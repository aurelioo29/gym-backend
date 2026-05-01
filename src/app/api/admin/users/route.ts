import { Op, WhereOptions } from "sequelize";

import { User, Role, CustomerProfile, TrainerProfile } from "@/database/models";
import { getAdminSession } from "@/lib/auth/admin-guard";
import { errorResponse, successResponse } from "@/lib/response";

export async function GET(req: Request) {
  const admin = await getAdminSession("users.view");

  if (!admin.authorized) {
    return errorResponse({
      message: admin.message,
      status: admin.status,
    });
  }

  const { searchParams } = new URL(req.url);

  const search = searchParams.get("search")?.trim() || "";
  const role = searchParams.get("role") || "";
  const isActive = searchParams.get("isActive") || "";

  const page = Math.max(Number(searchParams.get("page") || 1), 1);
  const limit = Math.max(Number(searchParams.get("limit") || 10), 1);
  const offset = (page - 1) * limit;

  const whereCondition: WhereOptions = {};

  if (isActive === "true") {
    Object.assign(whereCondition, {
      isActive: true,
    });
  }

  if (isActive === "false") {
    Object.assign(whereCondition, {
      isActive: false,
    });
  }

  if (search) {
    Object.assign(whereCondition, {
      [Op.or]: [
        {
          fullName: {
            [Op.iLike]: `%${search}%`,
          },
        },
        {
          email: {
            [Op.iLike]: `%${search}%`,
          },
        },
        {
          phone: {
            [Op.iLike]: `%${search}%`,
          },
        },
      ],
    });
  }

  const roleWhere: WhereOptions | undefined =
    role && role !== "ALL"
      ? {
          slug: role,
        }
      : undefined;

  const { rows, count } = await User.findAndCountAll({
    where: whereCondition,
    attributes: [
      "id",
      "roleId",
      "email",
      "fullName",
      "phone",
      "avatarUrl",
      "isActive",
      "emailVerifiedAt",
      "lastLoginAt",
      "createdAt",
      "updatedAt",
    ],
    include: [
      {
        model: Role,
        as: "role",
        where: roleWhere,
        attributes: ["id", "name", "slug"],
      },
      {
        model: CustomerProfile,
        as: "customerProfile",
        required: false,
      },
      {
        model: TrainerProfile,
        as: "trainerProfile",
        required: false,
      },
    ],
    order: [["createdAt", "DESC"]],
    limit,
    offset,
    distinct: true,
  });

  return successResponse({
    message: "Users fetched successfully",
    data: rows,
    meta: {
      page,
      limit,
      total: count,
      totalPages: Math.ceil(count / limit),
    },
  });
}
