import { Notification } from "@/database/models";
import { getAdminSession } from "@/lib/auth/admin-guard";
import { errorResponse, successResponse } from "@/lib/response";

export async function GET() {
  const admin = await getAdminSession();

  if (!admin.authorized || !admin.session) {
    return errorResponse({
      message: admin.message,
      status: admin.status,
    });
  }

  const count = await Notification.count({
    where: {
      recipientUserId: admin.session.user.id,
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
