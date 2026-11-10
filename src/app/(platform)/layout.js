import { ProShell } from "@/components/layouts/pro-shell";
import { ownerNav } from "@/config/navigation";

export default function PlatformLayout({ children }) {
  return (
    <ProShell nav={ownerNav} title="Platform Owner">
      {children}
    </ProShell>
  );
}
