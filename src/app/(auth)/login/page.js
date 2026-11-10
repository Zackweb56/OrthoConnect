import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  return (
    <Card>
      <CardHeader>
        <h1 className="text-2xl font-semibold">Connexion Cabinet</h1>
        <CardDescription>
          Connectez-vous à votre espace professionnel.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="email">Adresse e-mail</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="nom@cabinet.ma"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Mot de passe</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              placeholder="Votre mot de passe"
            />
          </div>
          <Button type="submit" className="w-full" size="lg" disabled>
            Se connecter
          </Button>
        </form>
        <p className="mt-5 text-center text-sm text-muted">
          Auth — Phase 5
        </p>
      </CardContent>
    </Card>
  );
}
