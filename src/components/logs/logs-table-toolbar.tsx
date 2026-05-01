"use client";

import { Button, Select, Space, Typography } from "antd";
import { ReloadOutlined } from "@ant-design/icons";

const { Text } = Typography;

type LogsTableToolbarProps = {
  total: number;
  page: number;
  limit: number;
  selectedCount?: number;
  onRefresh: () => void;
  onLimitChange: (value: number) => void;
};

export default function LogsTableToolbar({
  total,
  page,
  limit,
  selectedCount = 0,
  onRefresh,
  onLimitChange,
}: LogsTableToolbarProps) {
  const start = total === 0 ? 0 : (page - 1) * limit + 1;
  const end = Math.min(page * limit, total);

  return (
    <div className="mb-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <div>
        <Text className="!text-xs !text-slate-500">
          Parameter:{" "}
          <span className="italic">
            {total > 0 ? `${total} item found` : "no search params found"}
          </span>
        </Text>

        {selectedCount > 0 ? (
          <Text className="ml-3 !text-xs !text-blue-500">
            {selectedCount} selected
          </Text>
        ) : null}
      </div>

      <Space wrap>
        <Text className="!text-xs !text-slate-500">
          showing {start} to {end} of {total} items
        </Text>

        <Select
          value={limit}
          style={{ width: 110 }}
          onChange={onLimitChange}
          options={[
            { label: "10 / page", value: 10 },
            { label: "20 / page", value: 20 },
            { label: "50 / page", value: 50 },
            { label: "100 / page", value: 100 },
          ]}
        />

        <Button icon={<ReloadOutlined />} onClick={onRefresh} />
      </Space>
    </div>
  );
}
