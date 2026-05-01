import { ZodError } from "zod";

import { GeneralSetting } from "@/database/models";
import { getAdminSession } from "@/lib/auth/admin-guard";
import {
  errorResponse,
  successResponse,
  validationErrorResponse,
} from "@/lib/response";
import { updateGeneralSettingSchema } from "@/lib/validations/admin.validation";
import { createAuditLog, serializeModel } from "@/lib/logs";
import { AuditAction, ResourceType } from "@/constants/logs";
import { getClientIp } from "@/lib/request";

type RouteContext = {
  params: Promise<{
    key: string;
  }>;
};

function normalizeSettingValue(value: unknown) {
  if (value === null || value === undefined) return null;

  if (typeof value === "object") {
    return JSON.stringify(value);
  }

  return String(value);
}

function parseSettingValue(value: string | null, type: string) {
  if (value === null) return null;

  if (type === "BOOLEAN") {
    return value === "true";
  }

  if (type === "NUMBER") {
    return Number(value);
  }

  if (type === "JSON") {
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  }

  return value;
}

export async function GET(req: Request, context: RouteContext) {
  const admin = await getAdminSession("settings.view");

  if (!admin.authorized) {
    return errorResponse({
      message: admin.message,
      status: admin.status,
    });
  }

  const { key } = await context.params;

  const setting = await GeneralSetting.findOne({
    where: {
      key,
    },
  });

  if (!setting) {
    return errorResponse({
      message: "Setting tidak ditemukan",
      status: 404,
    });
  }

  return successResponse({
    message: "Setting fetched successfully",
    data: {
      ...setting.toJSON(),
      parsedValue: parseSettingValue(setting.value, setting.type),
    },
  });
}

export async function PATCH(req: Request, context: RouteContext) {
  const admin = await getAdminSession("settings.update");

  if (!admin.authorized || !admin.session) {
    return errorResponse({
      message: admin.message,
      status: admin.status,
    });
  }

  try {
    const { key } = await context.params;
    const body = await req.json();
    const payload = updateGeneralSettingSchema.parse(body);

    const setting = await GeneralSetting.findOne({
      where: {
        key,
      },
    });

    if (!setting) {
      return errorResponse({
        message: "Setting tidak ditemukan",
        status: 404,
      });
    }

    const oldData = serializeModel(setting);

    await setting.update({
      value: normalizeSettingValue(payload.value),
    });

    const newData = serializeModel(setting);

    await createAuditLog({
      userId: admin.session.user.id,
      action: AuditAction.UPDATE_GENERAL_SETTING,
      resourceType: ResourceType.GENERAL_SETTING,
      resourceId: setting.id,
      oldData,
      newData,
      ipAddress: getClientIp(req),
    });

    return successResponse({
      message: "Setting updated successfully",
      data: {
        ...setting.toJSON(),
        parsedValue: parseSettingValue(setting.value, setting.type),
      },
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return validationErrorResponse(error);
    }

    console.error("Update general setting error:", error);

    return errorResponse({
      message: "Failed to update general setting",
      status: 500,
    });
  }
}
