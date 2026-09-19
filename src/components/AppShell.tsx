"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  CalendarDays,
  CircleUserRound,
  Dumbbell,
  Flag,
  Heart,
  Home,
  Menu,
  X,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";

const nav = [
  { to: "/dashboard", label: "Home", icon: Home },
  { to: "/workouts", label: "Workouts", icon: Dumbbell },
  { to: "/progress", label: "Progress", icon: BarChart3 },
  { to: "/history", label: "History", icon: CalendarDays },
  { to: "/goals", label: "Goals", icon: Flag },
  { to: "/profile", label: "Profile", icon: CircleUserRound },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const isActive = (to: string) =>
    to === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(to);

  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 border-r border-line bg-surface/90 px-5 py-8 backdrop-blur md:block">
        <Link href="/dashboard" className="flex items-center gap-3 px-2 text-foreground">
          <span className="grid size-9 place-items-center rounded-lg bg-primary text-primary-foreground">
            <Heart className="size-4" fill="currentColor" />
          </span>
          <span className="text-lg font-semibold">Fitness Tracker</span>
        </Link>
        <nav className="mt-14 space-y-1.5" aria-label="Główna nawigacja">
          {nav.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              href={to}
              className={cn(
                "flex h-11 items-center gap-3 rounded-lg px-3 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground",
                isActive(to) && "bg-secondary font-medium text-secondary-foreground"
              )}
            >
              <Icon className="size-[18px]" />
              {label}
            </Link>
          ))}
        </nav>
      </aside>

      <header className="sticky top-0 z-30 grid h-16 grid-cols-[minmax(0,1fr)_auto] items-center border-b border-line bg-background/90 px-5 backdrop-blur md:hidden">
        <Link href="/dashboard" className="flex min-w-0 items-center gap-2 font-semibold">
          <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground">
            <Heart className="size-4" fill="currentColor" />
          </span>
          Fitness Tracker
        </Link>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setOpen((value) => !value)}
          aria-label={open ? "Zamknij menu" : "Otwórz menu"}
        >
          {open ? <X /> : <Menu />}
        </Button>
      </header>

      {open && (
        <div className="fixed inset-x-0 top-16 z-40 border-b border-line bg-surface p-4 md:hidden">
          <nav className="grid grid-cols-2 gap-2">
            {nav.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                href={to}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex h-12 items-center gap-3 rounded-lg px-3 text-sm text-muted-foreground",
                  isActive(to) && "bg-secondary font-medium text-secondary-foreground"
                )}
              >
                <Icon className="size-4" />
                {label}
              </Link>
            ))}
          </nav>
        </div>
      )}

      <main className="min-w-0 pb-24 md:ml-60 md:pb-0">{children}</main>

      <nav
        className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-line bg-surface/95 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur md:hidden"
        aria-label="Dolna nawigacja"
      >
        {nav.slice(0, 5).map(({ to, label, icon: Icon }) => (
          <Link
            key={to}
            href={to}
            className={cn(
              "flex min-w-0 flex-col items-center gap-1 py-1 text-[10px] text-muted-foreground",
              isActive(to) && "text-primary"
            )}
          >
            <Icon className="size-5" />
            <span className="truncate">{label}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}
