import { randomUUID } from "crypto";
import path from "path";
import { mkdir, writeFile } from "fs/promises";

import { getAdminSession } from "@/lib/auth/admin-guard";
import { errorResponse, successResponse } from "@/lib/response";

export const runtime = "nodejs";

const MAX_FILE_SIZE = 3 * 1024 * 1024;

const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/svg+xml",
  "image/x-icon",
];

function getFileExtension(filename: string) {
  return filename.split(".").pop()?.toLowerCase() || "";
}

export async function POST(req: Request) {
  const admin = await getAdminSession("gym_info.update");

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
        message: "File harus berupa JPG, PNG, WEBP, SVG, atau ICO",
        status: 422,
      });
    }

    if (file.size > MAX_FILE_SIZE) {
      return errorResponse({
        message: "Ukuran file maksimal 3MB",
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

    const uploadDir = path.join(
      process.cwd(),
      "public",
      "uploads",
      "gym-assets",
    );

    await mkdir(uploadDir, { recursive: true });

    const filePath = path.join(uploadDir, filename);

    await writeFile(filePath, buffer);

    const url = `/uploads/gym-assets/${filename}`;

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
    console.error("Upload gym asset error:", error);

    return errorResponse({
      message: "Failed to upload file",
      status: 500,
    });
  }
}
