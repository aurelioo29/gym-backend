import bcrypt from "bcryptjs";
import { Op } from "sequelize";
import { Role, User, Permission } from "@/database/models";

type AdminLoginInput = {
  identifier: string;
  password: string;
};

const ADMIN_ALLOWED_ROLES = ["SUPERADMIN", "ADMIN"];

export async function authorizeAdminLogin({
  identifier,
  password,
}: AdminLoginInput) {
  const cleanIdentifier = identifier.trim();

  if (!cleanIdentifier || !password) {
    return null;
  }

  const isEmail = cleanIdentifier.includes("@");

  const user = await User.findOne({
    where: isEmail
      ? { email: cleanIdentifier.toLowerCase() }
      : { phone: cleanIdentifier },
    include: [
      {
        model: Role,
        as: "role",
        include: [
          {
            model: Permission,
            as: "permissions",
            through: {
              attributes: [],
            },
          },
        ],
      },
    ],
  });

  if (!user) {
    return null;
  }

  if (!user.isActive) {
    throw new Error("Akun belum aktif atau sedang dinonaktifkan.");
  }

  if (!user.emailVerifiedAt) {
    throw new Error("Email belum diverifikasi.");
  }

  const role = user.get("role") as Role & {
    permissions?: Permission[];
  };

  if (!role || !ADMIN_ALLOWED_ROLES.includes(role.slug)) {
    throw new Error("Akun ini tidak memiliki akses ke dashboard admin.");
  }

  const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

  if (!isPasswordValid) {
    return null;
  }

  await user.update({
    lastLoginAt: new Date(),
  });

  const permissions =
    role.permissions?.map((permission) => permission.key) ?? [];

  return {
    id: user.id,
    name: user.fullName,
    email: user.email,
    image: user.avatarUrl,
    roleId: user.roleId,
    role: role.slug,
    permissions,
  };
}
