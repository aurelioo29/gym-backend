import { Op, type WhereOptions } from "sequelize";
import { ZodError } from "zod";

import { MembershipPlan } from "@/database/models";
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
import { createMembershipPlanSchema } from "@/lib/validations/admin.validation";

export async function GET(req: Request) {
  const admin = await getAdminSession("membership_plans.view");

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

  const { rows, count } = await MembershipPlan.findAndCountAll({
    where: whereCondition,
    order: [["createdAt", "DESC"]],
    limit,
    offset,
  });

  return successResponse({
    message: "Membership plans fetched successfully",
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
  const admin = await getAdminSession("membership_plans.create");

  if (!admin.authorized || !admin.session) {
    return errorResponse({
      message: admin.message,
      status: admin.status,
    });
  }

  try {
    const body = await req.json();
    const payload = createMembershipPlanSchema.parse(body);

    const slug = payload.slug ? slugify(payload.slug) : slugify(payload.name);

    const existing = await MembershipPlan.findOne({
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

    const plan = await MembershipPlan.create({
      name: payload.name,
      slug,
      description: payload.description ?? null,
      price: String(payload.price),
      durationDays: payload.durationDays,
      maxBookingsPerMonth: payload.maxBookingsPerMonth ?? null,
      benefits: payload.benefits ?? null,
      isActive: payload.isActive ?? true,
    });

    await createAuditLog({
      userId: admin.session.user.id,
      action: AuditAction.CREATE_MEMBERSHIP_PLAN,
      resourceType: ResourceType.MEMBERSHIP_PLAN,
      resourceId: plan.id,
      oldData: null,
      newData: serializeModel(plan),
      ipAddress: getClientIp(req),
    });

    return successResponse({
      message: "Membership plan created successfully",
      data: plan,
      status: 201,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return validationErrorResponse(error);
    }

    console.error("Create membership plan error:", error);

    return errorResponse({
      message: "Failed to create membership plan",
      status: 500,
    });
  }
}
