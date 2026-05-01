"use client";

import {
  Avatar,
  Button,
  Card,
  Empty,
  Input,
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
  EyeOutlined,
  FileProtectOutlined,
  ReloadOutlined,
  SearchOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { useEffect, useState } from "react";
import { apiGet, apiPatch } from "@/lib/client-api";
import LogsTableToolbar from "@/components/logs/logs-table-toolbar";

const { Title, Text } = Typography;
const { TextArea } = Input;

type TrainerUser = {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  avatarUrl: string | null;
  isActive: boolean;
  emailVerifiedAt: string | null;
  createdAt: string;
};

type ApprovedByUser = {
  id: string;
  fullName: string;
  email: string;
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
  approvedBy: string | null;
  approvedAt: string | null;
  createdAt: string;
  updatedAt: string;
  user: TrainerUser;
  approvedByUser?: ApprovedByUser | null;
};

type TrainerApprovalResponse = {
  success: boolean;
  message: string;
  data: TrainerProfile[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
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

function getApprovalColor(status: string) {
  if (status === "APPROVED") return "green";
  if (status === "REJECTED") return "red";
  if (status === "SUBMITTED") return "blue";
  if (status === "PENDING") return "orange";
  return "default";
}

function getInitials(name: string) {
  const words = name.trim().split(" ").filter(Boolean);

  if (words.length === 0) return "TR";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();

  return `${words[0][0]}${words[1][0]}`.toUpperCase();
}

export default function TrainerApprovalPageClient() {
  const [trainers, setTrainers] = useState<TrainerProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("SUBMITTED");

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);

  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedTrainer, setSelectedTrainer] = useState<TrainerProfile | null>(
    null,
  );

  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  async function fetchTrainers(nextPage = page, nextLimit = limit) {
    try {
      setLoading(true);

      const params = new URLSearchParams({
        page: String(nextPage),
        limit: String(nextLimit),
      });

      if (search) params.set("search", search);
      if (status !== "ALL") params.set("status", status);

      const response = await apiGet<TrainerApprovalResponse>(
        `/api/admin/trainers/pending?${params.toString()}`,
      );

      setTrainers(response.data || []);
      setTotal(response.meta.total || 0);
      setPage(response.meta.page || nextPage);
      setLimit(response.meta.limit || nextLimit);
    } catch (error) {
      console.error("Fetch trainer approvals error:", error);
      message.error("Failed to fetch trainer approvals");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchTrainers(1, limit);
  }, [status]);

  function handleReset() {
    setSearch("");
    setStatus("SUBMITTED");
    setPage(1);

    setTimeout(() => {
      fetchTrainers(1, limit);
    }, 0);
  }

  async function handleApprove(record: TrainerProfile) {
    Modal.confirm({
      title: "Approve Trainer",
      content: `Approve ${record.user.fullName} as trainer?`,
      centered: true,
      okText: "Approve",
      okButtonProps: {
        type: "primary",
      },
      async onOk() {
        try {
          setActionLoadingId(record.id);

          await apiPatch(`/api/admin/trainers/${record.id}/approve`);

          message.success("Trainer approved successfully");
          await fetchTrainers(page, limit);
        } catch (error) {
          console.error("Approve trainer error:", error);
          message.error(
            error instanceof Error
              ? error.message
              : "Failed to approve trainer",
          );
        } finally {
          setActionLoadingId(null);
        }
      },
    });
  }

  async function handleReject() {
    if (!selectedTrainer) return;

    if (!rejectReason.trim()) {
      message.warning("Rejected reason is required");
      return;
    }

    try {
      setActionLoadingId(selectedTrainer.id);

      await apiPatch(`/api/admin/trainers/${selectedTrainer.id}/reject`, {
        rejectedReason: rejectReason.trim(),
      });

      message.success("Trainer rejected successfully");
      setRejectOpen(false);
      setRejectReason("");
      setSelectedTrainer(null);

      await fetchTrainers(page, limit);
    } catch (error) {
      console.error("Reject trainer error:", error);
      message.error(
        error instanceof Error ? error.message : "Failed to reject trainer",
      );
    } finally {
      setActionLoadingId(null);
    }
  }

  const columns: ColumnsType<TrainerProfile> = [
    {
      title: "Trainer",
      key: "trainer",
      width: 320,
      render: (_, record) => (
        <div className="flex items-center gap-3">
          <Avatar
            src={record.user.avatarUrl || undefined}
            icon={<UserOutlined />}
          >
            {!record.user.avatarUrl ? getInitials(record.user.fullName) : null}
          </Avatar>

          <div className="min-w-0">
            <Text className="block !font-semibold truncate">
              {record.user.fullName}
            </Text>
            <Text className="block !text-xs !text-slate-500 truncate">
              {record.user.email}
            </Text>
            <Text className="block !text-xs !text-slate-400 truncate">
              {record.user.phone || "-"}
            </Text>
          </div>
        </div>
      ),
    },
    {
      title: "Specialization",
      dataIndex: "specialization",
      width: 190,
      render: (value) => value || "-",
    },
    {
      title: "Certification",
      dataIndex: "certification",
      width: 190,
      render: (value) => value || "-",
    },
    {
      title: "Certificate",
      dataIndex: "certificateUrl",
      width: 140,
      align: "center",
      render: (value: string | null) =>
        value ? (
          <Button
            size="small"
            icon={<FileProtectOutlined />}
            href={value}
            target="_blank"
          >
            View
          </Button>
        ) : (
          <Tag color="red">Missing</Tag>
        ),
    },
    {
      title: "Status",
      dataIndex: "approvalStatus",
      width: 140,
      render: (value: string) => (
        <Tag color={getApprovalColor(value)}>{value}</Tag>
      ),
    },
    {
      title: "Updated at",
      dataIndex: "updatedAt",
      width: 190,
      render: (value) => formatDate(value),
    },
    {
      title: "Action",
      key: "action",
      width: 220,
      align: "center",
      render: (_, record) => (
        <Space>
          <Button
            size="small"
            icon={<EyeOutlined />}
            onClick={() => {
              setSelectedTrainer(record);
              setDetailOpen(true);
            }}
          />

          <Button
            size="small"
            type="primary"
            icon={<CheckOutlined />}
            loading={actionLoadingId === record.id}
            disabled={
              record.approvalStatus === "APPROVED" || !record.certificateUrl
            }
            onClick={() => handleApprove(record)}
          />

          <Button
            size="small"
            danger
            icon={<CloseOutlined />}
            loading={actionLoadingId === record.id}
            disabled={record.approvalStatus === "REJECTED"}
            onClick={() => {
              setSelectedTrainer(record);
              setRejectOpen(true);
            }}
          />
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div className="mb-5">
        <Title level={3} className="!mb-1">
          Trainer Approval
        </Title>
        <Text type="secondary">
          Review trainer certificates before they can teach. Because “trust me
          bro” is not a certification.
        </Text>
      </div>

      <Card className="mb-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_220px_auto_auto]">
          <div>
            <div className="mb-1 text-xs font-medium text-slate-600">
              Search
            </div>
            <Input
              allowClear
              value={search}
              prefix={<SearchOutlined />}
              placeholder="Search trainer name, email, or phone"
              onChange={(event) => setSearch(event.target.value)}
              onPressEnter={() => fetchTrainers(1, limit)}
            />
          </div>

          <div>
            <div className="mb-1 text-xs font-medium text-slate-600">
              Status
            </div>
            <Select
              className="w-full"
              value={status}
              onChange={(value) => {
                setStatus(value);
                setPage(1);
              }}
              options={[
                { label: "All Status", value: "ALL" },
                { label: "Submitted", value: "SUBMITTED" },
                { label: "Approved", value: "APPROVED" },
                { label: "Rejected", value: "REJECTED" },
                { label: "Pending", value: "PENDING" },
              ]}
            />
          </div>

          <div className="flex items-end">
            <Button
              type="primary"
              icon={<SearchOutlined />}
              onClick={() => fetchTrainers(1, limit)}
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
          onRefresh={() => fetchTrainers(page, limit)}
          onLimitChange={(value) => {
            setLimit(value);
            setPage(1);
            fetchTrainers(1, value);
          }}
        />

        <Table
          rowKey="id"
          size="small"
          loading={loading}
          columns={columns}
          dataSource={trainers}
          pagination={false}
          rowSelection={{
            selectedRowKeys,
            onChange: setSelectedRowKeys,
          }}
          locale={{
            emptyText: <Empty description="No trainers found" />,
          }}
          scroll={{ x: 1300 }}
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
                fetchTrainers(nextPage, limit);
              }}
            />
          </Space>
        </div>
      </Card>

      <Modal
        title="Trainer Detail"
        open={detailOpen}
        onCancel={() => {
          setDetailOpen(false);
          setSelectedTrainer(null);
        }}
        footer={null}
        width={760}
        centered
      >
        {selectedTrainer ? (
          <div className="space-y-4">
            <Card size="small" title="User Info">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div>
                  <Text className="block !text-xs !text-slate-500">Name</Text>
                  <Text>{selectedTrainer.user.fullName}</Text>
                </div>

                <div>
                  <Text className="block !text-xs !text-slate-500">Email</Text>
                  <Text>{selectedTrainer.user.email}</Text>
                </div>

                <div>
                  <Text className="block !text-xs !text-slate-500">Phone</Text>
                  <Text>{selectedTrainer.user.phone || "-"}</Text>
                </div>

                <div>
                  <Text className="block !text-xs !text-slate-500">Status</Text>
                  <Tag color={getApprovalColor(selectedTrainer.approvalStatus)}>
                    {selectedTrainer.approvalStatus}
                  </Tag>
                </div>
              </div>
            </Card>

            <Card size="small" title="Trainer Info">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div>
                  <Text className="block !text-xs !text-slate-500">
                    Specialization
                  </Text>
                  <Text>{selectedTrainer.specialization || "-"}</Text>
                </div>

                <div>
                  <Text className="block !text-xs !text-slate-500">
                    Certification
                  </Text>
                  <Text>{selectedTrainer.certification || "-"}</Text>
                </div>

                <div>
                  <Text className="block !text-xs !text-slate-500">
                    Experience
                  </Text>
                  <Text>{selectedTrainer.experienceYears ?? "-"} years</Text>
                </div>

                <div>
                  <Text className="block !text-xs !text-slate-500">
                    Hourly Rate
                  </Text>
                  <Text>{selectedTrainer.hourlyRate || "-"}</Text>
                </div>

                <div className="md:col-span-2">
                  <Text className="block !text-xs !text-slate-500">Bio</Text>
                  <Text>{selectedTrainer.bio || "-"}</Text>
                </div>

                {selectedTrainer.rejectedReason ? (
                  <div className="md:col-span-2">
                    <Text className="block !text-xs !text-slate-500">
                      Rejected Reason
                    </Text>
                    <Text type="danger">{selectedTrainer.rejectedReason}</Text>
                  </div>
                ) : null}
              </div>
            </Card>
          </div>
        ) : null}
      </Modal>

      <Modal
        title="Reject Trainer"
        open={rejectOpen}
        onCancel={() => {
          setRejectOpen(false);
          setRejectReason("");
        }}
        onOk={handleReject}
        okText="Reject"
        cancelText="Cancel"
        confirmLoading={!!actionLoadingId}
        okButtonProps={{
          danger: true,
        }}
        centered
      >
        <Text className="mb-2 block">
          Give a clear reason, not just “no vibes.” Admin professionalism, etc.
        </Text>

        <TextArea
          rows={4}
          value={rejectReason}
          onChange={(event) => setRejectReason(event.target.value)}
          placeholder="Example: Sertifikat kurang jelas, mohon upload ulang file yang lebih terbaca."
        />
      </Modal>
    </div>
  );
}
