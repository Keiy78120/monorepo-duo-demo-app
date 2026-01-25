import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { isAdmin } from "@/lib/auth/admin-guard";

const checkSchema = z.object({
  telegram_user_id: z.string(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = checkSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input" },
        { status: 400 }
      );
    }

    const { telegram_user_id } = parsed.data;

    const adminStatus = await isAdmin(telegram_user_id);
    if (!adminStatus) {
      console.warn(`🚫 Accès admin refusé pour: ${telegram_user_id}`);
      return NextResponse.json(
        { error: "Unauthorized", isAdmin: false },
        { status: 403 }
      );
    }

    console.log(`✅ Accès admin autorisé: ${telegram_user_id}`);
    return NextResponse.json({ isAdmin: true });
  } catch (error) {
    console.error("Admin check error:", error);
    return NextResponse.json(
      { error: "Failed to check admin status" },
      { status: 500 }
    );
  }
}
