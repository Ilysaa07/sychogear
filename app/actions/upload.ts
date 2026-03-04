"use server";

import { auth } from "@/lib/auth";
import { writeFile, mkdir } from "fs/promises";
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
