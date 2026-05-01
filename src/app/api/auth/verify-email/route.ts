import { ZodError } from "zod";
import { User, VerificationCode, sequelize } from "@/database/models";
import {
  successResponse,
  errorResponse,
  validationErrorResponse,
} from "@/lib/response";
import { verifyEmailSchema } from "@/lib/validations/auth.validation";
import { env } from "@/lib/env";
import { createActivityLog, createAuditLog } from "@/lib/logs";
import { ActivityType, AuditAction, ResourceType } from "@/constants/logs";
import { getClientIp, getUserAgent } from "@/lib/request";

export async function POST(req: Request) {
  const transaction = await sequelize.transaction();

  try {
    const body = await req.json();
    const payload = verifyEmailSchema.parse(body);

    const email = payload.email.toLowerCase().trim();
    const code = payload.code.trim();

    const user = await User.findOne({
      where: { email },
      transaction,
    });

    if (!user) {
      await transaction.rollback();

      return errorResponse({
        message: "User tidak ditemukan",
        status: 404,
      });
    }

    if (user.emailVerifiedAt && user.isActive) {
      await transaction.rollback();

      return successResponse({
        message: "Email sudah terverifikasi",
        data: {
          verified: true,
        },
      });
    }

    const verificationCode = await VerificationCode.findOne({
      where: {
        userId: user.id,
        email,
        type: "EMAIL_VERIFICATION",
        verifiedAt: null,
      },
      order: [["createdAt", "DESC"]],
      transaction,
    });

    if (!verificationCode) {
      await transaction.rollback();

      return errorResponse({
        message: "Kode OTP tidak ditemukan. Silakan request ulang OTP.",
        status: 404,
      });
    }

    if (verificationCode.attempts >= env.otp.maxAttempts) {
      await transaction.rollback();

      return errorResponse({
        message: "Percobaan OTP terlalu banyak. Silakan request ulang OTP.",
        status: 429,
      });
    }

    if (verificationCode.expiresAt.getTime() < Date.now()) {
      await transaction.rollback();

      return errorResponse({
        message: "Kode OTP sudah expired. Silakan request ulang OTP.",
        status: 400,
      });
    }

    const oldUserData = {
      id: user.id,
      email: user.email,
      isActive: user.isActive,
      emailVerifiedAt: user.emailVerifiedAt,
    };

    if (verificationCode.code !== code) {
      await verificationCode.update(
        {
          attempts: verificationCode.attempts + 1,
        },
        { transaction },
      );

      await transaction.commit();

      return errorResponse({
        message: "Kode OTP salah",
        status: 400,
      });
    }

    const now = new Date();

    await verificationCode.update(
      {
        verifiedAt: now,
      },
      { transaction },
    );

    await user.update(
      {
        isActive: true,
        emailVerifiedAt: now,
      },
      { transaction },
    );

    await transaction.commit();

    await createActivityLog({
      userId: user.id,
      activity: ActivityType.VERIFY_EMAIL,
      description: "User verified email using OTP",
      metadata: {
        email: user.email,
      },
      ipAddress: getClientIp(req),
      userAgent: getUserAgent(req),
    });

    await createAuditLog({
      userId: user.id,
      action: AuditAction.UPDATE,
      resourceType: ResourceType.USER,
      resourceId: user.id,
      oldData: oldUserData,
      newData: {
        id: user.id,
        email: user.email,
        isActive: true,
        emailVerifiedAt: now,
      },
      ipAddress: getClientIp(req),
    });

    return successResponse({
      message: "Email verified successfully. Account is now active.",
      data: {
        verified: true,
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          isActive: true,
          emailVerifiedAt: now,
        },
      },
    });
  } catch (error) {
    await transaction.rollback();

    if (error instanceof ZodError) {
      return validationErrorResponse(error);
    }

    console.error("Verify email error:", error);

    return errorResponse({
      message: "Failed to verify email",
      status: 500,
    });
  }
}
