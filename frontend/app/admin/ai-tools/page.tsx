"use client";

import { useState } from "react";
import { motion } from "motion/react";
import {
  Sparkles,
  Loader2,
  Bot,
  FileText,
  Settings,
  Copy,
  Check,
  AlertCircle,
  ShoppingCart,
  Save,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { adminFetch } from "@/lib/api/admin-fetch";

// Types
interface ParsedProduct {
  name: string;
  variety?: string;
  origin_flag?: string;
  category_suggestion?: string;
  pricing_tiers: { quantity_grams: number; price: number }[];
  tags?: string[];
  confidence: number;
}

interface ParsedSettings {
  storeName?: string;
  contact?: {
    hours?: string;
    address?: string;
    phone?: string;
    email?: string;
    telegram?: string;
  };
  freeDeliveryThreshold?: number;
  customLinks?: { name: string; url: string }[];
  sections?: { title: string; content: string }[];
}

export default function AIToolsPage() {
  const [activeTab, setActiveTab] = useState("description");

  return (
    <div className="min-h-screen bg-[var(--color-background)] p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <Link
              href="/admin"
              className="inline-flex items-center gap-2 text-sm text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] mb-2 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Retour admin
            </Link>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Bot className="w-8 h-8 text-[var(--color-primary)]" />
              AI Tools
            </h1>
            <p className="text-[var(--color-muted-foreground)] mt-2">
              Utilisez l'IA pour générer des descriptions, parser des menus et
              extraire des paramètres
            </p>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="description" className="gap-2">
              <FileText className="w-4 h-4" />
              Générateur de Descriptions
            </TabsTrigger>
            <TabsTrigger value="menu" className="gap-2">
              <ShoppingCart className="w-4 h-4" />
              Parse Menu
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-2">
              <Settings className="w-4 h-4" />
              Parse Paramètres
            </TabsTrigger>
          </TabsList>

          {/* Tab 1: Description Generator */}
          <TabsContent value="description">
            <DescriptionGenerator />
          </TabsContent>

          {/* Tab 2: Menu Parser */}
          <TabsContent value="menu">
            <MenuParser />
          </TabsContent>

          {/* Tab 3: Settings Parser */}
          <TabsContent value="settings">
            <SettingsParser />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// ========================================
// TAB 1: DESCRIPTION GENERATOR
// ========================================
function DescriptionGenerator() {
  const [strainName, setStrainName] = useState("");
  const [existingDesc, setExistingDesc] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    if (!strainName.trim()) {
      setError("Veuillez entrer un nom de produit");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await adminFetch("/api/admin/ai/description", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          strain_name: strainName,
          existing_description: existingDesc || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Échec de la génération");
      }

      setResult(data.description);
    } catch (err) {
      console.error("Generation error:", err);
      setError(
        err instanceof Error ? err.message : "Erreur lors de la génération"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (result) {
      navigator.clipboard.writeText(result);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="p-6 rounded-2xl bg-[var(--color-glass)] backdrop-blur-md border border-[var(--color-border)]">
        <div className="space-y-4">
          <div>
            <Label htmlFor="strain-name">Nom du produit / strain *</Label>
            <Input
              id="strain-name"
              value={strainName}
              onChange={(e) => setStrainName(e.target.value)}
              placeholder="Ex: Purple Haze, OG Kush, Super Lemon Haze..."
              disabled={loading}
            />
          </div>

          <div>
            <Label htmlFor="existing-desc">
              Description existante (optionnel)
            </Label>
            <Textarea
              id="existing-desc"
              value={existingDesc}
              onChange={(e) => setExistingDesc(e.target.value)}
              placeholder="Si vous avez déjà une description à améliorer, collez-la ici..."
              rows={3}
              disabled={loading}
            />
          </div>

          <Button
            onClick={handleGenerate}
            disabled={loading || !strainName.trim()}
            className="w-full"
            variant="warning"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Génération en cours...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Générer la description
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 rounded-xl bg-[var(--color-destructive)]/10 text-[var(--color-destructive)] flex items-center gap-2">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Result */}
      {result && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 rounded-2xl bg-[var(--color-success)]/10 border border-[var(--color-success)]/20 space-y-4"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Check className="w-5 h-5 text-[var(--color-success)]" />
              Description générée
            </h3>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopy}
              className="gap-2"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" />
                  Copié !
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Copier
                </>
              )}
            </Button>
          </div>
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{result}</p>
        </motion.div>
      )}
    </motion.div>
  );
}

// ========================================
// TAB 2: MENU PARSER
// ========================================
function MenuParser() {
  const [menuText, setMenuText] = useState("");
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<ParsedProduct[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const EXAMPLE_MENU = `🌿 MENU PREMIUM

🇲🇦 Frozen From Hashland
10g: 65€ / 25g: 150€ / 50g: 280€
Hash premium frozen, extraction artisanale

🇪🇸 Amnesia Haze Indoor
5g: 45€ / 10g: 85€ / 25g: 200€
Sativa puissante, culture indoor

🇫🇷 Super Lemon Haze
5g: 40€ / 10g: 75€
Citronné et énergisant`;

  const handleParse = async () => {
    if (!menuText.trim()) {
      setError("Veuillez coller du texte avant d'analyser");
      return;
    }

    setLoading(true);
    setError(null);
    setProducts([]);
    setWarnings([]);

    try {
      const response = await adminFetch("/api/admin/ai/parse-menu", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ menu_text: menuText }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Échec de l'analyse");
      }

      setProducts(data.products || []);
      setWarnings(data.warnings || []);
    } catch (err) {
      console.error("Parse error:", err);
      setError(err instanceof Error ? err.message : "Erreur lors de l'analyse");
    } finally {
      setLoading(false);
    }
  };

  const handleImport = () => {
    // TODO: Implement import logic - navigate to products page with pre-filled data
    alert(
      `Import de ${products.length} produits vers le catalogue (à implémenter)`
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="p-6 rounded-2xl bg-[var(--color-glass)] backdrop-blur-md border border-[var(--color-border)]">
        <div className="space-y-4">
          <div>
            <Label htmlFor="menu-text">Collez votre menu texte</Label>
            <Textarea
              id="menu-text"
              value={menuText}
              onChange={(e) => setMenuText(e.target.value)}
              placeholder={EXAMPLE_MENU}
              rows={12}
              disabled={loading}
              className="font-mono text-sm"
            />
          </div>

          <Button
            onClick={handleParse}
            disabled={loading || !menuText.trim()}
            className="w-full"
            variant="warning"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Analyse en cours...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Analyser le menu
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 rounded-xl bg-[var(--color-destructive)]/10 text-[var(--color-destructive)] flex items-center gap-2">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Warnings */}
      {warnings.length > 0 && (
        <div className="p-4 rounded-xl bg-[var(--color-warning)]/10 border border-[var(--color-warning)]/20">
          <p className="text-sm font-medium text-[var(--color-warning)] mb-2">
            Avertissements:
          </p>
          <ul className="text-xs text-[var(--color-muted-foreground)] list-disc pl-4 space-y-1">
            {warnings.map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Results */}
      {products.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Check className="w-5 h-5 text-[var(--color-success)]" />
              {products.length} produit{products.length > 1 ? "s" : ""} détecté
              {products.length > 1 ? "s" : ""}
            </h3>
            <Button onClick={handleImport} variant="success" size="sm">
              <Save className="w-4 h-4 mr-2" />
              Importer dans le catalogue
            </Button>
          </div>

          <div className="grid gap-4">
            {products.map((product, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl bg-[var(--color-glass)] border border-[var(--color-border)]"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-semibold flex items-center gap-2">
                      {product.origin_flag && (
                        <span className="text-xl">{product.origin_flag}</span>
                      )}
                      {product.name}
                    </h4>
                    {product.variety && (
                      <p className="text-sm text-[var(--color-muted-foreground)]">
                        {product.variety}
                      </p>
                    )}
                  </div>
                  <Badge
                    variant={
                      product.confidence >= 0.8 ? "success" : "secondary"
                    }
                  >
                    {Math.round(product.confidence * 100)}% confiance
                  </Badge>
                </div>

                {/* Pricing Tiers */}
                <div className="space-y-2">
                  <p className="text-xs font-medium text-[var(--color-muted-foreground)]">
                    Tarification:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {product.pricing_tiers.map((tier, i) => (
                      <Badge key={i} variant="outline">
                        {tier.quantity_grams}g: {(tier.price / 100).toFixed(2)}€
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Tags */}
                {product.tags && product.tags.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {product.tags.map((tag, i) => (
                      <Badge key={i} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}

                {/* Category */}
                {product.category_suggestion && (
                  <p className="mt-2 text-xs text-[var(--color-muted-foreground)]">
                    Catégorie suggérée: {product.category_suggestion}
                  </p>
                )}
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}

// ========================================
// TAB 3: SETTINGS PARSER
// ========================================
function SettingsParser() {
  const [settingsText, setSettingsText] = useState("");
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState<ParsedSettings | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const EXAMPLE_SETTINGS = `CBD Shop Paris
Ouvert du Lundi au Samedi, 9h-19h
12 rue de la Paix, 75001 Paris
Tel: 01 23 45 67 89
contact@cbdshop.fr
Livraison gratuite dès 50€
Instagram: @cbdshopparis
Telegram: @cbdshop_support`;

  const handleParse = async () => {
    if (!settingsText.trim()) {
      setError("Veuillez coller du texte avant d'analyser");
      return;
    }

    setLoading(true);
    setError(null);
    setSettings(null);
    setWarnings([]);

    try {
      const response = await adminFetch("/api/admin/ai/parse-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: settingsText }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Échec de l'analyse");
      }

      setSettings(data.settings || null);
      setWarnings(data.warnings || []);
    } catch (err) {
      console.error("Parse error:", err);
      setError(err instanceof Error ? err.message : "Erreur lors de l'analyse");
    } finally {
      setLoading(false);
    }
  };

  const handleApply = () => {
    // TODO: Implement apply logic - navigate to settings page with pre-filled data
    alert("Application des paramètres (à implémenter)");
  };

  const formatPrice = (centimes: number | null | undefined) => {
    if (centimes === null || centimes === undefined) return null;
    return `${(centimes / 100).toFixed(2)}€`;
  };

  const countDetectedFields = () => {
    if (!settings) return 0;
    let count = 0;
    if (settings.storeName) count++;
    if (settings.contact?.hours) count++;
    if (settings.contact?.address) count++;
    if (settings.contact?.phone) count++;
    if (settings.contact?.email) count++;
    if (settings.contact?.telegram) count++;
    if (settings.freeDeliveryThreshold) count++;
    if (settings.customLinks?.length) count += settings.customLinks.length;
    if (settings.sections?.length) count += settings.sections.length;
    return count;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="p-6 rounded-2xl bg-[var(--color-glass)] backdrop-blur-md border border-[var(--color-border)]">
        <div className="space-y-4">
          <div>
            <Label htmlFor="settings-text">
              Collez les informations de votre boutique
            </Label>
            <Textarea
              id="settings-text"
              value={settingsText}
              onChange={(e) => setSettingsText(e.target.value)}
              placeholder={EXAMPLE_SETTINGS}
              rows={10}
              disabled={loading}
              className="font-mono text-sm"
            />
          </div>

          <Button
            onClick={handleParse}
            disabled={loading || !settingsText.trim()}
            className="w-full"
            variant="warning"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Analyse en cours...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Analyser les paramètres
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 rounded-xl bg-[var(--color-destructive)]/10 text-[var(--color-destructive)] flex items-center gap-2">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Warnings */}
      {warnings.length > 0 && (
        <div className="p-4 rounded-xl bg-[var(--color-warning)]/10 border border-[var(--color-warning)]/20">
          <p className="text-sm font-medium text-[var(--color-warning)] mb-2">
            Avertissements:
          </p>
          <ul className="text-xs text-[var(--color-muted-foreground)] list-disc pl-4 space-y-1">
            {warnings.map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Results */}
      {settings && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Check className="w-5 h-5 text-[var(--color-success)]" />
              {countDetectedFields()} information
              {countDetectedFields() > 1 ? "s" : ""} détectée
              {countDetectedFields() > 1 ? "s" : ""}
            </h3>
            <Button onClick={handleApply} variant="success" size="sm">
              <Save className="w-4 h-4 mr-2" />
              Appliquer aux paramètres
            </Button>
          </div>

          <div className="space-y-3">
            {/* Store Name */}
            {settings.storeName && (
              <div className="p-3 rounded-xl bg-[var(--color-glass)] border border-[var(--color-border)]">
                <div className="flex items-center gap-2 mb-1">
                  <Check className="w-4 h-4 text-[var(--color-success)]" />
                  <span className="text-xs font-medium text-[var(--color-muted-foreground)]">
                    Nom de la boutique
                  </span>
                </div>
                <p className="text-sm font-medium">{settings.storeName}</p>
              </div>
            )}

            {/* Contact Info */}
            {settings.contact && (
              <div className="p-3 rounded-xl bg-[var(--color-glass)] border border-[var(--color-border)]">
                <div className="flex items-center gap-2 mb-2">
                  <Check className="w-4 h-4 text-[var(--color-success)]" />
                  <span className="text-xs font-medium text-[var(--color-muted-foreground)]">
                    Informations de contact
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                  {settings.contact.hours && (
                    <div>
                      <span className="text-xs text-[var(--color-muted-foreground)]">
                        Horaires:
                      </span>
                      <p>{settings.contact.hours}</p>
                    </div>
                  )}
                  {settings.contact.address && (
                    <div>
                      <span className="text-xs text-[var(--color-muted-foreground)]">
                        Adresse:
                      </span>
                      <p>{settings.contact.address}</p>
                    </div>
                  )}
                  {settings.contact.phone && (
                    <div>
                      <span className="text-xs text-[var(--color-muted-foreground)]">
                        Téléphone:
                      </span>
                      <p>{settings.contact.phone}</p>
                    </div>
                  )}
                  {settings.contact.email && (
                    <div>
                      <span className="text-xs text-[var(--color-muted-foreground)]">
                        Email:
                      </span>
                      <p>{settings.contact.email}</p>
                    </div>
                  )}
                  {settings.contact.telegram && (
                    <div>
                      <span className="text-xs text-[var(--color-muted-foreground)]">
                        Telegram:
                      </span>
                      <p>{settings.contact.telegram}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Free Delivery */}
            {settings.freeDeliveryThreshold && (
              <div className="p-3 rounded-xl bg-[var(--color-glass)] border border-[var(--color-border)]">
                <div className="flex items-center gap-2 mb-1">
                  <Check className="w-4 h-4 text-[var(--color-success)]" />
                  <span className="text-xs font-medium text-[var(--color-muted-foreground)]">
                    Livraison gratuite
                  </span>
                </div>
                <p className="text-sm font-medium">
                  À partir de {formatPrice(settings.freeDeliveryThreshold)}
                </p>
              </div>
            )}

            {/* Custom Links */}
            {settings.customLinks && settings.customLinks.length > 0 && (
              <div className="p-3 rounded-xl bg-[var(--color-glass)] border border-[var(--color-border)]">
                <div className="flex items-center gap-2 mb-2">
                  <Check className="w-4 h-4 text-[var(--color-success)]" />
                  <span className="text-xs font-medium text-[var(--color-muted-foreground)]">
                    Liens ({settings.customLinks.length})
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {settings.customLinks.map((link, i) => (
                    <Badge key={i} variant="secondary" className="text-xs">
                      {link.name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Sections */}
            {settings.sections && settings.sections.length > 0 && (
              <div className="p-3 rounded-xl bg-[var(--color-glass)] border border-[var(--color-border)]">
                <div className="flex items-center gap-2 mb-2">
                  <Check className="w-4 h-4 text-[var(--color-success)]" />
                  <span className="text-xs font-medium text-[var(--color-muted-foreground)]">
                    Sections ({settings.sections.length})
                  </span>
                </div>
                <div className="space-y-2">
                  {settings.sections.map((section, i) => (
                    <div key={i} className="text-sm">
                      <p className="font-medium">{section.title}</p>
                      <p className="text-xs text-[var(--color-muted-foreground)] line-clamp-2">
                        {section.content}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <p className="text-xs text-[var(--color-muted-foreground)] text-center mt-4">
            Cliquez sur "Appliquer" pour remplir automatiquement les champs.
            <br />
            Vous pourrez modifier les valeurs avant de sauvegarder.
          </p>
        </motion.div>
      )}
    </motion.div>
  );
}
