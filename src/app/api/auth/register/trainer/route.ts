import bcrypt from "bcryptjs";
import { Op } from "sequelize";
import { ZodError } from "zod";
import { User, Role, TrainerProfile, sequelize } from "@/database/models";
import {
  successResponse,
  errorResponse,
  validationErrorResponse,
} from "@/lib/response";
import { registerTrainerSchema } from "@/lib/validations/auth.validation";
import { createEmailVerificationCode } from "@/lib/otp";
import { sendVerificationOtpEmail } from "@/lib/mail";
import { createActivityLog, createAuditLog } from "@/lib/logs";
import { ActivityType, AuditAction, ResourceType } from "@/constants/logs";
import { getClientIp, getUserAgent } from "@/lib/request";

export async function POST(req: Request) {
  const transaction = await sequelize.transaction();

  try {
    const body = await req.json();
    const payload = registerTrainerSchema.parse(body);

    const email = payload.email.toLowerCase().trim();
    const phone = payload.phone?.trim() || null;

    const trainerRole = await Role.findOne({
      where: { slug: "TRAINER" },
      transaction,
    });

    if (!trainerRole) {
      await transaction.rollback();

      return errorResponse({
        message: "Trainer role not found",
        status: 500,
      });
    }

    const existingUser = await User.findOne({
      where: {
        [Op.or]: [{ email }, ...(phone ? [{ phone }] : [])],
      },
      transaction,
    });

    if (existingUser) {
      await transaction.rollback();

      return errorResponse({
        message: "Email atau phone sudah digunakan",
        status: 409,
      });
    }

    const passwordHash = await bcrypt.hash(payload.password, 10);

    const user = await User.create(
      {
        roleId: trainerRole.id,
        email,
        phone,
        passwordHash,
        fullName: payload.fullName,
        avatarUrl: null,
        isActive: false,
        emailVerifiedAt: null,
        lastLoginAt: null,
      },
      { transaction },
    );

    await TrainerProfile.create(
      {
        userId: user.id,
        bio: null,
        specialization: payload.specialization ?? null,
        certification: payload.certification ?? null,
        certificateUrl: null,
        experienceYears: payload.experienceYears ?? 0,
        hourlyRate: "0",
        approvalStatus: "PENDING",
        approvedBy: null,
        approvedAt: null,
        rejectedReason: null,
        isAvailable: false,
      },
      { transaction },
    );

    const otpCode = await createEmailVerificationCode({
      userId: user.id,
      email,
      transaction,
    });

    await transaction.commit();

    await createActivityLog({
      userId: user.id,
      activity: ActivityType.REGISTER_TRAINER,
      description: "Trainer registered account",
      metadata: {
        email: user.email,
        phone: user.phone,
      },
      ipAddress: getClientIp(req),
      userAgent: getUserAgent(req),
    });

    await createAuditLog({
      userId: user.id,
      action: AuditAction.CREATE,
      resourceType: ResourceType.USER,
      resourceId: user.id,
      oldData: null,
      newData: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        fullName: user.fullName,
        role: "TRAINER",
        isActive: user.isActive,
        emailVerifiedAt: user.emailVerifiedAt,
      },
      ipAddress: getClientIp(req),
    });

    await sendVerificationOtpEmail({
      to: email,
      fullName: user.fullName,
      code: otpCode,
    });

    return successResponse({
      message:
        "Trainer registered successfully. Please verify your email, then upload certificate for approval.",
      status: 201,
      data: {
        user: {
          id: user.id,
          fullName: user.fullName,
          email: user.email,
          phone: user.phone,
          role: "TRAINER",
          isActive: user.isActive,
          emailVerifiedAt: user.emailVerifiedAt,
        },
        trainerStatus: {
          approvalStatus: "PENDING",
          canTeach: false,
        },
      },
    });
  } catch (error) {
    await transaction.rollback();

    if (error instanceof ZodError) {
      return validationErrorResponse(error);
    }

    console.error("Register trainer error:", error);

    return errorResponse({
      message: "Failed to register trainer",
      status: 500,
    });
  }
}
