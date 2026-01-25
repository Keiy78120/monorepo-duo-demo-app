"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { ArrowLeft, MapPin, StickyNote, ShoppingBag, CheckCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useCartStore, formatPrice } from "@/lib/store/cart";
import { useTelegramStore } from "@/lib/store/telegram";
import { DeliveryTimeline } from "@/components/DeliveryTimeline";

interface AddressFields {
  street: string;
  postalCode: string;
  city: string;
  additionalInfo: string;
}

interface AddressSuggestion {
  label: string;
  street: string;
  postalCode: string;
  city: string;
}

export default function CheckoutPage() {
  const router = useRouter();
  const { items, getTotal, clearCart } = useCartStore();
  const { initData } = useTelegramStore();
  const [address, setAddress] = useState<AddressFields>({
    street: "",
    postalCode: "",
    city: "",
    additionalInfo: "",
  });
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof AddressFields, string>>>({});
  const [addressValidation, setAddressValidation] = useState<{
    valid: boolean;
    suggestion?: {
      label: string;
      street: string;
      postalCode: string;
      city: string;
    } | null;
  } | null>(null);
  const [addressSuggestions, setAddressSuggestions] = useState<AddressSuggestion[]>([]);
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [warningMessage, setWarningMessage] = useState<string>(
    "⚠️ Important : Assurez-vous d'être disponible à votre adresse. Les livraisons commencent à partir de 12h00. Le délai peut varier selon la demande."
  );

  // Fetch warning message from settings
  useEffect(() => {
    const fetchWarningMessage = async () => {
      try {
        const response = await fetch("/api/settings?key=order_warning_message");
        if (response.ok) {
          const data = await response.json();
          if (data.setting?.value) {
            setWarningMessage(data.setting.value);
          }
        }
      } catch (err) {
        console.error("Failed to fetch warning message:", err);
        // Keep default message on error
      }
    };
    fetchWarningMessage();
  }, []);

  const total = getTotal();

  // Validate postal code (French format)
  const validatePostalCode = (code: string): boolean => {
    return /^[0-9]{5}$/.test(code);
  };

  // Validate address fields
  const validateAddress = (): boolean => {
    const errors: Partial<Record<keyof AddressFields, string>> = {};

    if (!address.street.trim()) {
      errors.street = "Rue requise";
    }

    if (!address.postalCode.trim()) {
      errors.postalCode = "Code postal requis";
    } else if (!validatePostalCode(address.postalCode)) {
      errors.postalCode = "Code postal invalide (5 chiffres)";
    }

    if (!address.city.trim()) {
      errors.city = "Ville requise";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAddressChange = (field: keyof AddressFields, value: string) => {
    setAddress((prev) => ({ ...prev, [field]: value }));
    if (addressValidation) {
      setAddressValidation(null);
    }
    if (field === "street") {
      setSuggestionsOpen(true);
    }
    // Clear field error on change
    if (fieldErrors[field]) {
      setFieldErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const streetQuery = useMemo(() => address.street.trim(), [address.street]);

  // Autocomplete address (FR)
  useEffect(() => {
    if (streetQuery.length < 4) {
      setAddressSuggestions([]);
      return;
    }

    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        setSuggestionsLoading(true);
        const params = new URLSearchParams({
          q: streetQuery,
          postalCode: address.postalCode || "",
          city: address.city || "",
          limit: "5",
        });
        const response = await fetch(`/api/address/search?${params.toString()}`);
        if (!response.ok) {
          setAddressSuggestions([]);
          return;
        }
        const data = await response.json();
        if (!cancelled) {
          setAddressSuggestions(Array.isArray(data?.suggestions) ? data.suggestions : []);
        }
      } catch (error) {
        console.error("Failed to fetch address suggestions:", error);
        if (!cancelled) setAddressSuggestions([]);
      } finally {
        if (!cancelled) setSuggestionsLoading(false);
      }
    }, 350);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [streetQuery, address.postalCode, address.city]);

  // Redirect if cart is empty
  if (items.length === 0 && !success) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <ShoppingBag className="w-16 h-16 text-[var(--color-muted-foreground)] mb-4" />
        <h1 className="text-xl font-bold text-[var(--color-foreground)] mb-2">
          Panier vide
        </h1>
        <p className="text-[var(--color-muted-foreground)] text-center mb-6">
          Ajoutez des produits à votre panier pour passer commande
        </p>
        <Button onClick={() => router.push("/")}>
          Voir les produits
        </Button>
      </div>
    );
  }

  // Success state
  if (success) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="w-20 h-20 rounded-full bg-[var(--color-primary)]/20 flex items-center justify-center mb-6"
        >
          <CheckCircle className="w-10 h-10 text-[var(--color-primary)]" />
        </motion.div>
        <h1 className="text-2xl font-bold text-[var(--color-foreground)] mb-2">
          Commande confirmée !
        </h1>
        <p className="text-[var(--color-muted-foreground)] text-center mb-4">
          Votre commande premium a été enregistrée. Un driver dédié vous contactera sous peu.
        </p>
        <div className="w-full max-w-sm mb-6">
          <DeliveryTimeline currentStep="confirmed" />
        </div>
        <p className="text-xs text-[var(--color-muted-foreground)] text-center mb-6">
          Suivi en temps réel disponible via Telegram
        </p>
        <Button onClick={() => router.push("/")}>
          Retour à l'accueil
        </Button>
      </div>
    );
  }

  const handleSubmit = async () => {
    // Validate address
    if (!validateAddress()) {
      setError("Veuillez remplir tous les champs requis");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const validationResponse = await fetch("/api/address/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          street: address.street,
          postalCode: address.postalCode,
          city: address.city,
        }),
      });

      if (!validationResponse.ok) {
        throw new Error("Impossible de vérifier l'adresse");
      }

      const validation = await validationResponse.json();
      setAddressValidation(validation);

      if (!validation.valid) {
        setError("Adresse non reconnue en France. Vérifie ou utilise la suggestion.");
        return;
      }

      const normalizedAddress =
        validation?.label || `${address.street}, ${address.postalCode} ${address.city}`;

      // Format complete address
      const fullAddress = [
        normalizedAddress,
        address.additionalInfo,
      ]
        .filter(Boolean)
        .join("\n");

      // Format order items
      const orderItems = items.map((item) => {
        const productName = (item.product as { variety?: string | null }).variety || item.product.name;
        const unitPrice = item.tier?.price ?? item.product.price;
        const quantityGrams = item.tier?.quantity_grams ?? 0;

        return {
          product_id: item.product.id,
          product_name: productName,
          tier_id: item.tier?.id ?? null,
          quantity_grams: quantityGrams,
          quantity: item.quantity,
          unit_price: unitPrice,
          total_price: unitPrice * item.quantity,
          // Legacy fields for compatibility
          name: quantityGrams ? `${productName} ${quantityGrams}g` : productName,
          price: unitPrice,
        };
      });

      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: orderItems,
          total,
          currency: "EUR",
          delivery_address: fullAddress,
          notes: notes.trim() || undefined,
          initData: initData || undefined,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Erreur lors de la commande");
      }

      // Success!
      clearCart();
      setSuccess(true);

      // Haptic feedback on Telegram
      if (typeof window !== "undefined" && window.Telegram?.WebApp) {
        window.Telegram.WebApp.HapticFeedback.notificationOccurred("success");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue");
      if (typeof window !== "undefined" && window.Telegram?.WebApp) {
        window.Telegram.WebApp.HapticFeedback.notificationOccurred("error");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen pb-28">
      {/* Header */}
      <div className="sticky top-0 z-10 glass-nav border-b border-[var(--color-border)]/50 px-5 py-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className="h-10 w-10"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-bold text-[var(--color-foreground)]">
            Finaliser la commande
          </h1>
        </div>
      </div>

      <div className="p-5 space-y-6">
        {/* Order Summary */}
        <div className="glass-card rounded-[1.5rem] p-5">
          <h2 className="text-sm font-semibold text-[var(--color-muted-foreground)] mb-4">
            Récapitulatif
          </h2>
          <div className="space-y-2">
            {items.map((item) => {
              const productName = (item.product as { variety?: string | null }).variety || item.product.name;
              const unitPrice = item.tier?.price ?? item.product.price;
              const quantityLabel = item.tier ? `${item.tier.quantity_grams}g × ${item.quantity}` : `× ${item.quantity}`;

              return (
                <div
                  key={`${item.product.id}-${item.tier?.id ?? "default"}`}
                  className="flex justify-between items-center"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-[var(--color-foreground)]">
                      {productName}
                    </span>
                    <span className="text-sm text-[var(--color-muted-foreground)]">
                      {quantityLabel}
                    </span>
                  </div>
                  <span className="font-medium text-[var(--color-foreground)]">
                    {formatPrice(unitPrice * item.quantity)}
                  </span>
                </div>
              );
            })}
          </div>
          <Separator className="my-3" />
          <div className="flex justify-between items-center">
            <span className="font-medium text-[var(--color-foreground)]">Total</span>
            <span className="text-lg font-bold text-[var(--color-primary)]">
              {formatPrice(total)}
            </span>
          </div>
        </div>

        {/* Delivery Address */}
        <div className="glass-card rounded-[1.5rem] p-5">
          <div className="flex items-center gap-2 mb-4">
            <MapPin className="w-5 h-5 text-[var(--color-primary)]" />
            <Label className="text-sm font-semibold">
              Adresse de livraison *
            </Label>
          </div>

          <div className="space-y-3">
            {/* Street */}
            <div>
              <Input
                value={address.street}
                onChange={(e) => handleAddressChange("street", e.target.value)}
                placeholder="Numéro et nom de rue"
                className={fieldErrors.street ? "border-red-500" : ""}
                onFocus={() => {
                  if (addressSuggestions.length > 0) setSuggestionsOpen(true);
                }}
                onBlur={() => {
                  setTimeout(() => setSuggestionsOpen(false), 150);
                }}
              />
              {fieldErrors.street && (
                <p className="text-xs text-red-500 mt-1">{fieldErrors.street}</p>
              )}
              {suggestionsOpen && (suggestionsLoading || addressSuggestions.length > 0) && (
                <div className="mt-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] shadow-[var(--shadow-card)] overflow-hidden">
                  {suggestionsLoading ? (
                    <div className="px-3 py-2 text-xs text-[var(--color-muted-foreground)]">
                      Recherche d'adresses...
                    </div>
                  ) : (
                    addressSuggestions.map((suggestion) => (
                      <button
                        key={suggestion.label}
                        type="button"
                        className="w-full px-3 py-2 text-left text-xs text-[var(--color-foreground)] hover:bg-[var(--color-muted)]/40"
                        onMouseDown={() => {
                          setAddress((prev) => ({
                            ...prev,
                            street: suggestion.street || prev.street,
                            postalCode: suggestion.postalCode || prev.postalCode,
                            city: suggestion.city || prev.city,
                          }));
                          setSuggestionsOpen(false);
                        }}
                      >
                        {suggestion.label}
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Postal Code and City */}
            <div className="grid grid-cols-3 gap-2">
              <div>
                <Input
                  value={address.postalCode}
                  onChange={(e) => handleAddressChange("postalCode", e.target.value)}
                  placeholder="75001"
                  maxLength={5}
                  className={fieldErrors.postalCode ? "border-red-500" : ""}
                />
                {fieldErrors.postalCode && (
                  <p className="text-xs text-red-500 mt-1">{fieldErrors.postalCode}</p>
                )}
              </div>
              <div className="col-span-2">
                <Input
                  value={address.city}
                  onChange={(e) => handleAddressChange("city", e.target.value)}
                  placeholder="Ville"
                  className={fieldErrors.city ? "border-red-500" : ""}
                />
                {fieldErrors.city && (
                  <p className="text-xs text-red-500 mt-1">{fieldErrors.city}</p>
                )}
              </div>
            </div>

            {/* Additional Info */}
            <div>
              <Textarea
                value={address.additionalInfo}
                onChange={(e) => handleAddressChange("additionalInfo", e.target.value)}
                placeholder="Digicode, étage, bâtiment, porte..."
                rows={2}
                className="resize-none"
              />
            </div>

            {addressValidation?.valid === false && addressValidation.suggestion && (
              <div className="rounded-xl border border-[var(--color-warning)]/30 bg-[var(--color-warning)]/10 p-3 text-xs text-[var(--color-warning-foreground)]">
                <p className="font-semibold text-[var(--color-foreground)]">
                  Adresse suggérée
                </p>
                <p className="mt-1 text-[var(--color-muted-foreground)]">
                  {addressValidation.suggestion.label}
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={() =>
                    setAddress((prev) => ({
                      ...prev,
                      street: addressValidation.suggestion?.street || prev.street,
                      postalCode:
                        addressValidation.suggestion?.postalCode || prev.postalCode,
                      city: addressValidation.suggestion?.city || prev.city,
                    }))
                  }
                >
                  Utiliser cette adresse
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Notes */}
        <div className="glass-card rounded-[1.5rem] p-5">
          <div className="flex items-center gap-2 mb-4">
            <StickyNote className="w-5 h-5 text-[var(--color-muted-foreground)]" />
            <Label className="text-sm font-semibold">
              Notes (optionnel)
            </Label>
          </div>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Instructions spéciales, horaires préférés..."
            rows={2}
            className="resize-none"
          />
        </div>

        {/* Error message */}
        {error && (
          <div className="p-4 rounded-[1rem] bg-red-500/10 border border-red-500/20">
            <p className="text-sm text-red-500 font-medium">{error}</p>
          </div>
        )}

        {/* Warning message */}
        {warningMessage && (
          <div className="p-4 rounded-[1rem] bg-orange-500/10 border border-orange-500/20">
            <p className="text-sm text-orange-600 dark:text-orange-400 leading-relaxed whitespace-pre-line">
              {warningMessage}
            </p>
          </div>
        )}

        {/* Payment note */}
        <p className="text-sm text-[var(--color-muted-foreground)] text-center">
          Paiement à la livraison
        </p>

        {/* Submit button */}
        <Button
          onClick={handleSubmit}
          disabled={submitting}
          className="w-full h-14 text-lg rounded-[1rem]"
          variant="success"
        >
          {submitting ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Envoi en cours...
            </>
          ) : (
            <>
              Commander — {formatPrice(total)}
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
