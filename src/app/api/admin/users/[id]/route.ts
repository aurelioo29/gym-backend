import {
  User,
  Role,
  Permission,
  CustomerProfile,
  TrainerProfile,
} from "@/database/models";
import { getAdminSession } from "@/lib/auth/admin-guard";
import { errorResponse, successResponse } from "@/lib/response";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(req: Request, context: RouteContext) {
  const admin = await getAdminSession("users.view");

  if (!admin.authorized) {
    return errorResponse({
      message: admin.message,
      status: admin.status,
    });
  }

  const { id } = await context.params;

  const user = await User.findOne({
    where: {
      id,
    },
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
        attributes: ["id", "name", "slug", "description"],
        include: [
          {
            model: Permission,
            as: "permissions",
            through: {
              attributes: [],
            },
            attributes: ["id", "name", "key", "module"],
          },
        ],
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
  });

  if (!user) {
    return errorResponse({
      message: "User tidak ditemukan",
      status: 404,
    });
  }

  return successResponse({
    message: "User detail fetched successfully",
    data: user,
  });
}
