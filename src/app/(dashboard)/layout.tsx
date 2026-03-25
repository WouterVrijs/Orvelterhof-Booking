import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { accommodationSettings } from "@/lib/db/schema";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  const [settings] = await db.select().from(accommodationSettings).limit(1);
  const accommodationName = settings?.accommodationName || "Orvelterhof";

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar userRole={session.role} accommodationName={accommodationName} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-8">{children}</main>
      </div>
    </div>
  );
}
