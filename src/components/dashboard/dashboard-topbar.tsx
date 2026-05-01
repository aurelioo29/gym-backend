"use client";

import {
  BellOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
} from "@ant-design/icons";
import {
  Avatar,
  Badge,
  Button,
  Divider,
  Dropdown,
  Empty,
  Layout,
  List,
  Modal,
  Space,
  Spin,
  Typography,
  message,
} from "antd";
import type { MenuProps } from "antd";
import { signOut } from "next-auth/react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { apiGet, apiPatch } from "@/lib/client-api";

const { Header } = Layout;
const { Text } = Typography;

type DashboardTopbarProps = {
  collapsed: boolean;
  onToggleSidebar: () => void;
  user: {
    name?: string | null;
    email?: string | null;
    role?: string;
  };
};

type NotificationItem = {
  id: string;
  type: string;
  title: string;
  message: string | null;
  isRead: boolean;
  createdAt: string;
  actor?: {
    id: string;
    fullName: string;
    email: string;
    phone: string | null;
    avatarUrl: string | null;
  } | null;
};

type NotificationsResponse = {
  success: boolean;
  message: string;
  data: NotificationItem[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

type UnreadCountResponse = {
  success: boolean;
  message: string;
  data: {
    count: number;
  };
};

function getInitials(name?: string | null) {
  if (!name) return "AD";

  const words = name.trim().split(" ").filter(Boolean);

  if (words.length === 0) return "AD";

  if (words.length === 1) {
    return words[0].slice(0, 2).toUpperCase();
  }

  return `${words[0][0]}${words[1][0]}`.toUpperCase();
}

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return date.toLocaleString("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default function DashboardTopbar({
  collapsed,
  onToggleSidebar,
  user,
}: DashboardTopbarProps) {
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationLoading, setNotificationLoading] = useState(false);

  const initials = useMemo(() => getInitials(user.name), [user.name]);

  async function fetchNotifications() {
    try {
      setNotificationLoading(true);

      const [notificationResponse, countResponse] = await Promise.all([
        apiGet<NotificationsResponse>("/api/admin/notifications?limit=5"),
        apiGet<UnreadCountResponse>("/api/admin/notifications/unread-count"),
      ]);

      setNotifications(notificationResponse.data || []);
      setUnreadCount(countResponse.data.count || 0);
    } catch (error) {
      console.error("Fetch notifications error:", error);
    } finally {
      setNotificationLoading(false);
    }
  }

  useEffect(() => {
    fetchNotifications();

    const interval = window.setInterval(() => {
      fetchNotifications();
    }, 60000);

    return () => window.clearInterval(interval);
  }, []);

  async function handleMarkAsRead(notificationId: string) {
    try {
      await apiPatch(`/api/admin/notifications/${notificationId}/read`);
      await fetchNotifications();
    } catch (error) {
      console.error("Mark notification read error:", error);
      message.error("Failed to mark notification as read");
    }
  }

  async function handleConfirmLogout() {
    setLogoutLoading(true);

    await signOut({
      callbackUrl: "/login",
    });
  }

  const profileMenuItems: MenuProps["items"] = [
    {
      key: "profile",
      label: (
        <div className="min-w-56">
          <div className="flex items-center gap-3">
            <Avatar
              size={42}
              className="!bg-slate-900 !text-white !font-semibold"
            >
              {initials}
            </Avatar>

            <div className="min-w-0">
              <Text className="block !font-semibold truncate">
                {user.name || "Admin"}
              </Text>
              <Text className="block !text-xs !text-slate-500 truncate">
                {user.email}
              </Text>
              <Text className="block !text-xs !text-slate-500">
                Role: {user.role}
              </Text>
            </div>
          </div>
        </div>
      ),
    },
    {
      type: "divider",
    },
    {
      key: "logout",
      danger: true,
      icon: <LogoutOutlined />,
      label: "Logout",
      onClick: () => setLogoutModalOpen(true),
    },
  ];

  const notificationPopup = (
    <div className="w-[380px] rounded-xl bg-white shadow-lg">
      <div className="flex items-center justify-between px-4 py-3">
        <div>
          <Text className="block !font-semibold">Notifications</Text>
          <Text className="block !text-xs !text-slate-500">
            {unreadCount} unread notification{unreadCount > 1 ? "s" : ""}
          </Text>
        </div>

        <Link href="/dashboard/notifications">
          <Button type="link" size="small">
            See all
          </Button>
        </Link>
      </div>

      <Divider className="!my-0" />

      <div className="max-h-[380px] overflow-auto">
        {notificationLoading ? (
          <div className="flex justify-center p-8">
            <Spin />
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-6">
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description="No notifications"
            />
          </div>
        ) : (
          <List
            dataSource={notifications}
            renderItem={(item) => (
              <List.Item
                className="!px-4 !py-3 hover:!bg-slate-50 cursor-pointer"
                onClick={() => {
                  if (!item.isRead) {
                    handleMarkAsRead(item.id);
                  }
                }}
              >
                <div className="flex w-full gap-3">
                  <div className="pt-1">
                    <span
                      className={`block h-2.5 w-2.5 rounded-full ${
                        !item.isRead ? "bg-blue-500" : "bg-slate-300"
                      }`}
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <Text className="block !font-medium truncate">
                      {item.title}
                    </Text>

                    <Text className="block !text-xs !text-slate-500 line-clamp-2">
                      {item.message || "-"}
                    </Text>

                    <Text className="mt-1 block !text-[11px] !text-slate-400">
                      {formatDate(item.createdAt)}
                    </Text>
                  </div>
                </div>
              </List.Item>
            )}
          />
        )}
      </div>
    </div>
  );

  return (
    <>
      <Header className="!h-16 !bg-white border-b border-slate-200 !px-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={onToggleSidebar}
          />

          <div className="leading-tight">
            <Text className="!font-semibold !text-slate-900 block">
              Dashboard
            </Text>
            <Text className="!text-xs !text-slate-500 block">
              Gym management admin panel
            </Text>
          </div>
        </div>

        <Space size={14}>
          <Dropdown
            trigger={["click"]}
            placement="bottomRight"
            dropdownRender={() => notificationPopup}
          >
            <Badge count={unreadCount} size="small">
              <Button shape="circle" icon={<BellOutlined />} />
            </Badge>
          </Dropdown>

          <Dropdown
            trigger={["click"]}
            placement="bottomRight"
            menu={{
              items: profileMenuItems,
            }}
          >
            <button className="flex items-center rounded-full border border-slate-200 p-1 hover:bg-slate-50 transition">
              <Avatar className="!bg-slate-900 !text-white !font-semibold">
                {initials}
              </Avatar>
            </button>
          </Dropdown>
        </Space>
      </Header>

      <Modal
        title="Confirm Logout"
        open={logoutModalOpen}
        centered
        onCancel={() => setLogoutModalOpen(false)}
        onOk={handleConfirmLogout}
        okText="Logout"
        cancelText="Cancel"
        confirmLoading={logoutLoading}
        okButtonProps={{
          danger: true,
        }}
      >
        <p className="mb-0">
          Are you sure you want to logout? Your session will be ended.
        </p>
      </Modal>
    </>
  );
}
