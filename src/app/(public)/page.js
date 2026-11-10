import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function PublicHomePage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-canvas px-4 py-16 text-center text-fg">
      <div className="max-w-xl space-y-6">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-muted">
          OrthoConnect
        </p>
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
          OrthoConnect — coming soon
        </h1>
        <p className="text-lg text-muted">
          Un espace simple pour accompagner les parcours orthophoniques.
        </p>
        <Button asChild size="lg">
          <Link href="/login">Accéder à la connexion</Link>
        </Button>
      </div>
    </main>
  );
}
