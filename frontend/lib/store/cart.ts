"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { Product, PricingTier, ProductWithPricing } from "@/lib/db/types";

export interface CartItem {
  product: Product | ProductWithPricing;
  tier: PricingTier | null; // The selected pricing tier (null for non-tiered products)
  quantity: number; // Number of times the tier is ordered (e.g., 2 × 25g)
}

// Unique key for cart items with tiers
function getCartItemKey(productId: string, tierId: string | null): string {
  return tierId ? `${productId}:${tierId}` : productId;
}

interface CartState {
  items: CartItem[];
  addItem: (product: Product | ProductWithPricing, tier?: PricingTier | null, quantity?: number) => void;
  removeItem: (productId: string, tierId?: string | null) => void;
  updateQuantity: (productId: string, quantity: number, tierId?: string | null) => void;
  clearCart: () => void;
  getTotal: () => number;
  getItemCount: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (product: Product | ProductWithPricing, tier: PricingTier | null = null, quantity = 1) => {
        set((state) => {
          const existingItem = state.items.find(
            (item) =>
              item.product.id === product.id &&
              (tier ? item.tier?.id === tier.id : !item.tier)
          );

          if (existingItem) {
            return {
              items: state.items.map((item) =>
                item.product.id === product.id &&
                (tier ? item.tier?.id === tier.id : !item.tier)
                  ? { ...item, quantity: item.quantity + quantity }
                  : item
              ),
            };
          }

          return {
            items: [...state.items, { product, tier, quantity }],
          };
        });
      },

      removeItem: (productId: string, tierId: string | null = null) => {
        set((state) => ({
          items: state.items.filter(
            (item) =>
              !(
                item.product.id === productId &&
                (tierId ? item.tier?.id === tierId : !item.tier)
              )
          ),
        }));
      },

      updateQuantity: (productId: string, quantity: number, tierId: string | null = null) => {
        if (quantity <= 0) {
          get().removeItem(productId, tierId);
          return;
        }

        set((state) => ({
          items: state.items.map((item) =>
            item.product.id === productId &&
            (tierId ? item.tier?.id === tierId : !item.tier)
              ? { ...item, quantity }
              : item
          ),
        }));
      },

      clearCart: () => {
        set({ items: [] });
      },

      getTotal: () => {
        const { items } = get();
        return items.reduce((total, item) => {
          // Use tier price if available, otherwise use product price
          const itemPrice = item.tier?.price ?? item.product.price;
          return total + itemPrice * item.quantity;
        }, 0);
      },

      getItemCount: () => {
        const { items } = get();
        return items.reduce((count, item) => count + item.quantity, 0);
      },
    }),
    {
      name: "demo-app-cart",
      storage: createJSONStorage(() => {
        // Check if we're in browser
        if (typeof window === "undefined") {
          return {
            getItem: () => null,
            setItem: () => {},
            removeItem: () => {},
          };
        }
        return localStorage;
      }),
      partialize: (state) => ({ items: state.items }),
    }
  )
);

// Helper to format price (now using EUR by default for cannabis)
export function formatPrice(cents: number, currency = "EUR"): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(cents / 100);
}

// Helper to format tier label (e.g., "25g")
export function formatTierLabel(tier: PricingTier): string {
  return `${tier.quantity_grams}g`;
}

// Helper to get item display info
export function getCartItemDisplayInfo(item: CartItem): {
  name: string;
  subtitle: string;
  unitPrice: number;
  totalPrice: number;
} {
  const unitPrice = item.tier?.price ?? item.product.price;
  const totalPrice = unitPrice * item.quantity;

  const subtitle = item.tier
    ? `${item.tier.quantity_grams}g × ${item.quantity}`
    : `× ${item.quantity}`;

  // Handle both Product and ProductWithPricing types
  const productWithPricing = item.product as { variety?: string | null };

  return {
    name: productWithPricing.variety || item.product.name,
    subtitle,
    unitPrice,
    totalPrice,
  };
}
