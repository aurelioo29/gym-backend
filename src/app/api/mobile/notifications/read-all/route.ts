import { Notification } from "@/database/models";
import { getMobileAuthUser } from "@/lib/auth/mobile-guard";
import { errorResponse, successResponse } from "@/lib/response";

export async function PATCH(req: Request) {
  const authUser = await getMobileAuthUser(req);

  if (!authUser) {
    return errorResponse({
      message: "Unauthenticated",
      status: 401,
    });
  }

  const [updatedCount] = await Notification.update(
    {
      isRead: true,
      readAt: new Date(),
    },
    {
      where: {
        recipientUserId: authUser.user.id,
        isRead: false,
      },
    },
  );

  return successResponse({
    message: "All notifications marked as read",
    data: {
      updatedCount,
    },
  });
}
