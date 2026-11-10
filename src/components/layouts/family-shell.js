"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { familyNav } from "@/config/navigation";
import { getNavigationIcon } from "@/config/navigation-icons";
import { PALETTES, resolveThemeClass } from "@/config/theme";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "cn";

export function FamilyShell({ children }) {
  const pathname = usePathname();
  const themeClass = resolveThemeClass(PALETTES.FAMILY);

  return (
    <div
      className={cn(
        themeClass,
        "flex min-h-screen flex-col bg-canvas text-fg",
      )}
    >
      <header className="flex min-h-16 items-center justify-between gap-4 border-b border-line bg-surface px-4 sm:px-6">
        <Link href="/home" aria-label="OrthoConnect family home">
          <Image
            src="/images/logo.svg"
            alt="OrthoConnect"
            width={220}
            height={44}
          />
        </Link>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="lg"
              className="gap-2"
              aria-label="Open family account menu"
            >
              <Avatar>
                <AvatarFallback>FA</AvatarFallback>
              </Avatar>
              <span className="hidden sm:inline">Compte</span>
              <ChevronDown className="size-4" aria-hidden="true" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Compte famille</DropdownMenuLabel>
            <DropdownMenuItem disabled>Menu de compte à venir</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      <nav
        aria-label="Family navigation"
        className="hidden justify-center gap-2 border-b border-line bg-surface px-4 py-2 md:flex"
      >
        {familyNav.map((item) => {
          const Icon = getNavigationIcon(item.icon);
          const isActive =
            pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "inline-flex min-h-11 items-center gap-2 rounded-full px-4 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                isActive
                  ? "bg-primary text-primary-fg hover:bg-primary-hover"
                  : "text-fg hover:bg-surface-soft",
              )}
            >
              <Icon className="size-4" aria-hidden="true" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 pb-24 sm:px-6 md:pb-10 lg:px-8">
        {children}
      </main>

      <nav
        aria-label="Family navigation"
        className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-5 border-t border-line bg-surface/95 pb-[env(safe-area-inset-bottom)] shadow-lg backdrop-blur md:hidden"
      >
        {familyNav.map((item) => {
          const Icon = getNavigationIcon(item.icon);
          const isActive =
            pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "flex min-h-14 flex-col items-center justify-center gap-1 px-1 text-[0.7rem] font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
                isActive ? "text-primary" : "text-muted",
              )}
            >
              <Icon className="size-5" aria-hidden="true" />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
