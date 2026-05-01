import { ZodError } from "zod";
import { User, VerificationCode, sequelize } from "@/database/models";
import {
  successResponse,
  errorResponse,
  validationErrorResponse,
} from "@/lib/response";
import { resendOtpSchema } from "@/lib/validations/auth.validation";
import { env } from "@/lib/env";
import { createEmailVerificationCode } from "@/lib/otp";
import { sendVerificationOtpEmail } from "@/lib/mail";
import { createActivityLog } from "@/lib/logs";
import { ActivityType } from "@/constants/logs";
import { getClientIp, getUserAgent } from "@/lib/request";

export async function POST(req: Request) {
  const transaction = await sequelize.transaction();

  try {
    const body = await req.json();
    const payload = resendOtpSchema.parse(body);

    const email = payload.email.toLowerCase().trim();

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

      return errorResponse({
        message: "Email sudah terverifikasi",
        status: 400,
      });
    }

    const lastOtp = await VerificationCode.findOne({
      where: {
        userId: user.id,
        email,
        type: "EMAIL_VERIFICATION",
      },
      order: [["createdAt", "DESC"]],
      transaction,
    });

    if (lastOtp?.lastSentAt) {
      const diffMs = Date.now() - lastOtp.lastSentAt.getTime();
      const cooldownMs = env.otp.resendCooldownSeconds * 1000;

      if (diffMs < cooldownMs) {
        const remainingSeconds = Math.ceil((cooldownMs - diffMs) / 1000);

        await transaction.rollback();

        return errorResponse({
          message: `Tunggu ${remainingSeconds} detik sebelum request OTP ulang.`,
          status: 429,
        });
      }
    }

    // Mark old unverified OTP as expired-ish by setting verifiedAt?
    // Better: leave history intact, newest OTP will be used.
    const otpCode = await createEmailVerificationCode({
      userId: user.id,
      email,
      transaction,
    });

    await transaction.commit();

    await createActivityLog({
      userId: user.id,
      activity: ActivityType.RESEND_OTP,
      description: "User requested email verification OTP resend",
      metadata: {
        email: user.email,
      },
      ipAddress: getClientIp(req),
      userAgent: getUserAgent(req),
    });

    await sendVerificationOtpEmail({
      to: email,
      fullName: user.fullName,
      code: otpCode,
    });

    return successResponse({
      message: "OTP berhasil dikirim ulang",
      data: {
        email,
        resendCooldownSeconds: env.otp.resendCooldownSeconds,
      },
    });
  } catch (error) {
    await transaction.rollback();

    if (error instanceof ZodError) {
      return validationErrorResponse(error);
    }

    console.error("Resend OTP error:", error);

    return errorResponse({
      message: "Failed to resend OTP",
      status: 500,
    });
  }
}
