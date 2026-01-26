"use client";

import { motion } from "motion/react";
import { ArrowRight, Sparkles, Zap } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useAppModeStore } from "@/lib/store/app-mode";
import { useDemoSessionStore } from "@/lib/store/demo-session";

export function ModeSelector() {
  const router = useRouter();
  const { setMode } = useAppModeStore();
  const { initDemoSession } = useDemoSessionStore();

  const handleSelect = (mode: "simple" | "advanced") => {
    // Initialize demo session with UUID
    initDemoSession();
    setMode(mode);
    router.replace("/");
  };

  return (
    <div className="min-h-screen bg-[var(--color-background)] px-5 py-10">
      <div className="mx-auto w-full max-w-xl space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-2"
        >
          <p className="text-xs uppercase tracking-[0.3em] text-[var(--color-muted-foreground)]">
            YX-MINI-APP
          </p>
          <h1 className="text-3xl font-bold text-[var(--color-foreground)] text-balance">
            Quelle démo veux-tu voir ?
          </h1>
          <p className="text-sm text-[var(--color-muted-foreground)]">
            Choisis un mode et on t’emmène directement vers la bonne expérience.
          </p>
        </motion.div>

        <div className="grid gap-4">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-card rounded-[1.5rem] p-5 border border-[var(--color-border)]/60"
          >
            <div className="flex items-start gap-3">
              <div className="h-11 w-11 rounded-2xl bg-[var(--color-primary)]/15 flex items-center justify-center">
                <Zap className="h-5 w-5 text-[var(--color-primary)]" />
              </div>
              <div className="flex-1 space-y-1">
                <h2 className="text-lg font-semibold text-[var(--color-foreground)]">Démo Simple</h2>
                <p className="text-sm text-[var(--color-muted-foreground)]">
                  Catalogue, panier, commande Telegram, admin minimal.
                </p>
              </div>
            </div>
            <Button
              className="mt-4 w-full rounded-[1rem] h-12"
              onClick={() => handleSelect("simple")}
            >
              Ouvrir la démo simple
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass-card rounded-[1.5rem] p-5 border border-[var(--color-border)]/60"
          >
            <div className="flex items-start gap-3">
              <div className="h-11 w-11 rounded-2xl bg-[var(--color-accent)]/15 flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-[var(--color-accent)]" />
              </div>
              <div className="flex-1 space-y-1">
                <h2 className="text-lg font-semibold text-[var(--color-foreground)]">Démo Advanced</h2>
                <p className="text-sm text-[var(--color-muted-foreground)]">
                  Dashboard complet, features avancées, gestion étendue.
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              className="mt-4 w-full rounded-[1rem] h-12"
              onClick={() => handleSelect("advanced")}
            >
              Ouvrir la démo advanced
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </motion.div>
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-center text-xs text-[var(--color-muted-foreground)]"
        >
          Tu peux changer de mode à tout moment depuis l’admin.
        </motion.p>
      </div>
    </div>
  );
}
