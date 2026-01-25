import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/guard";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ authenticated: false });
  }

  const isTelegramAdmin = session.user?.email === "telegram-admin@local";
  const telegramUserId = isTelegramAdmin ? session.user.id : null;

  return NextResponse.json({
    authenticated: true,
    user: session.user,
    telegramUserId,
  });
}
