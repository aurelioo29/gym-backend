import bcrypt from "bcryptjs";
import { Role, User } from "@/database/models";

const MOBILE_ALLOWED_ROLES = ["CUSTOMER", "TRAINER"];

export async function authorizeMobileLogin({
  identifier,
  password,
}: {
  identifier: string;
  password: string;
}) {
  const cleanIdentifier = identifier.trim();
  const isEmail = cleanIdentifier.includes("@");

  const user = await User.findOne({
    where: isEmail
      ? { email: cleanIdentifier.toLowerCase() }
      : { phone: cleanIdentifier },
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

  if (!user.isActive) {
    throw new Error("Akun belum aktif atau sedang dinonaktifkan.");
  }

  if (!user.emailVerifiedAt) {
    throw new Error("Email belum diverifikasi.");
  }

  const role = user.get("role") as Role | null;

  if (!role || !MOBILE_ALLOWED_ROLES.includes(role.slug)) {
    throw new Error("Akun ini tidak memiliki akses ke aplikasi mobile.");
  }

  const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

  if (!isPasswordValid) {
    return null;
  }

  await user.update({
    lastLoginAt: new Date(),
  });

  return {
    user,
    role,
  };
}
