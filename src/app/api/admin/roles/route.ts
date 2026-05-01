import { Role, Permission, User } from "@/database/models";
import { getAdminSession } from "@/lib/auth/admin-guard";
import { errorResponse, successResponse } from "@/lib/response";

export async function GET() {
  const admin = await getAdminSession("roles.view");

  if (!admin.authorized) {
    return errorResponse({
      message: admin.message,
      status: admin.status,
    });
  }

  const roles = await Role.findAll({
    include: [
      {
        model: Permission,
        as: "permissions",
        through: {
          attributes: [],
        },
        attributes: ["id", "name", "key", "module"],
      },
      {
        model: User,
        as: "users",
        attributes: ["id"],
        required: false,
      },
    ],
    order: [["createdAt", "ASC"]],
  });

  const data = roles.map((role) => {
    const json = role.toJSON() as Record<string, unknown> & {
      users?: unknown[];
      permissions?: unknown[];
    };

    return {
      ...json,
      userCount: json.users?.length ?? 0,
      users: undefined,
    };
  });

  return successResponse({
    message: "Roles fetched successfully",
    data,
  });
}
