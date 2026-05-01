"use client";

import {
  Alert,
  Card,
  Col,
  Row,
  Skeleton,
  Statistic,
  Typography,
  message,
} from "antd";
import {
  AuditOutlined,
  BellOutlined,
  SafetyCertificateOutlined,
  TeamOutlined,
  UserSwitchOutlined,
} from "@ant-design/icons";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useEffect, useState } from "react";
import { apiGet } from "@/lib/client-api";

const { Title, Text } = Typography;

type DashboardHomeProps = {
  user: {
    name?: string | null;
    email?: string | null;
    role?: string;
    permissions?: string[];
  };
};

type DashboardOverviewResponse = {
  success: boolean;
  message: string;
  data: {
    stats: {
      totalUsers: number;
      activeUsers: number;
      inactiveUsers: number;
      totalRoles: number;
      totalActivityLogs: number;
      totalAuditLogs: number;
      unreadNotifications: number;
      pendingTrainerApprovals: number;
    };
    charts: {
      userRoles: {
        role: string;
        count: number;
      }[];
      logsChart: {
        day: string;
        date: string;
        activityLogs: number;
        auditLogs: number;
      }[];
    };
  };
};

const roleColors: Record<string, string> = {
  SUPERADMIN: "#ef4444",
  ADMIN: "#3b82f6",
  CUSTOMER: "#22c55e",
  TRAINER: "#a855f7",
};

export default function DashboardHome({ user }: DashboardHomeProps) {
  const [overview, setOverview] = useState<
    DashboardOverviewResponse["data"] | null
  >(null);
  const [loading, setLoading] = useState(true);

  async function fetchOverview() {
    try {
      setLoading(true);

      const response = await apiGet<DashboardOverviewResponse>(
        "/api/admin/dashboard/overview",
      );

      setOverview(response.data);
    } catch (error) {
      console.error("Fetch dashboard overview error:", error);
      message.error("Failed to fetch dashboard overview");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchOverview();
  }, []);

  const stats = overview?.stats;
  const userRoles = overview?.charts.userRoles || [];
  const logsChart = overview?.charts.logsChart || [];

  return (
    <div>
      <div className="mb-6">
        <Title level={3} className="!mb-1">
          Dashboard
        </Title>

        <Text type="secondary">
          Welcome back, {user.name || "Admin"}. System overview, minus the
          dramatic spreadsheet chaos.
        </Text>
      </div>

      {loading ? (
        <Row gutter={[16, 16]}>
          {Array.from({ length: 8 }).map((_, index) => (
            <Col xs={24} md={12} xl={6} key={index}>
              <Card>
                <Skeleton active paragraph={{ rows: 1 }} />
              </Card>
            </Col>
          ))}
        </Row>
      ) : (
        <>
          <Row gutter={[16, 16]}>
            <Col xs={24} md={12} xl={6}>
              <Card>
                <Statistic
                  title="Total Users"
                  value={stats?.totalUsers || 0}
                  prefix={<TeamOutlined />}
                />
                <Text className="!text-xs !text-slate-500">
                  All registered accounts
                </Text>
              </Card>
            </Col>

            <Col xs={24} md={12} xl={6}>
              <Card>
                <Statistic
                  title="Active Users"
                  value={stats?.activeUsers || 0}
                  prefix={<UserSwitchOutlined />}
                />
                <Text className="!text-xs !text-slate-500">
                  Currently active accounts
                </Text>
              </Card>
            </Col>

            <Col xs={24} md={12} xl={6}>
              <Card>
                <Statistic
                  title="Pending Trainers"
                  value={stats?.pendingTrainerApprovals || 0}
                  prefix={<SafetyCertificateOutlined />}
                />
                <Text className="!text-xs !text-slate-500">
                  Waiting for certificate approval
                </Text>
              </Card>
            </Col>

            <Col xs={24} md={12} xl={6}>
              <Card>
                <Statistic
                  title="Unread Notifications"
                  value={stats?.unreadNotifications || 0}
                  prefix={<BellOutlined />}
                />
                <Text className="!text-xs !text-slate-500">
                  Alerts waiting for you
                </Text>
              </Card>
            </Col>

            <Col xs={24} md={12} xl={6}>
              <Card>
                <Statistic
                  title="Roles"
                  value={stats?.totalRoles || 0}
                  prefix={<SafetyCertificateOutlined />}
                />
                <Text className="!text-xs !text-slate-500">
                  Access control roles
                </Text>
              </Card>
            </Col>

            <Col xs={24} md={12} xl={6}>
              <Card>
                <Statistic
                  title="Activity Logs"
                  value={stats?.totalActivityLogs || 0}
                  prefix={<AuditOutlined />}
                />
                <Text className="!text-xs !text-slate-500">
                  User activity records
                </Text>
              </Card>
            </Col>

            <Col xs={24} md={12} xl={6}>
              <Card>
                <Statistic
                  title="Audit Logs"
                  value={stats?.totalAuditLogs || 0}
                  prefix={<AuditOutlined />}
                />
                <Text className="!text-xs !text-slate-500">
                  Data change records
                </Text>
              </Card>
            </Col>

            <Col xs={24} md={12} xl={6}>
              <Card>
                <Statistic
                  title="Inactive Users"
                  value={stats?.inactiveUsers || 0}
                  prefix={<UserSwitchOutlined />}
                />
                <Text className="!text-xs !text-slate-500">
                  Disabled accounts
                </Text>
              </Card>
            </Col>
          </Row>

          <Row gutter={[16, 16]} className="mt-6">
            <Col xs={24} xl={16}>
              <Card
                title="Logs Activity - Last 7 Days"
                extra={
                  <Text className="!text-xs !text-slate-500">
                    Activity vs Audit
                  </Text>
                }
              >
                {logsChart.length === 0 ? (
                  <Alert
                    type="info"
                    showIcon
                    message="No log data yet"
                    description="Logs will appear here after users start using the system."
                  />
                ) : (
                  <div className="h-[320px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={logsChart}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="day" />
                        <YAxis allowDecimals={false} />
                        <Tooltip />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="activityLogs"
                          name="Activity Logs"
                          stroke="#3b82f6"
                          strokeWidth={3}
                        />
                        <Line
                          type="monotone"
                          dataKey="auditLogs"
                          name="Audit Logs"
                          stroke="#f97316"
                          strokeWidth={3}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </Card>
            </Col>

            <Col xs={24} xl={8}>
              <Card
                title="Users by Role"
                extra={
                  <Text className="!text-xs !text-slate-500">
                    Account distribution
                  </Text>
                }
              >
                <div className="h-[320px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={userRoles}
                        dataKey="count"
                        nameKey="role"
                        outerRadius={105}
                        label={({ role, count }) => `${role}: ${count}`}
                      >
                        {userRoles.map((entry) => (
                          <Cell
                            key={entry.role}
                            fill={roleColors[entry.role] || "#64748b"}
                          />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </Col>
          </Row>

          <Row gutter={[16, 16]} className="mt-6">
            <Col xs={24}>
              <Card title="Role Distribution">
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={userRoles}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="role" />
                      <YAxis allowDecimals={false} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="count" name="Users">
                        {userRoles.map((entry) => (
                          <Cell
                            key={entry.role}
                            fill={roleColors[entry.role] || "#64748b"}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </Col>
          </Row>
        </>
      )}
    </div>
  );
}
