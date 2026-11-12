import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PasswordInput, RequiredLabel } from "@/components/shared/form-fields";
import { LogIn } from "lucide-react";

export default function FamilyLoginPage() {
  return (
    <Card>
      <CardHeader>
        <h1 className="text-2xl font-semibold">Espace famille</h1>
        <CardDescription>
          Retrouvez les activités et le suivi de votre enfant.
        </CardDescription>
        <p className="text-sm text-muted">Bienvenue dans votre espace.</p>
      </CardHeader>
      <CardContent>
        <form className="space-y-5">
          <div className="space-y-2">
            <RequiredLabel htmlFor="phone" required>
              Téléphone
            </RequiredLabel>
            <Input
              id="phone"
              type="tel"
              autoComplete="tel"
              placeholder="+212 6 00 00 00 00"
              required
            />
          </div>
          <div className="space-y-2">
            <RequiredLabel htmlFor="family-password" required>
              Mot de passe
            </RequiredLabel>
            <PasswordInput
              id="family-password"
              autoComplete="current-password"
              placeholder="Votre mot de passe"
              required
            />
          </div>
          <Button type="submit" className="w-full" size="lg" disabled>
            <LogIn aria-hidden="true" />
            Se connecter
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
