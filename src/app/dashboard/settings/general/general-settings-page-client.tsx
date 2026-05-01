"use client";

import {
  Button,
  Card,
  Empty,
  Input,
  Modal,
  Row,
  Select,
  Space,
  Spin,
  Switch,
  Table,
  Tag,
  Tooltip,
  Typography,
  message,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  CodeOutlined,
  EyeInvisibleOutlined,
  EyeOutlined,
  ReloadOutlined,
  SaveOutlined,
  SearchOutlined,
  SettingOutlined,
} from "@ant-design/icons";
import { useEffect, useMemo, useState } from "react";
import { apiGet, apiPatch } from "@/lib/client-api";

const { Title, Text } = Typography;
const { TextArea } = Input;

type SettingType = "STRING" | "NUMBER" | "BOOLEAN" | "JSON";

type GeneralSetting = {
  id: string;
  key: string;
  value: string | null;
  type: SettingType;
  groupName: string;
  label: string | null;
  description: string | null;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
};

type SettingsResponse = {
  success: boolean;
  message: string;
  data: {
    settings: GeneralSetting[];
    groups: string[];
  };
};

type EditableValues = Record<string, string>;

type JsonModalState = {
  open: boolean;
  setting: GeneralSetting | null;
  value: string;
};

function parseValue(value: string | null, type: SettingType) {
  if (value === null) return null;

  if (type === "BOOLEAN") return value === "true";
  if (type === "NUMBER") return Number(value);

  if (type === "JSON") {
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  }

  return value;
}

function getTypeColor(type: SettingType) {
  if (type === "BOOLEAN") return "blue";
  if (type === "NUMBER") return "purple";
  if (type === "JSON") return "orange";
  return "default";
}

