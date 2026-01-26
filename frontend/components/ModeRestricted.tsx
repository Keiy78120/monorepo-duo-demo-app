"use client";

import { motion } from "motion/react";
import { ArrowLeft, Lock } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

interface ModeRestrictedProps {
  title?: string;
  description?: string;
}

export function ModeRestricted({
  title = "Disponible en démo avancée",
  description = "Cette page n’est pas accessible dans la démo simple.",
}: ModeRestrictedProps) {
  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-background)] p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm glass-card rounded-3xl p-8 text-center"
      >
        <div className="mx-auto mb-4 h-12 w-12 rounded-2xl bg-[var(--color-primary)]/15 flex items-center justify-center">
          <Lock className="h-5 w-5 text-[var(--color-primary)]" />
        </div>
        <h1 className="text-xl font-semibold text-[var(--color-foreground)] mb-2">
          {title}
        </h1>
        <p className="text-sm text-[var(--color-muted-foreground)] mb-6">
          {description}
        </p>
        <Button onClick={() => router.back()} className="w-full">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour
        </Button>
      </motion.div>
    </div>
  );
}
