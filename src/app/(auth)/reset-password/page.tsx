import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";

interface PageProps {
  searchParams: Promise<{ token?: string }>;
}

export default async function ResetPasswordPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const token = params.token;

  // No token provided — show error
  if (!token) {
    return (
      <Card className="w-full">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-neutral-900 text-lg font-bold text-white">
            O
          </div>
          <CardTitle className="text-xl">Ongeldige link</CardTitle>
          <CardDescription>
            Er ontbreekt informatie in deze resetlink
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-700">
            Deze link is ongeldig. Vraag een nieuwe wachtwoord reset aan.
          </div>
          <Link href="/forgot-password">
            <Button variant="outline" className="w-full">
              Nieuwe reset aanvragen
            </Button>
          </Link>
          <div className="text-center">
            <Link
              href="/login"
              className="text-sm text-neutral-500 hover:text-neutral-700 hover:underline"
            >
              Terug naar inloggen
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  return <ResetPasswordForm token={token} />;
}
