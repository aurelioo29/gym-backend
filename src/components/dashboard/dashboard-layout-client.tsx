"use client";

import { useState } from "react";
import { Layout, theme } from "antd";
import DashboardTopbar from "./dashboard-topbar";
import DashboardSidebar from "./dashboard-sidebar";
import DashboardBreadcrumb from "./dashboard-breadcrumb";

const { Content } = Layout;

type DashboardLayoutClientProps = {
  children: React.ReactNode;
  user: {
    name?: string | null;
    email?: string | null;
    role?: string;
    permissions: string[];
  };
};

export default function DashboardLayoutClient({
  children,
  user,
}: DashboardLayoutClientProps) {
  const [collapsed, setCollapsed] = useState(false);

  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  return (
    <Layout className="min-h-screen">
      <DashboardSidebar collapsed={collapsed} permissions={user.permissions} />

      <Layout>
        <DashboardTopbar
          collapsed={collapsed}
          onToggleSidebar={() => setCollapsed((value) => !value)}
          user={{
            name: user.name,
            email: user.email,
            role: user.role,
          }}
        />

        <Layout style={{ padding: "0 24px 24px" }}>
          <DashboardBreadcrumb />

          <Content
            style={{
              padding: 24,
              margin: 0,
              minHeight: "calc(100vh - 112px)",
              background: colorBgContainer,
              borderRadius: borderRadiusLG,
            }}
          >
            {children}
          </Content>
        </Layout>
      </Layout>
    </Layout>
  );
}
