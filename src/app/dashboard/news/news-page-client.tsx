"use client";

import {
  Button,
  Card,
  Empty,
  Form,
  Image,
  Input,
  Modal,
  Pagination,
  Select,
  Space,
  Switch,
  Table,
  Tag,
  Typography,
  Upload,
  message,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import type { UploadRequestOption } from "rc-upload/lib/interface";
import {
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  PlusOutlined,
  ReloadOutlined,
  SearchOutlined,
  UploadOutlined,
} from "@ant-design/icons";
import { useEffect, useState } from "react";
import { apiGet, apiPatch } from "@/lib/client-api";
import LogsTableToolbar from "@/components/logs/logs-table-toolbar";

const { Title, Text } = Typography;
const { TextArea } = Input;

type NewsCategory = {
  id: string;
  name: string;
  slug: string;
};

type NewsAuthor = {
  id: string;
  fullName: string;
  email: string;
};

type NewsItem = {
  id: string;
  categoryId: string;
  authorId: string | null;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  thumbnailUrl: string | null;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  isFeatured: boolean;
  viewCount: number;
  seoTitle: string | null;
  seoDescription: string | null;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  category: NewsCategory;
  author?: NewsAuthor | null;
};

type NewsResponse = {
  success: boolean;
  message: string;
  data: NewsItem[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

type CategoriesResponse = {
  success: boolean;
  message: string;
  data: NewsCategory[];
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

type NewsFormValues = {
  categoryId: string;
  title: string;
  slug?: string;
  excerpt?: string | null;
  content: string;
  thumbnailUrl?: string | null;
  status?: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  isFeatured?: boolean;
  seoTitle?: string | null;
  seoDescription?: string | null;
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

async function uploadNewsThumbnail(file: File) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch("/api/admin/news/upload", {
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

function formatDate(value?: string | null) {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleString("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function getStatusColor(status: string) {
  if (status === "PUBLISHED") return "green";
  if (status === "DRAFT") return "orange";
  if (status === "ARCHIVED") return "red";
  return "default";
}

export default function NewsPageClient() {
  const [form] = Form.useForm<NewsFormValues>();

  const [news, setNews] = useState<NewsItem[]>([]);
  const [categories, setCategories] = useState<NewsCategory[]>([]);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ALL");
  const [categoryId, setCategoryId] = useState("ALL");

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);

  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingNews, setEditingNews] = useState<NewsItem | null>(null);

  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null);

  const thumbnailUrl = Form.useWatch("thumbnailUrl", form);

  async function fetchCategories() {
    try {
      const response = await apiGet<CategoriesResponse>(
        "/api/admin/news-categories?limit=100&isActive=true",
      );

      setCategories(response.data || []);
    } catch (error) {
      console.error("Fetch categories error:", error);
      message.error("Failed to fetch categories");
    }
  }

  async function fetchNews(nextPage = page, nextLimit = limit) {
    try {
      setLoading(true);

      const params = new URLSearchParams({
        page: String(nextPage),
        limit: String(nextLimit),
      });

      if (search) params.set("search", search);
      if (status !== "ALL") params.set("status", status);
      if (categoryId !== "ALL") params.set("categoryId", categoryId);

      const response = await apiGet<NewsResponse>(
        `/api/admin/news?${params.toString()}`,
      );

      setNews(response.data || []);
      setTotal(response.meta.total || 0);
      setPage(response.meta.page || nextPage);
      setLimit(response.meta.limit || nextLimit);
    } catch (error) {
      console.error("Fetch news error:", error);
      message.error("Failed to fetch news");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchCategories();
    fetchNews(1, limit);
  }, []);

  useEffect(() => {
    fetchNews(1, limit);
  }, [status, categoryId]);

  function openCreateModal() {
    setEditingNews(null);
    form.resetFields();
    form.setFieldsValue({
      status: "DRAFT",
      isFeatured: false,
    });
    setModalOpen(true);
  }

  function openEditModal(record: NewsItem) {
    setEditingNews(record);
    form.setFieldsValue({
      categoryId: record.categoryId,
      title: record.title,
      slug: record.slug,
      excerpt: record.excerpt,
      content: record.content,
      thumbnailUrl: record.thumbnailUrl,
      status: record.status,
      isFeatured: record.isFeatured,
      seoTitle: record.seoTitle,
      seoDescription: record.seoDescription,
    });
    setModalOpen(true);
  }

  function createUploadHandler() {
    return async (options: UploadRequestOption) => {
      const { file, onSuccess, onError } = options;

      try {
        const uploadedUrl = await uploadNewsThumbnail(file as File);

        form.setFieldValue("thumbnailUrl", uploadedUrl);
        message.success("Thumbnail uploaded successfully");

        onSuccess?.({ url: uploadedUrl });
      } catch (error) {
        console.error("Upload thumbnail error:", error);
        message.error(error instanceof Error ? error.message : "Upload failed");
        onError?.(error as Error);
      }
    };
  }

  async function handleSubmit(values: NewsFormValues) {
    try {
      setSaving(true);

      const payload = {
        categoryId: values.categoryId,
        title: values.title,
        slug: values.slug || undefined,
        excerpt: values.excerpt || null,
        content: values.content,
        thumbnailUrl: values.thumbnailUrl || null,
        status: values.status || "DRAFT",
        isFeatured: values.isFeatured ?? false,
        seoTitle: values.seoTitle || null,
        seoDescription: values.seoDescription || null,
      };

      if (editingNews) {
        await apiPatch(`/api/admin/news/${editingNews.id}`, payload);
        message.success("News updated successfully");
      } else {
        await apiPost("/api/admin/news", payload);
        message.success("News created successfully");
      }

      setModalOpen(false);
      setEditingNews(null);
      form.resetFields();

      await fetchNews(page, limit);
    } catch (error) {
      console.error("Save news error:", error);
      message.error(
        error instanceof Error ? error.message : "Failed to save news",
      );
    } finally {
      setSaving(false);
    }
  }

  function handleDelete(record: NewsItem) {
    Modal.confirm({
      title: "Delete News",
      content: `Are you sure you want to delete "${record.title}"?`,
      centered: true,
      okText: "Delete",
      okButtonProps: {
        danger: true,
      },
      async onOk() {
        try {
          await apiDelete(`/api/admin/news/${record.id}`);
          message.success("News deleted successfully");
          await fetchNews(page, limit);
        } catch (error) {
          console.error("Delete news error:", error);
          message.error(
            error instanceof Error ? error.message : "Failed to delete news",
          );
        }
      },
    });
  }

  function handleReset() {
    setSearch("");
    setStatus("ALL");
    setCategoryId("ALL");
    setPage(1);

    setTimeout(() => {
      fetchNews(1, limit);
    }, 0);
  }

  const columns: ColumnsType<NewsItem> = [
    {
      title: "News",
      key: "news",
      width: 420,
      render: (_, record) => (
        <div className="flex items-center gap-3">
          <div className="h-14 w-20 overflow-hidden rounded-lg border border-slate-200 bg-slate-50 shrink-0">
            {record.thumbnailUrl ? (
              <Image
                src={record.thumbnailUrl}
                alt={record.title}
                width={80}
                height={56}
                className="object-cover"
                preview={false}
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
              {record.slug}
            </Text>
            {record.excerpt ? (
              <Text className="block !text-xs !text-slate-400 truncate">
                {record.excerpt}
              </Text>
            ) : null}
          </div>
        </div>
      ),
    },
    {
      title: "Category",
      key: "category",
      width: 170,
      render: (_, record) => <Tag>{record.category?.name || "-"}</Tag>,
    },
    {
      title: "Status",
      dataIndex: "status",
      width: 130,
      render: (value) => <Tag color={getStatusColor(value)}>{value}</Tag>,
    },
    {
      title: "Featured",
      dataIndex: "isFeatured",
      width: 110,
      render: (value: boolean) =>
        value ? <Tag color="blue">Featured</Tag> : <Tag>Normal</Tag>,
    },
    {
      title: "Views",
      dataIndex: "viewCount",
      width: 90,
      align: "center",
    },
    {
      title: "Published",
      dataIndex: "publishedAt",
      width: 180,
      render: (value) => formatDate(value),
    },
    {
      title: "Action",
      key: "action",
      width: 170,
      align: "center",
      render: (_, record) => (
        <Space>
          <Button
            size="small"
            icon={<EyeOutlined />}
            onClick={() => {
              setSelectedNews(record);
              setDetailOpen(true);
            }}
          />

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
            News
          </Title>
          <Text type="secondary">
            Manage gym articles, announcements, and educational posts.
          </Text>
        </div>

        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={openCreateModal}
        >
          Add News
        </Button>
      </div>

      <Card className="mb-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_180px_240px_auto_auto]">
          <div>
            <div className="mb-1 text-xs font-medium text-slate-600">
              Search
            </div>
            <Input
              allowClear
              value={search}
              prefix={<SearchOutlined />}
              placeholder="Search title, slug, or excerpt"
              onChange={(event) => setSearch(event.target.value)}
              onPressEnter={() => fetchNews(1, limit)}
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
                { label: "Published", value: "PUBLISHED" },
                { label: "Archived", value: "ARCHIVED" },
              ]}
            />
          </div>

          <div>
            <div className="mb-1 text-xs font-medium text-slate-600">
              Category
            </div>
            <Select
              value={categoryId}
              className="w-full"
              onChange={(value) => {
                setCategoryId(value);
                setPage(1);
              }}
              options={[
                { label: "All Categories", value: "ALL" },
                ...categories.map((item) => ({
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
              onClick={() => fetchNews(1, limit)}
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
          onRefresh={() => fetchNews(page, limit)}
          onLimitChange={(value) => {
            setLimit(value);
            setPage(1);
            fetchNews(1, value);
          }}
        />

        <Table
          rowKey="id"
          size="small"
          loading={loading}
          columns={columns}
          dataSource={news}
          pagination={false}
          rowSelection={{
            selectedRowKeys,
            onChange: setSelectedRowKeys,
          }}
          locale={{
            emptyText: <Empty description="No news found" />,
          }}
          scroll={{ x: 1400 }}
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
                fetchNews(nextPage, limit);
              }}
            />
          </Space>
        </div>
      </Card>

      <Modal
        title={editingNews ? "Edit News" : "Add News"}
        open={modalOpen}
        onCancel={() => {
          setModalOpen(false);
          setEditingNews(null);
          form.resetFields();
        }}
        onOk={() => form.submit()}
        okText={editingNews ? "Update" : "Create"}
        confirmLoading={saving}
        width={980}
        centered
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Form.Item
              label="Category"
              name="categoryId"
              rules={[{ required: true, message: "Category is required" }]}
            >
              <Select
                placeholder="Select category"
                options={categories.map((item) => ({
                  label: item.name,
                  value: item.id,
                }))}
              />
            </Form.Item>

            <Form.Item label="Status" name="status">
              <Select
                options={[
                  { label: "Draft", value: "DRAFT" },
                  { label: "Published", value: "PUBLISHED" },
                  { label: "Archived", value: "ARCHIVED" },
                ]}
              />
            </Form.Item>

            <Form.Item
              label="Title"
              name="title"
              rules={[{ required: true, message: "Title is required" }]}
            >
              <Input placeholder="5 Tips Latihan Aman untuk Pemula" />
            </Form.Item>

            <Form.Item label="Excerpt" name="excerpt" className="md:col-span-2">
              <TextArea rows={3} placeholder="Short summary..." />
            </Form.Item>

            <Form.Item
              label="Content"
              name="content"
              className="md:col-span-2"
              rules={[{ required: true, message: "Content is required" }]}
            >
              <TextArea rows={8} placeholder="Write news content..." />
            </Form.Item>

            <div className="md:col-span-2">
              <Text className="mb-2 block !text-sm !font-medium">
                Thumbnail
              </Text>

              <div className="flex flex-wrap items-start gap-4 rounded-xl border border-slate-200 p-4">
                <div className="h-[110px] w-[160px] overflow-hidden rounded-xl border border-dashed border-slate-300 bg-slate-50">
                  {thumbnailUrl ? (
                    <Image
                      src={thumbnailUrl}
                      alt="Thumbnail"
                      width={160}
                      height={110}
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-xs text-slate-400">
                      No Thumbnail
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
                      <Button icon={<UploadOutlined />}>
                        Upload Thumbnail
                      </Button>
                    </Upload>

                    {thumbnailUrl ? (
                      <Button
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => form.setFieldValue("thumbnailUrl", null)}
                      >
                        Remove
                      </Button>
                    ) : null}
                  </Space>

                  <Form.Item name="thumbnailUrl" hidden>
                    <Input />
                  </Form.Item>

                  <Text className="mt-2 block !text-xs !text-slate-500">
                    Recommended ratio 16:9. JPG, PNG, or WEBP.
                  </Text>
                </div>
              </div>
            </div>

            <Form.Item
              label="Featured"
              name="isFeatured"
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>

            <Form.Item label="SEO Title" name="seoTitle">
              <Input placeholder="SEO optimized title" />
            </Form.Item>

            <Form.Item
              label="SEO Description"
              name="seoDescription"
              className="md:col-span-2"
            >
              <TextArea rows={3} placeholder="SEO meta description..." />
            </Form.Item>
          </div>
        </Form>
      </Modal>

      <Modal
        title="News Detail"
        open={detailOpen}
        onCancel={() => {
          setDetailOpen(false);
          setSelectedNews(null);
        }}
        footer={null}
        width={860}
        centered
      >
        {selectedNews ? (
          <div className="space-y-4">
            {selectedNews.thumbnailUrl ? (
              <Image
                src={selectedNews.thumbnailUrl}
                alt={selectedNews.title}
                className="max-h-[320px] rounded-xl object-cover"
              />
            ) : null}

            <div>
              <Title level={4} className="!mb-1">
                {selectedNews.title}
              </Title>

              <Space wrap>
                <Tag color={getStatusColor(selectedNews.status)}>
                  {selectedNews.status}
                </Tag>
                <Tag>{selectedNews.category?.name}</Tag>
                {selectedNews.isFeatured ? (
                  <Tag color="blue">Featured</Tag>
                ) : null}
                <Tag>{selectedNews.viewCount} views</Tag>
              </Space>
            </div>

            {selectedNews.excerpt ? (
              <Text className="block !text-slate-500">
                {selectedNews.excerpt}
              </Text>
            ) : null}

            <Card size="small" title="Content">
              <div className="whitespace-pre-wrap text-sm text-slate-700">
                {selectedNews.content}
              </div>
            </Card>

            <Card size="small" title="Metadata">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div>
                  <Text className="block !text-xs !text-slate-500">Slug</Text>
                  <Text>{selectedNews.slug}</Text>
                </div>

                <div>
                  <Text className="block !text-xs !text-slate-500">Author</Text>
                  <Text>{selectedNews.author?.fullName || "-"}</Text>
                </div>

                <div>
                  <Text className="block !text-xs !text-slate-500">
                    Published At
                  </Text>
                  <Text>{formatDate(selectedNews.publishedAt)}</Text>
                </div>

                <div>
                  <Text className="block !text-xs !text-slate-500">
                    Created At
                  </Text>
                  <Text>{formatDate(selectedNews.createdAt)}</Text>
                </div>
              </div>
            </Card>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
