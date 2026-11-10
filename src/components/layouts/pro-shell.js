"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  ChevronDown,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  X,
} from "lucide-react";
import { resolveThemeClass, PALETTES } from "@/config/theme";
import { getNavigationIcon } from "@/config/navigation-icons";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { cn } from "cn";

export function ProShell({ nav, title, children }) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const themeClass = resolveThemeClass(PALETTES.PRO);

  return (
    <div className={cn(themeClass, "flex min-h-screen bg-canvas text-fg")}>
      {isMobileMenuOpen && (
        <button
          type="button"
          aria-label="Close navigation menu"
          className="fixed inset-0 z-40 bg-black/30 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
      <aside
        className={cn(
          "fixed inset-y-0 start-0 z-50 flex h-dvh w-72 flex-col border-e border-line bg-surface transition-[width] md:sticky md:top-0 md:z-10 md:h-screen",
          isMobileMenuOpen ? "flex" : "hidden md:flex",
          isCollapsed ? "md:w-20" : "md:w-64",
        )}
      >
        <div className="flex h-16 items-center justify-between gap-3 px-4">
          <Link
            href="/"
            className="flex min-w-0 items-center"
            aria-label="OrthoConnect home"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            {isCollapsed ? (
              <span className="grid size-10 place-items-center rounded-lg bg-primary text-sm font-bold text-primary-fg md:grid">
                OC
              </span>
            ) : (
              <Image
                src="/images/logo.svg"
                alt="OrthoConnect"
                width={220}
                height={44}
              />
            )}
          </Link>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="hidden md:inline-flex"
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-expanded={!isCollapsed}
            onClick={() => setIsCollapsed((collapsed) => !collapsed)}
          >
            {isCollapsed ? (
              <PanelLeftOpen aria-hidden="true" />
            ) : (
              <PanelLeftClose aria-hidden="true" />
            )}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="md:hidden"
            aria-label="Close navigation menu"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <X aria-hidden="true" />
          </Button>
        </div>
        <Separator />
        <nav aria-label="Main navigation" className="flex-1 overflow-y-auto p-3">
          <ul className="space-y-1">
            {nav.map((item) => {
              const Icon = getNavigationIcon(item.icon);
              const isActive =
                pathname === item.href || pathname.startsWith(`${item.href}/`);

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={isActive ? "page" : undefined}
                    aria-label={isCollapsed ? item.label : undefined}
                    title={isCollapsed ? item.label : undefined}
                    className={cn(
                      "flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      isActive
                        ? "bg-primary text-primary-fg hover:bg-primary-hover"
                        : "text-fg hover:bg-surface-soft",
                      isCollapsed && "md:justify-center md:px-0",
                    )}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Icon className="size-5 shrink-0" aria-hidden="true" />
                    <span className={cn(isCollapsed && "md:sr-only")}>
                      {item.label}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        <div className={cn("p-3", isCollapsed && "md:px-2")}>
          <p
            className={cn(
              "text-xs text-muted",
              isCollapsed && "md:sr-only",
            )}
          >
            Espace professionnel
          </p>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex min-h-16 items-center justify-between gap-3 border-b border-line bg-canvas/95 px-4 backdrop-blur sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="md:hidden"
              aria-label="Open navigation menu"
              aria-expanded={isMobileMenuOpen}
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <Menu aria-hidden="true" />
            </Button>
            <h1 className="truncate text-lg font-semibold sm:text-xl">{title}</h1>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <div
              aria-label="Language switcher placeholder"
              className="hidden items-center gap-1 sm:flex"
            >
              <Button type="button" variant="ghost" size="sm" disabled>
                FR
              </Button>
              <Button type="button" variant="ghost" size="sm" disabled>
                AR
              </Button>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  className="gap-2 px-2"
                  aria-label="Open account menu"
                >
                  <Avatar>
                    <AvatarFallback>OC</AvatarFallback>
                  </Avatar>
                  <span className="hidden sm:inline">Compte</span>
                  <ChevronDown className="size-4" aria-hidden="true" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Compte</DropdownMenuLabel>
                <DropdownMenuItem disabled>Menu de compte à venir</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
        <main className="w-full flex-1 bg-canvas">
          <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
