import { auth } from "@/auth";

export async function getAdminSession(requiredPermission?: string) {
  const session = await auth();

  if (!session) {
    return {
      authorized: false,
      status: 401,
      message: "Unauthenticated",
      session: null,
    };
  }

  const role = session.user.role;
  const permissions = session.user.permissions ?? [];

  const isAdminRole = ["SUPERADMIN", "ADMIN"].includes(role);

  if (!isAdminRole) {
    return {
      authorized: false,
      status: 403,
      message: "Forbidden",
      session,
    };
  }

  if (requiredPermission && !permissions.includes(requiredPermission)) {
    return {
      authorized: false,
      status: 403,
      message: "You do not have permission to access this resource",
      session,
    };
  }

  return {
    authorized: true,
    status: 200,
    message: "Authorized",
    session,
  };
}
