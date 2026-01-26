import { NextRequest, NextResponse } from "next/server";
import { query, queryOne } from "@/lib/db/client";
import { getSession } from "@/lib/auth/guard";
import { z } from "zod";
import type { Driver } from "@/lib/db/types";

// Create driver schema
const createDriverSchema = z.object({
  name: z.string().min(1, "Name is required"),
  phone: z.string().optional(),
  is_active: z.boolean().default(true),
});

// GET /api/drivers - List all drivers
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get("active") === "true";

    let sql = `SELECT * FROM drivers`;
    const params: (string | boolean)[] = [];

    if (activeOnly) {
      sql += ` WHERE is_active = $1`;
      params.push(true);
    }

    sql += ` ORDER BY name ASC`;

    const drivers = await query<Driver>(sql, params);

    return NextResponse.json({ drivers });
  } catch (error) {
    console.error("Drivers GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch drivers" },
      { status: 500 }
    );
  }
}

// POST /api/drivers - Create new driver
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = createDriverSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const driver = await queryOne<Driver>(
      `INSERT INTO drivers (name, phone, is_active)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [parsed.data.name, parsed.data.phone || null, parsed.data.is_active]
    );

    return NextResponse.json({ driver }, { status: 201 });
  } catch (error) {
    console.error("Drivers POST error:", error);
    return NextResponse.json(
      { error: "Failed to create driver" },
      { status: 500 }
    );
  }
}
