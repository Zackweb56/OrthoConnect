import Image from "next/image";
import Link from "next/link";
import { PALETTES, resolveThemeClass } from "@/config/theme";
import { cn } from "cn";

export function AuthShell({ children, variant = PALETTES.PRO }) {
  const themeClass = resolveThemeClass(variant);

  return (
    <div
      className={cn(
        themeClass,
        "flex min-h-screen items-center justify-center bg-canvas px-4 py-10 text-fg",
      )}
    >
      <main className="w-full max-w-[26.25rem]">
        <Link
          href="/"
          className="mb-6 flex justify-center"
          aria-label="OrthoConnect home"
        >
          <Image
            src="/images/logo.svg"
            alt="OrthoConnect"
            width={200}
            height={40}
            className="h-10 w-auto"
            style={{ width: "auto" }}
          />
        </Link>
        {children}
      </main>
    </div>
  );
}
