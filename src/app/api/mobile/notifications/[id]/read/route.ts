import { Notification } from "@/database/models";
import { getMobileAuthUser } from "@/lib/auth/mobile-guard";
import { errorResponse, successResponse } from "@/lib/response";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function PATCH(req: Request, context: RouteContext) {
  const authUser = await getMobileAuthUser(req);

  if (!authUser) {
    return errorResponse({
      message: "Unauthenticated",
      status: 401,
    });
  }

  const { id } = await context.params;

  const notification = await Notification.findOne({
    where: {
      id,
      recipientUserId: authUser.user.id,
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
