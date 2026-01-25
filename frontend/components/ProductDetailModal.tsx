"use client";

import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Check, ShoppingCart, ChevronDown, ChevronUp, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ImageCarousel } from "@/components/ui/image-carousel";
import { StrainBadges, StrainBadgesSkeleton } from "@/components/StrainBadges";
import { CountryBadge } from "@/components/CountryBadge";
import { DeliveryBadge } from "@/components/DeliveryBadge";
import { useCartStore, formatPrice } from "@/lib/store/cart";
import { useHapticFeedback } from "@/lib/store/telegram";
import { useStrainInfo } from "@/lib/store/strain-cache";
import {
  sortTiersByQuantity,
  calculateDiscountPercentage,
  calculateTierPriceFromCost,
} from "@/lib/pricing";
import { cn } from "@/lib/utils";
import type {
  PricingTier,
  ProductWithPricing,
  ProductCategory,
} from "@/lib/supabase/database.types";

interface ProductDetailModalProps {
  product: ProductWithPricing;
  category?: ProductCategory | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProductDetailModal({
  product,
  category,
  open,
  onOpenChange,
}: ProductDetailModalProps) {
  const tiers = product.pricing_tiers || [];
  const sortedTiers = sortTiersByQuantity(tiers);
  const hasTiers = sortedTiers.length > 0;

  const [selectedTier, setSelectedTier] = useState<PricingTier | null>(
    sortedTiers.length > 0 ? sortedTiers[0] : null
  );
  const [isAdded, setIsAdded] = useState(false);
  const [showFullDescription, setShowFullDescription] = useState(false);

  const addItem = useCartStore((state) => state.addItem);
  const { impact, notification } = useHapticFeedback();

  // Fetch strain info from Cannabis API
  const varietyName = product.variety || product.name;
  const { strainInfo, loading: strainLoading } = useStrainInfo(varietyName);

  // Reset selection when modal opens
  useEffect(() => {
    if (open && sortedTiers.length > 0) {
      setSelectedTier(sortedTiers[0]);
      setIsAdded(false);
      setShowFullDescription(false);
    }
  }, [open]);

  const images = (product.images as string[]) || [];
  const categoryName = category?.name || product.category || "";
  const description = product.description || strainInfo?.description;

  // Calculate discount for each tier
  const getTierDiscount = (tier: PricingTier): number | null => {
    if (!product.cost_price_per_gram || !product.margin_percentage) return null;
    const calculatedPrice = calculateTierPriceFromCost(
      product.cost_price_per_gram,
      product.margin_percentage,
      tier.quantity_grams
    );
    if (tier.price >= calculatedPrice) return null;
    return calculateDiscountPercentage(tier.price, calculatedPrice);
  };

  const handleAddToCart = () => {
    if (hasTiers && !selectedTier) return;

    addItem(product, selectedTier, 1);
    impact("medium");
    notification("success");
    setIsAdded(true);

    setTimeout(() => {
      setIsAdded(false);
      onOpenChange(false);
    }, 1000);
  };

  // Check if description is long enough to truncate
  const isDescriptionLong = description && description.length > 150;
  const displayDescription =
    description && !showFullDescription && isDescriptionLong
      ? `${description.slice(0, 150)}...`
      : description;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="p-0 overflow-hidden flex flex-col gap-0"
        style={{
          width: "100vw",
          maxWidth: "100vw",
          height: "100dvh",
          maxHeight: "100dvh",
          borderRadius: 0,
          border: "none",
        }}
      >
        {/* Close Button - Fixed position */}
        <DialogClose className="absolute right-3 top-3 z-20 rounded-full bg-black/50 p-2 text-white backdrop-blur-sm hover:bg-black/70 transition-colors">
          <X className="h-5 w-5" />
          <span className="sr-only">Fermer</span>
        </DialogClose>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto">
          {/* Image Carousel */}
          <ImageCarousel
            images={images}
            alt={varietyName}
            aspectRatio="square"
            className="w-full"
          />

          {/* Content */}
          <div className="p-4 pb-0 space-y-4">
            {/* Header */}
            <div>
              <div className="flex items-center gap-2 mb-1">
                {product.origin_flag && (
                  <CountryBadge origin={product.origin_flag} variant="default" />
                )}
                {categoryName && (
                  <span className="text-xs text-[var(--color-muted-foreground)] uppercase tracking-wider">
                    {categoryName}
                  </span>
                )}
              </div>
              <h2 className="text-xl font-bold text-[var(--color-foreground)]">
                {varietyName}
              </h2>
              <div className="mt-2">
                <DeliveryBadge variant="premium" />
              </div>
            </div>

            {/* Strain Info (from Cannabis API) */}
            <div>
              {strainLoading ? (
                <StrainBadgesSkeleton />
              ) : (
                <StrainBadges
                  type={strainInfo?.type}
                  effects={strainInfo?.effects}
                  flavors={strainInfo?.flavors}
                  size="md"
                  maxEffects={4}
                  maxFlavors={3}
                />
              )}
            </div>

            {/* Description */}
            {description && (
              <div>
                <p className="text-sm text-[var(--color-muted-foreground)] leading-relaxed">
                  {displayDescription}
                </p>
                {isDescriptionLong && (
                  <button
                    onClick={() => setShowFullDescription(!showFullDescription)}
                    className="flex items-center gap-1 text-xs text-[var(--color-primary)] mt-1 hover:underline"
                  >
                    {showFullDescription ? (
                      <>
                        Voir moins <ChevronUp className="w-3 h-3" />
                      </>
                    ) : (
                      <>
                        Voir plus <ChevronDown className="w-3 h-3" />
                      </>
                    )}
                  </button>
                )}
              </div>
            )}

            {/* Pricing Tiers */}
            {hasTiers && (
              <div>
                <p className="text-sm font-medium text-[var(--color-foreground)] mb-2">
                  Choisir la quantité :
                </p>
                <div className="space-y-2">
                  {sortedTiers.map((tier) => {
                    const isSelected = selectedTier?.id === tier.id;
                    const discount = getTierDiscount(tier);

                    return (
                      <motion.button
                        key={tier.id}
                        onClick={() => setSelectedTier(tier)}
                        whileTap={{ scale: 0.98 }}
                        className={cn(
                          "w-full flex items-center justify-between gap-3 p-3.5 rounded-xl border-2 transition-all text-left",
                          isSelected
                            ? "border-[var(--color-primary)] bg-[var(--color-secondary)]"
                            : "border-[var(--color-border)] bg-[var(--color-card)] hover:border-[var(--color-primary)]/50"
                        )}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className={cn(
                              "w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0",
                              isSelected
                                ? "border-[var(--color-primary)] bg-[var(--color-primary)]"
                                : "border-[var(--color-muted-foreground)]"
                            )}
                          >
                            {isSelected && (
                              <Check className="w-3 h-3 text-white" />
                            )}
                          </div>
                          <span className="font-medium text-[var(--color-foreground)]">
                            {tier.quantity_grams}g
                          </span>
                          {discount && discount > 0 && (
                            <span className="text-xs bg-[var(--color-success)]/20 text-[var(--color-success)] px-2 py-0.5 rounded-full">
                              -{discount}%
                            </span>
                          )}
                        </div>
                        <span className="font-bold text-[var(--color-foreground)] shrink-0">
                          {formatPrice(tier.price)}
                        </span>
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Non-tiered product price */}
            {!hasTiers && (
              <div className="py-2">
                <p className="text-2xl font-bold text-[var(--color-foreground)]">
                  {formatPrice(product.price, product.currency)}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Sticky Add to Cart Button */}
        <div className="sticky bottom-0 p-4 border-t border-[var(--color-border)] bg-[var(--color-background)]">
          <Button
            onClick={handleAddToCart}
            disabled={hasTiers && !selectedTier}
            className={cn(
              "w-full h-12 text-base transition-all",
              isAdded && "bg-[var(--color-success)]"
            )}
            size="lg"
          >
            {isAdded ? (
              <>
                <Check className="w-5 h-5 mr-2" />
                Ajouté au panier
              </>
            ) : (
              <>
                <ShoppingCart className="w-5 h-5 mr-2" />
                Ajouter au panier
                {selectedTier && (
                  <span className="ml-2 opacity-80">
                    - {formatPrice(selectedTier.price)}
                  </span>
                )}
                {!hasTiers && (
                  <span className="ml-2 opacity-80">
                    - {formatPrice(product.price, product.currency)}
                  </span>
                )}
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
