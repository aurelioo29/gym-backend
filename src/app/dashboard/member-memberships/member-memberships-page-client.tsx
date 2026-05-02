"use client";

import {
  Avatar,
  Button,
  Card,
  DatePicker,
  Empty,
  Form,
  Input,
  InputNumber,
  Modal,
  Pagination,
  Select,
  Space,
  Table,
  Tag,
  Typography,
  message,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
  ReloadOutlined,
  SearchOutlined,
  UserOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { useEffect, useState } from "react";
import { apiGet, apiPatch } from "@/lib/client-api";
import LogsTableToolbar from "@/components/logs/logs-table-toolbar";

const { Title, Text } = Typography;
const { TextArea } = Input;

type UserLite = {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  avatarUrl: string | null;
};

type MembershipPlan = {
  id: string;
  name: string;
  slug: string;
  price: string;
  durationDays: number;
};

type MemberMembership = {
  id: string;
  userId: string;
  membershipPlanId: string;
  startDate: string;
  endDate: string;
  status: "PENDING" | "ACTIVE" | "EXPIRED" | "CANCELLED";
  paymentStatus: "UNPAID" | "PAID" | "CANCELLED";
  paymentMethod: "OFFLINE_CASH" | "OFFLINE_TRANSFER";
  paidAmount: string;
  paymentReference: string | null;
  notes: string | null;
  createdAt: string;
  user: UserLite;
  membershipPlan: MembershipPlan;
  createdByUser?: {
    id: string;
    fullName: string;
    email: string;
  } | null;
};

type MembershipsResponse = {
  success: boolean;
  message: string;
  data: MemberMembership[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

type UsersResponse = {
  success: boolean;
  message: string;
  data: UserLite[];
};

type PlansResponse = {
  success: boolean;
  message: string;
  data: MembershipPlan[];
};

type MembershipFormValues = {
  userId: string;
  membershipPlanId: string;
  startDate: dayjs.Dayjs;
  status: "PENDING" | "ACTIVE" | "EXPIRED" | "CANCELLED";
  paymentStatus: "UNPAID" | "PAID" | "CANCELLED";
  paymentMethod: "OFFLINE_CASH" | "OFFLINE_TRANSFER";
  paidAmount: number;
  paymentReference?: string | null;
  notes?: string | null;
};

async function apiPost<T>(
  url: string,
  body: Record<string, unknown>,
): Promise<T> {
  const response = await fetch(url, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.message || "Request failed");
  }

  return data;
}

async function apiDelete<T>(url: string): Promise<T> {
  const response = await fetch(url, {
    method: "DELETE",
    credentials: "include",
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.message || "Request failed");
  }

  return data;
}

function formatCurrency(value: string | number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

function formatDate(value?: string | null) {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleDateString("id-ID", {
    dateStyle: "medium",
  });
}

function getStatusColor(status: string) {
  if (status === "ACTIVE") return "green";
  if (status === "PENDING") return "orange";
  if (status === "EXPIRED") return "red";
  if (status === "CANCELLED") return "default";
  return "default";
}

function getPaymentColor(status: string) {
  if (status === "PAID") return "green";
  if (status === "UNPAID") return "orange";
  if (status === "CANCELLED") return "red";
  return "default";
}

function getInitials(name: string) {
  const words = name.trim().split(" ").filter(Boolean);

  if (words.length === 0) return "U";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();

  return `${words[0][0]}${words[1][0]}`.toUpperCase();
}

function UserCell({ user }: { user?: UserLite | null }) {
  if (!user) return <Text>-</Text>;

  return (
    <div className="flex items-center gap-3">
      <Avatar src={user.avatarUrl || undefined} icon={<UserOutlined />}>
        {!user.avatarUrl ? getInitials(user.fullName) : null}
      </Avatar>

      <div className="min-w-0">
        <Text className="block !font-semibold truncate">{user.fullName}</Text>
        <Text className="block !text-xs !text-slate-500 truncate">
          {user.email}
        </Text>
        <Text className="block !text-xs !text-slate-400 truncate">
          {user.phone || "-"}
        </Text>
      </div>
    </div>
  );
}

export default function MemberMembershipsPageClient() {
  const [form] = Form.useForm<MembershipFormValues>();

  const [memberships, setMemberships] = useState<MemberMembership[]>([]);
  const [customers, setCustomers] = useState<UserLite[]>([]);
  const [plans, setPlans] = useState<MembershipPlan[]>([]);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ALL");
  const [paymentStatus, setPaymentStatus] = useState("ALL");
  const [membershipPlanId, setMembershipPlanId] = useState("ALL");

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);

  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingMembership, setEditingMembership] =
    useState<MemberMembership | null>(null);

  async function fetchMemberships(nextPage = page, nextLimit = limit) {
    try {
      setLoading(true);

      const params = new URLSearchParams({
        page: String(nextPage),
        limit: String(nextLimit),
      });

      if (search) params.set("search", search);
      if (status !== "ALL") params.set("status", status);
      if (paymentStatus !== "ALL") params.set("paymentStatus", paymentStatus);
      if (membershipPlanId !== "ALL") {
        params.set("membershipPlanId", membershipPlanId);
      }

      const response = await apiGet<MembershipsResponse>(
        `/api/admin/member-memberships?${params.toString()}`,
      );

      setMemberships(response.data || []);
      setTotal(response.meta.total || 0);
      setPage(response.meta.page || nextPage);
      setLimit(response.meta.limit || nextLimit);
    } catch (error) {
      console.error("Fetch member memberships error:", error);
      message.error("Failed to fetch member memberships");
    } finally {
      setLoading(false);
    }
  }

  async function fetchCustomers() {
    try {
      const response = await apiGet<UsersResponse>(
        "/api/admin/users?role=CUSTOMER&isActive=true&limit=100",
      );

      setCustomers(response.data || []);
    } catch (error) {
      console.error("Fetch customers error:", error);
    }
  }

  async function fetchPlans() {
    try {
      const response = await apiGet<PlansResponse>(
        "/api/admin/membership-plans?isActive=true&limit=100",
      );

      setPlans(response.data || []);
    } catch (error) {
      console.error("Fetch plans error:", error);
    }
  }

  useEffect(() => {
    fetchMemberships(1, limit);
    fetchCustomers();
    fetchPlans();
  }, []);

  useEffect(() => {
    fetchMemberships(1, limit);
  }, [status, paymentStatus, membershipPlanId]);

  function openCreateModal() {
    setEditingMembership(null);
    form.resetFields();
    form.setFieldsValue({
      startDate: dayjs(),
      status: "ACTIVE",
      paymentStatus: "PAID",
      paymentMethod: "OFFLINE_CASH",
      paidAmount: 0,
    });
    setModalOpen(true);
  }

  function openEditModal(record: MemberMembership) {
    setEditingMembership(record);

    form.setFieldsValue({
      userId: record.userId,
      membershipPlanId: record.membershipPlanId,
      startDate: dayjs(record.startDate),
      status: record.status,
      paymentStatus: record.paymentStatus,
      paymentMethod: record.paymentMethod,
      paidAmount: Number(record.paidAmount),
      paymentReference: record.paymentReference,
      notes: record.notes,
    });

    setModalOpen(true);
  }

  async function handleSubmit(values: MembershipFormValues) {
    try {
      setSaving(true);

      const payload = {
        userId: values.userId,
        membershipPlanId: values.membershipPlanId,
        startDate: values.startDate.toISOString(),
        status: values.status,
        paymentStatus: values.paymentStatus,
        paymentMethod: values.paymentMethod,
        paidAmount: values.paidAmount,
        paymentReference: values.paymentReference || null,
        notes: values.notes || null,
      };

      if (editingMembership) {
        await apiPatch(
          `/api/admin/member-memberships/${editingMembership.id}`,
          {
            status: payload.status,
            paymentStatus: payload.paymentStatus,
            paymentMethod: payload.paymentMethod,
            paidAmount: payload.paidAmount,
            paymentReference: payload.paymentReference,
            notes: payload.notes,
          },
        );

        message.success("Member membership updated successfully");
      } else {
        await apiPost("/api/admin/member-memberships", payload);
        message.success("Member membership created successfully");
      }

      setModalOpen(false);
      setEditingMembership(null);
      form.resetFields();

      await fetchMemberships(page, limit);
    } catch (error) {
      console.error("Save membership error:", error);
      message.error(
        error instanceof Error
          ? error.message
          : "Failed to save member membership",
      );
    } finally {
      setSaving(false);
    }
  }

  function handleDelete(record: MemberMembership) {
    Modal.confirm({
      title: "Delete Member Membership",
      content: `Delete membership for ${record.user?.fullName}?`,
      centered: true,
      okText: "Delete",
      okButtonProps: {
        danger: true,
      },
      async onOk() {
        try {
          await apiDelete(`/api/admin/member-memberships/${record.id}`);
          message.success("Member membership deleted successfully");
          await fetchMemberships(page, limit);
        } catch (error) {
          console.error("Delete membership error:", error);
          message.error(
            error instanceof Error
              ? error.message
              : "Failed to delete member membership",
          );
        }
      },
    });
  }

  function handleReset() {
    setSearch("");
    setStatus("ALL");
    setPaymentStatus("ALL");
    setMembershipPlanId("ALL");
    setPage(1);

    setTimeout(() => {
      fetchMemberships(1, limit);
    }, 0);
  }

  const columns: ColumnsType<MemberMembership> = [
    {
      title: "Customer",
      key: "customer",
      width: 310,
      render: (_, record) => <UserCell user={record.user} />,
    },
    {
      title: "Plan",
      key: "plan",
      width: 260,
      render: (_, record) => (
        <div>
          <Text className="block !font-semibold">
            {record.membershipPlan?.name || "-"}
          </Text>
          <Text className="block !text-xs !text-slate-500">
            {formatCurrency(record.membershipPlan?.price || 0)}
          </Text>
        </div>
      ),
    },
    {
      title: "Period",
      key: "period",
      width: 210,
      render: (_, record) => (
        <div>
          <Text className="block">{formatDate(record.startDate)}</Text>
          <Text className="block !text-xs !text-slate-500">
            to {formatDate(record.endDate)}
          </Text>
        </div>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      width: 120,
      render: (value) => <Tag color={getStatusColor(value)}>{value}</Tag>,
    },
    {
      title: "Payment",
      key: "payment",
      width: 190,
      render: (_, record) => (
        <div>
          <Tag color={getPaymentColor(record.paymentStatus)}>
            {record.paymentStatus}
          </Tag>
          <Text className="block !text-xs !text-slate-500">
            {record.paymentMethod}
          </Text>
        </div>
      ),
    },
    {
      title: "Paid Amount",
      dataIndex: "paidAmount",
      width: 160,
      render: (value) => (
        <Text className="!font-semibold">{formatCurrency(value)}</Text>
      ),
    },
    {
      title: "Reference",
      dataIndex: "paymentReference",
      width: 180,
      render: (value) => value || "-",
    },
    {
      title: "Action",
      key: "action",
      width: 150,
      align: "center",
      render: (_, record) => (
        <Space>
          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={() => openEditModal(record)}
          />

          <Button
            size="small"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record)}
          />
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <Title level={3} className="!mb-1">
            Member Memberships
          </Title>
          <Text type="secondary">
            Manage customer memberships and offline gym payments. Cash is still
            king, apparently.
          </Text>
        </div>

        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={openCreateModal}
        >
          Add Membership
        </Button>
      </div>

      <Card className="mb-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_160px_160px_220px_auto_auto]">
          <div>
            <div className="mb-1 text-xs font-medium text-slate-600">
              Search
            </div>
            <Input
              allowClear
              value={search}
              prefix={<SearchOutlined />}
              placeholder="Search customer name, email, or phone"
              onChange={(event) => setSearch(event.target.value)}
              onPressEnter={() => fetchMemberships(1, limit)}
            />
          </div>

          <div>
            <div className="mb-1 text-xs font-medium text-slate-600">
              Status
            </div>
            <Select
              value={status}
              className="w-full"
              onChange={(value) => {
                setStatus(value);
                setPage(1);
              }}
              options={[
                { label: "All", value: "ALL" },
                { label: "Pending", value: "PENDING" },
                { label: "Active", value: "ACTIVE" },
                { label: "Expired", value: "EXPIRED" },
                { label: "Cancelled", value: "CANCELLED" },
              ]}
            />
          </div>

          <div>
            <div className="mb-1 text-xs font-medium text-slate-600">
              Payment
            </div>
            <Select
              value={paymentStatus}
              className="w-full"
              onChange={(value) => {
                setPaymentStatus(value);
                setPage(1);
              }}
              options={[
                { label: "All", value: "ALL" },
                { label: "Paid", value: "PAID" },
                { label: "Unpaid", value: "UNPAID" },
                { label: "Cancelled", value: "CANCELLED" },
              ]}
            />
          </div>

          <div>
            <div className="mb-1 text-xs font-medium text-slate-600">Plan</div>
            <Select
              value={membershipPlanId}
              className="w-full"
              onChange={(value) => {
                setMembershipPlanId(value);
                setPage(1);
              }}
              options={[
                { label: "All Plans", value: "ALL" },
                ...plans.map((item) => ({
                  label: item.name,
                  value: item.id,
                })),
              ]}
            />
          </div>

          <div className="flex items-end">
            <Button
              type="primary"
              icon={<SearchOutlined />}
              onClick={() => fetchMemberships(1, limit)}
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
          onRefresh={() => fetchMemberships(page, limit)}
          onLimitChange={(value) => {
            setLimit(value);
            setPage(1);
            fetchMemberships(1, value);
          }}
        />

        <Table
          rowKey="id"
          size="small"
          loading={loading}
          columns={columns}
          dataSource={memberships}
          pagination={false}
          rowSelection={{
            selectedRowKeys,
            onChange: setSelectedRowKeys,
          }}
          locale={{
            emptyText: <Empty description="No member memberships found" />,
          }}
          scroll={{ x: 1500 }}
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
                fetchMemberships(nextPage, limit);
              }}
            />
          </Space>
        </div>
      </Card>

      <Modal
        title={editingMembership ? "Edit Membership" : "Add Membership"}
        open={modalOpen}
        onCancel={() => {
          setModalOpen(false);
          setEditingMembership(null);
          form.resetFields();
        }}
        onOk={() => form.submit()}
        okText={editingMembership ? "Update" : "Create"}
        confirmLoading={saving}
        width={760}
        centered
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            label="Customer"
            name="userId"
            rules={[{ required: true, message: "Customer is required" }]}
          >
            <Select
              showSearch
              disabled={!!editingMembership}
              placeholder="Select customer"
              optionFilterProp="label"
              options={customers.map((item) => ({
                label: `${item.fullName} - ${item.email}`,
                value: item.id,
              }))}
            />
          </Form.Item>

          <Form.Item
            label="Membership Plan"
            name="membershipPlanId"
            rules={[{ required: true, message: "Membership plan is required" }]}
          >
            <Select
              showSearch
              disabled={!!editingMembership}
              placeholder="Select plan"
              optionFilterProp="label"
              onChange={(value) => {
                const selectedPlan = plans.find((item) => item.id === value);

                if (selectedPlan && !editingMembership) {
                  form.setFieldValue(
                    "paidAmount",
                    Number(selectedPlan.price || 0),
                  );
                }
              }}
              options={plans.map((item) => ({
                label: `${item.name} - ${formatCurrency(item.price)}`,
                value: item.id,
              }))}
            />
          </Form.Item>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Form.Item
              label="Start Date"
              name="startDate"
              rules={[{ required: true, message: "Start date is required" }]}
            >
              <DatePicker className="w-full" disabled={!!editingMembership} />
            </Form.Item>

            <Form.Item label="Paid Amount" name="paidAmount">
              <InputNumber className="w-full" min={0} prefix="Rp" />
            </Form.Item>

            <Form.Item label="Status" name="status">
              <Select
                options={[
                  { label: "Pending", value: "PENDING" },
                  { label: "Active", value: "ACTIVE" },
                  { label: "Expired", value: "EXPIRED" },
                  { label: "Cancelled", value: "CANCELLED" },
                ]}
              />
            </Form.Item>

            <Form.Item label="Payment Status" name="paymentStatus">
              <Select
                options={[
                  { label: "Unpaid", value: "UNPAID" },
                  { label: "Paid", value: "PAID" },
                  { label: "Cancelled", value: "CANCELLED" },
                ]}
              />
            </Form.Item>

            <Form.Item label="Payment Method" name="paymentMethod">
              <Select
                options={[
                  { label: "Offline Cash", value: "OFFLINE_CASH" },
                  { label: "Offline Transfer", value: "OFFLINE_TRANSFER" },
                ]}
              />
            </Form.Item>

            <Form.Item label="Payment Reference" name="paymentReference">
              <Input placeholder="Receipt number / transfer note" />
            </Form.Item>
          </div>

          <Form.Item label="Notes" name="notes">
            <TextArea rows={4} placeholder="Additional notes..." />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
