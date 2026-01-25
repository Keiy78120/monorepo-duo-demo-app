import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth/guard";
import { runEmergencyNuke } from "@/lib/emergency/nuke";

const bodySchema = z.object({
  confirmation: z.string().min(1),
});

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}

const REQUIRED_CONFIRMATION = "je suis sur";

function isEnabled() {
  return process.env.ENABLE_EMERGENCY_NUKE === "true";
}

function getMissingConfig() {
  const missing: string[] = [];
  if (!process.env.GITHUB_TOKEN) missing.push("GITHUB_TOKEN");
  if (!process.env.GITHUB_REPO_OWNER) missing.push("GITHUB_REPO_OWNER");
  if (!process.env.GITHUB_REPO_NAME) missing.push("GITHUB_REPO_NAME");
  if (!process.env.VERCEL_TOKEN) missing.push("VERCEL_TOKEN");
  if (!process.env.VERCEL_PROJECT_ID) missing.push("VERCEL_PROJECT_ID");
  return missing;
}

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({
    enabled: isEnabled(),
    missing: getMissingConfig(),
  });
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!isEnabled()) {
      return NextResponse.json(
        { error: "Emergency nuke disabled" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const confirmation = normalizeText(parsed.data.confirmation);
    if (confirmation !== REQUIRED_CONFIRMATION) {
      return NextResponse.json(
        { error: "Confirmation required" },
        { status: 400 }
      );
    }

    const result = await runEmergencyNuke();

    return NextResponse.json({
      success: true,
      result,
    });
  } catch (error) {
    console.error("Emergency nuke error:", error);
    return NextResponse.json(
      { error: "Failed to run emergency nuke" },
      { status: 500 }
    );
  }
}
