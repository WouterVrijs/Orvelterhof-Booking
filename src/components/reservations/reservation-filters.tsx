"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback, useTransition } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { RESERVATION_STATUS_CONFIG } from "@/lib/types";

export function ReservationFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const updateParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      startTransition(() => {
        router.replace(`${pathname}?${params.toString()}`);
      });
    },
    [router, pathname, searchParams, startTransition]
  );

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Search */}
      <div className="relative flex-1 min-w-[200px] max-w-sm">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-neutral-400" />
        <Input
          placeholder="Zoek op naam, e-mail of nummer..."
          defaultValue={searchParams.get("search") ?? ""}
          onChange={(e) => updateParam("search", e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Status filter */}
      <Select
        defaultValue={searchParams.get("status") ?? ""}
        onChange={(e) => updateParam("status", e.target.value)}
      >
        <option value="">Alle statussen</option>
        {Object.entries(RESERVATION_STATUS_CONFIG).map(([key, config]) => (
          <option key={key} value={key}>
            {config.label}
          </option>
        ))}
      </Select>

      {/* Sort */}
      <Select
        defaultValue={searchParams.get("sortBy") ?? "createdAt"}
        onChange={(e) => updateParam("sortBy", e.target.value)}
      >
        <option value="createdAt">Aanmaakdatum</option>
        <option value="arrivalDate">Aankomstdatum</option>
        <option value="departureDate">Vertrekdatum</option>
      </Select>

      <Select
        defaultValue={searchParams.get("sortOrder") ?? "desc"}
        onChange={(e) => updateParam("sortOrder", e.target.value)}
      >
        <option value="desc">Nieuwste eerst</option>
        <option value="asc">Oudste eerst</option>
      </Select>

      {isPending && (
        <span className="text-xs text-neutral-400">Laden...</span>
      )}
    </div>
  );
}
