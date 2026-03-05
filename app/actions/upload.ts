"use server";

import { auth } from "@/lib/auth";
import { writeFile, mkdir, unlink } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

export async function uploadFileAction(formData: FormData) {
  try {
    const session = await auth();
    if (!session?.user) {
      throw new Error("Unauthorized");
    }

    const file = formData.get("file") as File;
    if (!file) {
      throw new Error("No file uploaded");
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      // Fallback for local development if credentials aren't set yet
      console.warn("Supabase credentials missing, falling back to local filesystem (won't work on Vercel)");
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      const extension = file.name.split(".").pop();
      const filename = `${uniqueSuffix}.${extension}`;
      const uploadDir = join(process.cwd(), "public", "uploads");
      if (!existsSync(uploadDir)) await mkdir(uploadDir, { recursive: true });
      await writeFile(join(uploadDir, filename), buffer);
      return { success: true, url: `/uploads/${filename}` };
    }

    console.log(`Server Action: Uploading to Supabase Storage: ${file.name}`);

    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const extension = file.name.split(".").pop();
    const filename = `${uniqueSuffix}.${extension}`;
    const bucket = "uploads";
    
    // Construct Supabase Storage API URL
    const uploadUrl = `${supabaseUrl}/storage/v1/object/${bucket}/${filename}`;

    const bytes = await file.arrayBuffer();

    const response = await fetch(uploadUrl, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${supabaseKey}`,
        "Content-Type": file.type,
        "x-upsert": "true"
      },
      body: bytes
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Supabase Storage Error:", errorData);
      throw new Error(`Supabase storage failed: ${errorData.message || response.statusText}`);
    }

    // Get public URL
    const publicUrl = `${supabaseUrl}/storage/v1/object/public/${bucket}/${filename}`;

    return {
      success: true,
      url: publicUrl,
    };
  } catch (error: any) {
    console.error("Server Action Upload Error:", error);
    return {
      success: false,
      error: error.message || "Failed to upload file",
    };
  }
}

/**
 * Generates a signed upload URL for Supabase Storage.
 * This allows the client to upload files directly to Supabase, 
 * bypassing Vercel's 4.5MB request body size limit.
 */
export async function getSignedUploadUrlAction(filename: string, fileType: string) {
  try {
    const session = await auth();
    if (!session?.user) {
      throw new Error("Unauthorized");
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return { success: false, error: "Supabase credentials missing" };
    }

    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const extension = filename.split(".").pop();
    const cleanFilename = `${uniqueSuffix}.${extension}`;
    const bucket = "uploads";
    
    // Construct Supabase Storage API URL for signed upload
    const signUrl = `${supabaseUrl}/storage/v1/object/upload/sign/${bucket}/${cleanFilename}`;

    console.log(`Server Action: Requesting signed upload URL for: ${cleanFilename}`);

    const response = await fetch(signUrl, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${supabaseKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ expiresIn: 3600 }) // Valid for 1 hour
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Supabase Sign URL Error:", errorData);
      throw new Error(`Failed to get signed upload URL: ${errorData.message || response.statusText}`);
    }

    const data = await response.json();
    // Supabase returns { url: "upload/sign/bucket/path?token=..." }
    // We need to ensure it's prefixed correctly with /storage/v1/object/
    let relativePath = data.url;
    if (relativePath.startsWith("/")) relativePath = relativePath.substring(1);
    if (!relativePath.startsWith("object/")) relativePath = "object/" + relativePath;

    const uploadUrl = `${supabaseUrl}/storage/v1/${relativePath}`;
    const publicUrl = `${supabaseUrl}/storage/v1/object/public/${bucket}/${cleanFilename}`;

    return {
      success: true,
      uploadUrl,
      publicUrl,
    };
  } catch (error: any) {
    console.error("Server Action Sign URL Error:", error);
    return {
      success: false,
      error: error.message || "Failed to generate upload URL",
    };
  }
}

export async function deleteFileAction(fileUrl: string) {
  try {
    const session = await auth();
    if (!session?.user) {
      throw new Error("Unauthorized");
    }

    if (!fileUrl) return { success: true };

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    // 1. Handle Local File Deletion
    if (fileUrl.startsWith("/uploads/")) {
      const filename = fileUrl.replace("/uploads/", "");
      const filePath = join(process.cwd(), "public", "uploads", filename);
      if (existsSync(filePath)) {
        await unlink(filePath);
        console.log(`Deleted local file: ${filePath}`);
      }
      return { success: true };
    }

    // 2. Handle Supabase File Deletion
    if (supabaseUrl && fileUrl.includes(supabaseUrl)) {
      const bucket = "uploads";
      const parts = fileUrl.split(`${bucket}/`);
      if (parts.length < 2) throw new Error("Invalid Supabase URL format");
      
      const filename = parts[1];
      const deleteUrl = `${supabaseUrl}/storage/v1/object/${bucket}/${filename}`;

      console.log(`Server Action: Deleting from Supabase Storage: ${filename}`);

      const response = await fetch(deleteUrl, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${supabaseKey}`,
        },
      });

      if (!response.ok) {
        try {
          const errorData = await response.json();
          console.error("Supabase Deletion Error:", errorData);
        } catch (e) {
          console.error("Supabase Deletion Error (no JSON):", response.statusText);
        }
      }

      return { success: true };
    }

    return { success: true, message: "No action needed (not a managed file)" };
  } catch (error: any) {
    console.error("Server Action Delete Error:", error);
    return {
      success: false,
      error: error.message || "Failed to delete file",
    };
  }
}
