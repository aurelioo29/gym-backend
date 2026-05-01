import bcrypt from "bcryptjs";
import { Op } from "sequelize";
import { User, Role, CustomerProfile, sequelize } from "@/database/models";
import {
  successResponse,
  errorResponse,
  validationErrorResponse,
} from "@/lib/response";
import { registerCustomerSchema } from "@/lib/validations/auth.validation";
import { createEmailVerificationCode } from "@/lib/otp";
import { sendVerificationOtpEmail } from "@/lib/mail";
import { createActivityLog, createAuditLog } from "@/lib/logs";
import { ActivityType, AuditAction, ResourceType } from "@/constants/logs";
import { getClientIp, getUserAgent } from "@/lib/request";

export async function POST(req: Request) {
  const transaction = await sequelize.transaction();

  try {
    const body = await req.json();
    const payload = registerCustomerSchema.parse(body);

    const email = payload.email.toLowerCase().trim();
    const phone = payload.phone?.trim() || null;

    const customerRole = await Role.findOne({
      where: { slug: "CUSTOMER" },
      transaction,
    });

    if (!customerRole) {
      await transaction.rollback();

      return errorResponse({
        message: "Customer role not found",
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
        roleId: customerRole.id,
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

    await CustomerProfile.create(
      {
        userId: user.id,
        birthDate: null,
        gender: null,
        heightCm: null,
        weightKg: null,
        emergencyContactName: null,
        emergencyContactPhone: null,
        healthNotes: null,
        fitnessGoals: null,
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
      activity: ActivityType.REGISTER_CUSTOMER,
      description: "Customer registered account",
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
        role: "CUSTOMER",
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
      message: "Customer registered successfully. Please verify your email.",
      status: 201,
      data: {
        user: {
          id: user.id,
          fullName: user.fullName,
          email: user.email,
          phone: user.phone,
          role: "CUSTOMER",
          isActive: user.isActive,
          emailVerifiedAt: user.emailVerifiedAt,
        },
      },
    });
  } catch (error) {
    await transaction.rollback();

    if (error instanceof Error && error.name === "ZodError") {
      return validationErrorResponse(error as never);
    }

    console.error("Register customer error:", error);

    return errorResponse({
      message: "Failed to register customer",
      status: 500,
    });
  }
}