function getGroupColor(index: number) {
  const colors = ["blue", "purple", "green", "orange", "cyan", "magenta"];
  return colors[index % colors.length];
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function stringifySettingValue(setting: GeneralSetting) {
  if (setting.value === null) return "";

  if (setting.type === "JSON") {
    const parsed = parseValue(setting.value, setting.type);

    if (typeof parsed === "object" && parsed !== null) {
      return JSON.stringify(parsed, null, 2);
    }
  }

  return String(setting.value);
}

function getUpdatePayloadValue(setting: GeneralSetting, rawValue: string) {
  if (setting.type === "NUMBER") {
    const numericValue = Number(rawValue);

    if (Number.isNaN(numericValue)) {
      throw new Error("Value must be a valid number");
    }

    return numericValue;
  }

  if (setting.type === "JSON") {
    try {
      return JSON.parse(rawValue);
    } catch {
      throw new Error("Invalid JSON format");
    }
  }

  return rawValue;
}

export default function GeneralSettingsPageClient() {
  const [settings, setSettings] = useState<GeneralSetting[]>([]);
  const [groups, setGroups] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [updatingKey, setUpdatingKey] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [groupName, setGroupName] = useState("ALL");
  const [editableValues, setEditableValues] = useState<EditableValues>({});

  const [jsonModal, setJsonModal] = useState<JsonModalState>({
    open: false,
    setting: null,
    value: "",
  });

  async function fetchSettings() {
    try {
      setLoading(true);

      const params = new URLSearchParams();

      if (search.trim()) params.set("search", search.trim());
      if (groupName !== "ALL") params.set("groupName", groupName);

      const query = params.toString();
      const url = query
        ? `/api/admin/settings?${query}`
        : "/api/admin/settings";

      const response = await apiGet<SettingsResponse>(url);
      const incomingSettings = response.data.settings || [];

      setSettings(incomingSettings);
      setGroups(response.data.groups || []);

      const nextEditableValues = incomingSettings.reduce<EditableValues>(
        (acc, setting) => {
          acc[setting.key] = stringifySettingValue(setting);
          return acc;
        },
        {},
      );

      setEditableValues(nextEditableValues);
    } catch (error) {
      console.error("Fetch settings error:", error);
      message.error("Failed to fetch settings");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchSettings();
  }, [groupName]);

  async function updateSetting(setting: GeneralSetting, value: unknown) {
    try {
      setUpdatingKey(setting.key);

      await apiPatch(`/api/admin/settings/${setting.key}`, {
        value,
      });

      message.success("Setting updated successfully");
      await fetchSettings();
    } catch (error) {
      console.error("Update setting error:", error);
      message.error(
        error instanceof Error ? error.message : "Failed to update setting",
      );
    } finally {
      setUpdatingKey(null);
    }
  }

  async function saveTextSetting(setting: GeneralSetting) {
    try {
      const rawValue = editableValues[setting.key] ?? "";
      const value = getUpdatePayloadValue(setting, rawValue);

      await updateSetting(setting, value);
    } catch (error) {
      message.error(
        error instanceof Error ? error.message : "Invalid setting value",
      );
    }
  }

  async function saveJsonSetting() {
    if (!jsonModal.setting) return;

    try {
      const value = getUpdatePayloadValue(jsonModal.setting, jsonModal.value);

      await updateSetting(jsonModal.setting, value);

      setJsonModal({
        open: false,
        setting: null,
        value: "",
      });
    } catch (error) {
      message.error(
        error instanceof Error ? error.message : "Invalid JSON format",
      );
    }
  }

  const groupOptions = useMemo(
    () => [
      { label: "All Groups", value: "ALL" },
      ...groups.map((group) => ({
        label: group,
        value: group,
      })),
    ],
    [groups],
  );

  const summary = useMemo(() => {
    const publicSettings = settings.filter(
      (setting) => setting.isPublic,
    ).length;
    const privateSettings = settings.length - publicSettings;
    const booleanSettings = settings.filter(
      (setting) => setting.type === "BOOLEAN",
    ).length;

    return {
      total: settings.length,
      publicSettings,
      privateSettings,
      booleanSettings,
      groups: groups.length,
    };
  }, [settings, groups]);

  const groupFilterButtons = useMemo(
    () => [
      {
        label: "All",
        value: "ALL",
      },
      ...groups.map((group) => ({
        label: group,
        value: group,
      })),
    ],
    [groups],
  );

  const columns: ColumnsType<GeneralSetting> = [
    {
      title: "Setting",
      key: "setting",
      width: 360,
      render: (_, record) => (
        <div className="min-w-0">
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <Text className="!font-semibold !text-slate-800">
              {record.label || record.key}
            </Text>

            {record.isPublic ? (
              <Tooltip title="Visible for public/client usage">
                <Tag color="green" icon={<EyeOutlined />}>
                  Public
                </Tag>
              </Tooltip>
            ) : (
              <Tooltip title="Only visible internally">
                <Tag icon={<EyeInvisibleOutlined />}>Private</Tag>
              </Tooltip>
            )}
          </div>

          <Text className="block !font-mono !text-xs !text-slate-500">
            {record.key}
          </Text>

          {record.description ? (
            <Text className="mt-1 block !text-xs !text-slate-400">
              {record.description}
            </Text>
          ) : null}
        </div>
      ),
    },
    {
      title: "Group",
      dataIndex: "groupName",
      width: 140,
      render: (value: string) => {
        const groupIndex = groups.findIndex((group) => group === value);

        return (
          <Tag color={getGroupColor(groupIndex >= 0 ? groupIndex : 0)}>
            {value}
          </Tag>
        );
      },
    },
    {
      title: "Type",
      dataIndex: "type",
      width: 110,
      render: (value: SettingType) => (
        <Tag color={getTypeColor(value)}>{value}</Tag>
      ),
    },
    {
      title: "Value",
      key: "value",
      width: 420,
      render: (_, record) => {
        const parsedValue = parseValue(record.value, record.type);
        const isUpdating = updatingKey === record.key;

        if (record.type === "BOOLEAN") {
          return (
            <div className="flex items-center gap-3">
              <Switch
                checked={Boolean(parsedValue)}
                loading={isUpdating}
                checkedChildren="On"
                unCheckedChildren="Off"
                onChange={(checked) => updateSetting(record, checked)}
              />

              <Text className="!text-xs !text-slate-500">
                {Boolean(parsedValue) ? "Enabled" : "Disabled"}
              </Text>
            </div>
          );
        }

        if (record.type === "JSON") {
          return (
            <Space>
              <Button
                icon={<CodeOutlined />}
                onClick={() =>
                  setJsonModal({
                    open: true,
                    setting: record,
                    value: stringifySettingValue(record),
                  })
                }
              >
                Edit JSON
              </Button>

              <Text className="!text-xs !text-slate-400">
                {record.value ? "Configured" : "Empty"}
              </Text>
            </Space>
          );
        }

        return (
          <div className="flex gap-2">
            <Input
              type={record.type === "NUMBER" ? "number" : "text"}
              value={editableValues[record.key] ?? ""}
              disabled={isUpdating}
              placeholder="Enter value"
              onChange={(event) =>
                setEditableValues((current) => ({
                  ...current,
                  [record.key]: event.target.value,
                }))
              }
              onPressEnter={() => saveTextSetting(record)}
            />

            <Button
              type="primary"
              icon={<SaveOutlined />}
              loading={isUpdating}
              onClick={() => saveTextSetting(record)}
            >
              Save
            </Button>
          </div>
        );
      },
    },
    {
      title: "Updated",
      dataIndex: "updatedAt",
      width: 140,
      render: (value: string) => (
        <Text className="!text-xs !text-slate-500">{formatDate(value)}</Text>
      ),
    },
  ];

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
            <SettingOutlined />
            System Configuration
          </div>

          <Title level={3} className="!mb-1">
            General Settings
          </Title>

          <Text type="secondary">
            Manage system behavior, registration rules, payment mode, and
            trainer requirements.
          </Text>
        </div>

        <Button icon={<ReloadOutlined />} onClick={fetchSettings}>
          Refresh
        </Button>
      </div>

      <Row gutter={[16, 16]} className="mb-5">
        <div className="grid w-full grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
          <Card className="border border-slate-100">
            <Text className="block !text-xs !text-slate-500">
              Total Settings
            </Text>
            <Title level={3} className="!mb-0 !mt-1">
              {summary.total}
            </Title>
          </Card>

          <Card className="border border-slate-100">
            <Text className="block !text-xs !text-slate-500">Groups</Text>
            <Title level={3} className="!mb-0 !mt-1">
              {summary.groups}
            </Title>
          </Card>

          <Card className="border border-slate-100">
            <Text className="block !text-xs !text-slate-500">Public</Text>
            <Title level={3} className="!mb-0 !mt-1">
              {summary.publicSettings}
            </Title>
          </Card>

          <Card className="border border-slate-100">
            <Text className="block !text-xs !text-slate-500">Private</Text>
            <Title level={3} className="!mb-0 !mt-1">
              {summary.privateSettings}
            </Title>
          </Card>

          <Card className="border border-slate-100">
            <Text className="block !text-xs !text-slate-500">
              Toggle Settings
            </Text>
            <Title level={3} className="!mb-0 !mt-1">
              {summary.booleanSettings}
            </Title>
          </Card>
        </div>
      </Row>

      <Card className="mb-5 border border-slate-100">
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_240px_auto]">
            <Input
              allowClear
              value={search}
              prefix={<SearchOutlined />}
              placeholder="Search key, label, or description"
              onChange={(event) => setSearch(event.target.value)}
              onPressEnter={fetchSettings}
            />

            <Select
              value={groupName}
              options={groupOptions}
              onChange={setGroupName}
            />

            <Button type="primary" onClick={fetchSettings}>
              Search
            </Button>
          </div>

          <div className="flex flex-wrap gap-2">
            {groupFilterButtons.map((item) => {
              const active = groupName === item.value;

              return (
                <Button
                  key={item.value}
                  size="small"
                  type={active ? "primary" : "default"}
                  onClick={() => setGroupName(item.value)}
                >
                  {item.label}
                </Button>
              );
            })}
          </div>
        </div>
      </Card>

      <Card className="border border-slate-100">
        <Spin spinning={loading}>
          {settings.length === 0 ? (
            <Empty description="No settings found" />
          ) : (
            <Table
              rowKey="id"
              columns={columns}
              dataSource={settings}
              pagination={false}
              scroll={{ x: 1200 }}
            />
          )}
        </Spin>
      </Card>

      <Modal
        title={
          <Space>
            <CodeOutlined />
            Edit JSON Setting
          </Space>
        }
        open={jsonModal.open}
        width={720}
        okText="Save JSON"
        cancelText="Cancel"
        confirmLoading={Boolean(
          jsonModal.setting && updatingKey === jsonModal.setting.key,
        )}
        onOk={saveJsonSetting}
        onCancel={() =>
          setJsonModal({
            open: false,
            setting: null,
            value: "",
          })
        }
      >
        {jsonModal.setting ? (
          <div className="mb-3 rounded-xl bg-slate-50 p-3">
            <Text className="block !font-semibold !text-slate-800">
              {jsonModal.setting.label || jsonModal.setting.key}
            </Text>

            <Text className="block !font-mono !text-xs !text-slate-500">
              {jsonModal.setting.key}
            </Text>
          </div>
        ) : null}

        <TextArea
          rows={14}
          value={jsonModal.value}
          className="!font-mono"
          placeholder='{"key": "value"}'
          onChange={(event) =>
            setJsonModal((current) => ({
              ...current,
              value: event.target.value,
            }))
          }
        />

        <div className="mt-3 rounded-xl bg-orange-50 px-3 py-2">
          <Text className="!text-xs !text-orange-700">
            Make sure this is valid JSON before saving. One missing comma and
            JavaScript will start crying dramatically.
          </Text>
        </div>
      </Modal>
    </div>
  );
}
