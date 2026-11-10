import { AuthShell } from "@/components/layouts/auth-shell";

export default function LoginLayout({ children }) {
  return <AuthShell>{children}</AuthShell>;
}
