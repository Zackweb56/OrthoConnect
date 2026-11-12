"use client";

import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";

export function SignOutButton({ children, ...props }) {
  return (
    <Button
      type="button"
      variant="ghost"
      title="Se déconnecter"
      onClick={() => signOut({ redirectTo: "/login" })}
      {...props}
    >
      {children}
    </Button>
  );
}
