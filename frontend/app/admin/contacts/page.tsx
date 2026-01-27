"use client";

import { useEffect, useMemo, useState } from "react";
import { Users, Search, Copy, Check, RefreshCw, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { adminFetch } from "@/lib/api/admin-fetch";
import { useAppModeStore } from "@/lib/store/app-mode";
import { ModerationPanel } from "@/components/admin/ModerationPanel";

type TelegramContact = {
  telegram_user_id: number;
  username: string | null;
  first_name: string | null;
  last_name: string | null;
  language_code: string | null;
  is_premium: boolean | null;
  is_admin: boolean | null;
  first_seen_at: string;
  last_seen_at: string;
  visits_count: number;
};

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export default function AdminContactsPage() {
  const { mode } = useAppModeStore();
  const isSimple = mode === "simple";
  const [contacts, setContacts] = useState<TelegramContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const fetchContacts = async () => {
    setLoading(true);
    try {
      const response = await adminFetch("/api/admin/contacts");
      if (response.ok) {
        const data = await response.json();
        setContacts(data);
      }
    } catch (error) {
      console.error("Failed to fetch contacts:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContacts();
  }, []);

  const filteredContacts = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return contacts;
    return contacts.filter((contact) => {
      const fullName = `${contact.first_name || ""} ${contact.last_name || ""}`.trim();
      return (
        String(contact.telegram_user_id).includes(term) ||
        (contact.username || "").toLowerCase().includes(term) ||
        fullName.toLowerCase().includes(term)
      );
    });
  }, [contacts, query]);

  const handleCopy = async (id: number) => {
    await navigator.clipboard.writeText(String(id));
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const handleToggleAdmin = async (contact: TelegramContact) => {
    const newIsAdmin = !contact.is_admin;

    // Optimistic update
    setContacts((prev) =>
      prev.map((c) =>
        c.telegram_user_id === contact.telegram_user_id
          ? { ...c, is_admin: newIsAdmin }
          : c
      )
    );

    try {
      const response = await adminFetch("/api/admin/contacts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          telegram_user_id: contact.telegram_user_id,
          is_admin: newIsAdmin,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update");
      }
    } catch (error) {
      console.error("Failed to toggle admin:", error);
      // Revert on error
      setContacts((prev) =>
        prev.map((c) =>
          c.telegram_user_id === contact.telegram_user_id
            ? { ...c, is_admin: contact.is_admin }
            : c
        )
      );
    }
  };

  // Show ModerationPanel in Simple mode
  if (isSimple) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-[var(--color-primary)]/10 flex items-center justify-center">
            <Shield className="h-5 w-5 text-[var(--color-primary)]" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-[var(--color-foreground)]">
              Modération
            </h1>
            <p className="text-sm text-[var(--color-muted-foreground)]">
              Gérer les modérateurs et administrateurs
            </p>
          </div>
        </div>
        <ModerationPanel />
      </div>
    );
  }

  // Show ContactsTable in Advanced mode
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-[var(--color-primary)]/10 flex items-center justify-center">
              <Users className="h-5 w-5 text-[var(--color-primary)]" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-[var(--color-foreground)]">
                Contacts Telegram
              </h1>
              <p className="text-sm text-[var(--color-muted-foreground)]">
                Traçabilité des utilisateurs connectés à la mini app.
              </p>
            </div>
          </div>
        </div>
        <Button variant="ghost" className="w-fit gap-2" onClick={fetchContacts}>
          <RefreshCw className="h-4 w-4" />
          Actualiser
        </Button>
      </div>

      <div className="glass-card rounded-3xl p-6 space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-muted-foreground)]" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Rechercher par ID, username ou nom"
              className="pl-9"
            />
          </div>
          <div className="text-sm text-[var(--color-muted-foreground)]">
            {filteredContacts.length} utilisateur{filteredContacts.length > 1 ? "s" : ""}
          </div>
        </div>

        <div className="space-y-3">
          {loading
            ? Array.from({ length: 5 }).map((_, index) => (
                <div
                  key={index}
                  className="rounded-2xl border border-[var(--color-border)] p-4"
                >
                  <div className="flex items-center justify-between gap-4">
                    <Skeleton className="h-6 w-40" />
                    <Skeleton className="h-5 w-20" />
                  </div>
                  <div className="mt-4 grid gap-2 sm:grid-cols-3">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                  </div>
                </div>
              ))
            : filteredContacts.map((contact) => {
                const fullName = `${contact.first_name || ""} ${contact.last_name || ""}`.trim();
                return (
                  <div
                    key={contact.telegram_user_id}
                    className="rounded-2xl border border-[var(--color-border)] p-4 transition hover:border-[var(--color-primary)]/40"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-11 w-11 rounded-xl bg-[var(--color-primary)]/10 flex items-center justify-center text-sm font-semibold text-[var(--color-primary)]">
                          {(contact.username || contact.first_name || "U")[0]?.toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-[var(--color-foreground)]">
                              {contact.username ? `@${contact.username}` : "Sans username"}
                            </p>
                            {contact.is_admin && (
                              <Badge className="bg-amber-500/20 text-amber-600 border-amber-500/30">
                                <Shield className="h-3 w-3 mr-1" />
                                Admin
                              </Badge>
                            )}
                            {contact.is_premium ? (
                              <Badge variant="secondary">Premium</Badge>
                            ) : null}
                          </div>
                          <p className="text-sm text-[var(--color-muted-foreground)]">
                            {fullName || "Nom non renseigné"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant="outline">Visites: {contact.visits_count}</Badge>

                        {/* Admin Toggle */}
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[var(--color-muted)]/30">
                          <Shield className={`h-4 w-4 ${contact.is_admin ? "text-amber-500" : "text-[var(--color-muted-foreground)]"}`} />
                          <span className="text-xs font-medium text-[var(--color-muted-foreground)]">Admin</span>
                          <Switch
                            checked={contact.is_admin === true}
                            onCheckedChange={() => handleToggleAdmin(contact)}
                          />
                        </div>

                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleCopy(contact.telegram_user_id)}
                        >
                          {copiedId === contact.telegram_user_id ? (
                            <Check className="h-4 w-4 text-green-500" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>

                    <div className="mt-4 grid gap-3 text-sm text-[var(--color-muted-foreground)] sm:grid-cols-3">
                      <div>
                        <p className="text-xs uppercase tracking-wide">Telegram ID</p>
                        <p className="font-mono text-[var(--color-foreground)]">
                          {contact.telegram_user_id}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-wide">Dernière connexion</p>
                        <p className="text-[var(--color-foreground)]">
                          {formatDate(contact.last_seen_at)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-wide">Première connexion</p>
                        <p className="text-[var(--color-foreground)]">
                          {formatDate(contact.first_seen_at)}
                        </p>
                      </div>
                    </div>

                    {contact.language_code ? (
                      <div className="mt-3 text-xs text-[var(--color-muted-foreground)]">
                        Langue: <span className="text-[var(--color-foreground)]">{contact.language_code}</span>
                      </div>
                    ) : null}
                  </div>
                );
              })}

          {!loading && filteredContacts.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[var(--color-border)] p-10 text-center text-sm text-[var(--color-muted-foreground)]">
              Aucun contact trouvé.
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
