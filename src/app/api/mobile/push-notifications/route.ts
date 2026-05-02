import { Op, type WhereOptions } from "sequelize";

import { PushNotification, Service } from "@/database/models";
import { getMobileSession } from "@/lib/auth/mobile-guard";
import { errorResponse, successResponse } from "@/lib/response";

export async function GET(req: Request) {
  const auth = await getMobileSession();

  if (!auth.authorized || !auth.user || !auth.role) {
    return errorResponse({
      message: auth.message,
      status: auth.status,
    });
  }

  const { searchParams } = new URL(req.url);

  const page = Number(searchParams.get("page") || 1);
  const limit = Number(searchParams.get("limit") || 10);
  const offset = (page - 1) * limit;

  const now = new Date();

  const whereCondition: WhereOptions = {
    status: "PUBLISHED",
    publishedAt: {
      [Op.lte]: now,
    },
    [Op.or]: [
      {
        targetType: "ALL",
      },
      {
        targetType: auth.role.slug,
      },
      {
        targetType: "SPECIFIC_USER",
        userId: auth.user.id,
      },
    ],
  };

  const { rows, count } = await PushNotification.findAndCountAll({
    where: whereCondition,
    include: [
      {
        model: Service,
        as: "service",
        required: false,
      },
    ],
    order: [["publishedAt", "DESC"]],
    limit,
    offset,
    distinct: true,
  });

  return successResponse({
    message: "Mobile push notifications fetched successfully",
    data: rows,
    meta: {
      page,
      limit,
      total: count,
      totalPages: Math.ceil(count / limit),
    },
  });
}
