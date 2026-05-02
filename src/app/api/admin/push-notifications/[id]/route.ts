import { ZodError } from "zod";

import { PushNotification, Service, User } from "@/database/models";
import { AuditAction, ResourceType } from "@/constants/logs";
import { getAdminSession } from "@/lib/auth/admin-guard";
import { createAuditLog, serializeModel } from "@/lib/logs";
import { getClientIp } from "@/lib/request";
import {
  errorResponse,
  successResponse,
  validationErrorResponse,
} from "@/lib/response";
import { updatePushNotificationSchema } from "@/lib/validations/admin.validation";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(req: Request, context: RouteContext) {
  const admin = await getAdminSession("push_notifications.view");

  if (!admin.authorized) {
    return errorResponse({
      message: admin.message,
      status: admin.status,
    });
  }

  const { id } = await context.params;

  const notification = await PushNotification.findOne({
    where: { id },
    include: [
      {
        model: User,
        as: "user",
        attributes: ["id", "fullName", "email", "phone", "avatarUrl"],
        required: false,
      },
      {
        model: Service,
        as: "service",
        required: false,
      },
      {
        model: User,
        as: "createdByUser",
        attributes: ["id", "fullName", "email"],
        required: false,
      },
    ],
  });

  if (!notification) {
    return errorResponse({
      message: "Push notification tidak ditemukan",
      status: 404,
    });
  }

  return successResponse({
    message: "Push notification fetched successfully",
    data: notification,
  });
}

export async function PATCH(req: Request, context: RouteContext) {
  const admin = await getAdminSession("push_notifications.update");

  if (!admin.authorized || !admin.session) {
    return errorResponse({
      message: admin.message,
      status: admin.status,
    });
  }

  try {
    const { id } = await context.params;
    const body = await req.json();
    const payload = updatePushNotificationSchema.parse(body);

    const notification = await PushNotification.findByPk(id);

    if (!notification) {
      return errorResponse({
        message: "Push notification tidak ditemukan",
        status: 404,
      });
    }

    if (notification.status === "PUBLISHED") {
      return errorResponse({
        message: "Notification yang sudah published tidak bisa diedit",
        status: 400,
      });
    }

    if (payload.userId) {
      const user = await User.findByPk(payload.userId);

      if (!user) {
        return errorResponse({
          message: "User tidak ditemukan",
          status: 404,
        });
      }
    }

    if (payload.serviceId) {
      const service = await Service.findByPk(payload.serviceId);

      if (!service) {
        return errorResponse({
          message: "Service tidak ditemukan",
          status: 404,
        });
      }
    }

    const nextTargetType = payload.targetType ?? notification.targetType;
    const nextStatus = payload.status ?? notification.status;

    const oldData = serializeModel(notification);

    await notification.update({
      userId:
        nextTargetType === "SPECIFIC_USER"
          ? payload.userId !== undefined
            ? payload.userId
            : notification.userId
          : null,
      serviceId:
        payload.serviceId !== undefined
          ? payload.serviceId
          : notification.serviceId,
      imageUrl:
        payload.imageUrl !== undefined
          ? payload.imageUrl
          : notification.imageUrl,
      title: payload.title ?? notification.title,
      description:
        payload.description !== undefined
          ? payload.description
          : notification.description,
      targetType: nextTargetType,
      status: nextStatus,
      scheduledAt:
        payload.scheduledAt !== undefined
          ? payload.scheduledAt
          : notification.scheduledAt,
      publishedAt:
        nextStatus === "PUBLISHED" && !notification.publishedAt
          ? new Date()
          : notification.publishedAt,
    });

    await createAuditLog({
      userId: admin.session.user.id,
      action: AuditAction.UPDATE_PUSH_NOTIFICATION,
      resourceType: ResourceType.PUSH_NOTIFICATION,
      resourceId: notification.id,
      oldData,
      newData: serializeModel(notification),
      ipAddress: getClientIp(req),
    });

    return successResponse({
      message: "Push notification updated successfully",
      data: notification,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return validationErrorResponse(error);
    }

    console.error("Update push notification error:", error);

    return errorResponse({
      message: "Failed to update push notification",
      status: 500,
    });
  }
}

export async function DELETE(req: Request, context: RouteContext) {
  const admin = await getAdminSession("push_notifications.delete");

  if (!admin.authorized || !admin.session) {
    return errorResponse({
      message: admin.message,
      status: admin.status,
    });
  }

  const { id } = await context.params;

  const notification = await PushNotification.findByPk(id);

  if (!notification) {
    return errorResponse({
      message: "Push notification tidak ditemukan",
      status: 404,
    });
  }

  const oldData = serializeModel(notification);

  await notification.destroy();

  await createAuditLog({
    userId: admin.session.user.id,
    action: AuditAction.DELETE_PUSH_NOTIFICATION,
    resourceType: ResourceType.PUSH_NOTIFICATION,
    resourceId: id,
    oldData,
    newData: null,
    ipAddress: getClientIp(req),
  });

  return successResponse({
    message: "Push notification deleted successfully",
    data: null,
  });
}
