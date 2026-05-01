"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button, Card, Form, Input, Typography, Alert } from "antd";

const { Title, Text } = Typography;

type LoginFormValues = {
  identifier: string;
  password: string;
};

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(values: LoginFormValues) {
    setLoading(true);
    setErrorMessage(null);

    const result = await signIn("credentials", {
      identifier: values.identifier,
      password: values.password,
      redirect: false,
      callbackUrl,
    });

    setLoading(false);

    if (result?.error) {
      setErrorMessage(
        result.error === "CredentialsSignin"
          ? "Email/phone atau password salah."
          : result.error,
      );
      return;
    }

    router.push(callbackUrl);
    router.refresh();
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-100 px-4">
      <Card className="w-full max-w-md shadow-sm">
        <div className="mb-6">
          <Title level={3} className="!mb-1">
            Admin Login
          </Title>
          <Text type="secondary">Masuk pakai email atau nomor HP admin.</Text>
        </div>

        {errorMessage && (
          <Alert
            className="mb-4"
            type="error"
            showIcon
            message={errorMessage}
          />
        )}

        <Form layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            label="Email / Phone"
            name="identifier"
            rules={[
              {
                required: true,
                message: "Email atau phone wajib diisi",
              },
            ]}
          >
            <Input
              size="large"
              placeholder="superadmin@gym.com / 081234567890"
              autoComplete="username"
            />
          </Form.Item>

          <Form.Item
            label="Password"
            name="password"
            rules={[
              {
                required: true,
                message: "Password wajib diisi",
              },
            ]}
          >
            <Input.Password
              size="large"
              placeholder="Masukkan password"
              autoComplete="current-password"
            />
          </Form.Item>

          <Button
            type="primary"
            htmlType="submit"
            size="large"
            block
            loading={loading}
          >
            Login
          </Button>
        </Form>
      </Card>
    </main>
  );
}
