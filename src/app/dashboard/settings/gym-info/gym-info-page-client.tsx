"use client";

import {
  Button,
  Card,
  Col,
  Form,
  Image,
  Input,
  Row,
  Space,
  Spin,
  Switch,
  TimePicker,
  Typography,
  Upload,
  message,
} from "antd";
import type { UploadRequestOption } from "rc-upload/lib/interface";
import {
  DeleteOutlined,
  EnvironmentOutlined,
  ReloadOutlined,
  SaveOutlined,
  UploadOutlined,
} from "@ant-design/icons";
import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import dayjs, { type Dayjs } from "dayjs";
import { apiGet, apiPatch } from "@/lib/client-api";

const LocationPicker = dynamic(() => import("./location-picker"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[320px] items-center justify-center rounded-2xl border border-slate-200 bg-slate-50">
      <Spin />
    </div>
  ),
});

const { Title, Text } = Typography;
const { TextArea } = Input;
const { RangePicker } = TimePicker;

type GymInfo = {
  id: string;
  name: string;
  tagline: string | null;
  description: string | null;
  email: string | null;
  phone: string | null;
  whatsapp: string | null;
  address: string | null;
  city: string | null;
  province: string | null;
  postalCode: string | null;
  latitude: string | null;
  longitude: string | null;
  logoUrl: string | null;
  faviconUrl: string | null;
  openingHours: Record<string, any> | null;
  instagramUrl: string | null;
  facebookUrl: string | null;
  tiktokUrl: string | null;
  youtubeUrl: string | null;
};

type GymInfoResponse = {
  success: boolean;
  message: string;
  data: GymInfo | null;
};

type UploadResponse = {
  success: boolean;
  message: string;
  data: {
    url: string;
    filename: string;
    originalName: string;
    mimeType: string;
    size: number;
  };
};

type OpeningHourRange = [Dayjs, Dayjs] | null;

type GymInfoFormValues = {
  name: string;
  tagline?: string | null;
  description?: string | null;
  email?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
  address?: string | null;
  city?: string | null;
  province?: string | null;
  postalCode?: string | null;
  latitude?: string | null;
  longitude?: string | null;
  logoUrl?: string | null;
  faviconUrl?: string | null;
  instagramUrl?: string | null;
  facebookUrl?: string | null;
  tiktokUrl?: string | null;
  youtubeUrl?: string | null;

  mondayRange?: OpeningHourRange;
  tuesdayRange?: OpeningHourRange;
  wednesdayRange?: OpeningHourRange;
  thursdayRange?: OpeningHourRange;
  fridayRange?: OpeningHourRange;
  saturdayRange?: OpeningHourRange;
  sundayRange?: OpeningHourRange;

  mondayClosed?: boolean;
  tuesdayClosed?: boolean;
  wednesdayClosed?: boolean;
  thursdayClosed?: boolean;
  fridayClosed?: boolean;
  saturdayClosed?: boolean;
  sundayClosed?: boolean;
};

const days = [
  { key: "monday", label: "Monday" },
  { key: "tuesday", label: "Tuesday" },
  { key: "wednesday", label: "Wednesday" },
  { key: "thursday", label: "Thursday" },
  { key: "friday", label: "Friday" },
  { key: "saturday", label: "Saturday" },
  { key: "sunday", label: "Sunday" },
] as const;

function normalizeNullable(value?: string | null) {
  if (value === undefined) return undefined;
  if (value === "") return null;
  return value;
}

function parseTime(value?: string | null) {
  if (!value) return null;

  const parsed = dayjs(value, "HH:mm");

  if (!parsed.isValid()) {
    return null;
  }

  return parsed;
}

function getOpeningHourRange(
  openingHours: Record<string, any> | null,
  day: string,
) {
  const open = openingHours?.[day]?.open;
  const close = openingHours?.[day]?.close;

  const openTime = parseTime(open);
  const closeTime = parseTime(close);

  if (!openTime || !closeTime) {
    return null;
  }

  return [openTime, closeTime] as [Dayjs, Dayjs];
}

function isDayClosed(openingHours: Record<string, any> | null, day: string) {
  const open = openingHours?.[day]?.open;
  const close = openingHours?.[day]?.close;

  return !open || !close;
}

function getRangeValue(
  values: GymInfoFormValues,
  dayKey: (typeof days)[number]["key"],
) {
  return values[
    `${dayKey}Range` as keyof GymInfoFormValues
  ] as OpeningHourRange;
}

