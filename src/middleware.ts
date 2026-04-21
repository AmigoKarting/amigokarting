import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const pathname = req.nextUrl.pathname;

  // Pages publiques — pas de protection
  if (pathname === "/" || pathname.startsWith("/login") || pathname.startsWith("/register") || 
      pathname.startsWith("/aide-install") || pathname.startsWith("/api/auth") || 
      pathname.startsWith("/api/cron")) {
    return addSecurityHeaders(res);
  }

  // Fichiers statiques
  if (pathname.startsWith("/_next") || pathname.startsWith("/icons") || 
      pathname === "/manifest.json" || pathname === "/sw.js" ||
      pathname.endsWith(".png") || pathname.endsWith(".ico")) {
    return res;
  }

  // Vérifier si l'utilisateur a un cookie de session Supabase
  const hasSession = req.cookies.getAll().some((c) => 
    c.name.includes("supabase") || c.name.includes("sb-")
  );

  if (!hasSession) {
    // Pas connecté → rediriger vers login
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/", req.url));
  }

  return addSecurityHeaders(res);
}

function addSecurityHeaders(res: NextResponse): NextResponse {
  res.headers.set("X-Frame-Options", "DENY");
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  res.headers.set("X-XSS-Protection", "1; mode=block");
  return res;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
