import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@/lib/auth/better-auth";
import { query } from "@/lib/db/client";

// POST /api/setup - Create admin account (only works in development or when no users exist)
export async function POST(request: NextRequest) {
  try {
    // Check if we're in development
    const isDev = process.env.NODE_ENV === "development";

    // Check if any users exist
    const existingUsers = await query<{ count: number }>(
      `SELECT COUNT(*) as count FROM "user"`
    );

    const userCount = Number(existingUsers[0]?.count || 0);

    // Only allow setup in development or if no users exist
    if (!isDev && userCount > 0) {
      return NextResponse.json(
        { error: "Setup not available. Admin account already exists." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { email, password, name } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existingEmail = await query<{ id: string }>(
      `SELECT id FROM "user" WHERE email = $1`,
      [email]
    );

    if (existingEmail.length > 0) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      );
    }

    // Create user using Better Auth's internal method
    const auth = getAuth();
    const ctx = await auth.api.signUpEmail({
      body: {
        email,
        password,
        name: name || "Admin",
      },
    });

    return NextResponse.json({
      success: true,
      message: "Admin account created successfully",
      email,
    }, { status: 201 });
  } catch (error) {
    console.error("Setup error:", error);
    return NextResponse.json(
      { error: "Failed to create admin account" },
      { status: 500 }
    );
  }
}

// GET /api/setup - Check if setup is available
export async function GET() {
  try {
    const isDev = process.env.NODE_ENV === "development";

    // Check if any users exist
    const existingUsers = await query<{ count: number }>(
      `SELECT COUNT(*) as count FROM "user"`
    );

    const userCount = Number(existingUsers[0]?.count || 0);

    return NextResponse.json({
      setupAvailable: isDev || userCount === 0,
      userCount,
      isDev,
    });
  } catch (error) {
    // If database isn't connected, setup is needed
    return NextResponse.json({
      setupAvailable: true,
      userCount: 0,
      isDev: process.env.NODE_ENV === "development",
      error: "Database not connected",
    });
  }
}
