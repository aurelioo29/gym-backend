"use client";

import {
  Button,
  Card,
  Empty,
  Input,
  Space,
  Table,
  Tag,
  Tooltip,
  Typography,
  message,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  EyeOutlined,
  ReloadOutlined,
  SafetyCertificateOutlined,
  SearchOutlined,
  SettingOutlined,
} from "@ant-design/icons";
import { useEffect, useMemo, useState } from "react";
import { apiGet } from "@/lib/client-api";
import LogsTableToolbar from "@/components/logs/logs-table-toolbar";
import RolePermissionsModal from "@/components/access-control/role-permissions-modal";
import JsonDetailModal from "@/components/logs/json-detail-modal";

const { Title, Text } = Typography;

type Permission = {
  id: string;
  name: string;
  key: string;
  module: string;
};

type Role = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  permissions: Permission[];
  userCount: number;
  createdAt: string;
  updatedAt: string;
};

type RolesResponse = {
  success: boolean;
  message: string;
  data: Role[];
};

function getRoleColor(slug: string) {
  if (slug === "SUPERADMIN") return "red";
  if (slug === "ADMIN") return "blue";
  if (slug === "TRAINER") return "purple";
  if (slug === "CUSTOMER") return "green";
  return "default";
}

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleString("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default function RolesPageClient() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(false);

  const [search, setSearch] = useState("");
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [permissionModalOpen, setPermissionModalOpen] = useState(false);

  const [jsonModalOpen, setJsonModalOpen] = useState(false);
  const [jsonModalData, setJsonModalData] = useState<unknown>(null);

  async function fetchRoles() {
    try {
      setLoading(true);

      const response = await apiGet<RolesResponse>("/api/admin/roles");
      setRoles(response.data || []);
    } catch (error) {
      console.error("Fetch roles error:", error);
      message.error("Failed to fetch roles");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchRoles();
  }, []);

  const filteredRoles = useMemo(() => {
    if (!search) return roles;

    const keyword = search.toLowerCase();

    return roles.filter((role) => {
      return (
        role.name.toLowerCase().includes(keyword) ||
        role.slug.toLowerCase().includes(keyword) ||
        role.description?.toLowerCase().includes(keyword)
      );
    });
  }, [roles, search]);

  const columns: ColumnsType<Role> = [
    {
      title: "Role",
      key: "role",
      width: 260,
      render: (_, record) => (
        <div>
          <div className="flex items-center gap-2">
            <SafetyCertificateOutlined className="text-slate-400" />
            <Text className="!font-semibold">{record.name}</Text>
          </div>

          <div className="mt-1">
            <Tag color={getRoleColor(record.slug)}>{record.slug}</Tag>
          </div>
        </div>
      ),
    },
    {
      title: "Description",
      dataIndex: "description",
      render: (value) => (
        <Text className="!text-sm !text-slate-600">{value || "-"}</Text>
      ),
    },
    {
      title: "Users",
      dataIndex: "userCount",
      width: 100,
      align: "center",
      render: (value) => <Tag>{value}</Tag>,
    },
    {
      title: "Permissions",
      dataIndex: "permissions",
      width: 140,
      align: "center",
      render: (permissions: Permission[]) => (
        <Tag color="blue">{permissions?.length || 0}</Tag>
      ),
    },
    {
      title: "Created at",
      dataIndex: "createdAt",
      width: 190,
      render: (value: string) => formatDate(value),
    },
    {
      title: "Action",
      key: "action",
      width: 180,
      align: "center",
      render: (_, record) => (
        <Space>
          <Tooltip title="View permissions">
            <Button
              size="small"
              icon={<EyeOutlined />}
              onClick={() => {
                setJsonModalData(record.permissions || []);
                setJsonModalOpen(true);
              }}
            />
          </Tooltip>

          <Tooltip title="Manage permissions">
            <Button
              size="small"
              type="primary"
              icon={<SettingOutlined />}
              disabled={record.slug === "SUPERADMIN"}
              onClick={() => {
                setSelectedRole(record);
                setPermissionModalOpen(true);
              }}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div className="mb-5">
        <Title level={3} className="!mb-1">
          Roles
        </Title>
        <Text type="secondary">
          Manage role access and permissions. Tiny table, huge consequences.
        </Text>
      </div>

      <Card className="mb-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_auto_auto]">
          <Input
            allowClear
            value={search}
            prefix={<SearchOutlined />}
            placeholder="Search role name, slug, or description"
            onChange={(event) => setSearch(event.target.value)}
          />

          <Button icon={<ReloadOutlined />} onClick={fetchRoles}>
            Refresh
          </Button>

          <Button type="primary" onClick={() => setSearch(search.trim())}>
            Search
          </Button>
        </div>
      </Card>

      <Card>
        <LogsTableToolbar
          total={filteredRoles.length}
          page={1}
          limit={filteredRoles.length || 10}
          selectedCount={selectedRowKeys.length}
          onRefresh={fetchRoles}
          onLimitChange={() => {}}
        />

        <Table
          rowKey="id"
          size="small"
          loading={loading}
          columns={columns}
          dataSource={filteredRoles}
          pagination={false}
          rowSelection={{
            selectedRowKeys,
            onChange: setSelectedRowKeys,
          }}
          locale={{
            emptyText: <Empty description="No roles found" />,
          }}
          scroll={{ x: 1100 }}
        />
      </Card>

      <RolePermissionsModal
        open={permissionModalOpen}
        role={selectedRole}
        onClose={() => {
          setPermissionModalOpen(false);
          setSelectedRole(null);
        }}
        onSuccess={fetchRoles}
      />

      <JsonDetailModal
        title="Role Permissions"
        open={jsonModalOpen}
        data={jsonModalData}
        onClose={() => setJsonModalOpen(false)}
      />
    </div>
  );
}
