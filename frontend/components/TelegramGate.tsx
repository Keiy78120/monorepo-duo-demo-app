"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { Send, ExternalLink } from "lucide-react";
import { useTelegramStore } from "@/lib/store/telegram";
import { Button } from "@/components/ui/button";

interface TelegramGateProps {
  children: React.ReactNode;
  botUsername?: string;
}

export function TelegramGate({ children, botUsername = "your_bot" }: TelegramGateProps) {
  const { isReady, isInTelegram, initialize, enablePreview } = useTelegramStore();
  const [mounted, setMounted] = useState(false);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState<string | null>(null);
  const [previewChecked, setPreviewChecked] = useState(false);

  useEffect(() => {
    setMounted(true);
    initialize();
  }, [initialize]);

  useEffect(() => {
    if (!isReady) return;
    if (isInTelegram) {
      setPreviewChecked(true);
      return;
    }

    const checkPreview = async () => {
      try {
        if (typeof window === "undefined") return;
        const previewFlag = window.localStorage.getItem("admin-preview");
        if (previewFlag !== "1") {
          setPreviewChecked(true);
          return;
        }

        const response = await fetch("/api/admin/session");
        if (!response.ok) {
          window.localStorage.removeItem("admin-preview");
          setPreviewChecked(true);
          return;
        }

        const data = await response.json();
        if (data?.authenticated) {
          const telegramUserId = data.telegramUserId ? Number(data.telegramUserId) : null;
          enablePreview({
            userId: Number.isFinite(telegramUserId) ? telegramUserId : null,
            username: data?.user?.name || data?.user?.email || null,
            firstName: data?.user?.name || null,
            lastName: null,
          });
        } else {
          window.localStorage.removeItem("admin-preview");
        }
      } catch (error) {
        console.error("Failed to verify admin preview:", error);
      } finally {
        setPreviewChecked(true);
      }
    };

    checkPreview();
  }, [enablePreview, isInTelegram, isReady]);

  useEffect(() => {
    const fetchMaintenance = async () => {
      try {
        const response = await fetch("/api/settings?key=maintenance_mode");
        if (!response.ok) return;
        const data = await response.json();
        const value = String(data?.setting?.value ?? "").toLowerCase().trim();
        const isActive = value === "true" || value === "1";
        setMaintenanceMode(isActive);
        if (isActive) {
          const messageResponse = await fetch("/api/settings?key=emergency_message");
          if (messageResponse.ok) {
            const messageData = await messageResponse.json();
            if (messageData?.setting?.value) {
              setMaintenanceMessage(messageData.setting.value);
            }
          }
        }
      } catch (error) {
        console.error("Failed to fetch maintenance mode:", error);
      }
    };

    fetchMaintenance();
  }, []);

  // Show nothing until mounted (prevents hydration mismatch)
  if (!mounted || !isReady || !previewChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-background)]">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <div className="w-12 h-12 rounded-full border-2 border-[var(--color-primary)] border-t-transparent animate-spin" />
          <p className="text-[var(--color-muted-foreground)] text-sm">Chargement...</p>
        </motion.div>
      </div>
    );
  }

  // If maintenance mode is active, show maintenance screen
  if (maintenanceMode) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-background)] p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-sm"
        >
          <div className="glass-card rounded-3xl p-8 text-center">
            <motion.h1
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-2xl font-bold text-[var(--color-foreground)] mb-3"
            >
              Service en maintenance
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="text-[var(--color-muted-foreground)] text-sm mb-6 leading-relaxed"
            >
              {maintenanceMessage ||
                "L'application est temporairement indisponible. Merci de réessayer plus tard."}
            </motion.p>
          </div>
        </motion.div>
      </div>
    );
  }

  // If not in Telegram, show gate screen
  if (!isInTelegram) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-background)] p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-sm"
        >
          <div className="glass-card rounded-3xl p-8 text-center">
            {/* Telegram Icon */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-[#2AABEE] to-[#229ED9] flex items-center justify-center shadow-lg"
            >
              <Send className="w-10 h-10 text-white" />
            </motion.div>

            {/* Title */}
            <motion.h1
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-2xl font-bold text-[var(--color-foreground)] mb-3"
            >
              Ouvrir dans Telegram
            </motion.h1>

            {/* Description */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-[var(--color-muted-foreground)] text-sm mb-8 leading-relaxed"
            >
              Cette application est conçue pour fonctionner dans Telegram. Veuillez l'ouvrir via l'application Telegram pour continuer.
            </motion.p>

            {/* Open Button */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <Button
                size="lg"
                className="w-full bg-gradient-to-r from-[#2AABEE] to-[#229ED9] hover:from-[#229ED9] hover:to-[#1E8FCB] text-white font-semibold"
                onClick={() => {
                  window.open(`https://t.me/${botUsername}`, "_blank");
                }}
              >
                <Send className="w-5 h-5 mr-2" />
                Ouvrir Telegram
                <ExternalLink className="w-4 h-4 ml-2" />
              </Button>
            </motion.div>

            {/* Footer note */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="text-[var(--color-muted-foreground)] text-xs mt-6"
            >
              Application Telegram
            </motion.p>
          </div>
        </motion.div>
      </div>
    );
  }

  // User is in Telegram, show children
  return <>{children}</>;
}
