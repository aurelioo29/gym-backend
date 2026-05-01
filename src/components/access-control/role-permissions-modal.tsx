"use client";

import {
  Button,
  Checkbox,
  Col,
  Empty,
  Modal,
  Row,
  Spin,
  Tag,
  Typography,
  message,
} from "antd";
import { useEffect, useMemo, useState } from "react";
import { apiGet, apiPatch } from "@/lib/client-api";

const { Text } = Typography;

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
  description?: string | null;
  permissions?: Permission[];
};

type PermissionsResponse = {
  success: boolean;
  message: string;
  data: {
    permissions: Permission[];
    modules: string[];
  };
};

type RolePermissionsModalProps = {
  open: boolean;
  role: Role | null;
  onClose: () => void;
  onSuccess: () => void;
};

export default function RolePermissionsModal({
  open,
  role,
  onClose,
  onSuccess,
}: RolePermissionsModalProps) {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [selectedPermissionIds, setSelectedPermissionIds] = useState<string[]>(
    [],
  );
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const groupedPermissions = useMemo(() => {
    return permissions.reduce<Record<string, Permission[]>>(
      (acc, permission) => {
        if (!acc[permission.module]) {
          acc[permission.module] = [];
        }

        acc[permission.module].push(permission);

        return acc;
      },
      {},
    );
  }, [permissions]);

  async function fetchPermissions() {
    try {
      setLoading(true);

      const response = await apiGet<PermissionsResponse>(
        "/api/admin/permissions",
      );

      setPermissions(response.data.permissions || []);
    } catch (error) {
      console.error("Fetch permissions error:", error);
      message.error("Failed to fetch permissions");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (open) {
      fetchPermissions();
      setSelectedPermissionIds(role?.permissions?.map((item) => item.id) || []);
    }
  }, [open, role]);

  async function handleSave() {
    if (!role) return;

    if (selectedPermissionIds.length === 0) {
      message.warning("Minimal pilih 1 permission");
      return;
    }

    try {
      setSaving(true);

      await apiPatch(`/api/admin/roles/${role.id}/permissions`, {
        permissionIds: selectedPermissionIds,
      });

      message.success("Role permissions updated successfully");
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Update role permissions error:", error);
      message.error(
        error instanceof Error
          ? error.message
          : "Failed to update role permissions",
      );
    } finally {
      setSaving(false);
    }
  }

  function toggleModule(moduleName: string, checked: boolean) {
    const modulePermissionIds =
      groupedPermissions[moduleName]?.map((item) => item.id) || [];

    if (checked) {
      setSelectedPermissionIds((prev) =>
        Array.from(new Set([...prev, ...modulePermissionIds])),
      );

      return;
    }

    setSelectedPermissionIds((prev) =>
      prev.filter((id) => !modulePermissionIds.includes(id)),
    );
  }

  return (
    <Modal
      title={
        <div>
          Manage Permissions
          {role ? (
            <Text className="ml-2 !text-sm !text-slate-500">
              for {role.name}
            </Text>
          ) : null}
        </div>
      }
      open={open}
      onCancel={onClose}
      width={920}
      centered
      footer={[
        <Button key="cancel" onClick={onClose}>
          Cancel
        </Button>,
        <Button
          key="save"
          type="primary"
          loading={saving}
          onClick={handleSave}
          disabled={role?.slug === "SUPERADMIN"}
        >
          Save Permissions
        </Button>,
      ]}
    >
      {role?.slug === "SUPERADMIN" ? (
        <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
          <Text className="!text-amber-700">
            SUPERADMIN permissions cannot be changed. Don’t poke the final boss.
          </Text>
        </div>
      ) : null}

      <Spin spinning={loading}>
        {permissions.length === 0 ? (
          <Empty description="No permissions found" />
        ) : (
          <div className="max-h-[560px] overflow-auto pr-2">
            {Object.entries(groupedPermissions).map(
              ([moduleName, modulePermissions]) => {
                const modulePermissionIds = modulePermissions.map(
                  (item) => item.id,
                );

                const checkedCount = modulePermissionIds.filter((id) =>
                  selectedPermissionIds.includes(id),
                ).length;

                const allChecked =
                  checkedCount > 0 &&
                  checkedCount === modulePermissionIds.length;

                const indeterminate =
                  checkedCount > 0 && checkedCount < modulePermissionIds.length;

                return (
                  <div
                    key={moduleName}
                    className="mb-4 rounded-xl border border-slate-200"
                  >
                    <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Checkbox
                          checked={allChecked}
                          indeterminate={indeterminate}
                          onChange={(event) =>
                            toggleModule(moduleName, event.target.checked)
                          }
                        />

                        <Text className="!font-semibold capitalize">
                          {moduleName}
                        </Text>

                        <Tag>{modulePermissions.length} permissions</Tag>
                      </div>

                      <Text className="!text-xs !text-slate-500">
                        {checkedCount} selected
                      </Text>
                    </div>

                    <div className="p-4">
                      <Row gutter={[12, 12]}>
                        {modulePermissions.map((permission) => (
                          <Col xs={24} md={12} key={permission.id}>
                            <Checkbox
                              checked={selectedPermissionIds.includes(
                                permission.id,
                              )}
                              onChange={(event) => {
                                if (event.target.checked) {
                                  setSelectedPermissionIds((prev) =>
                                    Array.from(
                                      new Set([...prev, permission.id]),
                                    ),
                                  );
                                } else {
                                  setSelectedPermissionIds((prev) =>
                                    prev.filter((id) => id !== permission.id),
                                  );
                                }
                              }}
                            >
                              <div>
                                <Text className="block !font-medium">
                                  {permission.name}
                                </Text>
                                <Text className="block !text-xs !text-slate-500">
                                  {permission.key}
                                </Text>
                              </div>
                            </Checkbox>
                          </Col>
                        ))}
                      </Row>
                    </div>
                  </div>
                );
              },
            )}
          </div>
        )}
      </Spin>
    </Modal>
  );
}
