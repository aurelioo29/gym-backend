import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Card, Typography } from "antd";

const { Title, Text } = Typography;

export default async function DashboardPage() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  return (
    <main className="min-h-screen bg-slate-100 p-6">
      <Card>
        <Title level={3}>Dashboard</Title>
        <Text>Selamat datang, {session.user.name}</Text>

        <pre className="mt-4 rounded bg-slate-900 p-4 text-white overflow-auto">
          {JSON.stringify(session.user, null, 2)}
        </pre>
      </Card>
    </main>
  );
}
