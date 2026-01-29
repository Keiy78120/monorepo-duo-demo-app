"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { Shield, LayoutGrid, ArrowLeft, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useHapticFeedback, useTelegramStore } from "@/lib/store/telegram";
import { InfoDialog } from "@/components/InfoDialog";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";
import { useAppModeStore } from "@/lib/store/app-mode";
import { useDemoSessionStore } from "@/lib/store/demo-session";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  showInfo?: boolean;
  onBack?: () => void;
}

export function PageHeader({ title, subtitle, showBack = false, showInfo = true, onBack }: PageHeaderProps) {
  const router = useRouter();
  const { selection } = useHapticFeedback();
  const [infoOpen, setInfoOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const userId = useTelegramStore((s) => s.userId);
  const mode = useAppModeStore((s) => s.mode);
  const { clearMode } = useAppModeStore();
  const { sessionId: demoSessionId, loadDemoSession, clearDemoSession } = useDemoSessionStore();
  const isSimple = mode === "simple";
  const showInfoButton = showInfo; // Show info button in both simple and advanced modes

  // Load demo session on mount
  useEffect(() => {
    loadDemoSession();
  }, [loadDemoSession]);

  // Check admin access (Telegram user OR demo session)
  useEffect(() => {
    // If demo session exists, grant admin access immediately
    if (demoSessionId) {
      setIsAdmin(true);
      return;
    }

    // Otherwise, check via Telegram user ID
    if (!userId) return;

    const checkAdmin = async () => {
      try {
        const response = await fetch("/api/admin/check", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ telegram_user_id: userId.toString() }),
        });
        setIsAdmin(response.ok);
      } catch {
        setIsAdmin(false);
      }
    };

    checkAdmin();
  }, [userId, demoSessionId]);

  const handleBack = () => {
    selection();
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        {showBack ? (
          <div className="flex items-center gap-3 mb-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleBack}
              className="h-9 w-9"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-[var(--color-foreground)]">
                {title}
              </h1>
              {subtitle && (
                <p className="text-[var(--color-muted-foreground)] text-sm mt-0.5">
                  {subtitle}
                </p>
              )}
            </div>
            <motion.button
              onClick={() => {
                selection();
                clearMode();
                clearDemoSession();
                router.replace("/");
              }}
              className="h-10 w-10 rounded-xl bg-[var(--color-muted)]/20 flex items-center justify-center hover:bg-[var(--color-muted)]/30 transition-colors shrink-0"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              title="Retour à la sélection de démo"
            >
              <LayoutGrid className="w-5 h-5 text-[var(--color-foreground)]" />
            </motion.button>
            {isAdmin && (
              <motion.button
                onClick={() => {
                  selection();
                  router.push("/admin");
                }}
                className="h-10 w-10 rounded-xl bg-[var(--color-muted)]/20 flex items-center justify-center hover:bg-[var(--color-muted)]/30 transition-colors shrink-0"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                title="Panneau d'administration"
              >
                <Shield className="w-5 h-5 text-[var(--color-foreground)]" />
              </motion.button>
            )}
            {showInfoButton && (
              <motion.button
                onClick={() => {
                  selection();
                  setInfoOpen(true);
                }}
                className="h-10 w-10 rounded-xl bg-[var(--color-muted)]/20 flex items-center justify-center hover:bg-[var(--color-muted)]/30 transition-colors shrink-0"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                title="Informations"
              >
                <Info className="w-5 h-5 text-[var(--color-foreground)]" />
              </motion.button>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-between gap-3">
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-[var(--color-foreground)]">
                {title}
              </h1>
              {subtitle && (
                <p className="text-[var(--color-muted-foreground)] text-sm mt-1">
                  {subtitle}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <motion.button
                onClick={() => {
                  selection();
                  clearMode();
                  clearDemoSession();
                  router.replace("/");
                }}
                className="h-10 w-10 rounded-xl bg-[var(--color-muted)]/20 flex items-center justify-center hover:bg-[var(--color-muted)]/30 transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                title="Retour à la sélection de démo"
              >
                <LayoutGrid className="w-5 h-5 text-[var(--color-foreground)]" />
              </motion.button>
              <ThemeSwitcher />
              {isAdmin && (
                <motion.button
                  onClick={() => {
                    selection();
                    router.push("/admin");
                  }}
                  className="h-10 w-10 rounded-xl bg-[var(--color-muted)]/20 flex items-center justify-center hover:bg-[var(--color-muted)]/30 transition-colors shrink-0"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  title="Panneau d'administration"
                >
                  <Shield className="w-5 h-5 text-[var(--color-foreground)]" />
                </motion.button>
              )}
              {showInfoButton && (
                <motion.button
                  onClick={() => {
                    selection();
                    setInfoOpen(true);
                  }}
                  className="h-10 w-10 rounded-xl bg-[var(--color-muted)]/20 flex items-center justify-center hover:bg-[var(--color-muted)]/30 transition-colors shrink-0"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  title="Informations"
                >
                  <Info className="w-5 h-5 text-[var(--color-foreground)]" />
                </motion.button>
              )}
            </div>
          </div>
        )}
      </motion.div>

      <InfoDialog open={infoOpen} onOpenChange={setInfoOpen} />
    </>
  );
}
