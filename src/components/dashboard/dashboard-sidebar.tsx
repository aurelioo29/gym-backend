"use client";

import { Layout, Menu, theme, Typography } from "antd";
import { Dumbbell } from "lucide-react";
import { usePathname } from "next/navigation";
import {
  dashboardSideMenuItems,
  filterMenuByPermission,
  getDefaultOpenKeys,
  toAntdSideMenuItems,
} from "@/lib/menu/dashboard-menu";

const { Sider } = Layout;
const { Text } = Typography;

type DashboardSidebarProps = {
  collapsed: boolean;
  permissions: string[];
};

export default function DashboardSidebar({
  collapsed,
  permissions,
}: DashboardSidebarProps) {
  const pathname = usePathname();

  const {
    token: { colorBgContainer },
  } = theme.useToken();

  const filteredMenu = filterMenuByPermission(
    dashboardSideMenuItems,
    permissions,
  );

  return (
    <Sider
      width={260}
      collapsedWidth={80}
      collapsed={collapsed}
      trigger={null}
      style={{
        background: colorBgContainer,
        borderRight: "1px solid #f0f0f0",
      }}
    >
      <div className="h-16 flex items-center gap-3 px-5 border-b border-slate-100">
        <div className="h-10 w-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shrink-0">
          <Dumbbell size={20} />
        </div>

        {!collapsed && (
          <div className="leading-tight min-w-0">
            <Text className="!font-bold !text-slate-900 block truncate">
              Gym Admin
            </Text>
            <Text className="!text-xs !text-slate-500 block truncate">
              Management System
            </Text>
          </div>
        )}
      </div>

      <div className="py-3">
        <Menu
          mode="inline"
          selectedKeys={[pathname]}
          defaultOpenKeys={getDefaultOpenKeys(pathname)}
          style={{ borderInlineEnd: 0 }}
          items={toAntdSideMenuItems(filteredMenu)}
        />
      </div>
    </Sider>
  );
}
