"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, Sparkles, AlertCircle, Check, ChevronLeft } from "lucide-react";
import { adminFetch } from "@/lib/api/admin-fetch";
import type { ParsedSettings } from "@/app/api/admin/ai/parse-settings/route";

type DialogStep = "input" | "parsing" | "review";

interface SettingsAIDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApply: (settings: ParsedSettings) => void;
}

const EXAMPLE_TEXT = `CBD Shop Paris
Ouvert du Lundi au Samedi, 9h-19h
12 rue de la Paix, 75001 Paris
Tel: 01 23 45 67 89
contact@cbdshop.fr
Livraison gratuite dès 50€
Instagram: @cbdshopparis
Telegram: @cbdshop_support`;

export function SettingsAIDialog({
  open,
  onOpenChange,
  onApply,
}: SettingsAIDialogProps) {
  const [step, setStep] = useState<DialogStep>("input");
  const [inputText, setInputText] = useState("");
  const [parsedSettings, setParsedSettings] = useState<ParsedSettings | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [parseError, setParseError] = useState<string | null>(null);

  const handleParse = async () => {
    if (!inputText.trim()) {
      setParseError("Veuillez coller du texte avant d'analyser");
      return;
    }

    setStep("parsing");
    setParseError(null);
    setWarnings([]);

    try {
      const response = await adminFetch("/api/admin/ai/parse-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: inputText }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Échec de l'analyse");
      }

      if (data.warnings && data.warnings.length > 0) {
        setWarnings(data.warnings);
      }

      if (!data.settings) {
        setParseError("Aucune information détectée. Vérifiez le texte.");
        setStep("input");
        return;
      }

      setParsedSettings(data.settings);
      setStep("review");
    } catch (error) {
      console.error("Parse error:", error);
      setParseError(
        error instanceof Error ? error.message : "Erreur lors de l'analyse"
      );
      setStep("input");
    }
  };

  const handleApply = () => {
    if (parsedSettings) {
      onApply(parsedSettings);
      handleClose();
    }
  };

  const handleClose = () => {
    setStep("input");
    setInputText("");
    setParsedSettings(null);
    setWarnings([]);
    setParseError(null);
    onOpenChange(false);
  };

  const handleBack = () => {
    if (step === "review") {
      setStep("input");
    }
  };

  // Format price from centimes to euros
  const formatPrice = (centimes: number | null | undefined) => {
    if (centimes === null || centimes === undefined) return null;
    return `${(centimes / 100).toFixed(2)}€`;
  };

  // Count non-null fields
  const countDetectedFields = () => {
    if (!parsedSettings) return 0;
    let count = 0;
    if (parsedSettings.storeName) count++;
    if (parsedSettings.contact?.hours) count++;
    if (parsedSettings.contact?.address) count++;
    if (parsedSettings.contact?.phone) count++;
    if (parsedSettings.contact?.email) count++;
    if (parsedSettings.contact?.telegram) count++;
    if (parsedSettings.freeDeliveryThreshold) count++;
    if (parsedSettings.customLinks?.length) count += parsedSettings.customLinks.length;
    if (parsedSettings.sections?.length) count += parsedSettings.sections.length;
    return count;
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <div className="flex items-center gap-3">
            {step === "review" && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleBack}
                className="h-8 w-8"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
            )}
            <div>
              <DialogTitle>
                {step === "input" && "Importer avec IA"}
                {step === "parsing" && "Analyse en cours..."}
                {step === "review" && `${countDetectedFields()} informations détectées`}
              </DialogTitle>
              {step === "input" && (
                <DialogDescription>
                  Collez les informations de votre boutique pour les extraire automatiquement
                </DialogDescription>
              )}
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto py-4">
          {/* Input Step */}
          {step === "input" && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="settings-text">
                  Collez le texte contenant les informations de votre boutique
                </Label>
                <Textarea
                  id="settings-text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder={`Exemple:\n${EXAMPLE_TEXT}`}
                  rows={10}
                  className="font-mono text-sm"
                />
              </div>

              {parseError && (
                <div className="flex items-center gap-2 p-3 bg-[var(--color-destructive)]/10 text-[var(--color-destructive)] rounded-xl">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <p className="text-sm">{parseError}</p>
                </div>
              )}

              <div className="p-3 bg-[var(--color-muted)]/30 rounded-xl">
                <p className="text-xs text-[var(--color-muted-foreground)]">
                  <strong>L'IA peut détecter:</strong>
                  <br />
                  Nom de boutique, horaires, adresse, téléphone, email, Telegram,
                  seuil livraison gratuite, liens réseaux sociaux, sections À propos...
                </p>
              </div>
            </div>
          )}

          {/* Parsing Step */}
          {step === "parsing" && (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <Loader2 className="w-8 h-8 animate-spin text-[var(--color-primary)]" />
              <p className="text-[var(--color-muted-foreground)]">
                L'IA analyse le texte...
              </p>
            </div>
          )}

          {/* Review Step */}
          {step === "review" && parsedSettings && (
            <div className="space-y-4">
              {warnings.length > 0 && (
                <div className="p-3 bg-[var(--color-warning)]/10 rounded-xl">
                  <p className="text-sm text-[var(--color-warning)] font-medium mb-1">
                    Avertissements:
                  </p>
                  <ul className="text-xs text-[var(--color-muted-foreground)] list-disc pl-4">
                    {warnings.map((w, i) => (
                      <li key={i}>{w}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="space-y-3">
                {/* Store Name */}
                {parsedSettings.storeName && (
                  <div className="p-3 rounded-xl bg-[var(--color-glass)] border border-[var(--color-border)]">
                    <div className="flex items-center gap-2 mb-1">
                      <Check className="w-4 h-4 text-[var(--color-success)]" />
                      <span className="text-xs font-medium text-[var(--color-muted-foreground)]">
                        Nom de la boutique
                      </span>
                    </div>
                    <p className="text-sm font-medium">{parsedSettings.storeName}</p>
                  </div>
                )}

                {/* Contact Info */}
                {parsedSettings.contact && (
                  <div className="p-3 rounded-xl bg-[var(--color-glass)] border border-[var(--color-border)]">
                    <div className="flex items-center gap-2 mb-2">
                      <Check className="w-4 h-4 text-[var(--color-success)]" />
                      <span className="text-xs font-medium text-[var(--color-muted-foreground)]">
                        Informations de contact
                      </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                      {parsedSettings.contact.hours && (
                        <div>
                          <span className="text-xs text-[var(--color-muted-foreground)]">Horaires:</span>
                          <p>{parsedSettings.contact.hours}</p>
                        </div>
                      )}
                      {parsedSettings.contact.address && (
                        <div>
                          <span className="text-xs text-[var(--color-muted-foreground)]">Adresse:</span>
                          <p>{parsedSettings.contact.address}</p>
                        </div>
                      )}
                      {parsedSettings.contact.phone && (
                        <div>
                          <span className="text-xs text-[var(--color-muted-foreground)]">Téléphone:</span>
                          <p>{parsedSettings.contact.phone}</p>
                        </div>
                      )}
                      {parsedSettings.contact.email && (
                        <div>
                          <span className="text-xs text-[var(--color-muted-foreground)]">Email:</span>
                          <p>{parsedSettings.contact.email}</p>
                        </div>
                      )}
                      {parsedSettings.contact.telegram && (
                        <div>
                          <span className="text-xs text-[var(--color-muted-foreground)]">Telegram:</span>
                          <p>{parsedSettings.contact.telegram}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Free Delivery Threshold */}
                {parsedSettings.freeDeliveryThreshold && (
                  <div className="p-3 rounded-xl bg-[var(--color-glass)] border border-[var(--color-border)]">
                    <div className="flex items-center gap-2 mb-1">
                      <Check className="w-4 h-4 text-[var(--color-success)]" />
                      <span className="text-xs font-medium text-[var(--color-muted-foreground)]">
                        Livraison gratuite
                      </span>
                    </div>
                    <p className="text-sm font-medium">
                      À partir de {formatPrice(parsedSettings.freeDeliveryThreshold)}
                    </p>
                  </div>
                )}

                {/* Custom Links */}
                {parsedSettings.customLinks && parsedSettings.customLinks.length > 0 && (
                  <div className="p-3 rounded-xl bg-[var(--color-glass)] border border-[var(--color-border)]">
                    <div className="flex items-center gap-2 mb-2">
                      <Check className="w-4 h-4 text-[var(--color-success)]" />
                      <span className="text-xs font-medium text-[var(--color-muted-foreground)]">
                        Liens ({parsedSettings.customLinks.length})
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {parsedSettings.customLinks.map((link, i) => (
                        <Badge key={i} variant="secondary" className="text-xs">
                          {link.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Sections */}
                {parsedSettings.sections && parsedSettings.sections.length > 0 && (
                  <div className="p-3 rounded-xl bg-[var(--color-glass)] border border-[var(--color-border)]">
                    <div className="flex items-center gap-2 mb-2">
                      <Check className="w-4 h-4 text-[var(--color-success)]" />
                      <span className="text-xs font-medium text-[var(--color-muted-foreground)]">
                        Sections ({parsedSettings.sections.length})
                      </span>
                    </div>
                    <div className="space-y-2">
                      {parsedSettings.sections.map((section, i) => (
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
            </div>
          )}
        </div>

        <DialogFooter>
          {step === "input" && (
            <>
              <Button variant="outline" onClick={handleClose}>
                Annuler
              </Button>
              <Button
                variant="warning"
                onClick={handleParse}
                disabled={!inputText.trim()}
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Analyser avec IA
              </Button>
            </>
          )}

          {step === "review" && (
            <>
              <Button variant="outline" onClick={handleClose}>
                Annuler
              </Button>
              <Button variant="success" onClick={handleApply}>
                <Check className="w-4 h-4 mr-2" />
                Appliquer
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
