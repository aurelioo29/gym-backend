"use client";

import {
  Avatar,
  Button,
  Card,
  Descriptions,
  Empty,
  Input,
  Modal,
  Pagination,
  Select,
  Space,
  Switch,
  Table,
  Tag,
  Typography,
  message,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  EyeOutlined,
  ReloadOutlined,
  SearchOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { useEffect, useState } from "react";
import { apiGet, apiPatch } from "@/lib/client-api";
import LogsTableToolbar from "@/components/logs/logs-table-toolbar";

const { Title, Text } = Typography;

type Role = {
  id: string;
  name: string;
  slug: string;
};

type CustomerProfile = {
  id: string;
  userId: string;
  birthDate: string | null;
  gender: string | null;
  heightCm: number | null;
  weightKg: number | null;
  emergencyContactName: string | null;
  emergencyContactPhone: string | null;
  healthNotes: string | null;
  fitnessGoals: string | null;
};

type TrainerProfile = {
  id: string;
  userId: string;
  bio: string | null;
  specialization: string | null;
  certification: string | null;
  certificateUrl: string | null;
  approvalStatus: string;
  rejectedReason: string | null;
  experienceYears: number | null;
  hourlyRate: string | null;
  isAvailable: boolean;
};

type UserItem = {
  id: string;
  roleId: string;
  email: string;
  fullName: string;
  phone: string | null;
  avatarUrl: string | null;
  isActive: boolean;
  emailVerifiedAt: string | null;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
  role: Role;
  customerProfile?: CustomerProfile | null;
  trainerProfile?: TrainerProfile | null;
};

type UsersResponse = {
  success: boolean;
  message: string;
  data: UserItem[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

type UserDetailResponse = {
  success: boolean;
  message: string;
  data: UserItem;
};

function formatDate(value?: string | null) {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleString("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function getRoleColor(role: string) {
  if (role === "SUPERADMIN") return "red";
  if (role === "ADMIN") return "blue";
  if (role === "TRAINER") return "purple";
  if (role === "CUSTOMER") return "green";
  return "default";
}

function getInitials(name: string) {
  const words = name.trim().split(" ").filter(Boolean);

  if (words.length === 0) return "U";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();

  return `${words[0][0]}${words[1][0]}`.toUpperCase();
}

export default function UsersPageClient() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [role, setRole] = useState("ALL");
  const [isActive, setIsActive] = useState("ALL");

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);

  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserItem | null>(null);

  async function fetchUsers(nextPage = page, nextLimit = limit) {
    try {
      setLoading(true);

      const params = new URLSearchParams({
        page: String(nextPage),
        limit: String(nextLimit),
      });

      if (search) params.set("search", search);
      if (role !== "ALL") params.set("role", role);
      if (isActive !== "ALL") params.set("isActive", isActive);

      const response = await apiGet<UsersResponse>(
        `/api/admin/users?${params.toString()}`,
      );

      setUsers(response.data || []);
      setTotal(response.meta.total || 0);
      setPage(response.meta.page || nextPage);
      setLimit(response.meta.limit || nextLimit);
    } catch (error) {
      console.error("Fetch users error:", error);
      message.error("Failed to fetch users");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchUsers(1, limit);
  }, [role, isActive]);

  async function fetchUserDetail(userId: string) {
    try {
      setDetailLoading(true);
      setDetailOpen(true);

      const response = await apiGet<UserDetailResponse>(
        `/api/admin/users/${userId}`,
      );

      setSelectedUser(response.data);
    } catch (error) {
      console.error("Fetch user detail error:", error);
      message.error("Failed to fetch user detail");
    } finally {
      setDetailLoading(false);
    }
  }

  async function updateUserStatus(user: UserItem, checked: boolean) {
    Modal.confirm({
      title: checked ? "Activate User" : "Deactivate User",
      content: `Are you sure you want to ${
        checked ? "activate" : "deactivate"
      } ${user.fullName}?`,
      centered: true,
      okText: checked ? "Activate" : "Deactivate",
      okButtonProps: {
        danger: !checked,
      },
      async onOk() {
        try {
          setUpdatingUserId(user.id);

          await apiPatch(`/api/admin/users/${user.id}/status`, {
            isActive: checked,
          });

          message.success(
            `User ${checked ? "activated" : "deactivated"} successfully`,
          );

          await fetchUsers(page, limit);
        } catch (error) {
          console.error("Update user status error:", error);
          message.error(
            error instanceof Error
              ? error.message
              : "Failed to update user status",
          );
        } finally {
          setUpdatingUserId(null);
        }
      },
    });
  }

  function handleReset() {
    setSearch("");
    setRole("ALL");
    setIsActive("ALL");
    setPage(1);

    setTimeout(() => {
      fetchUsers(1, limit);
    }, 0);
  }

  const columns: ColumnsType<UserItem> = [
    {
      title: "User",
      key: "user",
      width: 320,
      render: (_, record) => (
        <div className="flex items-center gap-3">
          <Avatar src={record.avatarUrl || undefined} icon={<UserOutlined />}>
            {!record.avatarUrl ? getInitials(record.fullName) : null}
          </Avatar>

          <div className="min-w-0">
            <Text className="block !font-semibold truncate">
              {record.fullName}
            </Text>
            <Text className="block !text-xs !text-slate-500 truncate">
              {record.email}
            </Text>
            <Text className="block !text-xs !text-slate-400 truncate">
              {record.phone || "-"}
            </Text>
          </div>
        </div>
      ),
    },
    {
      title: "Role",
      key: "role",
      width: 140,
      render: (_, record) => (
        <Tag color={getRoleColor(record.role?.slug)}>{record.role?.slug}</Tag>
      ),
    },
    {
      title: "Verified",
      dataIndex: "emailVerifiedAt",
      width: 120,
      render: (value) =>
        value ? <Tag color="green">Verified</Tag> : <Tag color="red">No</Tag>,
    },
    {
      title: "Active",
      dataIndex: "isActive",
      width: 110,
      render: (value: boolean, record) => (
        <Switch
          size="small"
          checked={value}
          loading={updatingUserId === record.id}
          disabled={record.role?.slug === "SUPERADMIN"}
          onChange={(checked) => updateUserStatus(record, checked)}
        />
      ),
    },
    {
      title: "Last Login",
      dataIndex: "lastLoginAt",
      width: 190,
      render: (value) => formatDate(value),
    },
    {
      title: "Created at",
      dataIndex: "createdAt",
      width: 190,
      render: (value) => formatDate(value),
    },
    {
      title: "Action",
      key: "action",
      width: 100,
      align: "center",
      render: (_, record) => (
        <Button
          size="small"
          icon={<EyeOutlined />}
          onClick={() => fetchUserDetail(record.id)}
        />
      ),
    },
  ];

  return (
    <div>
      <div className="mb-5">
        <Title level={3} className="!mb-1">
          Users
        </Title>
        <Text type="secondary">
          Manage admins, customers, and trainers. Yes, this is where accounts
          come to behave.
        </Text>
      </div>

      <Card className="mb-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_180px_180px_auto_auto]">
          <div>
            <div className="mb-1 text-xs font-medium text-slate-600">
              Search
            </div>
            <Input
              allowClear
              value={search}
              prefix={<SearchOutlined />}
              placeholder="Search name, email, or phone"
              onChange={(event) => setSearch(event.target.value)}
              onPressEnter={() => fetchUsers(1, limit)}
            />
          </div>

          <div>
            <div className="mb-1 text-xs font-medium text-slate-600">Role</div>
            <Select
              className="w-full"
              value={role}
              onChange={(value) => {
                setRole(value);
                setPage(1);
              }}
              options={[
                { label: "All Roles", value: "ALL" },
                { label: "Superadmin", value: "SUPERADMIN" },
                { label: "Admin", value: "ADMIN" },
                { label: "Customer", value: "CUSTOMER" },
                { label: "Trainer", value: "TRAINER" },
              ]}
            />
          </div>

          <div>
            <div className="mb-1 text-xs font-medium text-slate-600">
              Status
            </div>
            <Select
              className="w-full"
              value={isActive}
              onChange={(value) => {
                setIsActive(value);
                setPage(1);
              }}
              options={[
                { label: "All Status", value: "ALL" },
                { label: "Active", value: "true" },
                { label: "Inactive", value: "false" },
              ]}
            />
          </div>

          <div className="flex items-end">
            <Button
              type="primary"
              icon={<SearchOutlined />}
              onClick={() => fetchUsers(1, limit)}
            >
              Search
            </Button>
          </div>

          <div className="flex items-end">
            <Button onClick={handleReset}>Reset</Button>
          </div>
        </div>
      </Card>

      <Card>
        <LogsTableToolbar
          total={total}
          page={page}
          limit={limit}
          selectedCount={selectedRowKeys.length}
          onRefresh={() => fetchUsers(page, limit)}
          onLimitChange={(value) => {
            setLimit(value);
            setPage(1);
            fetchUsers(1, value);
          }}
        />

        <Table
          rowKey="id"
          size="small"
          loading={loading}
          columns={columns}
          dataSource={users}
          pagination={false}
          rowSelection={{
            selectedRowKeys,
            onChange: setSelectedRowKeys,
          }}
          locale={{
            emptyText: <Empty description="No users found" />,
          }}
          scroll={{ x: 1250 }}
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
                fetchUsers(nextPage, limit);
              }}
            />
          </Space>
        </div>
      </Card>

      <Modal
        title="User Detail"
        open={detailOpen}
        onCancel={() => {
          setDetailOpen(false);
          setSelectedUser(null);
        }}
        footer={null}
        width={860}
        centered
      >
        {detailLoading || !selectedUser ? (
          <div className="py-10 text-center">
            <Text type="secondary">Loading user detail...</Text>
          </div>
        ) : (
          <div className="space-y-5">
            <Descriptions bordered size="small" column={2}>
              <Descriptions.Item label="Full Name">
                {selectedUser.fullName}
              </Descriptions.Item>
              <Descriptions.Item label="Email">
                {selectedUser.email}
              </Descriptions.Item>
              <Descriptions.Item label="Phone">
                {selectedUser.phone || "-"}
              </Descriptions.Item>
              <Descriptions.Item label="Role">
                <Tag color={getRoleColor(selectedUser.role?.slug)}>
                  {selectedUser.role?.slug}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Active">
                {selectedUser.isActive ? (
                  <Tag color="green">Active</Tag>
                ) : (
                  <Tag color="red">Inactive</Tag>
                )}
              </Descriptions.Item>
              <Descriptions.Item label="Email Verified">
                {selectedUser.emailVerifiedAt ? (
                  <Tag color="green">Verified</Tag>
                ) : (
                  <Tag color="red">Not Verified</Tag>
                )}
              </Descriptions.Item>
              <Descriptions.Item label="Last Login">
                {formatDate(selectedUser.lastLoginAt)}
              </Descriptions.Item>
              <Descriptions.Item label="Created At">
                {formatDate(selectedUser.createdAt)}
              </Descriptions.Item>
            </Descriptions>

            {selectedUser.trainerProfile ? (
              <Card size="small" title="Trainer Profile">
                <Descriptions bordered size="small" column={2}>
                  <Descriptions.Item label="Specialization">
                    {selectedUser.trainerProfile.specialization || "-"}
                  </Descriptions.Item>
                  <Descriptions.Item label="Certification">
                    {selectedUser.trainerProfile.certification || "-"}
                  </Descriptions.Item>
                  <Descriptions.Item label="Approval Status">
                    <Tag>{selectedUser.trainerProfile.approvalStatus}</Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="Available">
                    {selectedUser.trainerProfile.isAvailable ? "Yes" : "No"}
                  </Descriptions.Item>
                  <Descriptions.Item label="Experience Years">
                    {selectedUser.trainerProfile.experienceYears ?? "-"}
                  </Descriptions.Item>
                  <Descriptions.Item label="Hourly Rate">
                    {selectedUser.trainerProfile.hourlyRate ?? "-"}
                  </Descriptions.Item>
                </Descriptions>
              </Card>
            ) : null}

            {selectedUser.customerProfile ? (
              <Card size="small" title="Customer Profile">
                <Descriptions bordered size="small" column={2}>
                  <Descriptions.Item label="Gender">
                    {selectedUser.customerProfile.gender || "-"}
                  </Descriptions.Item>
                  <Descriptions.Item label="Birth Date">
                    {selectedUser.customerProfile.birthDate || "-"}
                  </Descriptions.Item>
                  <Descriptions.Item label="Height">
                    {selectedUser.customerProfile.heightCm ?? "-"}
                  </Descriptions.Item>
                  <Descriptions.Item label="Weight">
                    {selectedUser.customerProfile.weightKg ?? "-"}
                  </Descriptions.Item>
                  <Descriptions.Item label="Emergency Contact">
                    {selectedUser.customerProfile.emergencyContactName || "-"}
                  </Descriptions.Item>
                  <Descriptions.Item label="Emergency Phone">
                    {selectedUser.customerProfile.emergencyContactPhone || "-"}
                  </Descriptions.Item>
                </Descriptions>
              </Card>
            ) : null}
          </div>
        )}
      </Modal>
    </div>
  );
}
