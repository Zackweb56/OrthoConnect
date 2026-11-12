import Link from "next/link";
import { LogOut } from "lucide-react";
import { SignOutButton } from "@/components/cabinet/sign-out-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ForbiddenPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-canvas p-4 text-fg">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>403 — Aucun cabinet actif associé</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted">
            Votre compte n’est associé à aucun cabinet actif. Contactez
            l’administrateur de votre cabinet pour obtenir l’accès.
          </p>
          <div className="flex flex-wrap justify-end gap-2">
            <Button asChild variant="outline">
              <Link href="/">
                Retour à l’accueil
              </Link>
            </Button>
            <SignOutButton>
              <LogOut aria-hidden="true" />
              Se déconnecter
            </SignOutButton>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
