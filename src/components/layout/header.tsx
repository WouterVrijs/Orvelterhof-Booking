"use client";

import { usePathname } from "next/navigation";

const PAGE_TITLES: Record<string, string> = {
  "/": "Dashboard",
  "/reservations": "Reserveringen",
  "/calendar": "Kalender",
  "/pricing": "Prijzen",
  "/settings": "Instellingen",
};

function getPageTitle(pathname: string): string {
  // Exact match first
  if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname];

  // Check prefix matches for nested routes
  for (const [path, title] of Object.entries(PAGE_TITLES)) {
    if (path !== "/" && pathname.startsWith(path)) return title;
  }

  return "Orvelterhof";
}

export function Header() {
  const pathname = usePathname();
  const title = getPageTitle(pathname);

  return (
    <header className="flex h-16 items-center border-b border-neutral-200 bg-white px-8">
      <h1 className="text-lg font-semibold text-neutral-900">{title}</h1>
    </header>
  );
}
