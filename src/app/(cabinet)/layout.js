import { ProShell } from "@/components/layouts/pro-shell";
import { cabinetNav } from "@/config/navigation";

export default function CabinetLayout({ children }) {
  return (
    <ProShell nav={cabinetNav} title="Cabinet">
      {children}
    </ProShell>
  );
}
