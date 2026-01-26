"use client";

import Image from "next/image";
import { motion } from "motion/react";
import { Plus, Check, Eye } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCartStore, formatPrice } from "@/lib/store/cart";
import { useHapticFeedback } from "@/lib/store/telegram";
import { ProductDetailModal } from "@/components/ProductDetailModal";
import { DeliveryBadge } from "@/components/DeliveryBadge";
import { CountryBadge } from "@/components/CountryBadge";
import type { ProductWithPricing } from "@/lib/db/types";

interface ProductCardProps {
  product: ProductWithPricing;
  index?: number;
  displayMode?: "grid" | "compact" | "list" | "bento" | "featured";
  bentoSpan?: { colSpan: number; rowSpan: number };
}

export function ProductCard({ product, index = 0, displayMode = "grid", bentoSpan }: ProductCardProps) {
  const [isAdded, setIsAdded] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const addItem = useCartStore((state) => state.addItem);
  const { impact, notification } = useHapticFeedback();

  const images = (product.images as string[]) || [];
  const primaryImage = images[0] || "/placeholder.png";
  const isVideo = primaryImage
    ? [".mp4", ".webm", ".mov", ".m4v"].some((ext) =>
        primaryImage.split("?")[0].toLowerCase().endsWith(ext)
      )
    : false;
  const tiers = product.pricing_tiers || [];
  const hasTiers = tiers.length > 0;

  // Get the minimum tier price for display
  const minTier = hasTiers
    ? tiers.reduce((min, t) => (t.price < min.price ? t : min), tiers[0])
    : null;

  const handleAddToCart = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (hasTiers) {
      setShowDetailModal(true);
      impact("light");
    } else {
      addItem(product, null, 1);
      impact("medium");
      notification("success");
      setIsAdded(true);
      setTimeout(() => setIsAdded(false), 1500);
    }
  };

  const handleCardClick = () => {
    setShowDetailModal(true);
    impact("light");
  };

  const categoryName = product.category_info?.name || product.category;
  const varietyName = product.variety || product.name;

  // Bento grid class
  const bentoClass = bentoSpan
    ? cn(
        bentoSpan.colSpan === 2 && "bento-large",
        bentoSpan.colSpan === 2 && bentoSpan.rowSpan === 1 && "bento-wide"
      )
    : "";

  // List mode - horizontal layout
  if (displayMode === "list") {
    return (
      <>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05, duration: 0.3 }}
          className="group cursor-pointer"
          onClick={handleCardClick}
        >
          <div className="product-card overflow-hidden flex flex-row items-stretch">
            {/* Image Container */}
            <div className="image-container relative w-[120px] sm:w-[140px] md:w-[160px] shrink-0 overflow-hidden bg-[var(--color-muted)]">
              {isVideo ? (
                <video
                  src={primaryImage}
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  muted
                  playsInline
                  preload="metadata"
                />
              ) : (
                <Image
                  src={primaryImage}
                  alt={varietyName}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  sizes="160px"
                />
              )}

              {/* Origin Badge */}
              {product.origin_flag && (
                <div className="absolute top-2 right-2">
                  <CountryBadge origin={product.origin_flag} variant="default" />
                </div>
              )}
            </div>

            {/* Content */}
            <div className="content-container flex-1 p-3 sm:p-4 flex flex-col justify-between min-h-[120px]">
              <div>
                {/* Category & Tags */}
                <div className="flex items-center gap-2 mb-1">
                  {categoryName && (
                    <p className="text-[9px] sm:text-[10px] text-[var(--color-muted-foreground)] uppercase tracking-wider font-medium">
                      {categoryName}
                    </p>
                  )}
                  {product.tags?.slice(0, 1).map((tag) => (
                    <Badge
                      key={tag}
                      variant="secondary"
                      className="text-[8px] sm:text-[9px] px-1.5 py-0"
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>

                {/* Name */}
                <h3 className="font-semibold text-sm sm:text-base text-[var(--color-foreground)] leading-snug line-clamp-2">
                  {varietyName}
                </h3>

                {/* Delivery Badge */}
                <div className="mt-1.5">
                  <DeliveryBadge variant="premium" />
                </div>
              </div>

              {/* Price & Add Button */}
              <div className="flex items-end justify-between gap-2 mt-2">
                {/* Price Section */}
                <div className="flex flex-col min-w-0">
                  {hasTiers && minTier ? (
                    <>
                      <p className="text-[10px] sm:text-xs text-[var(--color-muted-foreground)] leading-tight">
                        À partir de
                      </p>
                      <p className="text-sm sm:text-base font-bold text-[var(--color-foreground)] leading-tight">
                        {formatPrice(minTier.price)}
                        <span className="text-[10px] sm:text-xs font-medium text-[var(--color-muted-foreground)] ml-0.5">
                          /{minTier.quantity_grams}g
                        </span>
                      </p>
                    </>
                  ) : (
                    <p className="text-base sm:text-lg font-bold text-[var(--color-foreground)]">
                      {formatPrice(product.price, product.currency)}
                    </p>
                  )}
                </div>

                {/* Action Button */}
                <Button
                  size="icon"
                  variant={isAdded ? "default" : "glass"}
                  className={cn(
                    "h-9 w-9 sm:h-10 sm:w-10 rounded-xl shrink-0 transition-all duration-200",
                    isAdded && "bg-[var(--color-success)]"
                  )}
                  onClick={handleAddToCart}
                >
                  {isAdded ? (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 400 }}
                    >
                      <Check className="w-4 h-4 sm:w-5 sm:h-5" />
                    </motion.div>
                  ) : hasTiers ? (
                    <Eye className="w-4 h-4 sm:w-5 sm:h-5" />
                  ) : (
                    <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                  )}
                </Button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Product Detail Modal */}
        <ProductDetailModal
          product={product}
          category={product.category_info}
          open={showDetailModal}
          onOpenChange={setShowDetailModal}
        />
      </>
    );
  }

  // Compact mode - smaller cards
  if (displayMode === "compact") {
    return (
      <>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.03, duration: 0.25 }}
          className="group h-full cursor-pointer"
          onClick={handleCardClick}
        >
          <div className="product-card overflow-hidden flex h-full flex-col">
            {/* Image Container - Square */}
            <div className="relative aspect-square overflow-hidden bg-[var(--color-muted)]">
              {isVideo ? (
                <video
                  src={primaryImage}
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  muted
                  playsInline
                  preload="metadata"
                />
              ) : (
                <Image
                  src={primaryImage}
                  alt={varietyName}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  sizes="(max-width: 640px) 33vw, 25vw"
                />
              )}

              {/* Origin Badge */}
              {product.origin_flag && (
                <div className="absolute top-1.5 right-1.5">
                  <CountryBadge origin={product.origin_flag} variant="default" />
                </div>
              )}
            </div>

            {/* Content - Minimal */}
            <div className="p-2 sm:p-2.5 flex flex-col flex-1 min-h-0">
              {/* Name */}
              <h3 className="font-medium text-xs sm:text-sm text-[var(--color-foreground)] leading-tight line-clamp-2 mb-auto">
                {varietyName}
              </h3>

              {/* Price */}
              <div className="mt-1.5">
                {hasTiers && minTier ? (
                  <p className="text-xs sm:text-sm font-bold text-[var(--color-foreground)]">
                    {formatPrice(minTier.price)}
                    <span className="text-[9px] font-medium text-[var(--color-muted-foreground)] ml-0.5">
                      /{minTier.quantity_grams}g
                    </span>
                  </p>
                ) : (
                  <p className="text-xs sm:text-sm font-bold text-[var(--color-foreground)]">
                    {formatPrice(product.price, product.currency)}
                  </p>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Product Detail Modal */}
        <ProductDetailModal
          product={product}
          category={product.category_info}
          open={showDetailModal}
          onOpenChange={setShowDetailModal}
        />
      </>
    );
  }

  // Featured mode - large cards with more details
  if (displayMode === "featured") {
    return (
      <>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.08, duration: 0.35 }}
          className="group h-full cursor-pointer"
          onClick={handleCardClick}
        >
          <div className="product-card overflow-hidden flex h-full flex-col">
            {/* Image Container - Wide */}
            <div className="relative aspect-[16/10] md:aspect-[16/9] overflow-hidden bg-[var(--color-muted)]">
              {isVideo ? (
                <video
                  src={primaryImage}
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  muted
                  playsInline
                  preload="metadata"
                />
              ) : (
                <Image
                  src={primaryImage}
                  alt={varietyName}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              )}

              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />

              {/* Tags Overlay */}
              <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                {product.tags?.slice(0, 2).map((tag) => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="text-[10px] sm:text-xs px-2 py-0.5"
                  >
                    {tag}
                  </Badge>
                ))}
              </div>

              {/* Origin Badge */}
              {product.origin_flag && (
                <div className="absolute top-3 right-3">
                  <CountryBadge origin={product.origin_flag} variant="default" />
                </div>
              )}

              {/* Delivery Badge */}
              <div className="absolute bottom-3 left-3">
                <DeliveryBadge variant="premium" />
              </div>
            </div>

            {/* Content */}
            <div className="p-4 sm:p-5 flex flex-col flex-1 min-h-0">
              {/* Category Label */}
              {categoryName && (
                <p className="text-[10px] sm:text-xs text-[var(--color-muted-foreground)] uppercase tracking-wider font-medium mb-1">
                  {categoryName}
                </p>
              )}

              {/* Name */}
              <h3 className="font-semibold text-base sm:text-lg md:text-xl text-[var(--color-foreground)] leading-snug mb-auto">
                {varietyName}
              </h3>

              {/* Price & Add Button */}
              <div className="flex items-end justify-between gap-3 mt-4">
                {/* Price Section */}
                <div className="flex flex-col min-w-0 flex-1">
                  {hasTiers && minTier ? (
                    <>
                      <p className="text-xs text-[var(--color-muted-foreground)] leading-tight">
                        À partir de
                      </p>
                      <p className="text-lg sm:text-xl md:text-2xl font-bold text-[var(--color-foreground)] leading-tight">
                        {formatPrice(minTier.price)}
                        <span className="text-xs sm:text-sm font-medium text-[var(--color-muted-foreground)] ml-1">
                          /{minTier.quantity_grams}g
                        </span>
                      </p>
                    </>
                  ) : (
                    <p className="text-lg sm:text-xl md:text-2xl font-bold text-[var(--color-foreground)]">
                      {formatPrice(product.price, product.currency)}
                    </p>
                  )}
                </div>

                {/* Action Button */}
                <Button
                  size="icon"
                  variant={isAdded ? "default" : "glass"}
                  className={cn(
                    "h-11 w-11 sm:h-12 sm:w-12 rounded-xl shrink-0 transition-all duration-200",
                    isAdded && "bg-[var(--color-success)]"
                  )}
                  onClick={handleAddToCart}
                >
                  {isAdded ? (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 400 }}
                    >
                      <Check className="w-5 h-5 sm:w-6 sm:h-6" />
                    </motion.div>
                  ) : hasTiers ? (
                    <Eye className="w-5 h-5 sm:w-6 sm:h-6" />
                  ) : (
                    <Plus className="w-5 h-5 sm:w-6 sm:h-6" />
                  )}
                </Button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Product Detail Modal */}
        <ProductDetailModal
          product={product}
          category={product.category_info}
          open={showDetailModal}
          onOpenChange={setShowDetailModal}
        />
      </>
    );
  }

  // Default: Grid mode (and Bento uses same card style)
  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.05, duration: 0.3 }}
        className={cn("group h-full cursor-pointer", bentoClass)}
        onClick={handleCardClick}
      >
        <div className="product-card overflow-hidden flex h-full flex-col">
          {/* Image Container - Square on mobile, taller on larger screens */}
          <div className="relative aspect-square sm:aspect-[4/5] overflow-hidden bg-[var(--color-muted)]">
            {isVideo ? (
              <video
                src={primaryImage}
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                muted
                playsInline
                preload="metadata"
              />
            ) : (
              <Image
                src={primaryImage}
                alt={varietyName}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-105"
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              />
            )}

            {/* Gradient overlay on hover */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

            {/* Tags Overlay - Hide on very small screens if needed */}
            <div className="absolute top-2 left-2 sm:top-3 sm:left-3 flex flex-wrap gap-1">
              {product.tags?.slice(0, 1).map((tag) => (
                <Badge
                  key={tag}
                  variant="secondary"
                  className="text-[9px] sm:text-[10px] px-1.5 py-0.5 sm:px-2 sm:py-0.5"
                >
                  {tag}
                </Badge>
              ))}
            </div>

            {/* Origin Badge */}
            {product.origin_flag && (
              <div className="absolute top-2 right-2 sm:top-3 sm:right-3">
                <CountryBadge origin={product.origin_flag} variant="default" />
              </div>
            )}

            {/* Delivery Badge */}
            <div className="absolute bottom-2 left-2 sm:bottom-3 sm:left-3">
              <DeliveryBadge variant="premium" />
            </div>
          </div>

          {/* Content - Flexible padding */}
          <div className="p-3 sm:p-4 lg:p-5 flex flex-col flex-1 min-h-0">
            {/* Category Label */}
            {categoryName && (
              <p className="text-[9px] sm:text-[10px] text-[var(--color-muted-foreground)] uppercase tracking-wider font-medium mb-1">
                {categoryName}
              </p>
            )}

            {/* Name / Variety - Auto height, no fixed clamp */}
            <h3 className="font-semibold text-sm sm:text-base text-[var(--color-foreground)] leading-snug mb-auto">
              {varietyName}
            </h3>

            {/* Price & Add Button */}
            <div className="flex items-end justify-between gap-2 mt-3 sm:mt-4">
              {/* Price Section */}
              <div className="flex flex-col min-w-0 flex-1">
                {hasTiers && minTier ? (
                  <>
                    <p className="text-[10px] sm:text-xs text-[var(--color-muted-foreground)] leading-tight">
                      À partir de
                    </p>
                    <p className="text-sm sm:text-base lg:text-lg font-bold text-[var(--color-foreground)] leading-tight">
                      {formatPrice(minTier.price)}
                      <span className="text-[10px] sm:text-xs font-medium text-[var(--color-muted-foreground)] ml-0.5">
                        /{minTier.quantity_grams}g
                      </span>
                    </p>
                  </>
                ) : (
                  <p className="text-base sm:text-lg lg:text-xl font-bold text-[var(--color-foreground)]">
                    {formatPrice(product.price, product.currency)}
                  </p>
                )}
              </div>

              {/* Action Button - Responsive size */}
              <Button
                size="icon"
                variant={isAdded ? "default" : "glass"}
                className={cn(
                  "h-9 w-9 sm:h-10 sm:w-10 lg:h-11 lg:w-11 rounded-xl shrink-0 transition-all duration-200",
                  isAdded && "bg-[var(--color-success)]"
                )}
                onClick={handleAddToCart}
              >
                {isAdded ? (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 400 }}
                  >
                    <Check className="w-4 h-4 sm:w-5 sm:h-5" />
                  </motion.div>
                ) : hasTiers ? (
                  <Eye className="w-4 h-4 sm:w-5 sm:h-5" />
                ) : (
                  <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Product Detail Modal */}
      <ProductDetailModal
        product={product}
        category={product.category_info}
        open={showDetailModal}
        onOpenChange={setShowDetailModal}
      />
    </>
  );
}
