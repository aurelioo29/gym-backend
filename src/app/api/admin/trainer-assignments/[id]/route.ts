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
import { updateTrainerAssignmentSchema } from "@/lib/validations/admin.validation";
import { createAuditLog, serializeModel } from "@/lib/logs";
import { AuditAction, ResourceType } from "@/constants/logs";
import { getClientIp } from "@/lib/request";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

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

export async function GET(req: Request, context: RouteContext) {
  const admin = await getAdminSession("trainer_assignments.view");

  if (!admin.authorized) {
    return errorResponse({
      message: admin.message,
      status: admin.status,
    });
  }

  const { id } = await context.params;

  const assignment = await TrainerAssignment.findOne({
    where: {
      id,
    },
    include: [
      {
        model: User,
        as: "customer",
        attributes: ["id", "fullName", "email", "phone", "avatarUrl"],
      },
      {
        model: User,
        as: "trainer",
        attributes: ["id", "fullName", "email", "phone", "avatarUrl"],
      },
      {
        model: User,
        as: "assignedByUser",
        attributes: ["id", "fullName", "email"],
        required: false,
      },
    ],
  });

  if (!assignment) {
    return errorResponse({
      message: "Trainer assignment tidak ditemukan",
      status: 404,
    });
  }

  return successResponse({
    message: "Trainer assignment fetched successfully",
    data: assignment,
  });
}

export async function PATCH(req: Request, context: RouteContext) {
  const admin = await getAdminSession("trainer_assignments.update");

  if (!admin.authorized || !admin.session) {
    return errorResponse({
      message: admin.message,
      status: admin.status,
    });
  }

  try {
    const { id } = await context.params;
    const body = await req.json();
    const payload = updateTrainerAssignmentSchema.parse(body);

    const assignment = await TrainerAssignment.findByPk(id);

    if (!assignment) {
      return errorResponse({
        message: "Trainer assignment tidak ditemukan",
        status: 404,
      });
    }

    const nextCustomerId = payload.customerId ?? assignment.customerId;
    const nextTrainerId = payload.trainerId ?? assignment.trainerId;

    const validationMessage = await validateCustomerAndTrainer(
      nextCustomerId,
      nextTrainerId,
    );

    if (validationMessage) {
      return errorResponse({
        message: validationMessage,
        status: 400,
      });
    }

    const nextStartDate = payload.startDate ?? assignment.startDate;
    const nextEndDate =
      payload.endDate !== undefined ? payload.endDate : assignment.endDate;

    if (nextEndDate && nextEndDate < nextStartDate) {
      return errorResponse({
        message: "End date tidak boleh sebelum start date",
        status: 400,
      });
    }

    const oldData = serializeModel(assignment);

    await assignment.update({
      customerId: nextCustomerId,
      trainerId: nextTrainerId,
      startDate: nextStartDate,
      endDate: nextEndDate,
      isActive:
        payload.isActive !== undefined ? payload.isActive : assignment.isActive,
      notes: payload.notes !== undefined ? payload.notes : assignment.notes,
    });

    await createAuditLog({
      userId: admin.session.user.id,
      action: AuditAction.UPDATE_TRAINER_ASSIGNMENT,
      resourceType: ResourceType.TRAINER_ASSIGNMENT,
      resourceId: assignment.id,
      oldData,
      newData: serializeModel(assignment),
      ipAddress: getClientIp(req),
    });

    return successResponse({
      message: "Trainer assignment updated successfully",
      data: assignment,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return validationErrorResponse(error);
    }

    console.error("Update trainer assignment error:", error);

    return errorResponse({
      message: "Failed to update trainer assignment",
      status: 500,
    });
  }
}

export async function DELETE(req: Request, context: RouteContext) {
  const admin = await getAdminSession("trainer_assignments.delete");

  if (!admin.authorized || !admin.session) {
    return errorResponse({
      message: admin.message,
      status: admin.status,
    });
  }

  const { id } = await context.params;

  const assignment = await TrainerAssignment.findByPk(id);

  if (!assignment) {
    return errorResponse({
      message: "Trainer assignment tidak ditemukan",
      status: 404,
    });
  }

  const oldData = serializeModel(assignment);

  await assignment.destroy();

  await createAuditLog({
    userId: admin.session.user.id,
    action: AuditAction.DELETE_TRAINER_ASSIGNMENT,
    resourceType: ResourceType.TRAINER_ASSIGNMENT,
    resourceId: id,
    oldData,
    newData: null,
    ipAddress: getClientIp(req),
  });

  return successResponse({
    message: "Trainer assignment deleted successfully",
    data: null,
  });
}
