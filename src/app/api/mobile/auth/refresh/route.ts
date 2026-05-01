import { ZodError } from "zod";
import { RefreshToken, User, Role, sequelize } from "@/database/models";
import {
  errorResponse,
  successResponse,
  validationErrorResponse,
} from "@/lib/response";
import { refreshTokenSchema } from "@/lib/validations/auth.validation";
import {
  decodeToken,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "@/lib/jwt";
import { createActivityLog } from "@/lib/logs";
import { ActivityType } from "@/constants/logs";
import { getClientIp, getUserAgent } from "@/lib/request";

export async function POST(req: Request) {
  const transaction = await sequelize.transaction();

  try {
    const body = await req.json();
    const payload = refreshTokenSchema.parse(body);

    let decoded;

    try {
      decoded = verifyRefreshToken(payload.refreshToken);
    } catch {
      await transaction.rollback();

      return errorResponse({
        message: "Refresh token tidak valid atau sudah expired",
        status: 401,
      });
    }

    const storedToken = await RefreshToken.findOne({
      where: {
        token: payload.refreshToken,
        isRevoked: false,
      },
      transaction,
    });

    if (!storedToken) {
      await transaction.rollback();

      return errorResponse({
        message: "Refresh token tidak ditemukan atau sudah dicabut",
        status: 401,
      });
    }

    if (storedToken.expiresAt.getTime() < Date.now()) {
      await storedToken.update(
        {
          isRevoked: true,
        },
        { transaction },
      );

      await transaction.commit();

      return errorResponse({
        message: "Refresh token sudah expired",
        status: 401,
      });
    }

    const user = await User.findOne({
      where: {
        id: decoded.id,
      },
      include: [
        {
          model: Role,
          as: "role",
        },
      ],
      transaction,
    });

    if (!user) {
      await transaction.rollback();

      return errorResponse({
        message: "User tidak ditemukan",
        status: 404,
      });
    }

    if (!user.isActive || !user.emailVerifiedAt) {
      await transaction.rollback();

      return errorResponse({
        message: "Akun tidak aktif atau belum diverifikasi",
        status: 403,
      });
    }

    const role = user.get("role") as Role | null;

    if (!role || !["CUSTOMER", "TRAINER"].includes(role.slug)) {
      await transaction.rollback();

      return errorResponse({
        message: "Akun ini tidak memiliki akses mobile",
        status: 403,
      });
    }

    await storedToken.update(
      {
        isRevoked: true,
      },
      { transaction },
    );

    const tokenPayload = {
      id: user.id,
      roleId: user.roleId,
      role: role.slug,
      email: user.email,
    };

    const newAccessToken = signAccessToken(tokenPayload);
    const newRefreshToken = signRefreshToken(tokenPayload);

    const decodedNewRefreshToken = decodeToken(newRefreshToken);

    if (!decodedNewRefreshToken?.exp) {
      await transaction.rollback();

      return errorResponse({
        message: "Failed to generate refresh token",
        status: 500,
      });
    }

    await RefreshToken.create(
      {
        userId: user.id,
        token: newRefreshToken,
        expiresAt: new Date(decodedNewRefreshToken.exp * 1000),
        isRevoked: false,
        ipAddress: getClientIp(req),
      },
      { transaction },
    );

    await transaction.commit();

    await createActivityLog({
      userId: user.id,
      activity: ActivityType.REFRESH_TOKEN,
      description: "Mobile access token refreshed",
      metadata: {
        role: role.slug,
        email: user.email,
      },
      ipAddress: getClientIp(req),
      userAgent: getUserAgent(req),
    });

    return successResponse({
      message: "Token refreshed successfully",
      data: {
        tokens: {
          accessToken: newAccessToken,
          refreshToken: newRefreshToken,
          tokenType: "Bearer",
        },
      },
    });
  } catch (error) {
    await transaction.rollback();

    if (error instanceof ZodError) {
      return validationErrorResponse(error);
    }

    console.error("Refresh token error:", error);

    return errorResponse({
      message: "Failed to refresh token",
      status: 500,
    });
  }
}
