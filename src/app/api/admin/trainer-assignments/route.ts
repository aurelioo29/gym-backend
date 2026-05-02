import { Op, type WhereOptions } from "sequelize";
import { ZodError } from "zod";

import {
  Role,
  TrainerAssignment,
  TrainerProfile,
  User,
} from "@/database/models";
import { getAdminSession } from "@/lib/auth/admin-guard";
import {
  errorResponse,
  successResponse,
  validationErrorResponse,
} from "@/lib/response";
import { createTrainerAssignmentSchema } from "@/lib/validations/admin.validation";
import { createAuditLog, serializeModel } from "@/lib/logs";
import { AuditAction, ResourceType } from "@/constants/logs";
import { getClientIp } from "@/lib/request";

async function validateCustomerAndTrainer(
  customerId: string,
  trainerId: string,
) {
  if (customerId === trainerId) {
    return "Customer dan trainer tidak boleh user yang sama";
  }

  const customer = await User.findOne({
    where: {
      id: customerId,
    },
    include: [
      {
        model: Role,
        as: "role",
        attributes: ["id", "name", "slug"],
      },
    ],
  });

  if (!customer) {
    return "Customer tidak ditemukan";
  }

  if (customer.role?.slug !== "CUSTOMER") {
    return "User customer harus memiliki role CUSTOMER";
  }

  const trainer = await User.findOne({
    where: {
      id: trainerId,
    },
    include: [
      {
        model: Role,
        as: "role",
        attributes: ["id", "name", "slug"],
      },
      {
        model: TrainerProfile,
        as: "trainerProfile",
        required: false,
      },
    ],
  });

  if (!trainer) {
    return "Trainer tidak ditemukan";
  }

  if (trainer.role?.slug !== "TRAINER") {
    return "User trainer harus memiliki role TRAINER";
  }

  if (trainer.trainerProfile?.approvalStatus !== "APPROVED") {
    return "Trainer harus approved sebelum bisa di-assign";
  }

  return null;
}

export async function GET(req: Request) {
  const admin = await getAdminSession("trainer_assignments.view");

  if (!admin.authorized) {
    return errorResponse({
      message: admin.message,
      status: admin.status,
    });
  }

  const { searchParams } = new URL(req.url);

  const search = searchParams.get("search") || "";
  const customerId = searchParams.get("customerId") || "";
  const trainerId = searchParams.get("trainerId") || "";
  const isActive = searchParams.get("isActive") || "";

  const page = Number(searchParams.get("page") || 1);
  const limit = Number(searchParams.get("limit") || 10);
  const offset = (page - 1) * limit;

  const whereCondition: WhereOptions = {};

  if (customerId && customerId !== "ALL") {
    whereCondition.customerId = customerId;
  }

  if (trainerId && trainerId !== "ALL") {
    whereCondition.trainerId = trainerId;
  }

  if (isActive === "true") {
    whereCondition.isActive = true;
  }

  if (isActive === "false") {
    whereCondition.isActive = false;
  }

  const include: any[] = [
    {
      model: User,
      as: "customer",
      attributes: ["id", "fullName", "email", "phone", "avatarUrl"],
      include: [
        {
          model: Role,
          as: "role",
          attributes: ["id", "slug", "name"],
        },
      ],
    },
    {
      model: User,
      as: "trainer",
      attributes: ["id", "fullName", "email", "phone", "avatarUrl"],
      include: [
        {
          model: Role,
          as: "role",
          attributes: ["id", "slug", "name"],
        },
      ],
    },
    {
      model: User,
      as: "assignedByUser",
      attributes: ["id", "fullName", "email"],
      required: false,
    },
  ];

  if (search) {
    include[0].where = {
      [Op.or]: [
        {
          fullName: {
            [Op.iLike]: `%${search}%`,
          },
        },
        {
          email: {
            [Op.iLike]: `%${search}%`,
          },
        },
        {
          phone: {
            [Op.iLike]: `%${search}%`,
          },
        },
      ],
    };

    include[0].required = false;

    include[1].where = {
      [Op.or]: [
        {
          fullName: {
            [Op.iLike]: `%${search}%`,
          },
        },
        {
          email: {
            [Op.iLike]: `%${search}%`,
          },
        },
        {
          phone: {
            [Op.iLike]: `%${search}%`,
          },
        },
      ],
    };

    include[1].required = false;
  }

  if (search) {
    (whereCondition as any)[Op.or] = [
      {
        notes: {
          [Op.iLike]: `%${search}%`,
        },
      },
    ];
  }

  const { rows, count } = await TrainerAssignment.findAndCountAll({
    where: whereCondition,
    include,
    order: [["createdAt", "DESC"]],
    limit,
    offset,
    distinct: true,
  });

  return successResponse({
    message: "Trainer assignments fetched successfully",
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
  const admin = await getAdminSession("trainer_assignments.create");

  if (!admin.authorized || !admin.session) {
    return errorResponse({
      message: admin.message,
      status: admin.status,
    });
  }

  try {
    const body = await req.json();
    const payload = createTrainerAssignmentSchema.parse(body);

    const validationMessage = await validateCustomerAndTrainer(
      payload.customerId,
      payload.trainerId,
    );

    if (validationMessage) {
      return errorResponse({
        message: validationMessage,
        status: 400,
      });
    }

    const assignment = await TrainerAssignment.create({
      customerId: payload.customerId,
      trainerId: payload.trainerId,
      assignedBy: admin.session.user.id,
      startDate: payload.startDate,
      endDate: payload.endDate ?? null,
      isActive: payload.isActive ?? true,
      notes: payload.notes ?? null,
    });

    await createAuditLog({
      userId: admin.session.user.id,
      action: AuditAction.CREATE_TRAINER_ASSIGNMENT,
      resourceType: ResourceType.TRAINER_ASSIGNMENT,
      resourceId: assignment.id,
      oldData: null,
      newData: serializeModel(assignment),
      ipAddress: getClientIp(req),
    });

    return successResponse({
      message: "Trainer assignment created successfully",
      data: assignment,
      status: 201,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return validationErrorResponse(error);
    }

    console.error("Create trainer assignment error:", error);

    return errorResponse({
      message: "Failed to create trainer assignment",
      status: 500,
    });
  }
}
