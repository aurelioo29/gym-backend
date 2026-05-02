"use client";

import {
  Avatar,
  Button,
  Card,
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
  CheckOutlined,
  CloseOutlined,
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
  SearchOutlined,
  UserOutlined,
} from "@ant-design/icons";
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

type ServiceItem = {
  id: string;
  name: string;
  slug: string;
  serviceType: string;
  price: string;
};

type ServiceSchedule = {
  id: string;
  title: string | null;
  startTime: string;
  endTime: string;
  capacity: number;
  bookedSlots: number;
  isCancelled: boolean;
  service: ServiceItem;
  trainer?: {
    id: string;
    fullName: string;
    email: string;
  } | null;
};

type Booking = {
  id: string;
  userId: string;
  serviceScheduleId: string;
  status: "BOOKED" | "COMPLETED" | "CANCELLED" | "NO_SHOW";
  amountPaid: string;
  paymentReference: string | null;
  notes: string | null;
  bookedAt: string;
  cancelledBy: string | null;
  cancelReason: string | null;
  cancelledAt: string | null;
  createdAt: string;
  user: UserLite;
  serviceSchedule: ServiceSchedule;
  createdByUser?: {
    id: string;
    fullName: string;
    email: string;
  } | null;
  cancelledByUser?: {
    id: string;
    fullName: string;
    email: string;
  } | null;
};

