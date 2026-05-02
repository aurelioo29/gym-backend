import { ZodError } from "zod";
import { RefreshToken, sequelize } from "@/database/models";
import {
  errorResponse,
  successResponse,
  validationErrorResponse,
} from "@/lib/response";
import { mobileLoginSchema } from "@/lib/validations/auth.validation";
import { authorizeMobileLogin } from "@/lib/auth/mobile-auth";
import { signAccessToken, signRefreshToken, decodeToken } from "@/lib/jwt";
import { createActivityLog } from "@/lib/logs";
import { ActivityType } from "@/constants/logs";
import { getClientIp, getUserAgent } from "@/lib/request";

export async function POST(req: Request) {
  const transaction = await sequelize.transaction();

  try {
    const body = await req.json();
    const payload = mobileLoginSchema.parse(body);

    const result = await authorizeMobileLogin({
      identifier: payload.identifier,
      password: payload.password,
    });

    if (!result) {
      await transaction.rollback();

      return errorResponse({
        message: "Email/phone atau password salah.",
        status: 401,
      });
    }

    const { user, role } = result;

    const tokenPayload = {
      id: user.id,
      roleId: user.roleId,
      role: role.slug,
      email: user.email,
    };

    const accessToken = signAccessToken(tokenPayload);
    const refreshToken = signRefreshToken(tokenPayload);

    const decodedRefreshToken = decodeToken(refreshToken);

    if (!decodedRefreshToken?.exp) {
      await transaction.rollback();

      return errorResponse({
        message: "Failed to generate refresh token",
        status: 500,
      });
    }

    await RefreshToken.create(
      {
        userId: user.id,
        token: refreshToken,
        expiresAt: new Date(decodedRefreshToken.exp * 1000),
        isRevoked: false,
        ipAddress: getClientIp(req),
      },
      { transaction },
    );

    await transaction.commit();

    await createActivityLog({
      userId: user.id,
      activity: ActivityType.MOBILE_LOGIN_SUCCESS,
      description: "User logged in from mobile app",
      metadata: {
        role: role.slug,
        email: user.email,
      },
      ipAddress: getClientIp(req),
      userAgent: getUserAgent(req),
    });

    return successResponse({
      message: "Login successful",
      data: {
        user: {
          id: user.id,
          fullName: user.fullName,
          email: user.email,
          phone: user.phone,
          avatarUrl: user.avatarUrl,
          role: role.slug,
        },
        tokens: {
          accessToken,
          refreshToken,
          tokenType: "Bearer",
        },
      },
    });
  } catch (error) {
    await transaction.rollback();

    if (error instanceof ZodError) {
      return validationErrorResponse(error);
    }

    if (error instanceof Error) {
      const knownErrors = [
        "Akun belum aktif atau sedang dinonaktifkan.",
        "Email belum diverifikasi.",
        "Akun ini tidak memiliki akses ke aplikasi mobile.",
      ];

      if (knownErrors.includes(error.message)) {
        return errorResponse({
          message: error.message,
          status: 403,
        });
      }
    }

    console.error("Mobile login error:", error);

    return errorResponse({
      message: "Failed to login",
      status: 500,
    });
  }
}
