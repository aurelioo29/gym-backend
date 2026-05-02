import { ZodError } from "zod";

import { PushNotification } from "@/database/models";
import { AuditAction, ResourceType } from "@/constants/logs";
import { getAdminSession } from "@/lib/auth/admin-guard";
import { createAuditLog, serializeModel } from "@/lib/logs";
import { getClientIp } from "@/lib/request";
import {
  errorResponse,
  successResponse,
  validationErrorResponse,
} from "@/lib/response";
import { cancelPushNotificationSchema } from "@/lib/validations/admin.validation";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function PATCH(req: Request, context: RouteContext) {
  const admin = await getAdminSession("push_notifications.cancel");

  if (!admin.authorized || !admin.session) {
    return errorResponse({
      message: admin.message,
      status: admin.status,
    });
  }

  try {
    const { id } = await context.params;
    const body = await req.json().catch(() => ({}));
    const payload = cancelPushNotificationSchema.parse(body);

    const notification = await PushNotification.findByPk(id);

    if (!notification) {
      return errorResponse({
        message: "Push notification tidak ditemukan",
        status: 404,
      });
    }

    if (notification.status === "CANCELLED") {
      return errorResponse({
        message: "Notification sudah cancelled",
        status: 400,
      });
    }

    const oldData = serializeModel(notification);

    await notification.update({
      status: "CANCELLED",
      description: payload.reason
        ? `${notification.description || ""}\n\nCancel reason: ${payload.reason}`
        : notification.description,
    });

    await createAuditLog({
      userId: admin.session.user.id,
      action: AuditAction.CANCEL_PUSH_NOTIFICATION,
      resourceType: ResourceType.PUSH_NOTIFICATION,
      resourceId: notification.id,
      oldData,
      newData: serializeModel(notification),
      ipAddress: getClientIp(req),
    });

    return successResponse({
      message: "Push notification cancelled successfully",
      data: notification,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return validationErrorResponse(error);
    }

    console.error("Cancel push notification error:", error);

    return errorResponse({
      message: "Failed to cancel push notification",
      status: 500,
    });
  }
}
