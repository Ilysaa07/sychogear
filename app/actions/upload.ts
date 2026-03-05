"use server";

import { auth } from "@/lib/auth";
import { writeFile, mkdir, unlink } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

export async function uploadFileAction(formData: FormData) {
  // ... (existing code remains unchanged)
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
      // Extract filename from URL: .../public/uploads/filename
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
        const errorData = await response.json();
        console.error("Supabase Deletion Error:", errorData);
        // We don't throw here to avoid blocking UI if file is already gone
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
