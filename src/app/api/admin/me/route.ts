import { auth } from "@/auth";
import { errorResponse, successResponse } from "@/lib/response";

export async function GET() {
  const session = await auth();

  if (!session) {
    return errorResponse({
      message: "Unauthenticated",
      status: 401,
    });
  }

  return successResponse({
    message: "Authenticated user fetched successfully",
    data: {
      user: session.user,
    },
  });
}
