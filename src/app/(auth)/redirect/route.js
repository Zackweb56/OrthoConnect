import { NextResponse } from "next/server";
import { auth } from "../../../../auth";

export async function GET(request) {
  const session = await auth();
  const destination = session?.user
    ? session.user.isPlatformOwner
      ? "/owner/dashboard"
      : "/dashboard"
    : "/login";

  return NextResponse.redirect(new URL(destination, request.url));
}
