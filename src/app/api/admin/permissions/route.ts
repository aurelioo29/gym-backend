import { Op } from "sequelize";

import { Permission } from "@/database/models";
import { getAdminSession } from "@/lib/auth/admin-guard";
import { errorResponse, successResponse } from "@/lib/response";

export async function GET(req: Request) {
  const admin = await getAdminSession("permissions.view");

  if (!admin.authorized) {
    return errorResponse({
      message: admin.message,
      status: admin.status,
    });
  }

  const { searchParams } = new URL(req.url);

  const search = searchParams.get("search") || "";
  const moduleFilter = searchParams.get("module") || "";

  const whereCondition: any = {};

  if (moduleFilter && moduleFilter !== "ALL") {
    whereCondition.module = moduleFilter;
  }

  if (search) {
    whereCondition[Op.or] = [
      {
        name: {
          [Op.iLike]: `%${search}%`,
        },
      },
      {
        key: {
          [Op.iLike]: `%${search}%`,
        },
      },
      {
        module: {
          [Op.iLike]: `%${search}%`,
        },
      },
    ];
  }

  const permissions = await Permission.findAll({
    where: whereCondition,
    order: [
      ["module", "ASC"],
      ["key", "ASC"],
    ],
  });

  const modules = await Permission.findAll({
    attributes: ["module"],
    group: ["module"],
    order: [["module", "ASC"]],
  });

  return successResponse({
    message: "Permissions fetched successfully",
    data: {
      permissions,
      modules: modules.map((item) => item.module),
    },
  });
}
