import { Op, type WhereOptions } from "sequelize";

import { GeneralSetting } from "@/database/models";
import { getAdminSession } from "@/lib/auth/admin-guard";
import { errorResponse, successResponse } from "@/lib/response";

export async function GET(req: Request) {
  const admin = await getAdminSession("settings.view");

  if (!admin.authorized) {
    return errorResponse({
      message: admin.message,
      status: admin.status,
    });
  }

  const { searchParams } = new URL(req.url);

  const search = searchParams.get("search") || "";
  const groupName = searchParams.get("groupName") || "";

  const whereCondition: WhereOptions = {};

  if (groupName && groupName !== "ALL") {
    whereCondition.groupName = groupName;
  }

  if (search) {
    // Sequelize dynamic where + TS = sedikit drama.
    (whereCondition as any)[Op.or] = [
      {
        key: {
          [Op.iLike]: `%${search}%`,
        },
      },
      {
        label: {
          [Op.iLike]: `%${search}%`,
        },
      },
      {
        description: {
          [Op.iLike]: `%${search}%`,
        },
      },
    ];
  }

  const settings = await GeneralSetting.findAll({
    where: whereCondition,
    order: [
      ["groupName", "ASC"],
      ["key", "ASC"],
    ],
  });

  const groups = await GeneralSetting.findAll({
    attributes: ["groupName"],
    group: ["groupName"],
    order: [["groupName", "ASC"]],
  });

  return successResponse({
    message: "General settings fetched successfully",
    data: {
      settings,
      groups: groups.map((item) => item.groupName),
    },
  });
}
