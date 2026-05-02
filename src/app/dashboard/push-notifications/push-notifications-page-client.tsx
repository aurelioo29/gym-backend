"use client";

import {
  Button,
  Card,
  DatePicker,
  Empty,
  Form,
  Image,
  Input,
  Modal,
  Pagination,
  Select,
  Space,
  Table,
  Tag,
  Typography,
  Upload,
  message,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import type { UploadRequestOption } from "rc-upload/lib/interface";
import {
  CheckOutlined,
  CloseOutlined,
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
  SearchOutlined,
  SendOutlined,
  UploadOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { useEffect, useState } from "react";
import { apiGet, apiPatch } from "@/lib/client-api";
import LogsTableToolbar from "@/components/logs/logs-table-toolbar";

const { Title, Text } = Typography;
const { TextArea } = Input;

type TargetType = "ALL" | "CUSTOMER" | "TRAINER" | "SPECIFIC_USER";
type PushStatus = "DRAFT" | "SCHEDULED" | "PUBLISHED" | "CANCELLED";

type UserLite = {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
};

type ServiceLite = {
  id: string;
  name: string;
  slug: string;
  serviceType: string;
  price: string;
  imageUrl: string | null;
};

type PushNotification = {
  id: string;
  userId: string | null;
  serviceId: string | null;
  imageUrl: string | null;
  title: string;
  description: string | null;
  targetType: TargetType;
  status: PushStatus;
  scheduledAt: string | null;
  publishedAt: string | null;
  createdAt: string;
  user?: UserLite | null;
  service?: ServiceLite | null;
  createdByUser?: {
    id: string;
    fullName: string;
    email: string;
  } | null;
};

type PushNotificationsResponse = {
  success: boolean;
  message: string;
  data: PushNotification[];
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

type ServicesResponse = {
  success: boolean;
  message: string;
  data: ServiceLite[];
};

type PushFormValues = {
  userId?: string | null;
  serviceId?: string | null;
  imageUrl?: string | null;
  title: string;
  description?: string | null;
  targetType: TargetType;
  status: PushStatus;
  scheduledAt?: dayjs.Dayjs | null;
};

type UploadResponse = {
  success: boolean;
  message: string;
  data: {
    url: string;
  };
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

async function uploadPushImage(file: File) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch("/api/admin/push-notifications/upload", {
    method: "POST",
    credentials: "include",
    body: formData,
  });

  const data = (await response.json()) as UploadResponse;

  if (!response.ok) {
    throw new Error(data?.message || "Upload failed");
  }

  return data.data.url;
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

function getStatusColor(status: PushStatus) {
  if (status === "PUBLISHED") return "green";
  if (status === "SCHEDULED") return "blue";
  if (status === "DRAFT") return "default";
  if (status === "CANCELLED") return "red";

  return "default";
}

function getTargetColor(targetType: TargetType) {
  if (targetType === "ALL") return "purple";
  if (targetType === "CUSTOMER") return "green";
  if (targetType === "TRAINER") return "blue";
  if (targetType === "SPECIFIC_USER") return "orange";

  return "default";
}

export default function PushNotificationsPageClient() {
  const [form] = Form.useForm<PushFormValues>();

  const [notifications, setNotifications] = useState<PushNotification[]>([]);
  const [users, setUsers] = useState<UserLite[]>([]);
  const [services, setServices] = useState<ServiceLite[]>([]);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [search, setSearch] = useState("");
  const [targetType, setTargetType] = useState("ALL_FILTER");
  const [status, setStatus] = useState("ALL");
  const [serviceId, setServiceId] = useState("ALL");

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);

  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingNotification, setEditingNotification] =
    useState<PushNotification | null>(null);

  const imageUrl = Form.useWatch("imageUrl", form);
  const watchedTargetType = Form.useWatch("targetType", form);
  const watchedStatus = Form.useWatch("status", form);

  async function fetchNotifications(nextPage = page, nextLimit = limit) {
    try {
      setLoading(true);

      const params = new URLSearchParams({
        page: String(nextPage),
        limit: String(nextLimit),
      });

      if (search) params.set("search", search);
      if (targetType !== "ALL_FILTER") params.set("targetType", targetType);
      if (status !== "ALL") params.set("status", status);
      if (serviceId !== "ALL") params.set("serviceId", serviceId);

      const response = await apiGet<PushNotificationsResponse>(
        `/api/admin/push-notifications?${params.toString()}`,
      );

      setNotifications(response.data || []);
      setTotal(response.meta.total || 0);
      setPage(response.meta.page || nextPage);
      setLimit(response.meta.limit || nextLimit);
    } catch (error) {
      console.error("Fetch push notifications error:", error);
      message.error("Failed to fetch push notifications");
    } finally {
      setLoading(false);
    }
  }

  async function fetchUsers() {
    try {
      const response = await apiGet<UsersResponse>(
        "/api/admin/users?isActive=true&limit=100",
      );

      setUsers(response.data || []);
    } catch (error) {
      console.error("Fetch users error:", error);
    }
  }

  async function fetchServices() {
    try {
      const response = await apiGet<ServicesResponse>(
        "/api/admin/services?isActive=true&limit=100",
      );

      setServices(response.data || []);
    } catch (error) {
      console.error("Fetch services error:", error);
    }
  }

  useEffect(() => {
    fetchNotifications(1, limit);
    fetchUsers();
    fetchServices();
  }, []);

  useEffect(() => {
    fetchNotifications(1, limit);
  }, [targetType, status, serviceId]);

  function openCreateModal() {
    setEditingNotification(null);
    form.resetFields();
    form.setFieldsValue({
      targetType: "ALL",
      status: "DRAFT",
      imageUrl: null,
      serviceId: null,
      userId: null,
      scheduledAt: null,
    });
    setModalOpen(true);
  }

  function openEditModal(record: PushNotification) {
    setEditingNotification(record);

    form.setFieldsValue({
      userId: record.userId,
      serviceId: record.serviceId,
      imageUrl: record.imageUrl,
      title: record.title,
      description: record.description,
      targetType: record.targetType,
      status: record.status,
      scheduledAt: record.scheduledAt ? dayjs(record.scheduledAt) : null,
    });

    setModalOpen(true);
  }

  function createUploadHandler() {
    return async (options: UploadRequestOption) => {
      const { file, onSuccess, onError } = options;

      try {
        const uploadedUrl = await uploadPushImage(file as File);

        form.setFieldValue("imageUrl", uploadedUrl);
        message.success("Image uploaded successfully");

        onSuccess?.({ url: uploadedUrl });
      } catch (error) {
        console.error("Upload push notification image error:", error);
        message.error(error instanceof Error ? error.message : "Upload failed");
        onError?.(error as Error);
      }
    };
  }

  async function handleSubmit(values: PushFormValues) {
    try {
      setSaving(true);

      const payload = {
        userId: values.targetType === "SPECIFIC_USER" ? values.userId : null,
        serviceId: values.serviceId || null,
        imageUrl: values.imageUrl || null,
        title: values.title,
        description: values.description || null,
        targetType: values.targetType,
        status: values.status,
        scheduledAt: values.scheduledAt
          ? values.scheduledAt.toISOString()
          : null,
      };

      if (editingNotification) {
        await apiPatch(
          `/api/admin/push-notifications/${editingNotification.id}`,
          payload,
        );

        message.success("Push notification updated successfully");
      } else {
        await apiPost("/api/admin/push-notifications", payload);
        message.success("Push notification created successfully");
      }

      setModalOpen(false);
      setEditingNotification(null);
      form.resetFields();

      await fetchNotifications(page, limit);
    } catch (error) {
      console.error("Save push notification error:", error);
      message.error(
        error instanceof Error
          ? error.message
          : "Failed to save push notification",
      );
    } finally {
      setSaving(false);
    }
  }

  function handleDelete(record: PushNotification) {
    Modal.confirm({
      title: "Delete Push Notification",
      content: `Delete "${record.title}"?`,
      centered: true,
      okText: "Delete",
      okButtonProps: {
        danger: true,
      },
      async onOk() {
        try {
          await apiDelete(`/api/admin/push-notifications/${record.id}`);
          message.success("Push notification deleted successfully");
          await fetchNotifications(page, limit);
        } catch (error) {
          console.error("Delete push notification error:", error);
          message.error(
            error instanceof Error
              ? error.message
              : "Failed to delete push notification",
          );
        }
      },
    });
  }

  function handlePublish(record: PushNotification) {
    Modal.confirm({
      title: "Publish Push Notification",
      content: `Publish "${record.title}" now?`,
      centered: true,
      okText: "Publish",
      icon: <SendOutlined />,
      async onOk() {
        try {
          await apiPatch(
            `/api/admin/push-notifications/${record.id}/publish`,
            {},
          );
          message.success("Push notification published successfully");
          await fetchNotifications(page, limit);
        } catch (error) {
          console.error("Publish push notification error:", error);
          message.error(
            error instanceof Error
              ? error.message
              : "Failed to publish push notification",
          );
        }
      },
    });
  }

  function handleCancel(record: PushNotification) {
    Modal.confirm({
      title: "Cancel Push Notification",
      content: `Cancel "${record.title}"?`,
      centered: true,
      okText: "Cancel Notification",
      okButtonProps: {
        danger: true,
      },
      async onOk() {
        try {
          await apiPatch(
            `/api/admin/push-notifications/${record.id}/cancel`,
            {},
          );
          message.success("Push notification cancelled successfully");
          await fetchNotifications(page, limit);
        } catch (error) {
          console.error("Cancel push notification error:", error);
          message.error(
            error instanceof Error
              ? error.message
              : "Failed to cancel push notification",
          );
        }
      },
    });
  }

  function handleReset() {
    setSearch("");
    setTargetType("ALL_FILTER");
    setStatus("ALL");
    setServiceId("ALL");
    setPage(1);

    setTimeout(() => {
      fetchNotifications(1, limit);
    }, 0);
  }

  const columns: ColumnsType<PushNotification> = [
    {
      title: "Notification",
      key: "notification",
      width: 420,
      render: (_, record) => (
        <div className="flex items-center gap-3">
          <div className="h-16 w-24 overflow-hidden rounded-lg border border-slate-200 bg-slate-50 shrink-0">
            {record.imageUrl ? (
              <Image
                src={record.imageUrl}
                alt={record.title}
                width={96}
                height={64}
                preview={false}
                className="object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-xs text-slate-400">
                No Image
              </div>
            )}
          </div>

          <div className="min-w-0">
            <Text className="block !font-semibold truncate">
              {record.title}
            </Text>
            <Text className="block !text-xs !text-slate-500 truncate">
              {record.description || "-"}
            </Text>
            {record.service ? (
              <Text className="block !text-xs !text-blue-500 truncate">
                Service: {record.service.name}
              </Text>
            ) : null}
          </div>
        </div>
      ),
    },
    {
      title: "Target",
      dataIndex: "targetType",
      width: 150,
      render: (value: TargetType, record) => (
        <div>
          <Tag color={getTargetColor(value)}>{value}</Tag>
          {value === "SPECIFIC_USER" ? (
            <Text className="block !text-xs !text-slate-500">
              {record.user?.fullName || "-"}
            </Text>
          ) : null}
        </div>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      width: 130,
      render: (value: PushStatus) => (
        <Tag color={getStatusColor(value)}>{value}</Tag>
      ),
    },
    {
      title: "Scheduled",
      dataIndex: "scheduledAt",
      width: 190,
      render: (value) => formatDateTime(value),
    },
    {
      title: "Published",
      dataIndex: "publishedAt",
      width: 190,
      render: (value) => formatDateTime(value),
    },
    {
      title: "Created By",
      key: "createdBy",
      width: 220,
      render: (_, record) => (
        <div>
          <Text className="block !font-medium">
            {record.createdByUser?.fullName || "-"}
          </Text>
          <Text className="block !text-xs !text-slate-500">
            {record.createdByUser?.email || "-"}
          </Text>
        </div>
      ),
    },
    {
      title: "Action",
      key: "action",
      width: 230,
      align: "center",
      render: (_, record) => (
        <Space>
          <Button
            size="small"
            icon={<EditOutlined />}
            disabled={record.status === "PUBLISHED"}
            onClick={() => openEditModal(record)}
          />

          <Button
            size="small"
            type="primary"
            icon={<CheckOutlined />}
            disabled={
              record.status === "PUBLISHED" || record.status === "CANCELLED"
            }
            onClick={() => handlePublish(record)}
          />

          <Button
            size="small"
            danger
            icon={<CloseOutlined />}
            disabled={record.status === "CANCELLED"}
            onClick={() => handleCancel(record)}
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
            Push Notifications
          </Title>
          <Text type="secondary">
            Create promos, important info, and mobile announcements. Basically:
            legal spam, but useful.
          </Text>
        </div>

        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={openCreateModal}
        >
          Add Notification
        </Button>
      </div>

      <Card className="mb-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_190px_170px_220px_auto_auto]">
          <div>
            <div className="mb-1 text-xs font-medium text-slate-600">
              Search
            </div>
            <Input
              allowClear
              value={search}
              prefix={<SearchOutlined />}
              placeholder="Search title or description"
              onChange={(event) => setSearch(event.target.value)}
              onPressEnter={() => fetchNotifications(1, limit)}
            />
          </div>

          <div>
            <div className="mb-1 text-xs font-medium text-slate-600">
              Target
            </div>
            <Select
              value={targetType}
              className="w-full"
              onChange={(value) => {
                setTargetType(value);
                setPage(1);
              }}
              options={[
                { label: "All Targets", value: "ALL_FILTER" },
                { label: "All Users", value: "ALL" },
                { label: "Customers", value: "CUSTOMER" },
                { label: "Trainers", value: "TRAINER" },
                { label: "Specific User", value: "SPECIFIC_USER" },
              ]}
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
                { label: "All Status", value: "ALL" },
                { label: "Draft", value: "DRAFT" },
                { label: "Scheduled", value: "SCHEDULED" },
                { label: "Published", value: "PUBLISHED" },
                { label: "Cancelled", value: "CANCELLED" },
              ]}
            />
          </div>

          <div>
            <div className="mb-1 text-xs font-medium text-slate-600">
              Service
            </div>
            <Select
              value={serviceId}
              className="w-full"
              onChange={(value) => {
                setServiceId(value);
                setPage(1);
              }}
              options={[
                { label: "All Services", value: "ALL" },
                ...services.map((item) => ({
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
              onClick={() => fetchNotifications(1, limit)}
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
          onRefresh={() => fetchNotifications(page, limit)}
          onLimitChange={(value) => {
            setLimit(value);
            setPage(1);
            fetchNotifications(1, value);
          }}
        />

        <Table
          rowKey="id"
          size="small"
          loading={loading}
          columns={columns}
          dataSource={notifications}
          pagination={false}
          rowSelection={{
            selectedRowKeys,
            onChange: setSelectedRowKeys,
          }}
          locale={{
            emptyText: <Empty description="No push notifications found" />,
          }}
          scroll={{ x: 1600 }}
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
                fetchNotifications(nextPage, limit);
              }}
            />
          </Space>
        </div>
      </Card>

      <Modal
        title={
          editingNotification
            ? "Edit Push Notification"
            : "Add Push Notification"
        }
        open={modalOpen}
        onCancel={() => {
          setModalOpen(false);
          setEditingNotification(null);
          form.resetFields();
        }}
        onOk={() => form.submit()}
        okText={editingNotification ? "Update" : "Create"}
        confirmLoading={saving}
        width={840}
        centered
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Form.Item
              label="Title / Nama Event"
              name="title"
              rules={[{ required: true, message: "Title is required" }]}
            >
              <Input placeholder="Promo Yoga Class / Info Gym Closed" />
            </Form.Item>

            <Form.Item
              label="Target"
              name="targetType"
              rules={[{ required: true, message: "Target is required" }]}
            >
              <Select
                options={[
                  { label: "All Users", value: "ALL" },
                  { label: "Customers", value: "CUSTOMER" },
                  { label: "Trainers", value: "TRAINER" },
                  { label: "Specific User", value: "SPECIFIC_USER" },
                ]}
                onChange={(value) => {
                  if (value !== "SPECIFIC_USER") {
                    form.setFieldValue("userId", null);
                  }
                }}
              />
            </Form.Item>

            {watchedTargetType === "SPECIFIC_USER" ? (
              <Form.Item
                label="User"
                name="userId"
                rules={[
                  {
                    required: true,
                    message: "User is required for specific user target",
                  },
                ]}
              >
                <Select
                  showSearch
                  placeholder="Select user"
                  optionFilterProp="label"
                  options={users.map((item) => ({
                    label: `${item.fullName} - ${item.email}`,
                    value: item.id,
                  }))}
                />
              </Form.Item>
            ) : null}

            <Form.Item label="Related Service / Layanan" name="serviceId">
              <Select
                allowClear
                showSearch
                placeholder="Optional service"
                optionFilterProp="label"
                options={services.map((item) => ({
                  label: item.name,
                  value: item.id,
                }))}
              />
            </Form.Item>

            <Form.Item
              label="Status"
              name="status"
              rules={[{ required: true, message: "Status is required" }]}
            >
              <Select
                options={[
                  { label: "Draft", value: "DRAFT" },
                  { label: "Scheduled", value: "SCHEDULED" },
                  { label: "Published", value: "PUBLISHED" },
                ]}
              />
            </Form.Item>

            {watchedStatus === "SCHEDULED" ? (
              <Form.Item
                label="Jadwal Terbit"
                name="scheduledAt"
                rules={[
                  {
                    required: true,
                    message: "Scheduled time is required",
                  },
                ]}
              >
                <DatePicker showTime className="w-full" />
              </Form.Item>
            ) : null}

            <Form.Item
              label="Description"
              name="description"
              className="md:col-span-2"
            >
              <TextArea rows={4} placeholder="Notification description..." />
            </Form.Item>

            <div className="md:col-span-2">
              <Text className="mb-2 block !text-sm !font-medium">
                Notification Image
              </Text>

              <div className="flex flex-wrap items-start gap-4 rounded-xl border border-slate-200 p-4">
                <div className="h-[120px] w-[180px] overflow-hidden rounded-xl border border-dashed border-slate-300 bg-slate-50">
                  {imageUrl ? (
                    <Image
                      src={imageUrl}
                      alt="Push notification"
                      width={180}
                      height={120}
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-xs text-slate-400">
                      No Image
                    </div>
                  )}
                </div>

                <div>
                  <Space wrap>
                    <Upload
                      showUploadList={false}
                      customRequest={createUploadHandler()}
                      accept="image/png,image/jpeg,image/webp"
                    >
                      <Button icon={<UploadOutlined />}>Upload Image</Button>
                    </Upload>

                    {imageUrl ? (
                      <Button
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => form.setFieldValue("imageUrl", null)}
                      >
                        Remove
                      </Button>
                    ) : null}
                  </Space>

                  <Form.Item name="imageUrl" hidden>
                    <Input />
                  </Form.Item>

                  <Text className="mt-2 block !text-xs !text-slate-500">
                    Recommended ratio 16:9. JPG, PNG, or WEBP. Jangan upload
                    foto random ukuran baliho, kasihan server-nya.
                  </Text>
                </div>
              </div>
            </div>
          </div>
        </Form>
      </Modal>
    </div>
  );
}
