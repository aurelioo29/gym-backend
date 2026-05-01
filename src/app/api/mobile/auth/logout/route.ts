import { ZodError } from "zod";
import { RefreshToken } from "@/database/models";
import {
  errorResponse,
  successResponse,
  validationErrorResponse,
} from "@/lib/response";
import { logoutSchema } from "@/lib/validations/auth.validation";
import { createActivityLog } from "@/lib/logs";
import { ActivityType } from "@/constants/logs";
import { getClientIp, getUserAgent } from "@/lib/request";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const payload = logoutSchema.parse(body);

    const storedToken = await RefreshToken.findOne({
      where: {
        token: payload.refreshToken,
      },
    });

    await RefreshToken.update(
      {
        isRevoked: true,
      },
      {
        where: {
          token: payload.refreshToken,
        },
      },
    );

    await createActivityLog({
      userId: storedToken?.userId ?? null,
      activity: ActivityType.MOBILE_LOGOUT,
      description: "User logged out from mobile app",
      metadata: {
        tokenRevoked: true,
      },
      ipAddress: getClientIp(req),
      userAgent: getUserAgent(req),
    });

    return successResponse({
      message: "Logout successful",
      data: null,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return validationErrorResponse(error);
    }

    console.error("Mobile logout error:", error);

    return errorResponse({
      message: "Failed to logout",
      status: 500,
    });
  }
}
