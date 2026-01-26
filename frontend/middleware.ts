import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Cloudflare Pages backend URL (contains the API Functions)
const CLOUDFLARE_API_URL =
  process.env.CLOUDFLARE_API_URL || "https://monorepo-duo-demo.pages.dev";

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  // Proxy /api/* requests to Cloudflare Pages Functions
  if (pathname.startsWith("/api/")) {
    try {
      // Build Cloudflare URL
      const cloudflareUrl = `${CLOUDFLARE_API_URL}${pathname}${search}`;

      // Copy headers
      const headers = new Headers(request.headers);
      headers.set("x-forwarded-host", request.headers.get("host") || "");

      // Forward the request to Cloudflare
      const cloudflareResponse = await fetch(cloudflareUrl, {
        method: request.method,
        headers,
        body:
          request.method !== "GET" && request.method !== "HEAD"
            ? await request.arrayBuffer()
            : undefined,
        // @ts-ignore - duplex is needed for streaming but not in types
        duplex: "half",
      });

      // Return the Cloudflare response
      return new NextResponse(cloudflareResponse.body, {
        status: cloudflareResponse.status,
        statusText: cloudflareResponse.statusText,
        headers: cloudflareResponse.headers,
      });
    } catch (error) {
      console.error("[Middleware] Cloudflare proxy error:", error);
      return NextResponse.json(
        { error: "Failed to connect to backend API" },
        { status: 502 }
      );
    }
  }

  // Continue with other requests
  return NextResponse.next();
}

export const config = {
  matcher: [
    // Proxy API routes
    "/api/:path*",
  ],
};
