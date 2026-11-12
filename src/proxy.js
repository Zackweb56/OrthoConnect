import { NextResponse } from "next/server";
import { auth } from "../auth";

export default auth((request) => {
  const isOwnerRoute = request.nextUrl.pathname.startsWith("/owner");
  const user = request.auth?.user;

  if (!user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (isOwnerRoute && user.isPlatformOwner !== true) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/owner/:path*",
    "/:clinicSlug/dashboard/:path*",
    "/:clinicSlug/billing/:path*",
  ],
};
