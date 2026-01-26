"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { IoArrowBack, IoInformationCircle } from "react-icons/io5";
import { Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useHapticFeedback, useTelegramStore } from "@/lib/store/telegram";
import { InfoDialog } from "@/components/InfoDialog";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";
import { useAppModeStore } from "@/lib/store/app-mode";

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
  const isSimple = mode === "simple";
  const showInfoButton = showInfo && !isSimple;

  useEffect(() => {
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
  }, [userId]);

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
              <IoArrowBack className="w-5 h-5" />
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
            {isAdmin && (
              <motion.button
                onClick={() => {
                  selection();
                  router.push("/admin");
                }}
                className="h-10 w-10 rounded-xl bg-red-600 flex items-center justify-center shadow-md shrink-0"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                animate={{
                  boxShadow: [
                    "0 2px 8px rgba(220, 38, 38, 0.4)",
                    "0 4px 12px rgba(220, 38, 38, 0.5)",
                    "0 2px 8px rgba(220, 38, 38, 0.4)",
                  ],
                }}
                transition={{
                  boxShadow: {
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                  },
                }}
              >
                <Shield className="w-5 h-5 text-white" />
              </motion.button>
            )}
            {showInfoButton && (
              <motion.button
                onClick={() => {
                  selection();
                  setInfoOpen(true);
                }}
                className="relative h-10 w-10 rounded-xl bg-[var(--color-primary)] flex items-center justify-center shadow-md"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                animate={{
                  boxShadow: [
                    "0 2px 8px oklch(0.50 0.12 20 / 0.3)",
                    "0 4px 12px oklch(0.50 0.12 20 / 0.4)",
                    "0 2px 8px oklch(0.50 0.12 20 / 0.3)",
                  ],
                }}
                transition={{
                  boxShadow: {
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                  },
                }}
              >
                <motion.div
                  animate={{
                    scale: [1, 1.08, 1],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                >
                  <IoInformationCircle className="w-6 h-6 text-white" />
                </motion.div>
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
              <ThemeSwitcher />
              {isAdmin && (
                <motion.button
                  onClick={() => {
                    selection();
                    router.push("/admin");
                  }}
                  className="h-10 w-10 rounded-xl bg-red-600 flex items-center justify-center shadow-md shrink-0"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  animate={{
                    boxShadow: [
                      "0 2px 8px rgba(220, 38, 38, 0.4)",
                      "0 4px 12px rgba(220, 38, 38, 0.5)",
                      "0 2px 8px rgba(220, 38, 38, 0.4)",
                    ],
                  }}
                  transition={{
                    boxShadow: {
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut",
                    },
                  }}
                >
                  <Shield className="w-5 h-5 text-white" />
                </motion.button>
              )}
              {showInfoButton && (
                <motion.button
                  onClick={() => {
                    selection();
                    setInfoOpen(true);
                  }}
                  className="relative h-10 w-10 rounded-xl bg-[var(--color-primary)] flex items-center justify-center shadow-md shrink-0"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  animate={{
                    boxShadow: [
                      "0 2px 8px oklch(0.50 0.12 20 / 0.3)",
                      "0 4px 12px oklch(0.50 0.12 20 / 0.4)",
                      "0 2px 8px oklch(0.50 0.12 20 / 0.3)",
                    ],
                  }}
                  transition={{
                    boxShadow: {
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut",
                    },
                  }}
                >
                  <motion.div
                    animate={{
                      scale: [1, 1.08, 1],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  >
                    <IoInformationCircle className="w-6 h-6 text-white" />
                  </motion.div>
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
