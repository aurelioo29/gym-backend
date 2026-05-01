import { CustomerProfile, TrainerProfile } from "@/database/models";
import { getMobileAuthUser } from "@/lib/auth/mobile-guard";
import { errorResponse, successResponse } from "@/lib/response";

export async function GET(req: Request) {
  const authUser = await getMobileAuthUser(req);

  if (!authUser) {
    return errorResponse({
      message: "Unauthenticated",
      status: 401,
    });
  }

  const { user, role } = authUser;

  if (role.slug === "CUSTOMER") {
    const profile = await CustomerProfile.findOne({
      where: {
        userId: user.id,
      },
    });

    return successResponse({
      message: "Profile fetched successfully",
      data: {
        user: {
          id: user.id,
          fullName: user.fullName,
          email: user.email,
          phone: user.phone,
          avatarUrl: user.avatarUrl,
          role: role.slug,
          isActive: user.isActive,
          emailVerifiedAt: user.emailVerifiedAt,
        },
        profile,
        trainerStatus: null,
      },
    });
  }

  if (role.slug === "TRAINER") {
    const profile = await TrainerProfile.findOne({
      where: {
        userId: user.id,
      },
    });

    return successResponse({
      message: "Profile fetched successfully",
      data: {
        user: {
          id: user.id,
          fullName: user.fullName,
          email: user.email,
          phone: user.phone,
          avatarUrl: user.avatarUrl,
          role: role.slug,
          isActive: user.isActive,
          emailVerifiedAt: user.emailVerifiedAt,
        },
        profile,
        trainerStatus: profile
          ? {
              approvalStatus: profile.approvalStatus,
              certificateUrl: profile.certificateUrl,
              rejectedReason: profile.rejectedReason,
              isAvailable: profile.isAvailable,
              canTeach: profile.approvalStatus === "APPROVED",
            }
          : null,
      },
    });
  }

  return errorResponse({
    message: "Invalid mobile role",
    status: 403,
  });
}
