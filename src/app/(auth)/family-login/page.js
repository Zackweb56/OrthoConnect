import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function FamilyLoginPage() {
  return (
    <Card>
      <CardHeader>
        <h1 className="text-2xl font-semibold">Espace famille</h1>
        <CardDescription>
          Retrouvez les activités et le suivi de votre enfant.
        </CardDescription>
        <p className="arabic-text text-sm text-muted" lang="ar">
          مرحبًا بكم
        </p>
      </CardHeader>
      <CardContent>
        <form className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="phone">Téléphone</Label>
            <Input
              id="phone"
              type="tel"
              autoComplete="tel"
              placeholder="+212 6 00 00 00 00"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="family-password">Mot de passe</Label>
            <Input
              id="family-password"
              type="password"
              autoComplete="current-password"
              placeholder="Votre mot de passe"
            />
          </div>
          <Button type="submit" className="w-full" size="lg" disabled>
            Se connecter
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
