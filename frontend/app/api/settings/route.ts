import { NextRequest, NextResponse } from "next/server";
import { query, queryOne, execute } from "@/lib/db/client";
import { getSession } from "@/lib/auth/guard";
import { z } from "zod";

interface Setting {
  key: string;
  value: unknown;
  updated_at: string;
}

// GET /api/settings - Get all settings (public for certain keys)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get("key");

    // Public keys that don't require auth
    const publicKeys = [
      "info",
      "features",
      "contact",
      "general",
      "order_warning_message",
      "delivery_start_time",
      "min_order_amount",
      "maintenance_mode",
      "emergency_mode",
      "emergency_message",
    ];

    if (key) {
      // Get single setting
      const setting = await queryOne<Setting>(
        `SELECT * FROM settings WHERE key = $1`,
        [key]
      );

      if (!setting) {
        if (key === "maintenance_mode") {
          return NextResponse.json({
            setting: { key, value: false, updated_at: new Date().toISOString() },
          });
        }
        if (key === "emergency_message") {
          return NextResponse.json({
            setting: {
              key,
              value: "On revient très vite.",
              updated_at: new Date().toISOString(),
            },
          });
        }
        return NextResponse.json({ error: "Setting not found" }, { status: 404 });
      }

      // Check if this is a private key
      if (!publicKeys.includes(key)) {
        const session = await getSession();
        if (!session) {
          return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
      }

      return NextResponse.json({ setting });
    }

    // Get all settings (admin only)
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const settings = await query<Setting>(`SELECT * FROM settings`);

    return NextResponse.json({ settings });
  } catch (error) {
    console.error("Settings GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch settings" },
      { status: 500 }
    );
  }
}

// Setting update schema
const updateSettingSchema = z.object({
  key: z.string().min(1).max(100),
  value: z.any(),
});

// PUT /api/settings - Update or create setting (admin only)
export async function PUT(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = updateSettingSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    // Check if demo session - block maintenance mode changes in demo
    const demoSessionId = request.headers.get("x-demo-session-id");
    if (demoSessionId && parsed.data.key === "maintenance_mode") {
      return NextResponse.json(
        { error: "Maintenance mode cannot be changed in demo" },
        { status: 403 }
      );
    }

    const setting = await queryOne<Setting>(
      `INSERT INTO settings (key, value, updated_at)
       VALUES ($1, $2, NOW())
       ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = NOW()
       RETURNING *`,
      [parsed.data.key, JSON.stringify(parsed.data.value)]
    );

    return NextResponse.json({ setting });
  } catch (error) {
    console.error("Settings PUT error:", error);
    return NextResponse.json(
      { error: "Failed to update setting" },
      { status: 500 }
    );
  }
}

// DELETE /api/settings?key=xxx - Delete setting (admin only)
export async function DELETE(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const key = searchParams.get("key");

    if (!key) {
      return NextResponse.json({ error: "Key is required" }, { status: 400 });
    }

    const rowCount = await execute(`DELETE FROM settings WHERE key = $1`, [key]);

    if (rowCount === 0) {
      return NextResponse.json({ error: "Setting not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Settings DELETE error:", error);
    return NextResponse.json(
      { error: "Failed to delete setting" },
      { status: 500 }
    );
  }
}
