import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getSession } from "@/lib/auth";
import { getUsers } from "@/lib/actions/user-actions";
import { PageHeader } from "@/components/shared/page-header";
import { UserList } from "@/components/settings/user-list";

export default async function UsersPage() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    redirect("/");
  }

  const users = await getUsers();

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/settings"
          className="mb-4 inline-flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Terug naar instellingen
        </Link>
        <PageHeader
          title="Gebruikersbeheer"
          description="Beheer wie toegang heeft tot de applicatie"
        />
      </div>

      <UserList users={users} currentUserId={session.id} />
    </div>
  );
}
