import { randomUUID } from "crypto";
import path from "path";
import { mkdir, writeFile } from "fs/promises";

import { getAdminSession } from "@/lib/auth/admin-guard";
import { errorResponse, successResponse } from "@/lib/response";

export const runtime = "nodejs";

const MAX_FILE_SIZE = 4 * 1024 * 1024;

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];

function getFileExtension(filename: string) {
  return filename.split(".").pop()?.toLowerCase() || "";
}

export async function POST(req: Request) {
  const admin = await getAdminSession("news.update");

  if (!admin.authorized) {
    return errorResponse({
      message: admin.message,
      status: admin.status,
    });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return errorResponse({
        message: "File is required",
        status: 422,
      });
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return errorResponse({
        message: "File harus berupa JPG, PNG, atau WEBP",
        status: 422,
      });
    }

    if (file.size > MAX_FILE_SIZE) {
      return errorResponse({
        message: "Ukuran file maksimal 4MB",
        status: 422,
      });
    }

    const extension = getFileExtension(file.name);

    if (!extension) {
      return errorResponse({
        message: "File extension tidak valid",
        status: 422,
      });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const filename = `${randomUUID()}.${extension}`;

    const uploadDir = path.join(process.cwd(), "public", "uploads", "news");

    await mkdir(uploadDir, { recursive: true });

    const filePath = path.join(uploadDir, filename);

    await writeFile(filePath, buffer);

    const url = `/uploads/news/${filename}`;

    return successResponse({
      message: "File uploaded successfully",
      data: {
        url,
        filename,
        originalName: file.name,
        mimeType: file.type,
        size: file.size,
      },
    });
  } catch (error) {
    console.error("Upload news thumbnail error:", error);

    return errorResponse({
      message: "Failed to upload file",
      status: 500,
    });
  }
}
