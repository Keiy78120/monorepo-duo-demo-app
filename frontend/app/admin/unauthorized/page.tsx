"use client";

import { useRouter } from "next/navigation";
import { ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function UnauthorizedPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="text-center space-y-6 max-w-md">
        <div className="w-20 h-20 mx-auto rounded-full bg-red-500/10 flex items-center justify-center">
          <ShieldAlert className="w-10 h-10 text-red-500" />
        </div>

        <div>
          <h1 className="text-2xl font-bold text-[var(--color-foreground)] mb-2">
            Accès refusé
          </h1>
          <p className="text-[var(--color-muted-foreground)]">
            Vous n'avez pas les permissions nécessaires pour accéder à l'administration.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-orange-500/10 border border-orange-500/20 text-left">
          <p className="text-sm text-orange-600 dark:text-orange-400 leading-relaxed">
            💡 <strong>Pour devenir admin :</strong><br />
            1. Va sur <code className="px-1 py-0.5 rounded bg-orange-500/20 font-mono text-xs">/whoami</code><br />
            2. Copie ton Telegram User ID<br />
            3. Contacte l'administrateur principal
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <Button onClick={() => router.push("/whoami")} variant="outline">
            Voir mon ID Telegram
          </Button>
          <Button onClick={() => router.push("/")}>
            Retour à l'accueil
          </Button>
        </div>
      </div>
    </div>
  );
}
