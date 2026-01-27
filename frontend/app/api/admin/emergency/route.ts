import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth/guard";
import { pool } from "@/lib/db/client";

const bodySchema = z.object({
  confirmation: z.string().min(1),
  purge: z.boolean().optional().default(true),
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

export async function POST(request: NextRequest) {
  try {
    // Check if demo session - block emergency actions in demo mode
    const demoSessionId = request.headers.get("x-demo-session-id");
    if (demoSessionId) {
      return NextResponse.json(
        { error: "Emergency actions disabled in demo mode" },
        { status: 403 }
      );
    }

    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // Enable maintenance and emergency flags
      await client.query(
        `INSERT INTO settings (key, value, updated_at)
         VALUES ($1, $2, NOW())
         ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = NOW()`,
        ["maintenance_mode", JSON.stringify(true)]
      );
      await client.query(
        `INSERT INTO settings (key, value, updated_at)
         VALUES ($1, $2, NOW())
         ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = NOW()`,
        ["emergency_mode", JSON.stringify(true)]
      );
      await client.query(
        `INSERT INTO settings (key, value, updated_at)
         VALUES ($1, $2, NOW())
         ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = NOW()`,
        ["emergency_message", "Service temporairement indisponible."]
      );

      if (parsed.data.purge) {
        await client.query(
          `TRUNCATE TABLE
            pricing_tiers,
            products,
            reviews,
            orders,
            product_categories,
            drivers,
            telegram_contacts
          RESTART IDENTITY CASCADE`
        );

        await client.query(
          `DELETE FROM settings WHERE key NOT IN (
            'maintenance_mode',
            'emergency_mode',
            'emergency_message'
          )`
        );
      }

      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }

    return NextResponse.json({
      success: true,
      maintenance: true,
      purged: parsed.data.purge,
    });
  } catch (error) {
    console.error("Emergency route error:", error);
    return NextResponse.json(
      { error: "Failed to trigger emergency" },
      { status: 500 }
    );
  }
}
