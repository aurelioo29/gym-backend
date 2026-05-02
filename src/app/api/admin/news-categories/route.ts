import { Op, type WhereOptions } from "sequelize";
import { ZodError } from "zod";

import { NewsCategory } from "@/database/models";
import { getAdminSession } from "@/lib/auth/admin-guard";
import {
  errorResponse,
  successResponse,
  validationErrorResponse,
} from "@/lib/response";
import { createNewsCategorySchema } from "@/lib/validations/admin.validation";
import { slugify } from "@/lib/slug";
import { createAuditLog, serializeModel } from "@/lib/logs";
import { AuditAction, ResourceType } from "@/constants/logs";
import { getClientIp } from "@/lib/request";

export async function GET(req: Request) {
  const admin = await getAdminSession("news_categories.view");

  if (!admin.authorized) {
    return errorResponse({
      message: admin.message,
      status: admin.status,
    });
  }

  const { searchParams } = new URL(req.url);

  const search = searchParams.get("search") || "";
  const isActive = searchParams.get("isActive") || "";

  const page = Number(searchParams.get("page") || 1);
  const limit = Number(searchParams.get("limit") || 10);
  const offset = (page - 1) * limit;

  const whereCondition: WhereOptions = {};

  if (isActive === "true") {
    whereCondition.isActive = true;
  }

  if (isActive === "false") {
    whereCondition.isActive = false;
  }

  if (search) {
    (whereCondition as any)[Op.or] = [
      {
        name: {
          [Op.iLike]: `%${search}%`,
        },
      },
      {
        slug: {
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

  const { rows, count } = await NewsCategory.findAndCountAll({
    where: whereCondition,
    order: [["createdAt", "DESC"]],
    limit,
    offset,
  });

  return successResponse({
    message: "News categories fetched successfully",
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
  const admin = await getAdminSession("news_categories.create");

  if (!admin.authorized || !admin.session) {
    return errorResponse({
      message: admin.message,
      status: admin.status,
    });
  }

  try {
    const body = await req.json();
    const payload = createNewsCategorySchema.parse(body);

    const slug = payload.slug ? slugify(payload.slug) : slugify(payload.name);

    const existing = await NewsCategory.findOne({
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

    const category = await NewsCategory.create({
      name: payload.name,
      slug,
      description: payload.description ?? null,
      isActive: payload.isActive ?? true,
    });

    await createAuditLog({
      userId: admin.session.user.id,
      action: AuditAction.CREATE_NEWS_CATEGORY,
      resourceType: ResourceType.NEWS_CATEGORY,
      resourceId: category.id,
      oldData: null,
      newData: serializeModel(category),
      ipAddress: getClientIp(req),
    });

    return successResponse({
      message: "News category created successfully",
      data: category,
      status: 201,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return validationErrorResponse(error);
    }

    console.error("Create news category error:", error);

    return errorResponse({
      message: "Failed to create news category",
      status: 500,
    });
  }
}
