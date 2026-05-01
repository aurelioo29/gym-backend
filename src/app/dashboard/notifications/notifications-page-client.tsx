"use client";

import {
  Badge,
  Button,
  Card,
  Empty,
  List,
  Select,
  Space,
  Spin,
  Tag,
  Typography,
  message,
} from "antd";
import { CheckOutlined, ReloadOutlined } from "@ant-design/icons";
import { useEffect, useState } from "react";
import { apiGet, apiPatch } from "@/lib/client-api";

const { Title, Text } = Typography;

type NotificationItem = {
  id: string;
  type: string;
  title: string;
  message: string | null;
  data: Record<string, unknown> | null;
  isRead: boolean;
  readAt: string | null;
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

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleString("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function getTagColor(type: string) {
  if (type.includes("APPROVED")) return "green";
  if (type.includes("REJECTED")) return "red";
  if (type.includes("SUBMITTED")) return "blue";
  if (type.includes("UPDATED")) return "orange";
  return "default";
}

export default function NotificationsPageClient() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [isReadFilter, setIsReadFilter] = useState<string>("ALL");

  async function fetchNotifications() {
    try {
      setLoading(true);

      const params = new URLSearchParams({
        page: "1",
        limit: "50",
      });

      if (isReadFilter !== "ALL") {
        params.set("isRead", isReadFilter);
      }

      const response = await apiGet<NotificationsResponse>(
        `/api/admin/notifications?${params.toString()}`,
      );

      setNotifications(response.data || []);
    } catch (error) {
      console.error("Fetch notifications error:", error);
      message.error("Failed to fetch notifications");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchNotifications();
  }, [isReadFilter]);

  async function handleMarkAsRead(id: string) {
    try {
      await apiPatch(`/api/admin/notifications/${id}/read`);
      message.success("Notification marked as read");
      await fetchNotifications();
    } catch (error) {
      console.error("Mark as read error:", error);
      message.error("Failed to mark as read");
    }
  }

  async function handleReadAll() {
    try {
      await apiPatch("/api/admin/notifications/read-all");
      message.success("All notifications marked as read");
      await fetchNotifications();
    } catch (error) {
      console.error("Read all error:", error);
      message.error("Failed to mark all as read");
    }
  }

  const unreadCount = notifications.filter((item) => !item.isRead).length;

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <Title level={3} className="!mb-1">
            Notifications
          </Title>
          <Text type="secondary">
            Important alerts and system updates. Basically the inbox that saves
            you from “kok nggak tahu?” moments.
          </Text>
        </div>

        <Space wrap>
          <Select
            value={isReadFilter}
            style={{ width: 160 }}
            onChange={setIsReadFilter}
            options={[
              { label: "All", value: "ALL" },
              { label: "Unread", value: "false" },
              { label: "Read", value: "true" },
            ]}
          />

          <Button icon={<ReloadOutlined />} onClick={fetchNotifications}>
            Refresh
          </Button>

          <Button
            type="primary"
            icon={<CheckOutlined />}
            onClick={handleReadAll}
            disabled={unreadCount === 0}
          >
            Mark all read
          </Button>
        </Space>
      </div>

      <Card>
        {loading ? (
          <div className="flex justify-center py-16">
            <Spin />
          </div>
        ) : notifications.length === 0 ? (
          <Empty description="No notifications found" />
        ) : (
          <List
            dataSource={notifications}
            renderItem={(item) => (
              <List.Item
                actions={[
                  !item.isRead ? (
                    <Button
                      key="read"
                      size="small"
                      onClick={() => handleMarkAsRead(item.id)}
                    >
                      Mark read
                    </Button>
                  ) : null,
                ]}
              >
                <List.Item.Meta
                  avatar={
                    <Badge dot={!item.isRead}>
                      <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center">
                        🔔
                      </div>
                    </Badge>
                  }
                  title={
                    <div className="flex flex-wrap items-center gap-2">
                      <span>{item.title}</span>
                      <Tag color={getTagColor(item.type)}>{item.type}</Tag>
                      {item.isRead ? (
                        <Tag>Read</Tag>
                      ) : (
                        <Tag color="blue">Unread</Tag>
                      )}
                    </div>
                  }
                  description={
                    <div>
                      <Text className="block !text-slate-600">
                        {item.message || "-"}
                      </Text>

                      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-400">
                        <span>{formatDate(item.createdAt)}</span>

                        {item.actor && (
                          <span>
                            Actor: {item.actor.fullName} ({item.actor.email})
                          </span>
                        )}
                      </div>
                    </div>
                  }
                />
              </List.Item>
            )}
          />
        )}
      </Card>
    </div>
  );
}
