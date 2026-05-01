import { Notification } from "@/database/models";
import { getMobileAuthUser } from "@/lib/auth/mobile-guard";
import { errorResponse, successResponse } from "@/lib/response";

export async function GET(req: Request) {
  const authUser = await getMobileAuthUser(req);

  if (!authUser) {
    return errorResponse({
      message: "Unauthenticated",
      status: 401,
    });
  }

  const count = await Notification.count({
    where: {
      recipientUserId: authUser.user.id,
      isRead: false,
    },
  });

  return successResponse({
    message: "Unread notification count fetched successfully",
    data: {
      count,
    },
  });
}
