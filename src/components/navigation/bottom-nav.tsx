"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function BottomNav({ patientId }: { patientId?: string }) {
  const pathname = usePathname();

  const homeHref = patientId ? `/patients/${patientId}` : "/patients";
  const careHref = patientId ? `/patients/${patientId}` : "/me";
  const medsHref = patientId ? `/patients/${patientId}/medicines` : "/me";
  const profileHref = patientId ? `/patients/${patientId}/people` : "/account";

  const isHome = pathname === homeHref || pathname === "/patients";
  const isCare = pathname === "/me";
  const isMeds = pathname.includes("/medicines");
  const isProfile = pathname.includes("/people") || pathname.includes("/edit") || pathname === "/account";

  const navItems = [
    {
      label: "Home",
      href: homeHref,
      active: isHome,
      icon: (
        <svg className="h-6 w-6" fill={isHome ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={isHome ? 0 : 2}>
          <path d="M3 9.75 12 3l9 6.75V21a.75.75 0 0 1-.75.75H15a.75.75 0 0 1-.75-.75v-4.5a.75.75 0 0 0-.75-.75h-3a.75.75 0 0 0-.75.75V21a.75.75 0 0 1-.75.75H3.75A.75.75 0 0 1 3 21V9.75Z" />
        </svg>
      ),
    },
    {
      label: "Care",
      href: careHref,
      active: isCare,
      icon: (
        <svg className="h-6 w-6" fill={isCare ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={isCare ? 0 : 2}>
          <path d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
        </svg>
      ),
    },
    {
      label: "Medications",
      href: medsHref,
      active: isMeds,
      icon: (
        <svg className="h-6 w-6" fill={isMeds ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={isMeds ? 0 : 2}>
          <path d="M19.5 12c0-1.232-.046-2.453-.138-3.662a4.006 4.006 0 0 0-3.7-3.7 48.678 48.678 0 0 0-7.324 0 4.006 4.006 0 0 0-3.7 3.7c-.017.22-.032.441-.046.662M19.5 12l-9.75 9.75a4.5 4.5 0 0 1-6.364-6.364L13.132 5.636M19.5 12a4.5 4.5 0 0 1-6.364 6.364L9.75 15" />
        </svg>
      ),
    },
    {
      label: "Profile",
      href: profileHref,
      active: isProfile,
      icon: (
        <svg className="h-6 w-6" fill={isProfile ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={isProfile ? 0 : 2}>
          <path d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
        </svg>
      ),
    },
  ];

  return (
    <nav aria-label="Bottom Navigation" className="fixed bottom-0 left-0 right-0 z-40 border-t border-line bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-lg items-center justify-around px-2 py-2">
        {navItems.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className={`flex flex-col items-center justify-center gap-1 rounded-xl px-4 py-1 text-xs font-medium transition-colors ${
              item.active
                ? "text-forest font-semibold"
                : "text-muted hover:text-ink"
            }`}
          >
            <div className={`flex items-center justify-center p-1 rounded-full ${item.active ? "bg-sage-soft text-forest" : ""}`}>
              {item.icon}
            </div>
            <span>{item.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
