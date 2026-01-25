import { NextRequest, NextResponse } from "next/server";
import { verifyTelegramInitData } from "@/lib/telegram/verifyInitData";
import { query } from "@/lib/db/client";
import { isAdmin } from "@/lib/auth/admin-guard";
import { signTelegramAdminToken } from "@/lib/auth/telegram-admin";
import { isMaintenanceMode } from "@/lib/maintenance";

export async function POST(request: NextRequest) {
  try {
    const maintenance = await isMaintenanceMode();
    if (maintenance) {
      return NextResponse.json(
        { error: "Service en maintenance" },
        { status: 503 }
      );
    }

    const { initData } = await request.json();

    if (!initData) {
      return NextResponse.json(
        { error: "Missing initData" },
        { status: 400 }
      );
    }

    const botToken = process.env.TELEGRAM_BOT_TOKEN;

    if (!botToken) {
      console.error("TELEGRAM_BOT_TOKEN not configured");
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }

    const { valid, data } = verifyTelegramInitData(initData, botToken);

    if (!valid || !data) {
      return NextResponse.json(
        { error: "Invalid initData" },
        { status: 401 }
      );
    }

    // Log contact for admin tracking
    if (data.user?.id) {
      await query(
        `INSERT INTO telegram_contacts (
          telegram_user_id, username, first_name, last_name, language_code, is_premium,
          first_seen_at, last_seen_at, visits_count
        )
        VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW(), 1)
        ON CONFLICT (telegram_user_id) DO UPDATE SET
          username = EXCLUDED.username,
          first_name = EXCLUDED.first_name,
          last_name = EXCLUDED.last_name,
          language_code = EXCLUDED.language_code,
          is_premium = EXCLUDED.is_premium,
          last_seen_at = NOW(),
          visits_count = telegram_contacts.visits_count + 1`,
        [
          data.user.id,
          data.user.username || null,
          data.user.first_name || null,
          data.user.last_name || null,
          data.user.language_code || null,
          data.user.is_premium ?? false,
        ]
      );
    }

    const response = NextResponse.json({
      success: true,
      user: data.user,
      queryId: data.query_id,
      authDate: data.auth_date,
    });

    // If user is admin, issue short-lived admin cookie for Telegram SSO
    const userIsAdmin = data.user?.id ? await isAdmin(data.user.id.toString()) : false;
    console.log(`[TG Verify] User ${data.user?.id} (${data.user?.username}) isAdmin: ${userIsAdmin}`);
    if (data.user?.id && userIsAdmin) {
      console.log(`[TG Verify] Setting tg_admin cookie for user ${data.user.id}`);
      const secret =
        process.env.ADMIN_SESSION_SECRET || process.env.BETTER_AUTH_SECRET || "";
      if (secret) {
        const token = signTelegramAdminToken(
          {
            sub: data.user.id.toString(),
            username: data.user.username || null,
            exp: Date.now() + 7 * 24 * 60 * 60 * 1000,
          },
          secret
        );
        response.cookies.set("tg_admin", token, {
          httpOnly: true,
          secure: true,
          sameSite: "lax",
          path: "/",
          maxAge: 60 * 60 * 24 * 7,
        });
      }
    }

    return response;
  } catch (error) {
    console.error("Telegram verification error:", error);
    return NextResponse.json(
      { error: "Verification failed" },
      { status: 500 }
    );
  }
}
