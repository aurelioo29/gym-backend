import { MembershipPlan } from "@/database/models";
import { successResponse } from "@/lib/response";

export async function GET() {
  const plans = await MembershipPlan.findAll({
    where: {
      isActive: true,
    },
    order: [
      ["price", "ASC"],
      ["durationDays", "ASC"],
    ],
  });

  return successResponse({
    message: "Public membership plans fetched successfully",
    data: plans,
  });
}
