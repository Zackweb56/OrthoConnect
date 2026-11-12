"use client";

import { signOut } from "next-auth/react";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { LogOut } from "lucide-react";

export function SignOutItem() {
  return (
    <DropdownMenuItem
      variant="destructive"
      title="Se déconnecter"
      onSelect={() => signOut({ redirectTo: "/login" })}
    >
      <LogOut aria-hidden="true" />
      Se déconnecter
    </DropdownMenuItem>
  );
}
