"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, List, MoreHorizontal, Plus, Users } from "lucide-react";
import { cn } from "@/lib/cn";

const tabs = [
  { href: "/home", label: "בית", Icon: Home },
  { href: "/transactions", label: "תנועות", Icon: List },
  { href: "/add", label: "הוספה", Icon: Plus, primary: true },
  { href: "/shared", label: "משותף", Icon: Users },
  { href: "/more", label: "עוד", Icon: MoreHorizontal },
];

export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="ניווט ראשי"
      className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur"
    >
      <ul className="mx-auto grid max-w-md grid-cols-5 items-center px-2">
        {tabs.map(({ href, label, Icon, primary }) => {
          const active = pathname.startsWith(href);
          return (
            <li key={href} className="flex justify-center">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                aria-label={label}
                className={cn(
                  "flex flex-col items-center justify-center gap-0.5 text-xs",
                  primary
                    ? "-mt-5 size-14 rounded-full bg-primary text-primary-fg shadow-card"
                    : cn("min-w-14 py-2", active ? "text-primary font-semibold" : "text-muted"),
                )}
              >
                <Icon size={primary ? 28 : 22} aria-hidden />
                {!primary && <span>{label}</span>}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
