import { Notification } from "@/database/models";
import { getAdminSession } from "@/lib/auth/admin-guard";
import { errorResponse, successResponse } from "@/lib/response";

export async function PATCH() {
  const admin = await getAdminSession();

  if (!admin.authorized || !admin.session) {
    return errorResponse({
      message: admin.message,
      status: admin.status,
    });
  }

  const [updatedCount] = await Notification.update(
    {
      isRead: true,
      readAt: new Date(),
    },
    {
      where: {
        recipientUserId: admin.session.user.id,
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
