import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function PlatformDashboardPage() {
  return (
    <section className="space-y-6">
      <div className="space-y-2">
        <Badge variant="outline">Phase 2</Badge>
        <h2 className="text-2xl font-semibold">Dashboard</h2>
        <p className="text-muted">
          Vue d’ensemble de la plateforme — contenu à venir.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Platform Owner</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted">
            Les indicateurs et outils de gestion seront ajoutés dans les phases
            suivantes.
          </p>
        </CardContent>
      </Card>
    </section>
  );
}
