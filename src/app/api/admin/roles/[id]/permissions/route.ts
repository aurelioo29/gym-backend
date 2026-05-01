import { ZodError } from "zod";

import { Role, Permission, RolePermission, sequelize } from "@/database/models";
import { getAdminSession } from "@/lib/auth/admin-guard";
import {
  errorResponse,
  successResponse,
  validationErrorResponse,
} from "@/lib/response";
import { updateRolePermissionsSchema } from "@/lib/validations/admin.validation";
import { createAuditLog, serializeModel } from "@/lib/logs";
import { AuditAction, ResourceType } from "@/constants/logs";
import { getClientIp } from "@/lib/request";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function PATCH(req: Request, context: RouteContext) {
  const admin = await getAdminSession("roles.assign_permissions");

  if (!admin.authorized || !admin.session) {
    return errorResponse({
      message: admin.message,
      status: admin.status,
    });
  }

  const transaction = await sequelize.transaction();

  try {
    const { id } = await context.params;
    const body = await req.json();
    const payload = updateRolePermissionsSchema.parse(body);

    const role = await Role.findOne({
      where: {
        id,
      },
      include: [
        {
          model: Permission,
          as: "permissions",
          through: {
            attributes: [],
          },
        },
      ],
      transaction,
    });

    if (!role) {
      await transaction.rollback();

      return errorResponse({
        message: "Role tidak ditemukan",
        status: 404,
      });
    }

    if (role.slug === "SUPERADMIN") {
      await transaction.rollback();

      return errorResponse({
        message: "Permission SUPERADMIN tidak boleh diubah",
        status: 403,
      });
    }

    const permissionCount = await Permission.count({
      where: {
        id: payload.permissionIds,
      },
      transaction,
    });

    if (permissionCount !== payload.permissionIds.length) {
      await transaction.rollback();

      return errorResponse({
        message: "Ada permission ID yang tidak valid",
        status: 400,
      });
    }

    const oldData = serializeModel(role);

    await RolePermission.destroy({
      where: {
        roleId: role.id,
      },
      transaction,
    });

    await RolePermission.bulkCreate(
      payload.permissionIds.map((permissionId) => ({
        roleId: role.id,
        permissionId,
      })),
      { transaction },
    );

    const updatedRole = await Role.findOne({
      where: {
        id: role.id,
      },
      include: [
        {
          model: Permission,
          as: "permissions",
          through: {
            attributes: [],
          },
        },
      ],
      transaction,
    });

    const newData = serializeModel(updatedRole);

    await transaction.commit();

    await createAuditLog({
      userId: admin.session.user.id,
      action: AuditAction.UPDATE_ROLE_PERMISSIONS,
      resourceType: ResourceType.ROLE,
      resourceId: role.id,
      oldData,
      newData,
      ipAddress: getClientIp(req),
    });

    return successResponse({
      message: "Role permissions updated successfully",
      data: {
        role: updatedRole,
      },
    });
  } catch (error) {
    await transaction.rollback();

    if (error instanceof ZodError) {
      return validationErrorResponse(error);
    }

    console.error("Update role permissions error:", error);

    return errorResponse({
      message: "Failed to update role permissions",
      status: 500,
    });
  }
}
