"use client";

import { useState, useEffect, useMemo } from "react";
import { motion } from "motion/react";
import { PackageX } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { ProductCard } from "@/components/ProductCard";
import { CategoryFilter } from "@/components/CategoryFilter";
import { EmptyState } from "@/components/EmptyState";
import { PageHeader } from "@/components/PageHeader";
import { useDisplayModeStore } from "@/lib/store/display-mode";
import { displayModes, getBentoSpan } from "@/lib/display-modes";
import { cn } from "@/lib/utils";
import { useBranding } from "@/lib/branding";
import type {
  Product,
  ProductCategory,
  ProductWithPricing,
  PricingTier,
} from "@/lib/db/types";

export default function CatalogPage() {
  const [products, setProducts] = useState<ProductWithPricing[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const displayModeRaw = useDisplayModeStore((s) => s.mode);
  const displayMode = displayModeRaw as "grid" | "compact" | "list" | "bento" | "featured";
  const branding = useBranding();

  // Load products and categories
  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      try {
        const [productsRes, categoriesRes] = await Promise.all([
          fetch("/api/products"),
          fetch("/api/categories"),
        ]);

        if (!productsRes.ok || !categoriesRes.ok) {
          throw new Error("Failed to fetch catalog data");
        }

        const productsJson = await productsRes.json();
        const categoriesJson = await categoriesRes.json();
        const productsData = (Array.isArray(productsJson)
          ? productsJson
          : []) as Product[];
        const categoriesData = (Array.isArray(categoriesJson)
          ? categoriesJson
          : []) as ProductCategory[];

        const tiersByProduct = await Promise.all(
          productsData.map(async (product) => {
            const tiersRes = await fetch(
              `/api/pricing-tiers?product_id=${product.id}`
            );
            if (!tiersRes.ok) return [] as PricingTier[];
            return (await tiersRes.json()) as PricingTier[];
          })
        );

        const withPricing: ProductWithPricing[] = productsData.map(
          (product, index) => ({
            ...product,
            pricing_tiers: tiersByProduct[index],
            category_info:
              categoriesData.find((cat) => cat.id === product.category_id) ||
              null,
          })
        );

        if (isMounted) {
          setProducts(withPricing);
          setCategories(categoriesData);
        }
      } catch (error) {
        console.error("Failed to fetch catalog:", error);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, []);

  // Get category names for filter
  const categoryOptions = useMemo(() => {
    const cats = categories
      .filter((c) => c.is_active)
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((c) => c.name);
    return ["All", ...cats];
  }, [categories]);

  // Filter products
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesCategory =
        selectedCategory === "All" ||
        product.category_info?.name === selectedCategory;

      return matchesCategory && product.is_active;
    });
  }, [products, selectedCategory]);

  // Get grid classes based on display mode
  const modeConfig = displayModes[displayModeRaw] || displayModes.grid;
  const gridClasses = cn(
    "grid",
    modeConfig.gridCols,
    modeConfig.gap,
    displayMode === "bento" && "bento-grid",
    displayMode === "list" && "display-mode-list",
    displayMode === "compact" && "display-mode-compact",
    displayMode === "featured" && "display-mode-featured"
  );

  // Skeleton count based on mode
  const skeletonCount = displayMode === "compact" ? 12 : displayMode === "featured" ? 4 : 8;

  return (
    <div className="page-container">
      <PageHeader title={branding.appName} subtitle={branding.tagline} />

      {/* Categories */}
      {!loading && categoryOptions.length > 1 && (
        <CategoryFilter
          categories={categoryOptions}
          selected={selectedCategory}
          onChange={setSelectedCategory}
        />
      )}

      {/* Products Grid */}
      <div className="mt-4 sm:mt-6 pb-28">
        {loading ? (
          <div className={gridClasses}>
            {[...Array(skeletonCount)].map((_, i) => (
              <div key={i} className="space-y-2 sm:space-y-3">
                <Skeleton className={cn(
                  "rounded-2xl sm:rounded-[1.5rem]",
                  displayMode === "list" ? "aspect-[4/1]" : "aspect-square sm:aspect-[4/5]"
                )} />
                <Skeleton className="h-3 w-2/3" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <EmptyState
            icon={PackageX}
            title="Aucun produit trouvé"
            description="Revenez plus tard pour découvrir nos nouveautés"
          />
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={gridClasses}
          >
            {filteredProducts.map((product, index) => (
              <ProductCard
                key={product.id}
                product={product}
                index={index}
                displayMode={displayMode}
                bentoSpan={displayMode === "bento" ? getBentoSpan(index) : undefined}
              />
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}