function isClosedValue(
  values: GymInfoFormValues,
  dayKey: (typeof days)[number]["key"],
) {
  return Boolean(values[`${dayKey}Closed` as keyof GymInfoFormValues]);
}

function buildOpeningHours(values: GymInfoFormValues) {
  return days.reduce<
    Record<string, { open: string | null; close: string | null }>
  >((acc, day) => {
    const closed = isClosedValue(values, day.key);
    const range = getRangeValue(values, day.key);

    acc[day.key] = {
      open: !closed && range?.[0] ? range[0].format("HH:mm") : null,
      close: !closed && range?.[1] ? range[1].format("HH:mm") : null,
    };

    return acc;
  }, {});
}

function normalizeCoordinateInput(value?: string | null) {
  if (value === undefined || value === null || value === "") return null;

  const numberValue = Number(value);

  if (Number.isNaN(numberValue)) return null;

  return numberValue.toFixed(7);
}

function isValidLatitude(value?: string | null) {
  if (!value) return true;

  const numberValue = Number(value);

  return !Number.isNaN(numberValue) && numberValue >= -90 && numberValue <= 90;
}

function isValidLongitude(value?: string | null) {
  if (!value) return true;

  const numberValue = Number(value);

  return (
    !Number.isNaN(numberValue) && numberValue >= -180 && numberValue <= 180
  );
}

