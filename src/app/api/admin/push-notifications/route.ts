import { Op, type WhereOptions } from "sequelize";
import { ZodError } from "zod";

import { PushNotification, Role, Service, User } from "@/database/models";
import { AuditAction, ResourceType } from "@/constants/logs";
import { getAdminSession } from "@/lib/auth/admin-guard";
import { createAuditLog, serializeModel } from "@/lib/logs";
import { getClientIp } from "@/lib/request";
import {
  errorResponse,
  successResponse,
  validationErrorResponse,
} from "@/lib/response";
import { createPushNotificationSchema } from "@/lib/validations/admin.validation";

export async function GET(req: Request) {
  const admin = await getAdminSession("push_notifications.view");

  if (!admin.authorized) {
    return errorResponse({
      message: admin.message,
      status: admin.status,
    });
  }

  const { searchParams } = new URL(req.url);

  const search = searchParams.get("search") || "";
  const targetType = searchParams.get("targetType") || "";
  const status = searchParams.get("status") || "";
  const serviceId = searchParams.get("serviceId") || "";

  const page = Number(searchParams.get("page") || 1);
  const limit = Number(searchParams.get("limit") || 10);
  const offset = (page - 1) * limit;

  const whereCondition: WhereOptions = {};

  if (targetType && targetType !== "ALL_FILTER") {
    whereCondition.targetType = targetType;
  }

  if (status && status !== "ALL") {
    whereCondition.status = status;
  }

  if (serviceId && serviceId !== "ALL") {
    whereCondition.serviceId = serviceId;
  }

  if (search) {
    (whereCondition as any)[Op.or] = [
      {
        title: {
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

  const { rows, count } = await PushNotification.findAndCountAll({
    where: whereCondition,
    include: [
      {
        model: User,
        as: "user",
        attributes: ["id", "fullName", "email", "phone", "avatarUrl"],
        required: false,
        include: [
          {
            model: Role,
            as: "role",
            attributes: ["id", "name", "slug"],
          },
        ],
      },
      {
        model: Service,
        as: "service",
        attributes: ["id", "name", "slug", "serviceType", "price", "imageUrl"],
        required: false,
      },
      {
        model: User,
        as: "createdByUser",
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
    message: "Push notifications fetched successfully",
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
  const admin = await getAdminSession("push_notifications.create");

  if (!admin.authorized || !admin.session) {
    return errorResponse({
      message: admin.message,
      status: admin.status,
    });
  }

  try {
    const body = await req.json();
    const payload = createPushNotificationSchema.parse(body);

    if (payload.userId) {
      const user = await User.findByPk(payload.userId);

      if (!user) {
        return errorResponse({
          message: "User tidak ditemukan",
          status: 404,
        });
      }
    }

    if (payload.serviceId) {
      const service = await Service.findByPk(payload.serviceId);

      if (!service) {
        return errorResponse({
          message: "Service tidak ditemukan",
          status: 404,
        });
      }
    }

    const status = payload.status ?? "DRAFT";

    const notification = await PushNotification.create({
      userId:
        payload.targetType === "SPECIFIC_USER"
          ? (payload.userId ?? null)
          : null,
      serviceId: payload.serviceId ?? null,
      imageUrl: payload.imageUrl ?? null,
      title: payload.title,
      description: payload.description ?? null,
      targetType: payload.targetType,
      status,
      scheduledAt: payload.scheduledAt ?? null,
      publishedAt: status === "PUBLISHED" ? new Date() : null,
      createdBy: admin.session.user.id,
    });

    await createAuditLog({
      userId: admin.session.user.id,
      action: AuditAction.CREATE_PUSH_NOTIFICATION,
      resourceType: ResourceType.PUSH_NOTIFICATION,
      resourceId: notification.id,
      oldData: null,
      newData: serializeModel(notification),
      ipAddress: getClientIp(req),
    });

    return successResponse({
      message: "Push notification created successfully",
      data: notification,
      status: 201,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return validationErrorResponse(error);
    }

    console.error("Create push notification error:", error);

    return errorResponse({
      message: "Failed to create push notification",
      status: 500,
    });
  }
}
