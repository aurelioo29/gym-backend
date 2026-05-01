import { ZodError } from "zod";

import { User, Role } from "@/database/models";
import { getAdminSession } from "@/lib/auth/admin-guard";
import {
  errorResponse,
  successResponse,
  validationErrorResponse,
} from "@/lib/response";
import { updateUserStatusSchema } from "@/lib/validations/admin.validation";
import { createActivityLog, createAuditLog, serializeModel } from "@/lib/logs";
import { ActivityType, AuditAction, ResourceType } from "@/constants/logs";
import { getClientIp, getUserAgent } from "@/lib/request";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function PATCH(req: Request, context: RouteContext) {
  const admin = await getAdminSession("users.update_status");

  if (!admin.authorized || !admin.session) {
    return errorResponse({
      message: admin.message,
      status: admin.status,
    });
  }

  try {
    const { id } = await context.params;
    const body = await req.json();
    const payload = updateUserStatusSchema.parse(body);

    if (admin.session.user.id === id) {
      return errorResponse({
        message: "Tidak bisa mengubah status akun sendiri",
        status: 400,
      });
    }

    const user = await User.findOne({
      where: {
        id,
      },
      include: [
        {
          model: Role,
          as: "role",
          attributes: ["id", "name", "slug"],
        },
      ],
    });

    if (!user) {
      return errorResponse({
        message: "User tidak ditemukan",
        status: 404,
      });
    }

    const role = user.get("role") as Role | null;

    if (role?.slug === "SUPERADMIN") {
      return errorResponse({
        message: "Status SUPERADMIN tidak boleh diubah",
        status: 403,
      });
    }

    const oldData = serializeModel(user);

    await user.update({
      isActive: payload.isActive,
    });

    const newData = serializeModel(user);

    await createActivityLog({
      userId: admin.session.user.id,
      activity: ActivityType.UPDATE_USER_STATUS,
      description: `Admin ${payload.isActive ? "activated" : "deactivated"} user`,
      metadata: {
        targetUserId: user.id,
        targetEmail: user.email,
        isActive: payload.isActive,
      },
      ipAddress: getClientIp(req),
      userAgent: getUserAgent(req),
    });

    await createAuditLog({
      userId: admin.session.user.id,
      action: AuditAction.UPDATE_USER_STATUS,
      resourceType: ResourceType.USER,
      resourceId: user.id,
      oldData,
      newData,
      ipAddress: getClientIp(req),
    });

    return successResponse({
      message: `User berhasil ${payload.isActive ? "diaktifkan" : "dinonaktifkan"}`,
      data: {
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          isActive: user.isActive,
        },
      },
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return validationErrorResponse(error);
    }

    console.error("Update user status error:", error);

    return errorResponse({
      message: "Failed to update user status",
      status: 500,
    });
  }
}
