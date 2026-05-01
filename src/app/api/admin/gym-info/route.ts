import { ZodError } from "zod";

import { GymInfo } from "@/database/models";
import { getAdminSession } from "@/lib/auth/admin-guard";
import {
  errorResponse,
  successResponse,
  validationErrorResponse,
} from "@/lib/response";
import { updateGymInfoSchema } from "@/lib/validations/admin.validation";
import { createAuditLog, serializeModel } from "@/lib/logs";
import { AuditAction, ResourceType } from "@/constants/logs";
import { getClientIp } from "@/lib/request";

export async function GET() {
  const admin = await getAdminSession("gym_info.view");

  if (!admin.authorized) {
    return errorResponse({
      message: admin.message,
      status: admin.status,
    });
  }

  const gymInfo = await GymInfo.findOne({
    order: [["createdAt", "ASC"]],
  });

  return successResponse({
    message: "Gym info fetched successfully",
    data: gymInfo,
  });
}

export async function PATCH(req: Request) {
  const admin = await getAdminSession("gym_info.update");

  if (!admin.authorized || !admin.session) {
    return errorResponse({
      message: admin.message,
      status: admin.status,
    });
  }

  try {
    const body = await req.json();
    const payload = updateGymInfoSchema.parse(body);

    let gymInfo = await GymInfo.findOne({
      order: [["createdAt", "ASC"]],
    });

    if (!gymInfo) {
      gymInfo = await GymInfo.create({
        name: payload.name || "Gym Name",
        tagline: payload.tagline ?? null,
        description: payload.description ?? null,
        email: payload.email ?? null,
        phone: payload.phone ?? null,
        whatsapp: payload.whatsapp ?? null,
        address: payload.address ?? null,
        city: payload.city ?? null,
        province: payload.province ?? null,
        postalCode: payload.postalCode ?? null,
        latitude: payload.latitude ?? null,
        longitude: payload.longitude ?? null,
        logoUrl: payload.logoUrl ?? null,
        faviconUrl: payload.faviconUrl ?? null,
        openingHours: payload.openingHours ?? null,
        instagramUrl: payload.instagramUrl ?? null,
        facebookUrl: payload.facebookUrl ?? null,
        tiktokUrl: payload.tiktokUrl ?? null,
        youtubeUrl: payload.youtubeUrl ?? null,
      });

      return successResponse({
        message: "Gym info created successfully",
        data: gymInfo,
      });
    }

    const oldData = serializeModel(gymInfo);

    await gymInfo.update(payload);

    const newData = serializeModel(gymInfo);

    await createAuditLog({
      userId: admin.session.user.id,
      action: AuditAction.UPDATE_GYM_INFO,
      resourceType: ResourceType.GYM_INFO,
      resourceId: gymInfo.id,
      oldData,
      newData,
      ipAddress: getClientIp(req),
    });

    return successResponse({
      message: "Gym info updated successfully",
      data: gymInfo,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return validationErrorResponse(error);
    }

    console.error("Update gym info error:", error);

    return errorResponse({
      message: "Failed to update gym info",
      status: 500,
    });
  }
}
