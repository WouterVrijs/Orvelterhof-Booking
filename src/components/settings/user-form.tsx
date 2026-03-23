"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import {
  createUserAction,
  type UserActionState,
} from "@/lib/actions/user-actions";

interface UserFormProps {
  onSuccess: () => void;
}

export function UserForm({ onSuccess }: UserFormProps) {
  const [state, formAction, isPending] = useActionState<
    UserActionState,
    FormData
  >(async (prevState, formData) => {
    const result = await createUserAction(prevState, formData);
    if (result?.success) {
      onSuccess();
    }
    return result;
  }, null);

  return (
    <form action={formAction} className="space-y-4">
      <h3 className="text-sm font-semibold">Nieuwe gebruiker</h3>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="name">Naam</Label>
          <Input id="name" name="name" required />
          {state?.errors?.name && (
            <p className="text-sm text-red-600">{state.errors.name[0]}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">E-mailadres</Label>
          <Input id="email" name="email" type="email" required />
          {state?.errors?.email && (
            <p className="text-sm text-red-600">{state.errors.email[0]}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="password">Wachtwoord</Label>
          <Input
            id="password"
            name="password"
            type="password"
            required
            minLength={8}
            placeholder="Minimaal 8 tekens"
          />
          {state?.errors?.password && (
            <p className="text-sm text-red-600">{state.errors.password[0]}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="role">Rol</Label>
          <Select id="role" name="role" defaultValue="USER">
            <option value="USER">Gebruiker</option>
            <option value="ADMIN">Admin</option>
          </Select>
        </div>
      </div>

      {state?.message && (
        <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.message}
        </div>
      )}

      <div className="flex justify-end">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Aanmaken..." : "Gebruiker aanmaken"}
        </Button>
      </div>
    </form>
  );
}
