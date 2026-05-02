import { Op, type WhereOptions } from "sequelize";
import { ZodError } from "zod";

import { News, NewsCategory, User } from "@/database/models";
import { getAdminSession } from "@/lib/auth/admin-guard";
import {
  errorResponse,
  successResponse,
  validationErrorResponse,
} from "@/lib/response";
import { createNewsSchema } from "@/lib/validations/admin.validation";
import { slugify } from "@/lib/slug";
import { createAuditLog, serializeModel } from "@/lib/logs";
import { AuditAction, ResourceType } from "@/constants/logs";
import { getClientIp } from "@/lib/request";

export async function GET(req: Request) {
  const admin = await getAdminSession("news.view");

  if (!admin.authorized) {
    return errorResponse({
      message: admin.message,
      status: admin.status,
    });
  }

  const { searchParams } = new URL(req.url);

  const search = searchParams.get("search") || "";
  const status = searchParams.get("status") || "";
  const categoryId = searchParams.get("categoryId") || "";

  const page = Number(searchParams.get("page") || 1);
  const limit = Number(searchParams.get("limit") || 10);
  const offset = (page - 1) * limit;

  const whereCondition: WhereOptions = {};

  if (status && status !== "ALL") {
    whereCondition.status = status;
  }

  if (categoryId && categoryId !== "ALL") {
    whereCondition.categoryId = categoryId;
  }

  if (search) {
    (whereCondition as any)[Op.or] = [
      {
        title: {
          [Op.iLike]: `%${search}%`,
        },
      },
      {
        slug: {
          [Op.iLike]: `%${search}%`,
        },
      },
      {
        excerpt: {
          [Op.iLike]: `%${search}%`,
        },
      },
    ];
  }

  const { rows, count } = await News.findAndCountAll({
    where: whereCondition,
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
    order: [["createdAt", "DESC"]],
    limit,
    offset,
    distinct: true,
  });

  return successResponse({
    message: "News fetched successfully",
    data: rows,
    meta: {
      page,
      limit,
      total: count,
      totalPages: Math.ceil(count / limit),
    },
  });
}

export async function POST(req: Request) {
  const admin = await getAdminSession("news.create");

  if (!admin.authorized || !admin.session) {
    return errorResponse({
      message: admin.message,
      status: admin.status,
    });
  }

  try {
    const body = await req.json();
    const payload = createNewsSchema.parse(body);

    const category = await NewsCategory.findByPk(payload.categoryId);

    if (!category) {
      return errorResponse({
        message: "News category tidak ditemukan",
        status: 404,
      });
    }

    const slug = payload.slug ? slugify(payload.slug) : slugify(payload.title);

    const existing = await News.findOne({
      where: {
        slug,
      },
    });

    if (existing) {
      return errorResponse({
        message: "Slug sudah digunakan",
        status: 400,
      });
    }

    const status = payload.status ?? "DRAFT";

    const news = await News.create({
      categoryId: payload.categoryId,
      authorId: admin.session.user.id,
      title: payload.title,
      slug,
      excerpt: payload.excerpt ?? null,
      content: payload.content,
      thumbnailUrl: payload.thumbnailUrl ?? null,
      status,
      isFeatured: payload.isFeatured ?? false,
      seoTitle: payload.seoTitle ?? null,
      seoDescription: payload.seoDescription ?? null,
      publishedAt: status === "PUBLISHED" ? new Date() : null,
    });

    await createAuditLog({
      userId: admin.session.user.id,
      action:
        status === "PUBLISHED"
          ? AuditAction.PUBLISH_NEWS
          : AuditAction.CREATE_NEWS,
      resourceType: ResourceType.NEWS,
      resourceId: news.id,
      oldData: null,
      newData: serializeModel(news),
      ipAddress: getClientIp(req),
    });

    return successResponse({
      message: "News created successfully",
      data: news,
      status: 201,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return validationErrorResponse(error);
    }

    console.error("Create news error:", error);

    return errorResponse({
      message: "Failed to create news",
      status: 500,
    });
  }
}
