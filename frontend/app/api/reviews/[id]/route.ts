import { NextRequest, NextResponse } from "next/server";
import { queryOne, execute } from "@/lib/db/client";
import { getSession } from "@/lib/auth/guard";
import { z } from "zod";

interface Review {
  id: string;
  product_id: string | null;
  telegram_user_id: string;
  username: string | null;
  rating: number;
  content: string;
  status: "pending" | "published" | "rejected";
  created_at: string;
}

type RouteContext = { params: Promise<{ id: string }> };

// GET /api/reviews/[id] - Get single review
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;

    const review = await queryOne<Review>(
      `SELECT * FROM reviews WHERE id = $1`,
      [id]
    );

    if (!review) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }

    return NextResponse.json({ review });
  } catch (error) {
    console.error("Review GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch review" },
      { status: 500 }
    );
  }
}

// Update review schema (admin moderation)
const updateReviewSchema = z.object({
  status: z.enum(["pending", "published", "rejected"]).optional(),
});

// PATCH /api/reviews/[id] - Update review status (admin only)
export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    const body = await request.json();
    const parsed = updateReviewSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    // Check if review exists
    const existing = await queryOne<{ id: string }>(
      `SELECT id FROM reviews WHERE id = $1`,
      [id]
    );

    if (!existing) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }

    if (!parsed.data.status) {
      return NextResponse.json({ error: "No status provided" }, { status: 400 });
    }

    const review = await queryOne<Review>(
      `UPDATE reviews SET status = $1 WHERE id = $2 RETURNING *`,
      [parsed.data.status, id]
    );

    return NextResponse.json({ review });
  } catch (error) {
    console.error("Review PATCH error:", error);
    return NextResponse.json(
      { error: "Failed to update review" },
      { status: 500 }
    );
  }
}

// DELETE /api/reviews/[id] - Delete review (admin only)
export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;

    const rowCount = await execute(`DELETE FROM reviews WHERE id = $1`, [id]);

    if (rowCount === 0) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Review DELETE error:", error);
    return NextResponse.json(
      { error: "Failed to delete review" },
      { status: 500 }
    );
  }
}
