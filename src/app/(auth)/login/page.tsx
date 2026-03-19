import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { LoginForm } from "@/components/auth/login-form";

export default async function LoginPage() {
  // Redirect to dashboard if already logged in
  const session = await getSession();
  if (session) {
    redirect("/");
  }

  return <LoginForm />;
}
