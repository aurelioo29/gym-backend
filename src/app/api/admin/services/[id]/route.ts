import { ZodError } from "zod";

import { Service } from "@/database/models";
import { AuditAction, ResourceType } from "@/constants/logs";
import { getAdminSession } from "@/lib/auth/admin-guard";
import { createAuditLog, serializeModel } from "@/lib/logs";
import { getClientIp } from "@/lib/request";
import {
  errorResponse,
  successResponse,
  validationErrorResponse,
} from "@/lib/response";
import { slugify } from "@/lib/slug";
import { updateServiceSchema } from "@/lib/validations/admin.validation";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(req: Request, context: RouteContext) {
  const admin = await getAdminSession("services.view");

  if (!admin.authorized) {
    return errorResponse({
      message: admin.message,
      status: admin.status,
    });
  }

  const { id } = await context.params;

  const service = await Service.findByPk(id);

  if (!service) {
    return errorResponse({
      message: "Service tidak ditemukan",
      status: 404,
    });
  }

  return successResponse({
    message: "Service fetched successfully",
    data: service,
  });
}

export async function PATCH(req: Request, context: RouteContext) {
  const admin = await getAdminSession("services.update");

  if (!admin.authorized || !admin.session) {
    return errorResponse({
      message: admin.message,
      status: admin.status,
    });
  }

  try {
    const { id } = await context.params;
    const body = await req.json();
    const payload = updateServiceSchema.parse(body);

    const service = await Service.findByPk(id);

    if (!service) {
      return errorResponse({
        message: "Service tidak ditemukan",
        status: 404,
      });
    }

    const nextSlug = payload.slug
      ? slugify(payload.slug)
      : payload.name
        ? slugify(payload.name)
        : service.slug;

    const existingSlug = await Service.findOne({
      where: {
        slug: nextSlug,
      },
    });

    if (existingSlug && existingSlug.id !== service.id) {
      return errorResponse({
        message: "Slug sudah digunakan",
        status: 400,
      });
    }

    const oldData = serializeModel(service);

    await service.update({
      name: payload.name ?? service.name,
      slug: nextSlug,
      description:
        payload.description !== undefined
          ? payload.description
          : service.description,
      serviceType: payload.serviceType ?? service.serviceType,
      price:
        payload.price !== undefined ? String(payload.price) : service.price,
      durationMinutes: payload.durationMinutes ?? service.durationMinutes,
      capacity:
        payload.capacity !== undefined ? payload.capacity : service.capacity,
      imageUrl:
        payload.imageUrl !== undefined ? payload.imageUrl : service.imageUrl,
      isActive:
        payload.isActive !== undefined ? payload.isActive : service.isActive,
    });

    await createAuditLog({
      userId: admin.session.user.id,
      action: AuditAction.UPDATE_SERVICE,
      resourceType: ResourceType.SERVICE,
      resourceId: service.id,
      oldData,
      newData: serializeModel(service),
      ipAddress: getClientIp(req),
    });

    return successResponse({
      message: "Service updated successfully",
      data: service,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return validationErrorResponse(error);
    }

    console.error("Update service error:", error);

    return errorResponse({
      message: "Failed to update service",
      status: 500,
    });
  }
}

export async function DELETE(req: Request, context: RouteContext) {
  const admin = await getAdminSession("services.delete");

  if (!admin.authorized || !admin.session) {
    return errorResponse({
      message: admin.message,
      status: admin.status,
    });
  }

  const { id } = await context.params;

  const service = await Service.findByPk(id);

  if (!service) {
    return errorResponse({
      message: "Service tidak ditemukan",
      status: 404,
    });
  }

  const oldData = serializeModel(service);

  await service.destroy();

  await createAuditLog({
    userId: admin.session.user.id,
    action: AuditAction.DELETE_SERVICE,
    resourceType: ResourceType.SERVICE,
    resourceId: id,
    oldData,
    newData: null,
    ipAddress: getClientIp(req),
  });

  return successResponse({
    message: "Service deleted successfully",
    data: null,
  });
}
