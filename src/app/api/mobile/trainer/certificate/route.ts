import { randomUUID } from "crypto";
import path from "path";
import { writeFile, mkdir } from "fs/promises";
import { TrainerProfile } from "@/database/models";
import { getMobileAuthUser } from "@/lib/auth/mobile-guard";
import { errorResponse, successResponse } from "@/lib/response";
import { createActivityLog, createAuditLog, serializeModel } from "@/lib/logs";
import { ActivityType, AuditAction, ResourceType } from "@/constants/logs";
import { getClientIp, getUserAgent } from "@/lib/request";
import { createNotificationsForRoles } from "@/lib/notifications";
import { NotificationType } from "@/constants/logs";

export const runtime = "nodejs";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
];

function getFileExtension(filename: string) {
  return filename.split(".").pop()?.toLowerCase() || "";
}

export async function POST(req: Request) {
  try {
    const authUser = await getMobileAuthUser(req);

    if (!authUser) {
      return errorResponse({
        message: "Unauthenticated",
        status: 401,
      });
    }

    const { user, role } = authUser;

    if (role.slug !== "TRAINER") {
      return errorResponse({
        message: "Only trainer can upload certificate",
        status: 403,
      });
    }

    const formData = await req.formData();
    const file = formData.get("certificate");

    if (!(file instanceof File)) {
      return errorResponse({
        message: "Certificate file is required",
        status: 422,
      });
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return errorResponse({
        message: "File harus berupa PDF, JPG, PNG, atau WEBP",
        status: 422,
      });
    }

    if (file.size > MAX_FILE_SIZE) {
      return errorResponse({
        message: "Ukuran file maksimal 5MB",
        status: 422,
      });
    }

    const trainerProfile = await TrainerProfile.findOne({
      where: {
        userId: user.id,
      },
    });

    if (!trainerProfile) {
      return errorResponse({
        message: "Trainer profile tidak ditemukan",
        status: 404,
      });
    }

    if (trainerProfile.approvalStatus === "APPROVED") {
      return errorResponse({
        message:
          "Trainer sudah approved. Sertifikat tidak bisa diubah langsung.",
        status: 400,
      });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const extension = getFileExtension(file.name);
    const filename = `${randomUUID()}.${extension}`;

    const uploadDir = path.join(
      process.cwd(),
      "public",
      "uploads",
      "trainer-certificates",
    );

    await mkdir(uploadDir, { recursive: true });

    const filePath = path.join(uploadDir, filename);

    await writeFile(filePath, buffer);

    const certificateUrl = `/uploads/trainer-certificates/${filename}`;

    const oldData = serializeModel(trainerProfile);

    await trainerProfile.update({
      certificateUrl,
      approvalStatus: "SUBMITTED",
      rejectedReason: null,
      approvedBy: null,
      approvedAt: null,
      isAvailable: false,
    });

    const newData = serializeModel(trainerProfile);

    await createActivityLog({
      userId: user.id,
      activity: ActivityType.UPLOAD_TRAINER_CERTIFICATE,
      description: "Trainer uploaded certificate for approval",
      metadata: {
        trainerProfileId: trainerProfile.id,
        certificateUrl,
      },
      ipAddress: getClientIp(req),
      userAgent: getUserAgent(req),
    });

    await createAuditLog({
      userId: user.id,
      action: AuditAction.UPDATE,
      resourceType: ResourceType.TRAINER_PROFILE,
      resourceId: trainerProfile.id,
      oldData,
      newData,
      ipAddress: getClientIp(req),
    });

    await createNotificationsForRoles({
      roleSlugs: ["SUPERADMIN", "ADMIN"],
      actorUserId: user.id,
      type: NotificationType.TRAINER_CERTIFICATE_SUBMITTED,
      title: "Trainer certificate submitted",
      message: `${user.fullName} mengupload sertifikat dan menunggu approval.`,
      data: {
        trainerProfileId: trainerProfile.id,
        trainerUserId: user.id,
        certificateUrl,
      },
    });

    return successResponse({
      message: "Certificate uploaded successfully. Waiting for admin approval.",
      data: {
        trainerProfile: {
          id: trainerProfile.id,
          certificateUrl,
          approvalStatus: "SUBMITTED",
          canTeach: false,
        },
      },
    });
  } catch (error) {
    console.error("Upload trainer certificate error:", error);

    return errorResponse({
      message: "Failed to upload certificate",
      status: 500,
    });
  }
}
