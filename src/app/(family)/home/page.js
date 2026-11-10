import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function FamilyHomePage() {
  return (
    <section className="space-y-6">
      <div className="space-y-2">
        <Badge className="bg-accent-2 text-fg">Espace famille</Badge>
        <h1 className="text-3xl font-semibold">Bonjour !</h1>
        <p className="text-muted">
          Les activités et le suivi de votre enfant apparaîtront ici.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Un mot de l’orthophoniste</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="notes-font text-xl">Bravo pour vos efforts !</p>
          <p className="arabic-text mt-3 text-sm text-muted" lang="ar">
            أحسنتم على جهودكم!
          </p>
        </CardContent>
      </Card>
    </section>
  );
}
