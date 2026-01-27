"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/**
 * Global Error Boundary
 *
 * Catches and displays errors in a user-friendly way.
 * Provides a reset button to try recovering from the error.
 */
export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log error to console for debugging
    console.error("Error boundary caught:", error);

    // TODO: Send error to error tracking service (Sentry, etc.)
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[var(--color-background)]">
      <div className="glass-card p-8 max-w-md w-full text-center">
        <div className="flex justify-center mb-6">
          <div className="h-16 w-16 rounded-full bg-[var(--color-destructive)]/10 flex items-center justify-center">
            <AlertTriangle className="h-8 w-8 text-[var(--color-destructive)]" />
          </div>
        </div>

        <h2 className="text-2xl font-bold text-[var(--color-foreground)] mb-4">
          Quelque chose s'est mal passé
        </h2>

        <p className="text-[var(--color-muted-foreground)] mb-6 leading-relaxed">
          {error.message || "Une erreur inattendue s'est produite. Veuillez réessayer."}
        </p>

        {error.digest && (
          <p className="text-xs text-[var(--color-muted-foreground)] mb-6 font-mono">
            ID: {error.digest}
          </p>
        )}

        <div className="flex flex-col gap-3">
          <Button onClick={reset} className="w-full">
            Réessayer
          </Button>

          <Button
            variant="ghost"
            onClick={() => window.location.href = "/"}
            className="w-full"
          >
            Retour à l'accueil
          </Button>
        </div>
      </div>
    </div>
  );
}
