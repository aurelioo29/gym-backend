import { Role, User } from "@/database/models";
import { verifyAccessToken } from "@/lib/jwt";

type MobileSessionSuccess = {
  authorized: true;
  status: 200;
  message: string;
  user: User;
  role: Role;
};

type MobileSessionFailed = {
  authorized: false;
  status: number;
  message: string;
  user: null;
  role: null;
};

type MobileSessionResult = MobileSessionSuccess | MobileSessionFailed;

function getBearerToken(req: Request) {
  const authorization = req.headers.get("authorization");

  if (!authorization) {
    return null;
  }

  const [scheme, token] = authorization.split(" ");

  if (scheme !== "Bearer" || !token) {
    return null;
  }

  return token;
}

export async function getMobileSession(
  req?: Request,
): Promise<MobileSessionResult> {
  if (!req) {
    return {
      authorized: false,
      status: 401,
      message: "Unauthorized",
      user: null,
      role: null,
    };
  }

  const token = getBearerToken(req);

  if (!token) {
    return {
      authorized: false,
      status: 401,
      message: "Access token tidak ditemukan",
      user: null,
      role: null,
    };
  }

  let decoded: {
    id?: string;
    userId?: string;
    role?: string;
    type?: string;
  };

  try {
    decoded = verifyAccessToken(token);
  } catch {
    return {
      authorized: false,
      status: 401,
      message: "Access token tidak valid atau sudah expired",
      user: null,
      role: null,
    };
  }

  const userId = decoded.userId || decoded.id;

  if (!userId) {
    return {
      authorized: false,
      status: 401,
      message: "Payload token tidak valid",
      user: null,
      role: null,
    };
  }

  const user = await User.findOne({
    where: {
      id: userId,
      isActive: true,
    },
    include: [
      {
        model: Role,
        as: "role",
      },
    ],
  });

  if (!user) {
    return {
      authorized: false,
      status: 401,
      message: "User tidak ditemukan atau tidak aktif",
      user: null,
      role: null,
    };
  }

  const role = user.get("role") as Role | null;

  if (!role) {
    return {
      authorized: false,
      status: 403,
      message: "Role user tidak ditemukan",
      user: null,
      role: null,
    };
  }

  if (!["CUSTOMER", "TRAINER"].includes(role.slug)) {
    return {
      authorized: false,
      status: 403,
      message: "Akun ini tidak memiliki akses mobile",
      user: null,
      role: null,
    };
  }

  return {
    authorized: true,
    status: 200,
    message: "Authorized",
    user,
    role,
  };
}
