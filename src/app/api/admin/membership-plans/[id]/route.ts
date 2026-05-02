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
import { updateMembershipPlanSchema } from "@/lib/validations/admin.validation";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(req: Request, context: RouteContext) {
  const admin = await getAdminSession("membership_plans.view");

  if (!admin.authorized) {
    return errorResponse({
      message: admin.message,
      status: admin.status,
    });
  }

  const { id } = await context.params;

  const plan = await MembershipPlan.findByPk(id);

  if (!plan) {
    return errorResponse({
      message: "Membership plan tidak ditemukan",
      status: 404,
    });
  }

  return successResponse({
    message: "Membership plan fetched successfully",
    data: plan,
  });
}

export async function PATCH(req: Request, context: RouteContext) {
  const admin = await getAdminSession("membership_plans.update");

  if (!admin.authorized || !admin.session) {
    return errorResponse({
      message: admin.message,
      status: admin.status,
    });
  }

  try {
    const { id } = await context.params;
    const body = await req.json();
    const payload = updateMembershipPlanSchema.parse(body);

    const plan = await MembershipPlan.findByPk(id);

    if (!plan) {
      return errorResponse({
        message: "Membership plan tidak ditemukan",
        status: 404,
      });
    }

    const nextSlug = payload.slug
      ? slugify(payload.slug)
      : payload.name
        ? slugify(payload.name)
        : plan.slug;

    const existingSlug = await MembershipPlan.findOne({
      where: {
        slug: nextSlug,
      },
    });

    if (existingSlug && existingSlug.id !== plan.id) {
      return errorResponse({
        message: "Slug sudah digunakan",
        status: 400,
      });
    }

    const oldData = serializeModel(plan);

    await plan.update({
      name: payload.name ?? plan.name,
      slug: nextSlug,
      description:
        payload.description !== undefined
          ? payload.description
          : plan.description,
      price: payload.price !== undefined ? String(payload.price) : plan.price,
      durationDays: payload.durationDays ?? plan.durationDays,
      maxBookingsPerMonth:
        payload.maxBookingsPerMonth !== undefined
          ? payload.maxBookingsPerMonth
          : plan.maxBookingsPerMonth,
      benefits:
        payload.benefits !== undefined ? payload.benefits : plan.benefits,
      isActive:
        payload.isActive !== undefined ? payload.isActive : plan.isActive,
    });

    await createAuditLog({
      userId: admin.session.user.id,
      action: AuditAction.UPDATE_MEMBERSHIP_PLAN,
      resourceType: ResourceType.MEMBERSHIP_PLAN,
      resourceId: plan.id,
      oldData,
      newData: serializeModel(plan),
      ipAddress: getClientIp(req),
    });

    return successResponse({
      message: "Membership plan updated successfully",
      data: plan,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return validationErrorResponse(error);
    }

    console.error("Update membership plan error:", error);

    return errorResponse({
      message: "Failed to update membership plan",
      status: 500,
    });
  }
}

export async function DELETE(req: Request, context: RouteContext) {
  const admin = await getAdminSession("membership_plans.delete");

  if (!admin.authorized || !admin.session) {
    return errorResponse({
      message: admin.message,
      status: admin.status,
    });
  }

  const { id } = await context.params;

  const plan = await MembershipPlan.findByPk(id);

  if (!plan) {
    return errorResponse({
      message: "Membership plan tidak ditemukan",
      status: 404,
    });
  }

  const oldData = serializeModel(plan);

  await plan.destroy();

  await createAuditLog({
    userId: admin.session.user.id,
    action: AuditAction.DELETE_MEMBERSHIP_PLAN,
    resourceType: ResourceType.MEMBERSHIP_PLAN,
    resourceId: id,
    oldData,
    newData: null,
    ipAddress: getClientIp(req),
  });

  return successResponse({
    message: "Membership plan deleted successfully",
    data: null,
  });
}
