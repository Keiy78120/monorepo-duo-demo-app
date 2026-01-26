import { NextRequest, NextResponse } from "next/server";

function getBackendBase() {
  return process.env.CLOUDFLARE_API_URL || "";
}

async function proxyToCloudflare(request: NextRequest) {
  const base = getBackendBase();
  if (!base) {
    return NextResponse.json(
      { error: "CLOUDFLARE_API_URL not configured" },
      { status: 501 }
    );
  }

  const url = new URL(request.url);
  const target = new URL(`${url.pathname}${url.search}`, base);

  const response = await fetch(target.toString(), {
    method: request.method,
    headers: request.headers,
    body: request.body,
  });

  return new NextResponse(response.body, {
    status: response.status,
    headers: response.headers,
  });
}

export async function POST(request: NextRequest) {
  return proxyToCloudflare(request);
}

export async function DELETE(request: NextRequest) {
  return proxyToCloudflare(request);
}
