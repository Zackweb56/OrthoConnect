import { AuthShell } from "@/components/layouts/auth-shell";
import { PALETTES } from "@/config/theme";

export default function FamilyLoginLayout({ children }) {
  return <AuthShell variant={PALETTES.FAMILY}>{children}</AuthShell>;
}
