"use client";

import {
  Button,
  Card,
  Empty,
  Pagination,
  Space,
  Table,
  Tag,
  Typography,
  message,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import { EyeOutlined } from "@ant-design/icons";
import { useEffect, useMemo, useState } from "react";
import { apiGet } from "@/lib/client-api";
import LogsFilterCard from "@/components/logs/logs-filter-card";
import LogsTableToolbar from "@/components/logs/logs-table-toolbar";
import JsonDetailModal from "@/components/logs/json-detail-modal";

const { Title, Text } = Typography;

type ActivityLog = {
  id: string;
  userId: string | null;
  activity: string;
  description: string | null;
  metadata: Record<string, unknown> | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
  user?: {
    id: string;
    fullName: string;
    email: string;
    phone: string | null;
  } | null;
};

type ActivityLogsResponse = {
  success: boolean;
  message: string;
  data: ActivityLog[];
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

function getActivityColor(activity: string) {
  if (activity.includes("LOGIN")) return "green";
  if (activity.includes("LOGOUT")) return "orange";
  if (activity.includes("REGISTER")) return "blue";
  if (activity.includes("UPLOAD")) return "purple";
  if (activity.includes("UPDATE")) return "gold";
  return "default";
}

export default function ActivityLogsPageClient() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(false);

  const [search, setSearch] = useState("");
  const [activity, setActivity] = useState("ALL");

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);

  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

  const [jsonModalOpen, setJsonModalOpen] = useState(false);
  const [jsonModalTitle, setJsonModalTitle] = useState("Metadata");
  const [jsonModalData, setJsonModalData] = useState<unknown>(null);

  async function fetchLogs(nextPage = page, nextLimit = limit) {
    try {
      setLoading(true);

      const params = new URLSearchParams({
        page: String(nextPage),
        limit: String(nextLimit),
      });

      if (search) params.set("search", search);
      if (activity !== "ALL") params.set("activity", activity);

      const response = await apiGet<ActivityLogsResponse>(
        `/api/admin/activity-logs?${params.toString()}`,
      );

      setLogs(response.data || []);
      setTotal(response.meta.total || 0);
      setPage(response.meta.page || nextPage);
      setLimit(response.meta.limit || nextLimit);
    } catch (error) {
      console.error("Fetch activity logs error:", error);
      message.error("Failed to fetch activity logs");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchLogs(1, limit);
  }, [activity]);

  const activityOptions = useMemo(() => {
    const uniqueActivities = Array.from(
      new Set(logs.map((item) => item.activity)),
    );

    return uniqueActivities.map((item) => ({
      label: item,
      value: item,
    }));
  }, [logs]);

  function handleReset() {
    setSearch("");
    setActivity("ALL");
    setPage(1);

    setTimeout(() => {
      fetchLogs(1, limit);
    }, 0);
  }

  const columns: ColumnsType<ActivityLog> = [
    {
      title: "Activity",
      dataIndex: "activity",
      width: 250,
      sorter: true,
      render: (value: string, record) => (
        <div>
          <Tag color={getActivityColor(value)}>{value}</Tag>
          {record.description && (
            <Text className="mt-1 block !text-xs !text-slate-500">
              {record.description}
            </Text>
          )}
        </div>
      ),
    },
    {
      title: "User",
      key: "user",
      width: 260,
      render: (_, record) => (
        <div>
          <Text className="block !font-medium">
            {record.user?.fullName || "-"}
          </Text>
          <Text className="block !text-xs !text-slate-500">
            {record.user?.email || "-"}
          </Text>
        </div>
      ),
    },
    {
      title: "IP Address",
      dataIndex: "ipAddress",
      width: 160,
      render: (value) => value || "-",
    },
    {
      title: "Created at",
      dataIndex: "createdAt",
      width: 190,
      render: (value: string) => formatDate(value),
    },
    {
      title: "Metadata",
      key: "metadata",
      width: 120,
      align: "center",
      render: (_, record) => (
        <Button
          size="small"
          icon={<EyeOutlined />}
          disabled={!record.metadata}
          onClick={() => {
            setJsonModalTitle("Activity Metadata");
            setJsonModalData(record.metadata);
            setJsonModalOpen(true);
          }}
        >
          View
        </Button>
      ),
    },
  ];

  return (
    <div>
      <div className="mb-5">
        <Title level={3} className="!mb-1">
          Activity Logs
        </Title>
        <Text type="secondary">
          Track user activities such as login, register, OTP, upload, and system
          actions.
        </Text>
      </div>

      <LogsFilterCard
        search={search}
        onSearchChange={setSearch}
        typeValue={activity}
        typePlaceholder="Activity"
        typeOptions={activityOptions}
        onTypeChange={(value) => {
          setActivity(value);
          setPage(1);
        }}
        onSubmit={() => fetchLogs(1, limit)}
        onReset={handleReset}
      />

      <Card>
        <LogsTableToolbar
          total={total}
          page={page}
          limit={limit}
          selectedCount={selectedRowKeys.length}
          onRefresh={() => fetchLogs(page, limit)}
          onLimitChange={(value) => {
            setLimit(value);
            setPage(1);
            fetchLogs(1, value);
          }}
        />

        <Table
          rowKey="id"
          size="small"
          loading={loading}
          columns={columns}
          dataSource={logs}
          pagination={false}
          rowSelection={{
            selectedRowKeys,
            onChange: setSelectedRowKeys,
          }}
          locale={{
            emptyText: <Empty description="No activity logs found" />,
          }}
          scroll={{ x: 1000 }}
        />

        <div className="mt-4 flex justify-end">
          <Space>
            <Text className="!text-xs !text-slate-500">
              showing {total === 0 ? 0 : (page - 1) * limit + 1} to{" "}
              {Math.min(page * limit, total)} of {total} items
            </Text>

            <Pagination
              size="small"
              current={page}
              pageSize={limit}
              total={total}
              showSizeChanger={false}
              onChange={(nextPage) => {
                setPage(nextPage);
                fetchLogs(nextPage, limit);
              }}
            />
          </Space>
        </div>
      </Card>

      <JsonDetailModal
        title={jsonModalTitle}
        open={jsonModalOpen}
        data={jsonModalData}
        onClose={() => setJsonModalOpen(false)}
      />
    </div>
  );
}
