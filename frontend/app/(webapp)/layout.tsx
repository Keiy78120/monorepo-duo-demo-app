"use client";

import { TelegramGate } from "@/components/TelegramGate";
import { BottomNav } from "@/components/BottomNav";
import { AdminPreviewBar } from "@/components/AdminPreviewBar";

export default function WebAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <TelegramGate botUsername={process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || "vhash94_bot"}>
      <AdminPreviewBar />
      <main className="min-h-screen pb-nav">
        {children}
      </main>
      <BottomNav />
    </TelegramGate>
  );
}
