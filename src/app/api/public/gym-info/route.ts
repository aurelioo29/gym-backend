import { GymInfo } from "@/database/models";
import { successResponse } from "@/lib/response";

export async function GET() {
  const gymInfo = await GymInfo.findOne({
    order: [["createdAt", "ASC"]],
    attributes: [
      "id",
      "name",
      "tagline",
      "description",
      "email",
      "phone",
      "whatsapp",
      "address",
      "city",
      "province",
      "postalCode",
      "latitude",
      "longitude",
      "logoUrl",
      "faviconUrl",
      "openingHours",
      "instagramUrl",
      "facebookUrl",
      "tiktokUrl",
      "youtubeUrl",
    ],
  });

  return successResponse({
    message: "Public gym info fetched successfully",
    data: gymInfo,
  });
}
