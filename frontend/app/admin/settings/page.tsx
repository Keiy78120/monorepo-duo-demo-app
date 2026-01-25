"use client";

import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Save, Plus, Trash2, Loader2, ExternalLink, AlertTriangle, Sparkles } from "lucide-react";
import { SettingsAIDialog } from "@/components/admin/SettingsAIDialog";
import type { ParsedSettings } from "@/app/api/admin/ai/parse-settings/route";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { adminFetch } from "@/lib/api/admin-fetch";

interface InfoSection {
  id: string;
  title: string;
  content: string;
}

interface ContactInfo {
  hours: string;
  address: string;
  phone: string;
  email: string;
  telegram: string;
}

interface Feature {
  id: string;
  icon: string;
  title: string;
  description: string;
}

interface CustomLink {
  id: string;
  name: string;
  url: string;
}

interface AppSettings {
  info: {
    sections: InfoSection[];
    contact: ContactInfo;
    features: Feature[];
  };
  general: {
    storeName: string;
    currency: string;
    freeDeliveryThreshold: number;
    telegramBotUsername: string;
    maintenanceMode: boolean;
  };
  customLinks: CustomLink[];
}

// Default empty settings
const defaultSettings: AppSettings = {
  info: {
    sections: [],
    contact: {
      hours: "",
      address: "",
      phone: "",
      email: "",
      telegram: "",
    },
    features: [],
  },
  general: {
    storeName: "",
    currency: "EUR",
    freeDeliveryThreshold: 5000,
    telegramBotUsername: "",
    maintenanceMode: false,
  },
  customLinks: [],
};

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [orderWarningMessage, setOrderWarningMessage] = useState<string>("");
  const [savingWarning, setSavingWarning] = useState(false);
  const [emergencyOpen, setEmergencyOpen] = useState(false);
  const [emergencyConfirm, setEmergencyConfirm] = useState("");
  const [emergencyLoading, setEmergencyLoading] = useState(false);
  const [emergencyError, setEmergencyError] = useState<string | null>(null);
  const [purgeData, setPurgeData] = useState(false);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [maintenanceLoading, setMaintenanceLoading] = useState(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState("On revient très vite.");
  const [savingMaintenanceMessage, setSavingMaintenanceMessage] = useState(false);
  const [nukeEnabled, setNukeEnabled] = useState(false);
  const [nukeMissing, setNukeMissing] = useState<string[]>([]);
  const [nukeExternal, setNukeExternal] = useState(false);
  const [nukeArmed, setNukeArmed] = useState(false);
  const [nukeCountdown, setNukeCountdown] = useState(0);
  const [successOpen, setSuccessOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState("Sauvegarde effectuée");
  const [aiDialogOpen, setAIDialogOpen] = useState(false);

  // Fetch settings
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        // Fetch app settings from API
        const settingsResponse = await adminFetch("/api/settings?key=app_settings");
        if (settingsResponse.ok) {
          const data = await settingsResponse.json();
          if (data?.setting?.value) {
            try {
              const parsed = typeof data.setting.value === "string"
                ? JSON.parse(data.setting.value)
                : data.setting.value;
              setSettings({ ...defaultSettings, ...parsed });
            } catch {
              setSettings(defaultSettings);
            }
          } else {
            setSettings(defaultSettings);
          }
        } else {
          setSettings(defaultSettings);
        }

        // Fetch order warning message
        const response = await adminFetch("/api/settings?key=order_warning_message");
        if (response.ok) {
          const data = await response.json();
          if (data.setting?.value) {
            setOrderWarningMessage(data.setting.value);
          }
        }

        // Fetch maintenance mode
        const maintenanceResponse = await adminFetch(
          "/api/settings?key=maintenance_mode"
        );
        if (maintenanceResponse.ok) {
          const data = await maintenanceResponse.json();
          const value = String(data?.setting?.value ?? "")
            .toLowerCase()
            .trim();
          setMaintenanceMode(value === "true" || value === "1");
        }

        const maintenanceMessageResponse = await adminFetch(
          "/api/settings?key=emergency_message"
        );
        if (maintenanceMessageResponse.ok) {
          const messageData = await maintenanceMessageResponse.json();
          if (typeof messageData?.setting?.value === "string") {
            setMaintenanceMessage(messageData.setting.value);
          }
        }

        // Fetch emergency nuke config
        const nukeResponse = await adminFetch("/api/admin/emergency/nuke");
        if (nukeResponse.ok) {
          const data = await nukeResponse.json();
          setNukeEnabled(Boolean(data?.enabled));
          setNukeMissing(Array.isArray(data?.missing) ? data.missing : []);
        }
      } catch (error) {
        console.error("Échec du chargement des paramètres:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  // Save settings
  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await adminFetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: "app_settings",
          value: JSON.stringify(settings),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save settings");
      }

      setSuccessMessage("Sauvegarde effectuée");
      setSuccessOpen(true);
    } catch (error) {
      console.error("Échec de l'enregistrement:", error);
    } finally {
      setSaving(false);
    }
  };

  // Update nested setting
  const updateSetting = (path: string[], value: any) => {
    if (!settings) return;

    setSettings((prev) => {
      if (!prev) return prev;

      const updated = { ...prev };
      let current: any = updated;

      for (let i = 0; i < path.length - 1; i++) {
        current[path[i]] = { ...current[path[i]] };
        current = current[path[i]];
      }

      current[path[path.length - 1]] = value;
      return updated;
    });
  };

  // Add info section
  const addSection = () => {
    if (!settings) return;

    const newSection: InfoSection = {
      id: Date.now().toString(),
      title: "Nouvelle section",
      content: "",
    };

    updateSetting(["info", "sections"], [...settings.info.sections, newSection]);
  };

  // Remove info section
  const removeSection = (id: string) => {
    if (!settings) return;

    updateSetting(
      ["info", "sections"],
      settings.info.sections.filter((s) => s.id !== id)
    );
  };

  // Update info section
  const updateSection = (id: string, field: keyof InfoSection, value: string) => {
    if (!settings) return;

    updateSetting(
      ["info", "sections"],
      settings.info.sections.map((s) =>
        s.id === id ? { ...s, [field]: value } : s
      )
    );
  };

  // Add custom link
  const addCustomLink = () => {
    if (!settings) return;

    const newLink: CustomLink = {
      id: Date.now().toString(),
      name: "",
      url: "",
    };

    updateSetting(["customLinks"], [...settings.customLinks, newLink]);
  };

  // Remove custom link
  const removeCustomLink = (id: string) => {
    if (!settings) return;

    updateSetting(
      ["customLinks"],
      settings.customLinks.filter((l) => l.id !== id)
    );
  };

  // Update custom link
  const updateCustomLink = (id: string, field: keyof CustomLink, value: string) => {
    if (!settings) return;

    updateSetting(
      ["customLinks"],
      settings.customLinks.map((l) =>
        l.id === id ? { ...l, [field]: value } : l
      )
    );
  };

  // Save order warning message
  const handleSaveWarningMessage = async () => {
    setSavingWarning(true);
    try {
      const response = await adminFetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: "order_warning_message",
          value: orderWarningMessage,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save");
      }

      setSuccessMessage("Sauvegarde effectuée");
      setSuccessOpen(true);
    } catch (error) {
      console.error("Failed to save warning message:", error);
    } finally {
      setSavingWarning(false);
    }
  };

  const handleToggleMaintenance = async (nextValue: boolean) => {
    setMaintenanceLoading(true);
    try {
      if (nextValue) {
        const messageValue = maintenanceMessage?.trim() || "On revient très vite.";
        const messageResponse = await adminFetch("/api/settings", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            key: "emergency_message",
            value: messageValue,
          }),
        });

        if (!messageResponse.ok) {
          throw new Error("Failed to update maintenance message");
        }

        if (!maintenanceMessage?.trim()) {
          setMaintenanceMessage(messageValue);
        }
      }

      const response = await adminFetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: "maintenance_mode",
          value: nextValue,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update maintenance");
      }

      setMaintenanceMode(nextValue);
      setSuccessMessage(
        nextValue ? "Maintenance activée" : "Boutique réactivée"
      );
      setSuccessOpen(true);
    } catch (error) {
      console.error("Failed to toggle maintenance:", error);
    } finally {
      setMaintenanceLoading(false);
    }
  };

  const handleSaveMaintenanceMessage = async () => {
    setSavingMaintenanceMessage(true);
    try {
      const messageValue = maintenanceMessage?.trim() || "On revient très vite.";
      const response = await adminFetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: "emergency_message",
          value: messageValue,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save maintenance message");
      }

      if (!maintenanceMessage?.trim()) {
        setMaintenanceMessage(messageValue);
      }
      setSuccessMessage("Message maintenance sauvegardé");
      setSuccessOpen(true);
    } catch (error) {
      console.error("Failed to save maintenance message:", error);
    } finally {
      setSavingMaintenanceMessage(false);
    }
  };

  const normalizeConfirmation = (value: string) =>
    value
      .toLowerCase()
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "")
      .replace(/\s+/g, " ")
      .trim();

  const handleEmergencyAction = async () => {
    const confirmation = normalizeConfirmation(emergencyConfirm);
    if (confirmation !== "je suis sur") {
      setEmergencyError("Veuillez écrire exactement : je suis sûr");
      return;
    }

    if (nukeExternal && !nukeArmed) {
      setEmergencyError("Arme l'option nuke avant de confirmer.");
      return;
    }

    if (nukeExternal && nukeCountdown > 0) {
      setEmergencyError("Attends la fin du compte à rebours avant de confirmer.");
      return;
    }

    setEmergencyLoading(true);
    setEmergencyError(null);
    try {
      const response = await adminFetch("/api/admin/emergency", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmation: emergencyConfirm, purge: purgeData }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || "Erreur lors de l'activation");
      }

      if (nukeExternal) {
        const nukeResponse = await adminFetch("/api/admin/emergency/nuke", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ confirmation: emergencyConfirm }),
        });
        const nukeData = await nukeResponse.json();
        if (!nukeResponse.ok) {
          throw new Error(nukeData?.error || "Échec de la suppression externe");
        }
      }

      setMaintenanceMode(true);
      if (purgeData || nukeExternal) {
        setSuccessMessage("Nuke action exécutée");
      } else {
        setSuccessMessage("Mode maintenance activé");
      }
      setSuccessOpen(true);
      setEmergencyOpen(false);
      setEmergencyConfirm("");
      setNukeArmed(false);
      setNukeCountdown(0);
    } catch (error) {
      console.error("Emergency action failed:", error);
      setEmergencyError("Impossible d'activer l'urgence pour le moment.");
    } finally {
      setEmergencyLoading(false);
    }
  };

  const handleArmNuke = () => {
    if (!nukeExternal) {
      setEmergencyError("Active d'abord l'option nuke externe.");
      return;
    }

    setNukeArmed(true);
    setNukeCountdown(10);
    setEmergencyError(null);
  };

  useEffect(() => {
    if (!nukeArmed || nukeCountdown <= 0) return;
    const timer = setTimeout(() => {
      setNukeCountdown((prev) => Math.max(prev - 1, 0));
    }, 1000);
    return () => clearTimeout(timer);
  }, [nukeArmed, nukeCountdown]);

  useEffect(() => {
    if (!nukeExternal) {
      setNukeArmed(false);
      setNukeCountdown(0);
    }
  }, [nukeExternal]);

  // Handle AI-parsed settings
  const handleApplyAISettings = (parsed: ParsedSettings) => {
    if (!settings) return;

    setSettings((prev) => {
      if (!prev) return prev;

      const updated = { ...prev };

      // Apply store name
      if (parsed.storeName) {
        updated.general = { ...updated.general, storeName: parsed.storeName };
      }

      // Apply currency if detected
      if (parsed.currency) {
        updated.general = { ...updated.general, currency: parsed.currency };
      }

      // Apply free delivery threshold
      if (parsed.freeDeliveryThreshold) {
        updated.general = {
          ...updated.general,
          freeDeliveryThreshold: parsed.freeDeliveryThreshold,
        };
      }

      // Apply contact info
      if (parsed.contact) {
        updated.info = {
          ...updated.info,
          contact: {
            ...updated.info.contact,
            hours: parsed.contact.hours || updated.info.contact.hours,
            address: parsed.contact.address || updated.info.contact.address,
            phone: parsed.contact.phone || updated.info.contact.phone,
            email: parsed.contact.email || updated.info.contact.email,
            telegram: parsed.contact.telegram || updated.info.contact.telegram,
          },
        };
      }

      // Apply custom links (merge with existing)
      if (parsed.customLinks && parsed.customLinks.length > 0) {
        const newLinks = parsed.customLinks.map((link, index) => ({
          id: `ai-${Date.now()}-${index}`,
          name: link.name,
          url: link.url,
        }));
        updated.customLinks = [...updated.customLinks, ...newLinks];
      }

      // Apply sections (merge with existing)
      if (parsed.sections && parsed.sections.length > 0) {
        const newSections = parsed.sections.map((section, index) => ({
          id: `ai-${Date.now()}-${index}`,
          title: section.title,
          content: section.content,
        }));
        updated.info = {
          ...updated.info,
          sections: [...updated.info.sections, ...newSections],
        };
      }

      return updated;
    });

    setSuccessMessage("Paramètres importés avec succès");
    setSuccessOpen(true);
  };

  if (loading || !settings) {
    return (
      <div>
        <div className="mb-8">
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-12 w-full mb-6" />
        <div className="space-y-4">
          <Skeleton className="h-48 w-full rounded-2xl" />
          <Skeleton className="h-48 w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-foreground)]">
            Paramètres
          </h1>
          <p className="text-[var(--color-muted-foreground)] text-sm mt-1">
            Gérer les paramètres de la boutique
          </p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button
            variant="warning"
            onClick={() => setAIDialogOpen(true)}
            className="flex-1 sm:flex-none"
          >
            <Sparkles className="w-5 h-5 mr-2" />
            Importer avec IA
          </Button>
          <Button variant="success" onClick={handleSave} disabled={saving} className="flex-1 sm:flex-none">
            {saving ? (
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            ) : (
              <Save className="w-5 h-5 mr-2" />
            )}
            {saving ? "Enregistrement..." : "Enregistrer"}
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="general" className="space-y-6">
        <TabsList>
          <TabsTrigger value="general">Général</TabsTrigger>
          <TabsTrigger value="orders">Commandes</TabsTrigger>
          <TabsTrigger value="info">Page Infos</TabsTrigger>
          <TabsTrigger value="contact">Contact</TabsTrigger>
          <TabsTrigger value="links">Liens</TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Paramètres généraux</CardTitle>
                <CardDescription>
                  Configuration de base de votre boutique
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="storeName">Nom de la boutique</Label>
                    <Input
                      id="storeName"
                      value={settings.general.storeName}
                      onChange={(e) =>
                        updateSetting(["general", "storeName"], e.target.value)
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="currency">Devise</Label>
                    <Input
                      id="currency"
                      value={settings.general.currency}
                      onChange={(e) =>
                        updateSetting(["general", "currency"], e.target.value)
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="freeDelivery">
                      Seuil livraison gratuite (centimes)
                    </Label>
                    <Input
                      id="freeDelivery"
                      type="number"
                      value={settings.general.freeDeliveryThreshold}
                      onChange={(e) =>
                        updateSetting(
                          ["general", "freeDeliveryThreshold"],
                          parseInt(e.target.value) || 0
                        )
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="botUsername">Bot Telegram</Label>
                    <Input
                      id="botUsername"
                      value={settings.general.telegramBotUsername}
                      onChange={(e) =>
                        updateSetting(
                          ["general", "telegramBotUsername"],
                          e.target.value
                        )
                      }
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 rounded-xl bg-[var(--color-glass)]">
                  <div>
                    <p className="font-medium text-[var(--color-foreground)]">
                      Mode maintenance
                    </p>
                    <p className="text-sm text-[var(--color-muted-foreground)]">
                      Désactiver temporairement la boutique
                    </p>
                  </div>
                  <Switch
                    checked={maintenanceMode}
                    onCheckedChange={(checked) => handleToggleMaintenance(checked)}
                    disabled={maintenanceLoading}
                  />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        {/* Orders Settings */}
        <TabsContent value="orders">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Paramètres des commandes</CardTitle>
                <CardDescription>
                  Message d'avertissement affiché lors du checkout
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="warningMessage">
                    Message d'avertissement
                  </Label>
                  <Textarea
                    id="warningMessage"
                    value={orderWarningMessage}
                    onChange={(e) => setOrderWarningMessage(e.target.value)}
                    placeholder="Ex: ⚠️ Important : Soyez bien chez vous. Les livraisons commencent à 12h00..."
                    rows={4}
                    className="resize-none"
                  />
                  <p className="text-xs text-[var(--color-muted-foreground)]">
                    Ce message sera affiché aux clients lors de la finalisation de leur commande.
                  </p>
                </div>

                <div className="flex justify-end">
                  <Button variant="success" onClick={handleSaveWarningMessage} disabled={savingWarning}>
                    {savingWarning ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Enregistrement...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Enregistrer
                      </>
                    )}
                  </Button>
                </div>

                {/* Preview */}
                {orderWarningMessage && (
                  <div className="space-y-2">
                    <Label>Aperçu</Label>
                    <div className="p-4 rounded-xl bg-orange-500/10 border border-orange-500/20">
                      <p className="text-sm text-orange-600 dark:text-orange-400 leading-relaxed whitespace-pre-line">
                        {orderWarningMessage}
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        {/* Info Page Settings */}
        <TabsContent value="info">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Sections de la page Infos</CardTitle>
                    <CardDescription>
                      Contenu affiché sur la page Infos
                    </CardDescription>
                  </div>
                  <Button variant="warning" size="sm" onClick={addSection}>
                    <Plus className="w-4 h-4 mr-2" />
                    Ajouter
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {settings.info.sections.map((section, index) => (
                  <motion.div
                    key={section.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="p-4 rounded-xl bg-[var(--color-glass)] space-y-4"
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-[var(--color-muted-foreground)]">
                        Section {index + 1}
                      </p>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-[var(--color-destructive)]"
                        onClick={() => removeSection(section.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>

                    <div className="space-y-2">
                      <Label>Titre</Label>
                      <Input
                        value={section.title}
                        onChange={(e) =>
                          updateSection(section.id, "title", e.target.value)
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Contenu</Label>
                      <Textarea
                        value={section.content}
                        onChange={(e) =>
                          updateSection(section.id, "content", e.target.value)
                        }
                        rows={3}
                      />
                    </div>
                  </motion.div>
                ))}
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        {/* Contact Settings */}
        <TabsContent value="contact">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Informations de contact</CardTitle>
                <CardDescription>
                  Coordonnées affichées sur la page Infos
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="hours">Horaires d'ouverture</Label>
                    <Input
                      id="hours"
                      value={settings.info.contact.hours}
                      onChange={(e) =>
                        updateSetting(["info", "contact", "hours"], e.target.value)
                      }
                      placeholder="Lun-Sam: 8h - 20h"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="address">Adresse</Label>
                    <Input
                      id="address"
                      value={settings.info.contact.address}
                      onChange={(e) =>
                        updateSetting(["info", "contact", "address"], e.target.value)
                      }
                      placeholder="123 Rue du Marché"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Téléphone</Label>
                    <Input
                      id="phone"
                      value={settings.info.contact.phone}
                      onChange={(e) =>
                        updateSetting(["info", "contact", "phone"], e.target.value)
                      }
                      placeholder="+33 1 23 45 67 89"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={settings.info.contact.email}
                      onChange={(e) =>
                        updateSetting(["info", "contact", "email"], e.target.value)
                      }
                      placeholder="contact@exemple.com"
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="telegramContact">Contact Telegram</Label>
                    <Input
                      id="telegramContact"
                      value={settings.info.contact.telegram}
                      onChange={(e) =>
                        updateSetting(
                          ["info", "contact", "telegram"],
                          e.target.value
                        )
                      }
                      placeholder="@votre_bot"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        {/* Custom Links Settings */}
        <TabsContent value="links">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Liens personnalisés</CardTitle>
                    <CardDescription>
                      Ajoutez vos réseaux sociaux et autres liens
                    </CardDescription>
                  </div>
                  <Button variant="warning" size="sm" onClick={addCustomLink}>
                    <Plus className="w-4 h-4 mr-2" />
                    Ajouter un lien
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {settings.customLinks.length === 0 ? (
                  <div className="text-center py-8">
                    <ExternalLink className="w-12 h-12 mx-auto text-[var(--color-muted-foreground)] mb-3" />
                    <p className="text-sm text-[var(--color-muted-foreground)]">
                      Aucun lien ajouté. Commencez par ajouter vos réseaux sociaux.
                    </p>
                  </div>
                ) : (
                  settings.customLinks.map((link, index) => (
                    <motion.div
                      key={link.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="p-4 rounded-xl bg-[var(--color-glass)] space-y-4"
                    >
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-[var(--color-muted-foreground)]">
                          Lien {index + 1}
                        </p>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-[var(--color-destructive)]"
                          onClick={() => removeCustomLink(link.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Nom du lien</Label>
                          <Input
                            value={link.name}
                            onChange={(e) =>
                              updateCustomLink(link.id, "name", e.target.value)
                            }
                            placeholder="Instagram, Facebook, TikTok..."
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>URL</Label>
                          <Input
                            value={link.url}
                            onChange={(e) =>
                              updateCustomLink(link.id, "url", e.target.value)
                            }
                            placeholder="https://..."
                          />
                        </div>
                      </div>

                      {link.url && (
                        <a
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-[var(--color-primary)] hover:underline"
                        >
                          Tester le lien
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </motion.div>
                  ))
                )}
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>
      </Tabs>

      <div className="mt-8">
        <Card className="border-[var(--color-destructive)]/40 bg-[var(--color-destructive)]/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-[var(--color-destructive)]">
              <AlertTriangle className="w-5 h-5" />
              Zone d'urgence
            </CardTitle>
            <CardDescription>
              Désactive immédiatement la boutique et peut effacer toutes les
              données produit/commandes/avis.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-glass)] p-4">
              <div>
                <p className="text-sm font-medium text-[var(--color-foreground)]">
                  Mode maintenance
                </p>
                <p className="text-xs text-[var(--color-muted-foreground)]">
                  {maintenanceMode
                    ? "Boutique désactivée - les clients ne peuvent pas accéder."
                    : "Boutique active - les clients peuvent accéder."}
                </p>
              </div>
              <Switch
                checked={maintenanceMode}
                onCheckedChange={(checked) => handleToggleMaintenance(checked)}
                disabled={maintenanceLoading}
              />
            </div>

            <div className="flex flex-col gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-glass)] p-4">
              <div>
                <p className="text-sm font-medium text-[var(--color-foreground)]">
                  Message maintenance
                </p>
                <p className="text-xs text-[var(--color-muted-foreground)]">
                  Affiché aux clients quand la boutique est en maintenance.
                </p>
              </div>
              <div className="flex flex-col gap-3 md:flex-row">
                <Input
                  value={maintenanceMessage}
                  onChange={(e) => setMaintenanceMessage(e.target.value)}
                  placeholder="On revient très vite."
                />
                <Button
                  variant="outline"
                  onClick={handleSaveMaintenanceMessage}
                  disabled={savingMaintenanceMessage}
                >
                  {savingMaintenanceMessage ? "Sauvegarde..." : "Sauvegarder"}
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3">
              <div className="text-xs text-[var(--color-muted-foreground)]">
                Action irréversible. Cette opération est loggée côté serveur.
              </div>
              <Button
                variant="destructive"
                onClick={() => {
                  setEmergencyError(null);
                  setEmergencyOpen(true);
                  setPurgeData(false);
                  setNukeExternal(false);
                  setNukeArmed(false);
                  setNukeCountdown(0);
                  setEmergencyConfirm("");
                }}
              >
                Nuke Action
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={emergencyOpen} onOpenChange={setEmergencyOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmer la Nuke Action</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-[var(--color-muted-foreground)]">
              Choisis ce que tu veux supprimer. Cette action active le mode
              maintenance et est irréversible.
            </p>

            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-xl border border-[var(--color-border)] bg-[var(--color-glass)] p-4">
                <div>
                  <p className="text-sm font-medium text-[var(--color-foreground)]">
                    Supprimer les données (DB)
                  </p>
                  <p className="text-xs text-[var(--color-muted-foreground)]">
                    Produits, avis, commandes, catégories, contacts.
                  </p>
                </div>
                <Switch checked={purgeData} onCheckedChange={setPurgeData} />
              </div>

              <div className="flex items-center justify-between rounded-xl border border-[var(--color-border)] bg-[var(--color-glass)] p-4">
                <div>
                  <p className="text-sm font-medium text-[var(--color-foreground)]">
                    Supprimer l'app (Vercel + GitHub)
                  </p>
                  <p className="text-xs text-[var(--color-muted-foreground)]">
                    Supprime le projet Vercel et le repo GitHub (irréversible).
                  </p>
                  {!nukeEnabled && (
                    <p className="text-xs text-[var(--color-muted-foreground)] mt-1">
                      Active ENABLE_EMERGENCY_NUKE=true pour déverrouiller.
                    </p>
                  )}
                  {nukeMissing.length > 0 && (
                    <p className="text-xs text-[var(--color-muted-foreground)] mt-1">
                      Config manquante: {nukeMissing.join(", ")}
                    </p>
                  )}
                </div>
                <Switch
                  checked={nukeExternal}
                  onCheckedChange={setNukeExternal}
                  disabled={!nukeEnabled || nukeMissing.length > 0}
                />
              </div>
            </div>

            {nukeExternal && (
              <div className="rounded-xl border border-[var(--color-destructive)]/40 bg-[var(--color-destructive)]/10 p-3 text-xs text-[var(--color-destructive)]">
                Suppression externe activée : Vercel + GitHub seront supprimés.
              </div>
            )}
            {nukeExternal && (
              <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-glass)] p-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-xs text-[var(--color-muted-foreground)]">
                    Arme le nuke et attends 10 secondes avant de confirmer.
                  </div>
                  <Button
                    type="button"
                    variant={nukeArmed ? "outline" : "destructive"}
                    size="sm"
                    onClick={handleArmNuke}
                    disabled={nukeArmed}
                  >
                    {nukeArmed ? "Nuke armé" : "Armer le nuke"}
                  </Button>
                </div>
                {nukeArmed && (
                  <p className="mt-2 text-xs text-[var(--color-muted-foreground)]">
                    Confirmation activable dans {nukeCountdown}s.
                  </p>
                )}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="emergencyConfirm">
                Tapez <strong>je suis sûr</strong> pour confirmer
              </Label>
              <Input
                id="emergencyConfirm"
                value={emergencyConfirm}
                onChange={(e) => setEmergencyConfirm(e.target.value)}
                placeholder="je suis sûr"
              />
            </div>
            {emergencyError && (
              <p className="text-xs text-[var(--color-destructive)]">
                {emergencyError}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEmergencyOpen(false)}>
              Annuler
            </Button>
              <Button
                variant="destructive"
                onClick={handleEmergencyAction}
                disabled={
                  emergencyLoading ||
                  (nukeExternal && (!nukeArmed || nukeCountdown > 0))
                }
              >
                {emergencyLoading ? "Activation..." : "Confirmer"}
              </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={successOpen} onOpenChange={setSuccessOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sauvegarde effectuée</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-[var(--color-muted-foreground)]">
            {successMessage}
          </p>
          <DialogFooter>
            <Button variant="success" onClick={() => setSuccessOpen(false)}>
              OK
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <SettingsAIDialog
        open={aiDialogOpen}
        onOpenChange={setAIDialogOpen}
        onApply={handleApplyAISettings}
      />
    </div>
  );
}
