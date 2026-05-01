import { Op } from "sequelize";
import { AuditLog, User } from "@/database/models";
import { getAdminSession } from "@/lib/auth/admin-guard";
import { errorResponse, successResponse } from "@/lib/response";

export async function GET(req: Request) {
  const admin = await getAdminSession("audit_logs.view");

  if (!admin.authorized) {
    return errorResponse({
      message: admin.message,
      status: admin.status,
    });
  }

  const { searchParams } = new URL(req.url);

  const search = searchParams.get("search") || "";
  const action = searchParams.get("action") || "";
  const resourceType = searchParams.get("resourceType") || "";

  const page = Number(searchParams.get("page") || 1);
  const limit = Number(searchParams.get("limit") || 10);
  const offset = (page - 1) * limit;

  const whereCondition: Record<string, unknown> = {};

  if (action) {
    whereCondition.action = action;
  }

  if (resourceType) {
    whereCondition.resourceType = resourceType;
  }

  if (search) {
    whereCondition[Op.or as unknown as string] = [
      {
        action: {
          [Op.iLike]: `%${search}%`,
        },
      },
      {
        resourceType: {
          [Op.iLike]: `%${search}%`,
        },
      },
    ];
  }

  const { rows, count } = await AuditLog.findAndCountAll({
    where: whereCondition,
    include: [
      {
        model: User,
        as: "user",
        attributes: ["id", "fullName", "email", "phone"],
        required: false,
      },
    ],
    order: [["createdAt", "DESC"]],
    limit,
    offset,
  });

  return successResponse({
    message: "Audit logs fetched successfully",
    data: rows,
    meta: {
      page,
      limit,
      total: count,
      totalPages: Math.ceil(count / limit),
    },
  });
}
