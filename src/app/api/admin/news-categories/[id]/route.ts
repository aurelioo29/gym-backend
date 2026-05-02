import { ZodError } from "zod";

import { NewsCategory } from "@/database/models";
import { getAdminSession } from "@/lib/auth/admin-guard";
import {
  errorResponse,
  successResponse,
  validationErrorResponse,
} from "@/lib/response";
import { updateNewsCategorySchema } from "@/lib/validations/admin.validation";
import { slugify } from "@/lib/slug";
import { createAuditLog, serializeModel } from "@/lib/logs";
import { AuditAction, ResourceType } from "@/constants/logs";
import { getClientIp } from "@/lib/request";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(req: Request, context: RouteContext) {
  const admin = await getAdminSession("news_categories.view");

  if (!admin.authorized) {
    return errorResponse({
      message: admin.message,
      status: admin.status,
    });
  }

  const { id } = await context.params;

  const category = await NewsCategory.findByPk(id);

  if (!category) {
    return errorResponse({
      message: "News category tidak ditemukan",
      status: 404,
    });
  }

  return successResponse({
    message: "News category fetched successfully",
    data: category,
  });
}

export async function PATCH(req: Request, context: RouteContext) {
  const admin = await getAdminSession("news_categories.update");

  if (!admin.authorized || !admin.session) {
    return errorResponse({
      message: admin.message,
      status: admin.status,
    });
  }

  try {
    const { id } = await context.params;
    const body = await req.json();
    const payload = updateNewsCategorySchema.parse(body);

    const category = await NewsCategory.findByPk(id);

    if (!category) {
      return errorResponse({
        message: "News category tidak ditemukan",
        status: 404,
      });
    }

    const nextSlug = payload.slug
      ? slugify(payload.slug)
      : payload.name
        ? slugify(payload.name)
        : category.slug;

    const existingSlug = await NewsCategory.findOne({
      where: {
        slug: nextSlug,
      },
    });

    if (existingSlug && existingSlug.id !== category.id) {
      return errorResponse({
        message: "Slug sudah digunakan",
        status: 400,
      });
    }

    const oldData = serializeModel(category);

    await category.update({
      name: payload.name ?? category.name,
      slug: nextSlug,
      description:
        payload.description !== undefined
          ? payload.description
          : category.description,
      isActive:
        payload.isActive !== undefined ? payload.isActive : category.isActive,
    });

    await createAuditLog({
      userId: admin.session.user.id,
      action: AuditAction.UPDATE_NEWS_CATEGORY,
      resourceType: ResourceType.NEWS_CATEGORY,
      resourceId: category.id,
      oldData,
      newData: serializeModel(category),
      ipAddress: getClientIp(req),
    });

    return successResponse({
      message: "News category updated successfully",
      data: category,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return validationErrorResponse(error);
    }

    console.error("Update news category error:", error);

    return errorResponse({
      message: "Failed to update news category",
      status: 500,
    });
  }
}

export async function DELETE(req: Request, context: RouteContext) {
  const admin = await getAdminSession("news_categories.delete");

  if (!admin.authorized || !admin.session) {
    return errorResponse({
      message: admin.message,
      status: admin.status,
    });
  }

  const { id } = await context.params;

  const category = await NewsCategory.findByPk(id);

  if (!category) {
    return errorResponse({
      message: "News category tidak ditemukan",
      status: 404,
    });
  }

  const oldData = serializeModel(category);

  await category.destroy();

  await createAuditLog({
    userId: admin.session.user.id,
    action: AuditAction.DELETE_NEWS_CATEGORY,
    resourceType: ResourceType.NEWS_CATEGORY,
    resourceId: id,
    oldData,
    newData: null,
    ipAddress: getClientIp(req),
  });

  return successResponse({
    message: "News category deleted successfully",
    data: null,
  });
}