type BookingsResponse = {
  success: boolean;
  message: string;
  data: Booking[];
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

type SchedulesResponse = {
  success: boolean;
  message: string;
  data: ServiceSchedule[];
};

type BookingFormValues = {
  userId: string;
  serviceScheduleId: string;
  amountPaid?: number;
  paymentReference?: string | null;
  notes?: string | null;
};

type EditBookingFormValues = {
  status: "BOOKED" | "COMPLETED" | "NO_SHOW";
  amountPaid?: number;
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

function formatDateTime(value?: string | null) {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleString("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function getStatusColor(status: string) {
  if (status === "BOOKED") return "blue";
  if (status === "COMPLETED") return "green";
  if (status === "CANCELLED") return "red";
  if (status === "NO_SHOW") return "orange";
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

export default function BookingsPageClient() {
  const [form] = Form.useForm<BookingFormValues>();
  const [editForm] = Form.useForm<EditBookingFormValues>();
  const [cancelForm] = Form.useForm<{ cancelReason: string }>();

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [customers, setCustomers] = useState<UserLite[]>([]);
  const [schedules, setSchedules] = useState<ServiceSchedule[]>([]);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ALL");
  const [serviceScheduleId, setServiceScheduleId] = useState("ALL");

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);

  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  async function fetchBookings(nextPage = page, nextLimit = limit) {
    try {
      setLoading(true);

      const params = new URLSearchParams({
        page: String(nextPage),
        limit: String(nextLimit),
      });

      if (search) params.set("search", search);
      if (status !== "ALL") params.set("status", status);
      if (serviceScheduleId !== "ALL") {
        params.set("serviceScheduleId", serviceScheduleId);
      }

      const response = await apiGet<BookingsResponse>(
        `/api/admin/bookings?${params.toString()}`,
      );

      setBookings(response.data || []);
      setTotal(response.meta.total || 0);
      setPage(response.meta.page || nextPage);
      setLimit(response.meta.limit || nextLimit);
    } catch (error) {
      console.error("Fetch bookings error:", error);
      message.error("Failed to fetch bookings");
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

  async function fetchSchedules() {
    try {
      const response = await apiGet<SchedulesResponse>(
        "/api/admin/service-schedules?isCancelled=false&limit=100",
      );

      setSchedules(response.data || []);
    } catch (error) {
      console.error("Fetch schedules error:", error);
    }
  }

  useEffect(() => {
    fetchBookings(1, limit);
    fetchCustomers();
    fetchSchedules();
  }, []);

  useEffect(() => {
    fetchBookings(1, limit);
  }, [status, serviceScheduleId]);

  function openCreateModal() {
    form.resetFields();
    form.setFieldsValue({
      amountPaid: 0,
    });
    setCreateModalOpen(true);
  }

  function openEditModal(record: Booking) {
    setSelectedBooking(record);
    editForm.setFieldsValue({
      status:
        record.status === "CANCELLED"
          ? "BOOKED"
          : (record.status as "BOOKED" | "COMPLETED" | "NO_SHOW"),
      amountPaid: Number(record.amountPaid),
      paymentReference: record.paymentReference,
      notes: record.notes,
    });
    setEditModalOpen(true);
  }

  async function handleCreate(values: BookingFormValues) {
    try {
      setSaving(true);

      await apiPost("/api/admin/bookings", {
        userId: values.userId,
        serviceScheduleId: values.serviceScheduleId,
        amountPaid: values.amountPaid ?? 0,
        paymentReference: values.paymentReference || null,
        notes: values.notes || null,
      });

      message.success("Booking created successfully");

      setCreateModalOpen(false);
      form.resetFields();

      await fetchBookings(page, limit);
      await fetchSchedules();
    } catch (error) {
      console.error("Create booking error:", error);
      message.error(
        error instanceof Error ? error.message : "Failed to create booking",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdate(values: EditBookingFormValues) {
    if (!selectedBooking) return;

    try {
      setSaving(true);

      await apiPatch(`/api/admin/bookings/${selectedBooking.id}`, {
        status: values.status,
        amountPaid: values.amountPaid ?? 0,
        paymentReference: values.paymentReference || null,
        notes: values.notes || null,
      });

      message.success("Booking updated successfully");

      setEditModalOpen(false);
      setSelectedBooking(null);
      editForm.resetFields();

      await fetchBookings(page, limit);
    } catch (error) {
      console.error("Update booking error:", error);
      message.error(
        error instanceof Error ? error.message : "Failed to update booking",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleCancelBooking() {
    if (!selectedBooking) return;

    try {
      const values = await cancelForm.validateFields();

      setSaving(true);

      await apiPatch(`/api/admin/bookings/${selectedBooking.id}/cancel`, {
        cancelReason: values.cancelReason,
      });

      message.success("Booking cancelled successfully");

      setCancelModalOpen(false);
      setSelectedBooking(null);
      cancelForm.resetFields();

      await fetchBookings(page, limit);
      await fetchSchedules();
    } catch (error) {
      console.error("Cancel booking error:", error);
      message.error(
        error instanceof Error ? error.message : "Failed to cancel booking",
      );
    } finally {
      setSaving(false);
    }
  }

  function handleDelete(record: Booking) {
    Modal.confirm({
      title: "Delete Booking",
      content: `Delete booking for ${record.user?.fullName}?`,
      centered: true,
      okText: "Delete",
      okButtonProps: {
        danger: true,
      },
      async onOk() {
        try {
          await apiDelete(`/api/admin/bookings/${record.id}`);
          message.success("Booking deleted successfully");

          await fetchBookings(page, limit);
          await fetchSchedules();
        } catch (error) {
          console.error("Delete booking error:", error);
          message.error(
            error instanceof Error ? error.message : "Failed to delete booking",
          );
        }
      },
    });
  }

  function handleReset() {
    setSearch("");
    setStatus("ALL");
    setServiceScheduleId("ALL");
    setPage(1);

    setTimeout(() => {
      fetchBookings(1, limit);
    }, 0);
  }

  const columns: ColumnsType<Booking> = [
    {
      title: "Customer",
      key: "customer",
      width: 310,
      render: (_, record) => <UserCell user={record.user} />,
    },
    {
      title: "Schedule",
      key: "schedule",
      width: 330,
      render: (_, record) => (
        <div>
          <Text className="block !font-semibold">
            {record.serviceSchedule?.title ||
              record.serviceSchedule?.service?.name ||
              "-"}
          </Text>
          <Text className="block !text-xs !text-slate-500">
            {record.serviceSchedule?.service?.name || "-"}
          </Text>
          <Text className="block !text-xs !text-slate-400">
            {formatDateTime(record.serviceSchedule?.startTime)}
          </Text>
        </div>
      ),
    },
    {
      title: "Trainer",
      key: "trainer",
      width: 190,
      render: (_, record) => record.serviceSchedule?.trainer?.fullName || "-",
    },
    {
      title: "Status",
      dataIndex: "status",
      width: 130,
      render: (value) => <Tag color={getStatusColor(value)}>{value}</Tag>,
    },
    {
      title: "Paid",
      dataIndex: "amountPaid",
      width: 150,
      render: (value) => (
        <Text className="!font-semibold">{formatCurrency(value)}</Text>
      ),
    },
    {
      title: "Booked At",
      dataIndex: "bookedAt",
      width: 190,
      render: (value) => formatDateTime(value),
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
      width: 210,
      align: "center",
      render: (_, record) => (
        <Space>
          <Button
            size="small"
            icon={<EditOutlined />}
            disabled={record.status === "CANCELLED"}
            onClick={() => openEditModal(record)}
          />

          <Button
            size="small"
            danger
            icon={<CloseOutlined />}
            disabled={record.status === "CANCELLED"}
            onClick={() => {
              setSelectedBooking(record);
              setCancelModalOpen(true);
            }}
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
            Bookings
          </Title>
          <Text type="secondary">
            Manage customer bookings for service schedules. Slot chaos,
            professionally contained.
          </Text>
        </div>

        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={openCreateModal}
        >
          Add Booking
        </Button>
      </div>

      <Card className="mb-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_180px_260px_auto_auto]">
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
              onPressEnter={() => fetchBookings(1, limit)}
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
                { label: "Booked", value: "BOOKED" },
                { label: "Completed", value: "COMPLETED" },
                { label: "Cancelled", value: "CANCELLED" },
                { label: "No Show", value: "NO_SHOW" },
              ]}
            />
          </div>

          <div>
            <div className="mb-1 text-xs font-medium text-slate-600">
              Schedule
            </div>
            <Select
              value={serviceScheduleId}
              className="w-full"
              onChange={(value) => {
                setServiceScheduleId(value);
                setPage(1);
              }}
              options={[
                { label: "All Schedules", value: "ALL" },
                ...schedules.map((item) => ({
                  label: `${item.service?.name || "Schedule"} - ${formatDateTime(
                    item.startTime,
                  )}`,
                  value: item.id,
                })),
              ]}
            />
          </div>

          <div className="flex items-end">
            <Button
              type="primary"
              icon={<SearchOutlined />}
              onClick={() => fetchBookings(1, limit)}
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
          onRefresh={() => fetchBookings(page, limit)}
          onLimitChange={(value) => {
            setLimit(value);
            setPage(1);
            fetchBookings(1, value);
          }}
        />

        <Table
          rowKey="id"
          size="small"
          loading={loading}
          columns={columns}
          dataSource={bookings}
          pagination={false}
          rowSelection={{
            selectedRowKeys,
            onChange: setSelectedRowKeys,
          }}
          locale={{
            emptyText: <Empty description="No bookings found" />,
          }}
          scroll={{ x: 1550 }}
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
                fetchBookings(nextPage, limit);
              }}
            />
          </Space>
        </div>
      </Card>

      <Modal
        title="Add Booking"
        open={createModalOpen}
        onCancel={() => {
          setCreateModalOpen(false);
          form.resetFields();
        }}
        onOk={() => form.submit()}
        okText="Create"
        confirmLoading={saving}
        width={760}
        centered
      >
        <Form form={form} layout="vertical" onFinish={handleCreate}>
          <Form.Item
            label="Customer"
            name="userId"
            rules={[{ required: true, message: "Customer is required" }]}
          >
            <Select
              showSearch
              placeholder="Select customer"
              optionFilterProp="label"
              options={customers.map((item) => ({
                label: `${item.fullName} - ${item.email}`,
                value: item.id,
              }))}
            />
          </Form.Item>

          <Form.Item
            label="Schedule"
            name="serviceScheduleId"
            rules={[{ required: true, message: "Schedule is required" }]}
          >
            <Select
              showSearch
              placeholder="Select schedule"
              optionFilterProp="label"
              onChange={(value) => {
                const selectedSchedule = schedules.find(
                  (item) => item.id === value,
                );

                if (selectedSchedule) {
                  form.setFieldValue(
                    "amountPaid",
                    Number(selectedSchedule.service?.price || 0),
                  );
                }
              }}
              options={schedules.map((item) => ({
                label: `${item.service?.name || "Schedule"} - ${formatDateTime(
                  item.startTime,
                )} (${item.bookedSlots}/${item.capacity})`,
                value: item.id,
              }))}
            />
          </Form.Item>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Form.Item label="Amount Paid" name="amountPaid">
              <InputNumber className="w-full" min={0} prefix="Rp" />
            </Form.Item>

            <Form.Item label="Payment Reference" name="paymentReference">
              <Input placeholder="Receipt / transfer note" />
            </Form.Item>
          </div>

          <Form.Item label="Notes" name="notes">
            <TextArea rows={4} placeholder="Booking notes..." />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Edit Booking"
        open={editModalOpen}
        onCancel={() => {
          setEditModalOpen(false);
          setSelectedBooking(null);
          editForm.resetFields();
        }}
        onOk={() => editForm.submit()}
        okText="Update"
        confirmLoading={saving}
        width={720}
        centered
      >
        <Form form={editForm} layout="vertical" onFinish={handleUpdate}>
          <Form.Item label="Status" name="status">
            <Select
              options={[
                { label: "Booked", value: "BOOKED" },
                { label: "Completed", value: "COMPLETED" },
                { label: "No Show", value: "NO_SHOW" },
              ]}
            />
          </Form.Item>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Form.Item label="Amount Paid" name="amountPaid">
              <InputNumber className="w-full" min={0} prefix="Rp" />
            </Form.Item>

            <Form.Item label="Payment Reference" name="paymentReference">
              <Input placeholder="Receipt / transfer note" />
            </Form.Item>
          </div>

          <Form.Item label="Notes" name="notes">
            <TextArea rows={4} placeholder="Booking notes..." />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Cancel Booking"
        open={cancelModalOpen}
        onCancel={() => {
          setCancelModalOpen(false);
          setSelectedBooking(null);
          cancelForm.resetFields();
        }}
        onOk={handleCancelBooking}
        okText="Cancel Booking"
        confirmLoading={saving}
        okButtonProps={{ danger: true }}
        centered
      >
        <Form form={cancelForm} layout="vertical">
          <Form.Item
            label="Cancel Reason"
            name="cancelReason"
            rules={[
              {
                required: true,
                message: "Cancel reason is required",
              },
            ]}
          >
            <TextArea rows={4} placeholder="Reason for cancellation..." />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
