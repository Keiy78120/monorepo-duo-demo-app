"use client";

import { useEffect, useState } from "react";
import { useTelegramStore } from "@/lib/store/telegram";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, Check } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAppModeStore } from "@/lib/store/app-mode";
import { ModeRestricted } from "@/components/ModeRestricted";

export default function WhoAmIPage() {
  const router = useRouter();
  const { initData, userId, username, firstName, lastName } = useTelegramStore();
  const [copied, setCopied] = useState(false);
  const mode = useAppModeStore((state) => state.mode);

  if (mode === "simple") {
    return (
      <ModeRestricted
        title="Page désactivée"
        description="Cette page est réservée à la démo advanced."
      />
    );
  }

  const telegramUserId = userId?.toString() || "Non connecté";
  const displayUsername = username || "Aucun";

  const copyToClipboard = () => {
    if (telegramUserId !== "Non connecté") {
      navigator.clipboard.writeText(telegramUserId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);

      // Haptic feedback
      if (typeof window !== "undefined" && window.Telegram?.WebApp) {
        window.Telegram.WebApp.HapticFeedback.notificationOccurred("success");
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="glass-card p-8 max-w-md w-full space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-[var(--color-foreground)] mb-2">
            Ton Profil Telegram
          </h1>
          <p className="text-sm text-[var(--color-muted-foreground)]">
            Informations pour la configuration admin
          </p>
        </div>

        <div className="space-y-4">
          {/* User ID */}
          <div className="glass rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-[var(--color-muted-foreground)] mb-1">
                  Telegram User ID
                </p>
                <p className="text-lg font-mono font-bold text-[var(--color-primary)]">
                  {telegramUserId}
                </p>
              </div>
              {telegramUserId !== "Non connecté" && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={copyToClipboard}
                  className="shrink-0"
                >
                  {copied ? (
                    <Check className="w-5 h-5 text-green-500" />
                  ) : (
                    <Copy className="w-5 h-5" />
                  )}
                </Button>
              )}
            </div>
          </div>

          {/* Username */}
          <div className="glass rounded-xl p-4">
            <p className="text-xs text-[var(--color-muted-foreground)] mb-1">
              Username
            </p>
            <p className="text-base font-medium text-[var(--color-foreground)]">
              {displayUsername !== "Aucun" ? `@${displayUsername}` : "Aucun"}
            </p>
          </div>

          {/* Name */}
          {(firstName || lastName) && (
            <div className="glass rounded-xl p-4">
              <p className="text-xs text-[var(--color-muted-foreground)] mb-1">
                Nom
              </p>
              <p className="text-base font-medium text-[var(--color-foreground)]">
                {firstName} {lastName}
              </p>
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
          <p className="text-sm text-blue-600 dark:text-blue-400 leading-relaxed">
            💡 <strong>Pour devenir admin :</strong><br />
            Copie ton User ID et ajoute-le dans <code className="px-1 py-0.5 rounded bg-blue-500/20 font-mono text-xs">ADMIN_TELEGRAM_IDS</code> dans <code className="px-1 py-0.5 rounded bg-blue-500/20 font-mono text-xs">.env.local</code>
          </p>
        </div>

        <Button
          onClick={() => router.push("/")}
          variant="outline"
          className="w-full"
        >
          Retour
        </Button>
      </Card>
    </div>
  );
}
