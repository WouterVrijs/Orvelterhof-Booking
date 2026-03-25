"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CalendarCheck,
  Calendar,
  Euro,
  Settings,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { LogoutButton } from "@/components/auth/logout-button";
import type { UserRole } from "@/lib/auth";

const navItems = [
  { title: "Dashboard", href: "/", icon: LayoutDashboard },
  { title: "Reserveringen", href: "/reservations", icon: CalendarCheck },
  { title: "Kalender", href: "/calendar", icon: Calendar },
  { title: "Prijzen", href: "/pricing", icon: Euro },
  { title: "Instellingen", href: "/settings", icon: Settings },
];

interface SidebarProps {
  userRole: UserRole;
  accommodationName?: string;
}

export function Sidebar({ userRole, accommodationName = "Orvelterhof" }: SidebarProps) {
  const pathname = usePathname();

  const items = userRole === "ADMIN"
    ? [...navItems, { title: "Gebruikers", href: "/settings/users", icon: Users }]
    : navItems;

  return (
    <aside className="flex h-screen w-64 flex-col border-r border-neutral-200 bg-white">
      {/* Logo */}
      <div className="flex h-16 items-center border-b border-neutral-200 px-6">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-neutral-900 text-sm font-bold text-white">
            {accommodationName.charAt(0).toUpperCase()}
          </div>
          <span className="text-lg font-semibold text-neutral-900 truncate">
            {accommodationName}
          </span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {items.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-neutral-100 text-neutral-900"
                  : "text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900"
              )}
            >
              <Icon className="h-4 w-4" />
              {item.title}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="border-t border-neutral-200 p-3">
        <LogoutButton />
      </div>
    </aside>
  );
}
