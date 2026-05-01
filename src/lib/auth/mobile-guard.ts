import { Role, User } from "@/database/models";
import { getBearerToken } from "@/lib/request";
import { verifyAccessToken } from "@/lib/jwt";

export async function getMobileAuthUser(req: Request) {
  const token = getBearerToken(req);

  if (!token) {
    return null;
  }

  try {
    const decoded = verifyAccessToken(token);

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
    });

    if (!user) {
      return null;
    }

    if (!user.isActive || !user.emailVerifiedAt) {
      return null;
    }

    const role = user.get("role") as Role | null;

    if (!role || !["CUSTOMER", "TRAINER"].includes(role.slug)) {
      return null;
    }

    return {
      user,
      role,
      token: decoded,
    };
  } catch {
    return null;
  }
}
