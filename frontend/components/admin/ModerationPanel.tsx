"use client";

import { useEffect, useState } from "react";
import { Shield, Trash2, UserPlus, RefreshCw, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { adminFetch } from "@/lib/api/admin-fetch";
import { useAppModeStore } from "@/lib/store/app-mode";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Moderator = {
  id: string;
  telegram_user_id: string;
  role: "moderator" | "admin";
  added_by: string | null;
  created_at: string;
  updated_at: string;
};

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function ModerationPanel() {
  const mode = useAppModeStore((s) => s.mode);
  const [moderators, setModerators] = useState<Moderator[]>([]);
  const [loading, setLoading] = useState(true);
  const [newModeratorId, setNewModeratorId] = useState("");
  const [newModeratorRole, setNewModeratorRole] = useState<"moderator" | "admin">("moderator");
  const [adding, setAdding] = useState(false);

  const fetchModerators = async () => {
    setLoading(true);
    try {
      const response = await adminFetch("/api/moderators");
      if (response.ok) {
        const data = await response.json();
        setModerators(data);
      }
    } catch (error) {
      console.error("Failed to fetch moderators:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchModerators();
  }, []);

  const handleAddModerator = async () => {
    if (!newModeratorId.trim()) {
      alert("Veuillez entrer un Telegram User ID");
      return;
    }

    setAdding(true);
    try {
      const response = await adminFetch("/api/moderators", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          telegram_user_id: newModeratorId.trim(),
          role: newModeratorRole,
        }),
      });

      if (response.ok) {
        setNewModeratorId("");
        setNewModeratorRole("moderator");
        await fetchModerators();
      } else {
        const error = await response.json();
        alert(error.error || "Erreur lors de l'ajout");
      }
    } catch (error) {
      console.error("Failed to add moderator:", error);
      alert("Erreur lors de l'ajout du modérateur");
    } finally {
      setAdding(false);
    }
  };

  const handleDeleteModerator = async (id: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce modérateur ?")) {
      return;
    }

    try {
      const response = await adminFetch("/api/moderators", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });

      if (response.ok) {
        await fetchModerators();
      } else {
        alert("Erreur lors de la suppression");
      }
    } catch (error) {
      console.error("Failed to delete moderator:", error);
      alert("Erreur lors de la suppression du modérateur");
    }
  };

  return (
    <div className="space-y-6">
      {/* Telegram ID Instructions - Simple Mode Only */}
      {mode === "simple" && (
        <div className="glass-card rounded-3xl p-6 border-2 border-blue-500/20">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-2xl bg-blue-500/10 flex items-center justify-center shrink-0">
              <Info className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-[var(--color-foreground)] mb-2">
                Comment obtenir un Telegram ID
              </h3>
              <p className="text-sm text-[var(--color-muted-foreground)] leading-relaxed">
                Pour modérer un utilisateur, vous avez besoin de son Telegram ID.
                Demandez à l'utilisateur d'ouvrir l'app et de visiter la page{" "}
                <code className="px-1.5 py-0.5 bg-[var(--color-muted)] rounded text-xs font-mono">
                  /whoami
                </code>{" "}
                (ou Menu → Mon Profil) pour copier son ID Telegram.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Add Moderator Form */}
      <div className="glass-card rounded-3xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-10 w-10 rounded-2xl bg-[var(--color-primary)]/10 flex items-center justify-center">
            <UserPlus className="h-5 w-5 text-[var(--color-primary)]" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-[var(--color-foreground)]">
              Ajouter un modérateur
            </h2>
            <p className="text-sm text-[var(--color-muted-foreground)]">
              Entrez le Telegram User ID et sélectionnez le rôle
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <label className="text-sm font-medium text-[var(--color-foreground)] mb-1.5 block">
              Telegram User ID
            </label>
            <Input
              type="text"
              placeholder="123456789"
              value={newModeratorId}
              onChange={(e) => setNewModeratorId(e.target.value)}
              disabled={adding}
            />
          </div>

          <div className="w-full sm:w-48">
            <label className="text-sm font-medium text-[var(--color-foreground)] mb-1.5 block">
              Rôle
            </label>
            <Select
              value={newModeratorRole}
              onValueChange={(value) => setNewModeratorRole(value as "moderator" | "admin")}
              disabled={adding}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="moderator">Modérateur</SelectItem>
                <SelectItem value="admin">Administrateur</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button
            onClick={handleAddModerator}
            disabled={adding || !newModeratorId.trim()}
            className="gap-2"
          >
            <UserPlus className="h-4 w-4" />
            Ajouter
          </Button>
        </div>
      </div>

      {/* Moderators List */}
      <div className="glass-card rounded-3xl p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-[var(--color-foreground)]">
              Liste des modérateurs
            </h2>
            <p className="text-sm text-[var(--color-muted-foreground)]">
              {moderators.length} modérateur{moderators.length > 1 ? "s" : ""}
            </p>
          </div>
          <Button variant="ghost" size="sm" className="gap-2" onClick={fetchModerators}>
            <RefreshCw className="h-4 w-4" />
            Actualiser
          </Button>
        </div>

        <div className="space-y-3">
          {loading
            ? Array.from({ length: 3 }).map((_, index) => (
                <div
                  key={index}
                  className="rounded-2xl border border-[var(--color-border)] p-4"
                >
                  <div className="flex items-center justify-between gap-4">
                    <Skeleton className="h-6 w-40" />
                    <Skeleton className="h-5 w-20" />
                  </div>
                  <div className="mt-4 grid gap-2 sm:grid-cols-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                  </div>
                </div>
              ))
            : moderators.map((moderator) => (
                <div
                  key={moderator.id}
                  className="rounded-2xl border border-[var(--color-border)] p-4 transition hover:border-[var(--color-primary)]/40"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-11 w-11 rounded-xl bg-[var(--color-primary)]/10 flex items-center justify-center">
                        <Shield className={`h-5 w-5 ${
                          moderator.role === "admin"
                            ? "text-amber-500"
                            : "text-[var(--color-primary)]"
                        }`} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-mono text-sm font-semibold text-[var(--color-foreground)]">
                            {moderator.telegram_user_id}
                          </p>
                          <Badge
                            variant={moderator.role === "admin" ? "destructive" : "secondary"}
                          >
                            {moderator.role === "admin" ? "Administrateur" : "Modérateur"}
                          </Badge>
                        </div>
                        <p className="text-sm text-[var(--color-muted-foreground)]">
                          Ajouté le {formatDate(moderator.created_at)}
                        </p>
                      </div>
                    </div>

                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteModerator(moderator.id)}
                      className="text-red-500 hover:text-red-600 hover:bg-red-500/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}

          {!loading && moderators.length === 0 && (
            <div className="rounded-2xl border border-dashed border-[var(--color-border)] p-10 text-center text-sm text-[var(--color-muted-foreground)]">
              Aucun modérateur ajouté pour le moment.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
