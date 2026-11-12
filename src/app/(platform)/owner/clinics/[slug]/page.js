import { OwnerClinicDetails } from "@/components/owner/clinic-details";
import { LoadingState } from "@/components/shared/loading-state";
import { Suspense } from "react";

export default function OwnerClinicDetailsPage({ params }) {
  return (
    <Suspense fallback={<LoadingState label="Chargement du cabinet…" />}>
      <OwnerClinicDetailsPageContent params={params} />
    </Suspense>
  );
}

async function OwnerClinicDetailsPageContent({ params }) {
  const { slug } = await params;
  return <OwnerClinicDetails slug={slug} />;
}
