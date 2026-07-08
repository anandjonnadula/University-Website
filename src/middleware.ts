import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const secret = new TextEncoder().encode(process.env.SESSION_SECRET ?? "univos-dev-secret");

export async function middleware(req: NextRequest) {
  const token = req.cookies.get("univos_session")?.value;
  if (!token) {
    const url = new URL("/login", req.url);
    url.searchParams.set("next", req.nextUrl.pathname);
    return NextResponse.redirect(url);
  }
  try {
    await jwtVerify(token, secret);
    return NextResponse.next();
  } catch {
    const url = new URL("/login", req.url);
    return NextResponse.redirect(url);
  }
}

export const config = {
  matcher: ["/portal/:path*"],
};
