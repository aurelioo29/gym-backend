"use client";

import { Breadcrumb } from "antd";
import Link from "next/link";
import { usePathname } from "next/navigation";

const breadcrumbLabels: Record<string, string> = {
  dashboard: "Dashboard",
  users: "Users",
  trainers: "Trainers",
  approval: "Approval",
  roles: "Roles",
  permissions: "Permissions",
  settings: "Settings",
  "gym-info": "Gym Info",
  general: "General",
  notifications: "Notifications",
  logs: "Logs",
  activity: "Activity Logs",
  audit: "Audit Logs",
};

function formatSegment(segment: string) {
  return (
    breadcrumbLabels[segment] ||
    segment
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ")
  );
}

export default function DashboardBreadcrumb() {
  const pathname = usePathname();

  const segments = pathname.split("/").filter(Boolean);

  const items = segments.map((segment, index) => {
    const href = "/" + segments.slice(0, index + 1).join("/");
    const isLast = index === segments.length - 1;

    return {
      title: isLast ? (
        formatSegment(segment)
      ) : (
        <Link href={href}>{formatSegment(segment)}</Link>
      ),
    };
  });

  return (
    <Breadcrumb
      items={[
        { title: <Link href="/dashboard">Home</Link> },
        ...items.slice(1),
      ]}
      style={{ margin: "16px 0" }}
    />
  );
}
