import { Notification } from "@/database/models";
import { getAdminSession } from "@/lib/auth/admin-guard";
import { errorResponse, successResponse } from "@/lib/response";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function PATCH(req: Request, context: RouteContext) {
  const admin = await getAdminSession();

  if (!admin.authorized || !admin.session) {
    return errorResponse({
      message: admin.message,
      status: admin.status,
    });
  }

  const { id } = await context.params;

  const notification = await Notification.findOne({
    where: {
      id,
      recipientUserId: admin.session.user.id,
    },
  });

  if (!notification) {
    return errorResponse({
      message: "Notification tidak ditemukan",
      status: 404,
    });
  }

  await notification.update({
    isRead: true,
    readAt: new Date(),
  });

  return successResponse({
    message: "Notification marked as read",
    data: notification,
  });
}
