import { GeneralSetting } from "@/database/models";
import { successResponse } from "@/lib/response";

function parseSettingValue(value: string | null, type: string) {
  if (value === null) return null;

  if (type === "BOOLEAN") {
    return value === "true";
  }

  if (type === "NUMBER") {
    return Number(value);
  }

  if (type === "JSON") {
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  }

  return value;
}

export async function GET() {
  const settings = await GeneralSetting.findAll({
    where: {
      isPublic: true,
    },
    order: [
      ["groupName", "ASC"],
      ["key", "ASC"],
    ],
  });

  const data = settings.reduce<Record<string, unknown>>((acc, setting) => {
    acc[setting.key] = parseSettingValue(setting.value, setting.type);
    return acc;
  }, {});

  return successResponse({
    message: "Public settings fetched successfully",
    data,
  });
}
