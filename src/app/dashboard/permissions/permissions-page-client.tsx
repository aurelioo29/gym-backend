"use client";

import {
  Button,
  Card,
  Empty,
  Input,
  Pagination,
  Select,
  Space,
  Table,
  Tag,
  Typography,
  message,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import { ReloadOutlined, SearchOutlined } from "@ant-design/icons";
import { useEffect, useMemo, useState } from "react";
import { apiGet } from "@/lib/client-api";
import LogsTableToolbar from "@/components/logs/logs-table-toolbar";

const { Title, Text } = Typography;

type Permission = {
  id: string;
  name: string;
  key: string;
  module: string;
  createdAt: string;
  updatedAt: string;
};

type PermissionsResponse = {
  success: boolean;
  message: string;
  data: {
    permissions: Permission[];
    modules: string[];
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

function getModuleColor(moduleName: string) {
  if (moduleName.includes("users")) return "blue";
  if (moduleName.includes("roles")) return "purple";
  if (moduleName.includes("settings")) return "orange";
  if (moduleName.includes("logs")) return "cyan";
  if (moduleName.includes("trainer")) return "green";
  return "default";
}

export default function PermissionsPageClient() {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [modules, setModules] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const [search, setSearch] = useState("");
  const [moduleName, setModuleName] = useState("ALL");

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

  async function fetchPermissions() {
    try {
      setLoading(true);

      const params = new URLSearchParams();

      if (search) params.set("search", search);
      if (moduleName !== "ALL") params.set("module", moduleName);

      const query = params.toString();

      const response = await apiGet<PermissionsResponse>(
        query ? `/api/admin/permissions?${query}` : "/api/admin/permissions",
      );

      setPermissions(response.data.permissions || []);
      setModules(response.data.modules || []);
      setPage(1);
    } catch (error) {
      console.error("Fetch permissions error:", error);
      message.error("Failed to fetch permissions");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchPermissions();
  }, [moduleName]);

  const paginatedPermissions = useMemo(() => {
    const start = (page - 1) * limit;
    const end = start + limit;

    return permissions.slice(start, end);
  }, [permissions, page, limit]);

  const moduleOptions = useMemo(
    () => [
      { label: "All Modules", value: "ALL" },
      ...modules.map((item) => ({
        label: item,
        value: item,
      })),
    ],
    [modules],
  );

  function handleReset() {
    setSearch("");
    setModuleName("ALL");
    setPage(1);

    setTimeout(() => {
      fetchPermissions();
    }, 0);
  }

  const columns: ColumnsType<Permission> = [
    {
      title: "Permission",
      key: "permission",
      width: 320,
      render: (_, record) => (
        <div>
          <Text className="block !font-semibold">{record.name}</Text>
          <Text className="block !text-xs !text-slate-500">{record.key}</Text>
        </div>
      ),
    },
    {
      title: "Module",
      dataIndex: "module",
      width: 180,
      render: (value: string) => (
        <Tag color={getModuleColor(value)}>{value}</Tag>
      ),
    },
    {
      title: "Key",
      dataIndex: "key",
      render: (value: string) => (
        <Text className="!text-xs" copyable>
          {value}
        </Text>
      ),
    },
    {
      title: "Created at",
      dataIndex: "createdAt",
      width: 190,
      render: (value: string) => formatDate(value),
    },
  ];

  return (
    <div>
      <div className="mb-5">
        <Title level={3} className="!mb-1">
          Permissions
        </Title>
        <Text type="secondary">
          View available system permissions grouped by module.
        </Text>
      </div>

      <Card className="mb-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_260px_auto_auto]">
          <Input
            allowClear
            value={search}
            prefix={<SearchOutlined />}
            placeholder="Search permission name, key, or module"
            onChange={(event) => setSearch(event.target.value)}
            onPressEnter={fetchPermissions}
          />

          <Select
            value={moduleName}
            options={moduleOptions}
            onChange={(value) => {
              setModuleName(value);
              setPage(1);
            }}
          />

          <Button
            type="primary"
            icon={<SearchOutlined />}
            onClick={fetchPermissions}
          >
            Search
          </Button>

          <Button onClick={handleReset}>Reset</Button>
        </div>
      </Card>

      <Card>
        <LogsTableToolbar
          total={permissions.length}
          page={page}
          limit={limit}
          selectedCount={selectedRowKeys.length}
          onRefresh={fetchPermissions}
          onLimitChange={(value) => {
            setLimit(value);
            setPage(1);
          }}
        />

        <Table
          rowKey="id"
          size="small"
          loading={loading}
          columns={columns}
          dataSource={paginatedPermissions}
          pagination={false}
          rowSelection={{
            selectedRowKeys,
            onChange: setSelectedRowKeys,
          }}
          locale={{
            emptyText: <Empty description="No permissions found" />,
          }}
          scroll={{ x: 1000 }}
        />

        <div className="mt-4 flex justify-end">
          <Space>
            <Text className="!text-xs !text-slate-500">
              showing {permissions.length === 0 ? 0 : (page - 1) * limit + 1} to{" "}
              {Math.min(page * limit, permissions.length)} of{" "}
              {permissions.length} items
            </Text>

            <Pagination
              size="small"
              current={page}
              pageSize={limit}
              total={permissions.length}
              showSizeChanger={false}
              onChange={(nextPage) => setPage(nextPage)}
            />
          </Space>
        </div>
      </Card>
    </div>
  );
}
