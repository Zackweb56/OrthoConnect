import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ClinicDashboardPage() {
  return (
    <section className="space-y-6">
      <div className="space-y-2">
        <Badge variant="outline">Phase 2</Badge>
        <h2 className="text-xl font-semibold sm:text-2xl">Tableau de bord</h2>
        <p className="text-muted">
          Votre espace de travail — le contenu métier sera ajouté plus tard.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Bienvenue dans votre cabinet</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted">
            Patients, rendez-vous et suivi seront disponibles dans les phases
            suivantes.
          </p>
        </CardContent>
      </Card>
    </section>
  );
}
