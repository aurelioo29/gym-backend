import { Op, type WhereOptions } from "sequelize";

import { Notification, User } from "@/database/models";
import { getAdminSession } from "@/lib/auth/admin-guard";
import { errorResponse, successResponse } from "@/lib/response";

export async function GET(req: Request) {
  const admin = await getAdminSession();

  if (!admin.authorized || !admin.session) {
    return errorResponse({
      message: admin.message,
      status: admin.status,
    });
  }

  const { searchParams } = new URL(req.url);

  const search = searchParams.get("search") || "";
  const type = searchParams.get("type") || "";
  const isRead = searchParams.get("isRead") || "";

  const page = Number(searchParams.get("page") || 1);
  const limit = Number(searchParams.get("limit") || 10);
  const offset = (page - 1) * limit;

  const whereCondition: WhereOptions = {
    recipientUserId: admin.session.user.id,
  };

  if (type && type !== "ALL") {
    whereCondition.type = type;
  }

  if (isRead === "true") {
    whereCondition.isRead = true;
  }

  if (isRead === "false") {
    whereCondition.isRead = false;
  }

  if (search) {
    (whereCondition as any)[Op.or] = [
      {
        title: {
          [Op.iLike]: `%${search}%`,
        },
      },
      {
        message: {
          [Op.iLike]: `%${search}%`,
        },
      },
      {
        type: {
          [Op.iLike]: `%${search}%`,
        },
      },
    ];
  }

  const { rows, count } = await Notification.findAndCountAll({
    where: whereCondition,
    include: [
      {
        model: User,
        as: "actor",
        attributes: ["id", "fullName", "email", "phone", "avatarUrl"],
        required: false,
      },
    ],
    order: [["createdAt", "DESC"]],
    limit,
    offset,
  });

  return successResponse({
    message: "Notifications fetched successfully",
    data: rows,
    meta: {
      page,
      limit,
      total: count,
      totalPages: Math.ceil(count / limit),
    },
  });
}
