"use client";

import { Modal, Typography } from "antd";

const { Text } = Typography;

type JsonDetailModalProps = {
  title: string;
  open: boolean;
  data: unknown;
  onClose: () => void;
};

export default function JsonDetailModal({
  title,
  open,
  data,
  onClose,
}: JsonDetailModalProps) {
  return (
    <Modal
      title={title}
      open={open}
      onCancel={onClose}
      footer={null}
      width={760}
      centered
    >
      {data ? (
        <pre className="max-h-[520px] overflow-auto rounded-xl bg-slate-950 p-4 text-xs text-slate-100">
          {JSON.stringify(data, null, 2)}
        </pre>
      ) : (
        <Text type="secondary">No data</Text>
      )}
    </Modal>
  );
}
