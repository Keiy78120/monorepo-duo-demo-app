"use client";

import Image from "next/image";
import { motion } from "motion/react";
import { Minus, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCartStore, formatPrice, getCartItemDisplayInfo, type CartItem as CartItemType } from "@/lib/store/cart";
import { useHapticFeedback } from "@/lib/store/telegram";

interface CartItemProps {
  item: CartItemType;
  index?: number;
}

export function CartItem({ item, index = 0 }: CartItemProps) {
  const { updateQuantity, removeItem } = useCartStore();
  const { impact, selection } = useHapticFeedback();

  const images = (item.product.images as string[]) || [];
  const primaryImage = images[0] || "/placeholder.png";
  const isVideo = primaryImage
    ? [".mp4", ".webm", ".mov", ".m4v"].some((ext) =>
        primaryImage.split("?")[0].toLowerCase().endsWith(ext)
      )
    : false;

  // Get display info
  const displayInfo = getCartItemDisplayInfo(item);
  const tierId = item.tier?.id || null;

  const handleIncrease = () => {
    updateQuantity(item.product.id, item.quantity + 1, tierId);
    selection();
  };

  const handleDecrease = () => {
    if (item.quantity > 1) {
      updateQuantity(item.product.id, item.quantity - 1, tierId);
      selection();
    } else {
      removeItem(item.product.id, tierId);
      impact("medium");
    }
  };

  const handleRemove = () => {
    removeItem(item.product.id, tierId);
    impact("medium");
  };

  // Get category/variety info
  const productWithPricing = item.product as { category_info?: { name: string } | null; variety?: string | null };
  const categoryLabel = productWithPricing.category_info?.name || item.product.category;
  const productName = productWithPricing.variety || item.product.name;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20, height: 0 }}
      transition={{ delay: index * 0.05 }}
      className="glass-card rounded-[1.5rem] p-5"
    >
      <div className="flex gap-4">
        {/* Image */}
        <div className="relative w-24 h-24 rounded-xl overflow-hidden bg-[var(--color-muted)] shrink-0">
          {isVideo ? (
            <video
              src={primaryImage}
              className="absolute inset-0 h-full w-full object-cover"
              muted
              playsInline
              preload="metadata"
            />
          ) : (
            <Image
              src={primaryImage}
              alt={productName}
              fill
              className="object-cover"
            />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Name & Remove */}
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              {categoryLabel && (
                <p className="text-[10px] text-[var(--color-muted-foreground)] uppercase tracking-wider mb-0.5">
                  {categoryLabel}
                </p>
              )}
              <h3 className="font-semibold text-[var(--color-foreground)] text-sm line-clamp-1">
                {productName}
              </h3>
              {/* Tier info */}
              {item.tier && (
                <p className="text-xs text-[var(--color-muted-foreground)]">
                  {item.tier.quantity_grams}g × {item.quantity}
                </p>
              )}
            </div>
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 text-[var(--color-muted-foreground)] hover:text-[var(--color-destructive)] shrink-0"
              onClick={handleRemove}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>

          {/* Price & Quantity */}
          <div className="flex items-center justify-between mt-3">
            <p className="text-lg font-bold text-[var(--color-foreground)]">
              {formatPrice(displayInfo.totalPrice)}
            </p>

            {/* Quantity Controls - Pill style */}
            <div className="flex items-center gap-1 bg-[var(--color-muted)] rounded-full p-1">
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 rounded-full"
                onClick={handleDecrease}
              >
                <Minus className="w-4 h-4" />
              </Button>
              <span className="w-8 text-center text-sm font-semibold text-[var(--color-foreground)]">
                {item.quantity}
              </span>
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 rounded-full"
                onClick={handleIncrease}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