async function uploadGymAsset(file: File) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch("/api/admin/gym-info/upload", {
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

export default function GymInfoPageClient() {
  const [form] = Form.useForm<GymInfoFormValues>();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const logoUrl = Form.useWatch("logoUrl", form);
  const faviconUrl = Form.useWatch("faviconUrl", form);
  const latitude = Form.useWatch("latitude", form);
  const longitude = Form.useWatch("longitude", form);

  const googleMapsPreviewUrl = useMemo(() => {
    if (!latitude || !longitude) {
      return null;
    }

    return `https://maps.google.com/maps?q=${latitude},${longitude}&z=16&output=embed`;
  }, [latitude, longitude]);

  async function fetchGymInfo() {
    try {
      setLoading(true);

      const response = await apiGet<GymInfoResponse>("/api/admin/gym-info");
      const gymInfo = response.data;

      if (!gymInfo) {
        form.setFieldsValue({
          name: "Gym Name",
          mondayRange: [dayjs("06:00", "HH:mm"), dayjs("22:00", "HH:mm")],
          tuesdayRange: [dayjs("06:00", "HH:mm"), dayjs("22:00", "HH:mm")],
          wednesdayRange: [dayjs("06:00", "HH:mm"), dayjs("22:00", "HH:mm")],
          thursdayRange: [dayjs("06:00", "HH:mm"), dayjs("22:00", "HH:mm")],
          fridayRange: [dayjs("06:00", "HH:mm"), dayjs("22:00", "HH:mm")],
          saturdayRange: [dayjs("08:00", "HH:mm"), dayjs("20:00", "HH:mm")],
          sundayClosed: true,
        });

        return;
      }

      form.setFieldsValue({
        name: gymInfo.name,
        tagline: gymInfo.tagline,
        description: gymInfo.description,
        email: gymInfo.email,
        phone: gymInfo.phone,
        whatsapp: gymInfo.whatsapp,
        address: gymInfo.address,
        city: gymInfo.city,
        province: gymInfo.province,
        postalCode: gymInfo.postalCode,
        latitude: gymInfo.latitude,
        longitude: gymInfo.longitude,
        logoUrl: gymInfo.logoUrl,
        faviconUrl: gymInfo.faviconUrl,
        instagramUrl: gymInfo.instagramUrl,
        facebookUrl: gymInfo.facebookUrl,
        tiktokUrl: gymInfo.tiktokUrl,
        youtubeUrl: gymInfo.youtubeUrl,

        mondayRange: getOpeningHourRange(gymInfo.openingHours, "monday"),
        tuesdayRange: getOpeningHourRange(gymInfo.openingHours, "tuesday"),
        wednesdayRange: getOpeningHourRange(gymInfo.openingHours, "wednesday"),
        thursdayRange: getOpeningHourRange(gymInfo.openingHours, "thursday"),
        fridayRange: getOpeningHourRange(gymInfo.openingHours, "friday"),
        saturdayRange: getOpeningHourRange(gymInfo.openingHours, "saturday"),
        sundayRange: getOpeningHourRange(gymInfo.openingHours, "sunday"),

        mondayClosed: isDayClosed(gymInfo.openingHours, "monday"),
        tuesdayClosed: isDayClosed(gymInfo.openingHours, "tuesday"),
        wednesdayClosed: isDayClosed(gymInfo.openingHours, "wednesday"),
        thursdayClosed: isDayClosed(gymInfo.openingHours, "thursday"),
        fridayClosed: isDayClosed(gymInfo.openingHours, "friday"),
        saturdayClosed: isDayClosed(gymInfo.openingHours, "saturday"),
        sundayClosed: isDayClosed(gymInfo.openingHours, "sunday"),
      });
    } catch (error) {
      console.error("Fetch gym info error:", error);
      message.error("Failed to fetch gym info");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchGymInfo();
  }, []);

  async function handleSubmit(values: GymInfoFormValues) {
    try {
      setSaving(true);

      if (!isValidLatitude(values.latitude)) {
        message.error("Latitude harus berada di antara -90 sampai 90");
        return;
      }

      if (!isValidLongitude(values.longitude)) {
        message.error("Longitude harus berada di antara -180 sampai 180");
        return;
      }

      const payload = {
        name: values.name,
        tagline: normalizeNullable(values.tagline),
        description: normalizeNullable(values.description),
        email: normalizeNullable(values.email),
        phone: normalizeNullable(values.phone),
        whatsapp: normalizeNullable(values.whatsapp),
        address: normalizeNullable(values.address),
        city: normalizeNullable(values.city),
        province: normalizeNullable(values.province),
        postalCode: normalizeNullable(values.postalCode),
        latitude: normalizeCoordinateInput(values.latitude),
        longitude: normalizeCoordinateInput(values.longitude),
        logoUrl: normalizeNullable(values.logoUrl),
        faviconUrl: normalizeNullable(values.faviconUrl),
        openingHours: buildOpeningHours(values),
        instagramUrl: normalizeNullable(values.instagramUrl),
        facebookUrl: normalizeNullable(values.facebookUrl),
        tiktokUrl: normalizeNullable(values.tiktokUrl),
        youtubeUrl: normalizeNullable(values.youtubeUrl),
      };

      await apiPatch("/api/admin/gym-info", payload);

      message.success("Gym info updated successfully");
      await fetchGymInfo();
    } catch (error) {
      console.error("Update gym info error:", error);
      message.error("Failed to update gym info");
    } finally {
      setSaving(false);
    }
  }

  function createUploadHandler(fieldName: "logoUrl" | "faviconUrl") {
    return async (options: UploadRequestOption) => {
      const { file, onSuccess, onError } = options;

      try {
        const uploadedUrl = await uploadGymAsset(file as File);
        form.setFieldValue(fieldName, uploadedUrl);
        message.success("Image uploaded successfully");
        onSuccess?.({ url: uploadedUrl });
      } catch (error) {
        console.error("Upload error:", error);
        message.error(error instanceof Error ? error.message : "Upload failed");
        onError?.(error as Error);
      }
    };
  }

  function renderAssetBox(
    fieldName: "logoUrl" | "faviconUrl",
    label: string,
    value?: string | null,
    previewSize = 84,
    accept = "image/png,image/jpeg,image/webp,image/svg+xml",
  ) {
    return (
      <div className="rounded-xl border border-slate-200 p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
          <div
            className="flex shrink-0 items-center justify-center overflow-hidden rounded-xl border border-dashed border-slate-300 bg-slate-50"
            style={{ width: previewSize, height: previewSize }}
          >
            {value ? (
              <Image
                src={value}
                alt={label}
                width={previewSize}
                height={previewSize}
                className="object-contain"
                preview
              />
            ) : (
              <Text className="!text-xs !text-slate-400">No image</Text>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <Text className="block !font-medium !text-slate-800">{label}</Text>
            <Text className="mb-3 block !text-xs !text-slate-500">
              Upload JPG, PNG, WEBP, SVG or ICO depending on asset type.
            </Text>

            <Space wrap>
              <Upload
                showUploadList={false}
                customRequest={createUploadHandler(fieldName)}
                accept={accept}
              >
                <Button size="small" icon={<UploadOutlined />}>
                  Upload
                </Button>
              </Upload>

              {value ? (
                <Button
                  size="small"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => form.setFieldValue(fieldName, null)}
                >
                  Remove
                </Button>
              ) : null}
            </Space>
          </div>
        </div>

        <Form.Item name={fieldName} hidden>
          <Input />
        </Form.Item>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <Title level={3} className="!mb-1">
            Gym Info
          </Title>
          <Text type="secondary">
            Manage company profile, location, assets, and business hours.
          </Text>
        </div>

        <Space>
          <Button icon={<ReloadOutlined />} onClick={fetchGymInfo}>
            Refresh
          </Button>

          <Button
            type="primary"
            icon={<SaveOutlined />}
            loading={saving}
            onClick={() => form.submit()}
          >
            Save
          </Button>
        </Space>
      </div>

      <Spin spinning={loading}>
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Row gutter={[20, 20]}>
            <Col xs={24} xl={13}>
              <Card size="small" title="Company Profile">
                <Row gutter={[16, 0]}>
                  <Col xs={24} md={12}>
                    <Form.Item
                      label="Gym Name"
                      name="name"
                      rules={[
                        {
                          required: true,
                          message: "Gym name is required",
                        },
                      ]}
                    >
                      <Input placeholder="Aurelio Gym" />
                    </Form.Item>
                  </Col>

                  <Col xs={24} md={12}>
                    <Form.Item label="Tagline" name="tagline">
                      <Input placeholder="Train stronger. Live better." />
                    </Form.Item>
                  </Col>

                  <Col xs={24}>
                    <Form.Item label="Description" name="description">
                      <TextArea rows={4} placeholder="Describe your gym..." />
                    </Form.Item>
                  </Col>

                  <Col xs={24} md={8}>
                    <Form.Item label="Email" name="email">
                      <Input placeholder="info@gym.com" />
                    </Form.Item>
                  </Col>

                  <Col xs={24} md={8}>
                    <Form.Item label="Phone" name="phone">
                      <Input placeholder="081234567890" />
                    </Form.Item>
                  </Col>

                  <Col xs={24} md={8}>
                    <Form.Item label="WhatsApp" name="whatsapp">
                      <Input placeholder="081234567890" />
                    </Form.Item>
                  </Col>

                  <Col xs={24} md={12}>
                    {renderAssetBox(
                      "logoUrl",
                      "Gym Logo",
                      logoUrl,
                      88,
                      "image/png,image/jpeg,image/webp,image/svg+xml",
                    )}
                  </Col>

                  <Col xs={24} md={12}>
                    {renderAssetBox(
                      "faviconUrl",
                      "Favicon",
                      faviconUrl,
                      64,
                      "image/png,image/jpeg,image/webp,image/svg+xml,image/x-icon",
                    )}
                  </Col>
                </Row>
              </Card>
            </Col>

            <Col xs={24} xl={11}>
              <div className="flex flex-col gap-5">
                <Card size="small" title="Social Media">
                  <Row gutter={[16, 0]}>
                    <Col xs={24} md={12}>
                      <Form.Item label="Instagram" name="instagramUrl">
                        <Input placeholder="https://instagram.com/yourgym" />
                      </Form.Item>
                    </Col>

                    <Col xs={24} md={12}>
                      <Form.Item label="Facebook" name="facebookUrl">
                        <Input placeholder="https://facebook.com/yourgym" />
                      </Form.Item>
                    </Col>

                    <Col xs={24} md={12}>
                      <Form.Item label="TikTok" name="tiktokUrl">
                        <Input placeholder="https://tiktok.com/@yourgym" />
                      </Form.Item>
                    </Col>

                    <Col xs={24} md={12}>
                      <Form.Item label="YouTube" name="youtubeUrl">
                        <Input placeholder="https://youtube.com/@yourgym" />
                      </Form.Item>
                    </Col>
                  </Row>
                </Card>

                <Card size="small" title="Opening Hours">
                  <div className="flex flex-col divide-y divide-slate-100">
                    {days.map((day) => (
                      <div
                        key={day.key}
                        className="grid grid-cols-1 gap-3 py-3 md:grid-cols-[110px_90px_1fr]"
                      >
                        <div className="flex items-center">
                          <Text className="!font-medium !text-slate-800">
                            {day.label}
                          </Text>
                        </div>

                        <Form.Item
                          name={`${day.key}Closed`}
                          valuePropName="checked"
                          className="!mb-0"
                        >
                          <Switch
                            size="small"
                            checkedChildren="Closed"
                            unCheckedChildren="Open"
                          />
                        </Form.Item>

                        <Form.Item
                          noStyle
                          shouldUpdate={(prevValues, currentValues) =>
                            prevValues[`${day.key}Closed`] !==
                            currentValues[`${day.key}Closed`]
                          }
                        >
                          {({ getFieldValue }) => {
                            const closed = getFieldValue(`${day.key}Closed`);

                            return (
                              <Form.Item
                                name={`${day.key}Range`}
                                className="!mb-0"
                                rules={[
                                  {
                                    validator(_, value) {
                                      if (closed || value?.length === 2) {
                                        return Promise.resolve();
                                      }

                                      return Promise.reject(
                                        new Error(
                                          "Please select open and close time",
                                        ),
                                      );
                                    },
                                  },
                                ]}
                              >
                                <RangePicker
                                  className="w-full"
                                  format="HH:mm"
                                  minuteStep={5}
                                  disabled={closed}
                                  placeholder={["Open", "Close"]}
                                />
                              </Form.Item>
                            );
                          }}
                        </Form.Item>
                      </div>
                    ))}
                  </div>

                  <div className="mt-3 rounded-xl bg-slate-50 px-3 py-2">
                    <Text className="!text-xs !text-slate-500">
                      Click the time range to set open and close hours. Turn on
                      Closed when the gym is not operating that day.
                    </Text>
                  </div>
                </Card>
              </div>
            </Col>

            <Col xs={24}>
              <Card
                size="small"
                title={
                  <Space>
                    <EnvironmentOutlined />
                    Location
                  </Space>
                }
              >
                <Row gutter={[20, 20]}>
                  <Col xs={24} lg={10}>
                    <Row gutter={[16, 0]}>
                      <Col xs={24}>
                        <Form.Item label="Address" name="address">
                          <TextArea rows={3} placeholder="Gym address..." />
                        </Form.Item>
                      </Col>

                      <Col xs={24} md={12}>
                        <Form.Item label="City" name="city">
                          <Input placeholder="Medan" />
                        </Form.Item>
                      </Col>

                      <Col xs={24} md={12}>
                        <Form.Item label="Province" name="province">
                          <Input placeholder="Sumatera Utara" />
                        </Form.Item>
                      </Col>

                      <Col xs={24}>
                        <Form.Item label="Postal Code" name="postalCode">
                          <Input placeholder="20111" />
                        </Form.Item>
                      </Col>

                      <Col xs={24} md={12}>
                        <Form.Item
                          label="Latitude"
                          name="latitude"
                          rules={[
                            {
                              validator(_, value) {
                                if (isValidLatitude(value))
                                  return Promise.resolve();

                                return Promise.reject(
                                  new Error(
                                    "Latitude harus berada di antara -90 sampai 90",
                                  ),
                                );
                              },
                            },
                          ]}
                        >
                          <Input placeholder="-6.2000000" />
                        </Form.Item>
                      </Col>

                      <Col xs={24} md={12}>
                        <Form.Item
                          label="Longitude"
                          name="longitude"
                          rules={[
                            {
                              validator(_, value) {
                                if (isValidLongitude(value))
                                  return Promise.resolve();

                                return Promise.reject(
                                  new Error(
                                    "Longitude harus berada di antara -180 sampai 180",
                                  ),
                                );
                              },
                            },
                          ]}
                        >
                          <Input placeholder="106.8166667" />
                        </Form.Item>
                      </Col>
                    </Row>

                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                      <Text className="block !text-xs !font-medium !text-slate-700">
                        Selected Coordinate
                      </Text>

                      <Text className="block !text-xs !text-slate-500">
                        {latitude && longitude
                          ? `${latitude}, ${longitude}`
                          : "No coordinate selected yet. Click the map to set location."}
                      </Text>
                    </div>
                  </Col>

                  <Col xs={24} lg={14}>
                    <div className="flex flex-col gap-4">
                      <div>
                        <Text className="mb-2 block !text-sm !font-medium !text-slate-800">
                          Pick Location
                        </Text>

                        <LocationPicker
                          latitude={latitude}
                          longitude={longitude}
                          onChange={(value) => {
                            form.setFieldsValue({
                              latitude: value.latitude,
                              longitude: value.longitude,
                            });
                          }}
                        />
                      </div>

                      <div>
                        <Text className="mb-2 block !text-sm !font-medium !text-slate-800">
                          Google Maps Preview
                        </Text>

                        {googleMapsPreviewUrl ? (
                          <iframe
                            title="Google Maps Preview"
                            src={googleMapsPreviewUrl}
                            className="h-[260px] w-full rounded-2xl border border-slate-200"
                            loading="lazy"
                          />
                        ) : (
                          <div className="flex h-[260px] items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50">
                            <Text className="!text-sm !text-slate-400">
                              Add latitude and longitude to preview the
                              location.
                            </Text>
                          </div>
                        )}
                      </div>
                    </div>
                  </Col>
                </Row>
              </Card>
            </Col>
          </Row>
        </Form>
      </Spin>
    </div>
  );
}
