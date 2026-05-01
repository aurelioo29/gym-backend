"use client";

import {
  Button,
  Card,
  Empty,
  Pagination,
  Select,
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

type AuditLog = {
  id: string;
  userId: string | null;
  action: string;
  resourceType: string;
  resourceId: string | null;
  oldData: Record<string, unknown> | null;
  newData: Record<string, unknown> | null;
  ipAddress: string | null;
  createdAt: string;
  user?: {
    id: string;
    fullName: string;
    email: string;
    phone: string | null;
  } | null;
};

type AuditLogsResponse = {
  success: boolean;
  message: string;
  data: AuditLog[];
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

function getActionColor(action: string) {
  if (action.includes("CREATE")) return "green";
  if (action.includes("UPDATE")) return "blue";
  if (action.includes("DELETE")) return "red";
  if (action.includes("APPROVE")) return "green";
  if (action.includes("REJECT")) return "red";
  return "default";
}

function getResourceColor(resourceType: string) {
  if (resourceType.includes("USER")) return "blue";
  if (resourceType.includes("TRAINER")) return "purple";
  if (resourceType.includes("SETTING")) return "orange";
  if (resourceType.includes("ROLE")) return "cyan";
  return "default";
}

export default function AuditLogsPageClient() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(false);

  const [search, setSearch] = useState("");
  const [action, setAction] = useState("ALL");
  const [resourceType, setResourceType] = useState("ALL");

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);

  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

  const [jsonModalOpen, setJsonModalOpen] = useState(false);
  const [jsonModalTitle, setJsonModalTitle] = useState("Data");
  const [jsonModalData, setJsonModalData] = useState<unknown>(null);

  async function fetchLogs(nextPage = page, nextLimit = limit) {
    try {
      setLoading(true);

      const params = new URLSearchParams({
        page: String(nextPage),
        limit: String(nextLimit),
      });

      if (search) params.set("search", search);
      if (action !== "ALL") params.set("action", action);
      if (resourceType !== "ALL") params.set("resourceType", resourceType);

      const response = await apiGet<AuditLogsResponse>(
        `/api/admin/audit-logs?${params.toString()}`,
      );

      setLogs(response.data || []);
      setTotal(response.meta.total || 0);
      setPage(response.meta.page || nextPage);
      setLimit(response.meta.limit || nextLimit);
    } catch (error) {
      console.error("Fetch audit logs error:", error);
      message.error("Failed to fetch audit logs");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchLogs(1, limit);
  }, [action, resourceType]);

  const actionOptions = useMemo(() => {
    const uniqueActions = Array.from(new Set(logs.map((item) => item.action)));

    return uniqueActions.map((item) => ({
      label: item,
      value: item,
    }));
  }, [logs]);

  const resourceOptions = useMemo(() => {
    const uniqueResources = Array.from(
      new Set(logs.map((item) => item.resourceType)),
    );

    return uniqueResources.map((item) => ({
      label: item,
      value: item,
    }));
  }, [logs]);

  function handleReset() {
    setSearch("");
    setAction("ALL");
    setResourceType("ALL");
    setPage(1);

    setTimeout(() => {
      fetchLogs(1, limit);
    }, 0);
  }

  const columns: ColumnsType<AuditLog> = [
    {
      title: "Action",
      dataIndex: "action",
      width: 220,
      render: (value: string) => (
        <Tag color={getActionColor(value)}>{value}</Tag>
      ),
    },
    {
      title: "Resource",
      dataIndex: "resourceType",
      width: 180,
      render: (value: string) => (
        <Tag color={getResourceColor(value)}>{value}</Tag>
      ),
    },
    {
      title: "Resource ID",
      dataIndex: "resourceId",
      width: 260,
      render: (value) => (
        <Text className="!text-xs" copyable={!!value}>
          {value || "-"}
        </Text>
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
      width: 150,
      render: (value) => value || "-",
    },
    {
      title: "Created at",
      dataIndex: "createdAt",
      width: 190,
      render: (value: string) => formatDate(value),
    },
    {
      title: "Old Data",
      key: "oldData",
      width: 110,
      align: "center",
      render: (_, record) => (
        <Button
          size="small"
          icon={<EyeOutlined />}
          disabled={!record.oldData}
          onClick={() => {
            setJsonModalTitle("Old Data");
            setJsonModalData(record.oldData);
            setJsonModalOpen(true);
          }}
        >
          View
        </Button>
      ),
    },
    {
      title: "New Data",
      key: "newData",
      width: 110,
      align: "center",
      render: (_, record) => (
        <Button
          size="small"
          icon={<EyeOutlined />}
          disabled={!record.newData}
          onClick={() => {
            setJsonModalTitle("New Data");
            setJsonModalData(record.newData);
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
          Audit Logs
        </Title>
        <Text type="secondary">
          Track important data changes, including old and new values.
        </Text>
      </div>

      <LogsFilterCard
        search={search}
        onSearchChange={setSearch}
        typeValue={action}
        typePlaceholder="Action"
        typeOptions={actionOptions}
        onTypeChange={(value) => {
          setAction(value);
          setPage(1);
        }}
        onSubmit={() => fetchLogs(1, limit)}
        onReset={handleReset}
      />

      <Card className="mb-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-[260px_auto]">
          <Select
            value={resourceType}
            options={[
              { label: "All Resources", value: "ALL" },
              ...resourceOptions,
            ]}
            onChange={(value) => {
              setResourceType(value);
              setPage(1);
            }}
          />

          <Text className="flex items-center !text-xs !text-slate-500">
            Filter audit log by resource type. Yes, this is where the “who
            changed this?” drama gets solved.
          </Text>
        </div>
      </Card>

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
            emptyText: <Empty description="No audit logs found" />,
          }}
          scroll={{ x: 1450 }}
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
