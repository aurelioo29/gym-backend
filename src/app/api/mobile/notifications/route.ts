import { Op, type WhereOptions } from "sequelize";

import { Notification, User } from "@/database/models";
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

  const { searchParams } = new URL(req.url);

  const search = searchParams.get("search") || "";
  const type = searchParams.get("type") || "";
  const isRead = searchParams.get("isRead") || "";

  const page = Number(searchParams.get("page") || 1);
  const limit = Number(searchParams.get("limit") || 10);
  const offset = (page - 1) * limit;

  const whereCondition: WhereOptions = {
    recipientUserId: authUser.user.id,
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
