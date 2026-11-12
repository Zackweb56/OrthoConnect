import { NextResponse } from "next/server";
import { forbidden } from "next/navigation";
import { auth } from "../../../../auth";
import { findFirstClinicSlugForUser } from "@/features/subscriptions/access";

export async function GET(request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (session.user.isPlatformOwner) {
    return NextResponse.redirect(new URL("/owner/dashboard", request.url));
  }

  const clinicSlug = await findFirstClinicSlugForUser(session.user.id);
  if (!clinicSlug) forbidden();

  return NextResponse.redirect(
    new URL(`/${encodeURIComponent(clinicSlug)}/dashboard`, request.url),
  );
}
