"use client";

import { useState, useTransition } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UserPlus, Shield, User, Ban, CheckCircle2, KeyRound } from "lucide-react";
import { UserForm } from "@/components/settings/user-form";
import {
  deactivateUserAction,
  activateUserAction,
  resetUserPasswordAction,
} from "@/lib/actions/user-actions";

interface UserData {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: Date;
}

interface UserListProps {
  users: UserData[];
  currentUserId: string;
}

export function UserList({ users, currentUserId }: UserListProps) {
  const [showForm, setShowForm] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [resetUserId, setResetUserId] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  function handleDeactivate(userId: string) {
    if (!confirm("Weet je zeker dat je dit account wilt deactiveren?")) return;
    startTransition(async () => {
      const result = await deactivateUserAction(userId);
      if (result?.message) setActionMessage(result.message);
    });
  }

  function handleActivate(userId: string) {
    startTransition(async () => {
      await activateUserAction(userId);
    });
  }

  function handleResetPassword(userId: string) {
    if (!newPassword || newPassword.length < 8) {
      setActionMessage("Wachtwoord moet minimaal 8 tekens bevatten");
      return;
    }
    startTransition(async () => {
      const result = await resetUserPasswordAction(userId, newPassword);
      if (result?.success) {
        setResetUserId(null);
        setNewPassword("");
        setActionMessage("Wachtwoord is gereset");
        setTimeout(() => setActionMessage(null), 3000);
      } else if (result?.message) {
        setActionMessage(result.message);
      }
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Gebruikers</h2>
        <Button onClick={() => setShowForm(!showForm)}>
          <UserPlus className="h-4 w-4" />
          Toevoegen
        </Button>
      </div>

      {actionMessage && (
        <div className="rounded-md bg-blue-50 px-3 py-2 text-sm text-blue-700">
          {actionMessage}
        </div>
      )}

      {showForm && (
        <Card>
          <CardContent className="p-6">
            <UserForm onSuccess={() => setShowForm(false)} />
          </CardContent>
        </Card>
      )}

      <div className="space-y-2">
        {users.map((user) => (
          <Card key={user.id} className={!user.isActive ? "opacity-60" : ""}>
            <CardContent className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-neutral-100">
                  {user.role === "ADMIN" ? (
                    <Shield className="h-4 w-4 text-neutral-600" />
                  ) : (
                    <User className="h-4 w-4 text-neutral-600" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">{user.name}</p>
                    <Badge variant={user.role === "ADMIN" ? "info" : "default"}>
                      {user.role === "ADMIN" ? "Admin" : "Gebruiker"}
                    </Badge>
                    {!user.isActive && (
                      <Badge variant="danger">Inactief</Badge>
                    )}
                  </div>
                  <p className="text-xs text-neutral-500">{user.email}</p>
                </div>
              </div>

              {user.id !== currentUserId && (
                <div className="flex items-center gap-2">
                  {/* Reset password */}
                  {resetUserId === user.id ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="password"
                        placeholder="Nieuw wachtwoord"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="h-8 w-40 rounded border border-neutral-300 px-2 text-sm"
                      />
                      <Button
                        variant="outline"
                        className="h-8 text-xs"
                        onClick={() => handleResetPassword(user.id)}
                        disabled={isPending}
                      >
                        Opslaan
                      </Button>
                      <Button
                        variant="outline"
                        className="h-8 text-xs"
                        onClick={() => {
                          setResetUserId(null);
                          setNewPassword("");
                        }}
                      >
                        Annuleren
                      </Button>
                    </div>
                  ) : (
                    <Button
                      variant="outline"
                      className="h-8 text-xs"
                      onClick={() => setResetUserId(user.id)}
                    >
                      <KeyRound className="h-3 w-3" />
                      Wachtwoord
                    </Button>
                  )}

                  {/* Activate / Deactivate */}
                  {user.isActive ? (
                    <Button
                      variant="outline"
                      className="h-8 text-xs text-red-600 hover:text-red-700"
                      onClick={() => handleDeactivate(user.id)}
                      disabled={isPending}
                    >
                      <Ban className="h-3 w-3" />
                      Deactiveren
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      className="h-8 text-xs text-green-600 hover:text-green-700"
                      onClick={() => handleActivate(user.id)}
                      disabled={isPending}
                    >
                      <CheckCircle2 className="h-3 w-3" />
                      Activeren
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
