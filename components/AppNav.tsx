"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: "🏠" },
  { href: "/tasks", label: "Tasks", icon: "📋" },
  { href: "/leaderboard", label: "Leaderboard", icon: "🏆" },
  { href: "/aquarium", label: "Aquarium", icon: "🐠" },
  { href: "/settings", label: "Settings", icon: "⚙️" },
];

export function AppNav() {
  const pathname = usePathname();
  const isCompletePage = pathname.startsWith("/complete");

  if (isCompletePage) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200 bg-white shadow-lg md:relative md:bottom-auto md:border-t-0 md:shadow-none">
      <div className="mx-auto flex h-14 max-w-4xl items-center justify-around md:justify-start md:gap-1 md:px-4">
        {navItems.map(({ href, label, icon }) => {
          const isActive = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center gap-0.5 px-3 py-2 text-xs font-medium md:flex-row md:rounded-lg md:px-4 md:py-2 md:text-sm ${
                isActive
                  ? "text-indigo-600 bg-indigo-50 md:bg-indigo-100"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              }`}
            >
              <span className="text-lg md:mr-2 md:text-base">{icon}</span>
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
