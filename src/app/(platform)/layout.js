import { auth } from "../../../auth";
import { ProShell } from "@/components/layouts/pro-shell";
import { ownerNav } from "@/config/navigation";

export const instant = false;

export default async function PlatformLayout({ children }) {
  const session = await auth();
  return (
    <ProShell nav={ownerNav} title="Espace propriétaire" user={session?.user}>
      {children}
    </ProShell>
  );
}
