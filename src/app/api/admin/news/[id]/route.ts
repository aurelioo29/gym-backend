import { ZodError } from "zod";

import { News, NewsCategory, User } from "@/database/models";
import { getAdminSession } from "@/lib/auth/admin-guard";
import {
  errorResponse,
  successResponse,
  validationErrorResponse,
} from "@/lib/response";
import { updateNewsSchema } from "@/lib/validations/admin.validation";
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
  const admin = await getAdminSession("news.view");

  if (!admin.authorized) {
    return errorResponse({
      message: admin.message,
      status: admin.status,
    });
  }

  const { id } = await context.params;

  const news = await News.findOne({
    where: {
      id,
    },
    include: [
      {
        model: NewsCategory,
        as: "category",
        attributes: ["id", "name", "slug"],
      },
      {
        model: User,
        as: "author",
        attributes: ["id", "fullName", "email"],
        required: false,
      },
    ],
  });

  if (!news) {
    return errorResponse({
      message: "News tidak ditemukan",
      status: 404,
    });
  }

  return successResponse({
    message: "News detail fetched successfully",
    data: news,
  });
}

export async function PATCH(req: Request, context: RouteContext) {
  const admin = await getAdminSession("news.update");

  if (!admin.authorized || !admin.session) {
    return errorResponse({
      message: admin.message,
      status: admin.status,
    });
  }

  try {
    const { id } = await context.params;
    const body = await req.json();
    const payload = updateNewsSchema.parse(body);

    const news = await News.findByPk(id);

    if (!news) {
      return errorResponse({
        message: "News tidak ditemukan",
        status: 404,
      });
    }

    if (payload.categoryId) {
      const category = await NewsCategory.findByPk(payload.categoryId);

      if (!category) {
        return errorResponse({
          message: "News category tidak ditemukan",
          status: 404,
        });
      }
    }

    const nextSlug = payload.slug
      ? slugify(payload.slug)
      : payload.title
        ? slugify(payload.title)
        : news.slug;

    const existingSlug = await News.findOne({
      where: {
        slug: nextSlug,
      },
    });

    if (existingSlug && existingSlug.id !== news.id) {
      return errorResponse({
        message: "Slug sudah digunakan",
        status: 400,
      });
    }

    const oldData = serializeModel(news);

    const nextStatus = payload.status ?? news.status;

    await news.update({
      categoryId: payload.categoryId ?? news.categoryId,
      title: payload.title ?? news.title,
      slug: nextSlug,
      excerpt: payload.excerpt !== undefined ? payload.excerpt : news.excerpt,
      content: payload.content ?? news.content,
      thumbnailUrl:
        payload.thumbnailUrl !== undefined
          ? payload.thumbnailUrl
          : news.thumbnailUrl,
      status: nextStatus,
      isFeatured:
        payload.isFeatured !== undefined ? payload.isFeatured : news.isFeatured,
      seoTitle:
        payload.seoTitle !== undefined ? payload.seoTitle : news.seoTitle,
      seoDescription:
        payload.seoDescription !== undefined
          ? payload.seoDescription
          : news.seoDescription,
      publishedAt:
        news.status !== "PUBLISHED" && nextStatus === "PUBLISHED"
          ? new Date()
          : nextStatus === "PUBLISHED"
            ? news.publishedAt
            : null,
    });

    await createAuditLog({
      userId: admin.session.user.id,
      action:
        oldData?.status !== "PUBLISHED" && news.status === "PUBLISHED"
          ? AuditAction.PUBLISH_NEWS
          : AuditAction.UPDATE_NEWS,
      resourceType: ResourceType.NEWS,
      resourceId: news.id,
      oldData,
      newData: serializeModel(news),
      ipAddress: getClientIp(req),
    });

    return successResponse({
      message: "News updated successfully",
      data: news,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return validationErrorResponse(error);
    }

    console.error("Update news error:", error);

    return errorResponse({
      message: "Failed to update news",
      status: 500,
    });
  }
}

export async function DELETE(req: Request, context: RouteContext) {
  const admin = await getAdminSession("news.delete");

  if (!admin.authorized || !admin.session) {
    return errorResponse({
      message: admin.message,
      status: admin.status,
    });
  }

  const { id } = await context.params;

  const news = await News.findByPk(id);

  if (!news) {
    return errorResponse({
      message: "News tidak ditemukan",
      status: 404,
    });
  }

  const oldData = serializeModel(news);

  await news.destroy();

  await createAuditLog({
    userId: admin.session.user.id,
    action: AuditAction.DELETE_NEWS,
    resourceType: ResourceType.NEWS,
    resourceId: id,
    oldData,
    newData: null,
    ipAddress: getClientIp(req),
  });

  return successResponse({
    message: "News deleted successfully",
    data: null,
  });
}
