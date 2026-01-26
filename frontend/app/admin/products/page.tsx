"use client";

import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import { motion } from "motion/react";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  ImagePlus,
  X,
  ArrowLeft,
  FolderTree,
  Sparkles,
  Loader2,
  FileUp,
  Bot,
  PenLine,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatPrice } from "@/lib/store/cart";
import {
  calculateTierPriceFromCost,
  DEFAULT_QUANTITY_TIERS,
} from "@/lib/pricing";
import { ImageUploader } from "@/components/admin/ImageUploader";
import { MenuImportDialog } from "@/components/admin/MenuImportDialog";
import { FlagSelect } from "@/components/admin/FlagSelect";
import { adminFetch } from "@/lib/api/admin-fetch";
import type { Product, ProductCategory, PricingTier } from "@/lib/db/types";

interface TierFormData {
  quantity_grams: number;
  price: number;
  is_custom_price: boolean;
}

interface ProductFormData {
  name: string;
  slug: string;
  variety: string;
  description: string;
  category_id: string;
  stock_quantity: number | null;
  cost_price_per_gram: number;
  margin_percentage: number;
  images: string[];
  tags: string[];
  origin_flag: string;
  is_active: boolean;
  pricing_tiers: TierFormData[];
}

const emptyProduct: ProductFormData = {
  name: "",
  slug: "",
  variety: "",
  description: "",
  category_id: "",
  stock_quantity: null,
  cost_price_per_gram: 0,
  margin_percentage: 50,
  images: [],
  tags: [],
  origin_flag: "",
  is_active: true,
  pricing_tiers: DEFAULT_QUANTITY_TIERS.map((qty) => ({
    quantity_grams: qty,
    price: 0,
    is_custom_price: false,
  })),
};

type WizardMode = null | "ai" | "manual";

// Auto-suggest category based on product name keywords
function suggestCategory(name: string, categories: ProductCategory[]): string | null {
  const lower = name.toLowerCase();
  const keywords: Record<string, string[]> = {
    indoor: ["indoor", "intérieur", "int"],
    outdoor: ["outdoor", "extérieur", "ext", "greenhouse", "green house"],
    hash: ["hash", "hasch", "haschich", "hashish"],
    frozen: ["frozen", "gelé", "ice", "glace"],
    edibles: ["edible", "gummy", "cookie", "bonbon"],
    concentrates: ["wax", "shatter", "rosin", "bho", "live"],
    premium: ["premium", "aaaa", "top"],
  };

  for (const [catSlug, words] of Object.entries(keywords)) {
    if (words.some((w) => lower.includes(w))) {
      const matched = categories.find(
        (c) => c.slug.includes(catSlug) || c.name.toLowerCase().includes(catSlug)
      );
      if (matched) return matched.id;
    }
  }
  return null;
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<(Product & { pricing_tiers?: PricingTier[] })[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState<ProductFormData>(emptyProduct);
  const [tagInput, setTagInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [importDialogOpen, setImportDialogOpen] = useState(false);

  // Wizard mode: null = selection, "ai" = AI-assisted, "manual" = manual entry
  const [wizardMode, setWizardMode] = useState<WizardMode>(null);
  const [aiText, setAiText] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [descGenerating, setDescGenerating] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Fetch products and categories
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [productsRes, categoriesRes] = await Promise.all([
          adminFetch("/api/products"),
          adminFetch("/api/categories"),
        ]);

        if (productsRes.ok) {
          const productsData = await productsRes.json();
          const productsWithTiers = await Promise.all(
            productsData.map(async (product: Product) => {
              const tiersRes = await adminFetch(`/api/pricing-tiers?product_id=${product.id}`);
              const tiers = tiersRes.ok ? await tiersRes.json() : [];
              return { ...product, pricing_tiers: tiers };
            })
          );
          setProducts(productsWithTiers);
        }

        if (categoriesRes.ok) {
          const categoriesData = await categoriesRes.json();
          setCategories(categoriesData);
        }
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Refetch products after import
  const refetchProducts = async () => {
    try {
      const productsRes = await adminFetch("/api/products");
      if (productsRes.ok) {
        const productsData = await productsRes.json();
        const productsWithTiers = await Promise.all(
          productsData.map(async (product: Product) => {
            const tiersRes = await adminFetch(`/api/pricing-tiers?product_id=${product.id}`);
            const tiers = tiersRes.ok ? await tiersRes.json() : [];
            return { ...product, pricing_tiers: tiers };
          })
        );
        setProducts(productsWithTiers);
      }
    } catch (error) {
      console.error("Failed to refetch products:", error);
    }
  };

  // Refetch categories (called when new categories are created during import)
  const refetchCategories = async () => {
    try {
      const categoriesRes = await adminFetch("/api/categories");
      if (categoriesRes.ok) {
        const categoriesData = await categoriesRes.json();
        setCategories(categoriesData);
      }
    } catch (error) {
      console.error("Failed to refetch categories:", error);
    }
  };

  // Filter products
  const filteredProducts = products.filter(
    (product) =>
      product.name.toLowerCase().includes(search.toLowerCase()) ||
      product.variety?.toLowerCase().includes(search.toLowerCase()) ||
      categories
        .find((c) => c.id === product.category_id)
        ?.name.toLowerCase()
        .includes(search.toLowerCase())
  );

  // Generate slug from name
  const generateSlug = (name: string, variety: string) => {
    const base = variety || name;
    return base
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  };

  // Handle form changes
  const handleChange = (field: keyof ProductFormData, value: unknown) => {
    setFormData((prev) => {
      const updated = { ...prev, [field]: value };
      if (field === "name" && !prev.variety) {
        updated.variety = value as string;
      }
      if (field === "variety" && !prev.name) {
        updated.name = value as string;
      }
      if (field === "name" || field === "variety") {
        updated.slug = generateSlug(updated.name, updated.variety);
        // Auto-suggest category if not set
        if (!prev.category_id) {
          const suggested = suggestCategory(updated.name, categories);
          if (suggested) {
            updated.category_id = suggested;
          }
        }
      }
      return updated;
    });
  };

  // Handle tier price change
  const handleTierChange = (index: number, field: keyof TierFormData, value: number) => {
    setFormData((prev) => {
      const updatedTiers = [...prev.pricing_tiers];
      updatedTiers[index] = { ...updatedTiers[index], [field]: value };

      if (field === "price") {
        const calculatedPrice = calculateTierPriceFromCost(
          prev.cost_price_per_gram,
          prev.margin_percentage,
          updatedTiers[index].quantity_grams
        );
        updatedTiers[index].is_custom_price = value !== calculatedPrice;
      }

      return { ...prev, pricing_tiers: updatedTiers };
    });
  };

  // Add tag
  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags?.includes(tagInput.trim())) {
      setFormData((prev) => ({
        ...prev,
        tags: [...(prev.tags || []), tagInput.trim()],
      }));
      setTagInput("");
    }
  };

  // Remove tag
  const handleRemoveTag = (tag: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags?.filter((t) => t !== tag) || [],
    }));
  };

  // AI Parse text to fill form
  const handleAiParse = async () => {
    if (!aiText.trim()) {
      setAiError("Collez du texte à analyser");
      return;
    }

    setAiLoading(true);
    setAiError(null);

    try {
      const response = await adminFetch("/api/admin/ai/parse-menu", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ menu_text: aiText }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Échec de l'analyse");
      }

      if (!data.products || data.products.length === 0) {
        setAiError("Aucun produit détecté. Vérifiez le format.");
        return;
      }

      // Take the first product
      const parsed = data.products[0];

      const categoryId = parsed.category_suggestion
        ? categories.find((c) =>
            c.slug.includes(parsed.category_suggestion.replace("cat-", ""))
          )?.id || ""
        : "";

      setFormData((prev) => ({
        ...prev,
        name: parsed.name || prev.name,
        variety: parsed.variety || parsed.name || prev.variety,
        slug: generateSlug(parsed.name || prev.name, parsed.variety || parsed.name),
        origin_flag: parsed.origin_flag || prev.origin_flag,
        category_id: categoryId || suggestCategory(parsed.name, categories) || prev.category_id,
        tags: parsed.tags || prev.tags,
        pricing_tiers: parsed.pricing_tiers?.length > 0
          ? parsed.pricing_tiers.map((t: { quantity_grams: number; price: number }) => ({
              quantity_grams: t.quantity_grams,
              price: t.price,
              is_custom_price: true,
            }))
          : prev.pricing_tiers,
      }));

      setWizardMode("manual");
    } catch (error) {
      console.error("AI parse error:", error);
      setAiError(error instanceof Error ? error.message : "Erreur lors de l'analyse");
    } finally {
      setAiLoading(false);
    }
  };

  // Generate description with AI
  const handleGenerateDescription = async () => {
    const strainName = formData.variety || formData.name;
    if (!strainName) {
      setAiError("Ajoutez d'abord un nom de produit.");
      return;
    }

    setDescGenerating(true);
    setAiError(null);

    try {
      const response = await adminFetch("/api/admin/ai/description", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          strain_name: strainName,
          existing_description: formData.description || null,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || "Échec de la génération");
      }

      if (data.description) {
        setFormData((prev) => ({ ...prev, description: data.description }));
      }

      // Also apply tags from strain info
      if (data.strain) {
        const newTags = [
          ...(data.strain.effects || []),
          ...(data.strain.flavors || []),
        ]
          .map((tag: string) => tag.trim())
          .filter(Boolean)
          .slice(0, 8);

        if (newTags.length > 0 && (!formData.tags || formData.tags.length === 0)) {
          setFormData((prev) => ({ ...prev, tags: newTags }));
        }
      }
    } catch (error) {
      console.error("AI description error:", error);
      setAiError("Impossible de générer la description.");
    } finally {
      setDescGenerating(false);
    }
  };

  // Open dialog for new product
  const handleNew = () => {
    setEditingProduct(null);
    setFormData({
      ...emptyProduct,
      pricing_tiers: DEFAULT_QUANTITY_TIERS.map((qty) => ({
        quantity_grams: qty,
        price: 0,
        is_custom_price: false,
      })),
    });
    setWizardMode(null);
    setAiText("");
    setAiError(null);
    setTagInput("");
    setShowAdvanced(false);
    setDialogOpen(true);
  };

  // Open dialog for editing
  const handleEdit = (product: Product & { pricing_tiers?: PricingTier[] }) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      slug: product.slug,
      variety: product.variety || "",
      description: product.description || "",
      category_id: product.category_id || "",
      stock_quantity: product.stock_quantity ?? null,
      cost_price_per_gram: product.cost_price_per_gram || 0,
      margin_percentage: product.margin_percentage || 50,
      images: (product.images as string[]) || [],
      tags: product.tags || [],
      origin_flag: product.origin_flag || "",
      is_active: product.is_active,
      pricing_tiers:
        product.pricing_tiers?.map((t) => ({
          quantity_grams: t.quantity_grams,
          price: t.price,
          is_custom_price: t.is_custom_price,
        })) ||
        DEFAULT_QUANTITY_TIERS.map((qty) => ({
          quantity_grams: qty,
          price: calculateTierPriceFromCost(
            product.cost_price_per_gram || 0,
            product.margin_percentage || 50,
            qty
          ),
          is_custom_price: false,
        })),
    });
    setWizardMode("manual");
    setAiText("");
    setAiError(null);
    setTagInput("");
    setShowAdvanced(true);
    setDialogOpen(true);
  };

  // Save product
  const handleSave = async () => {
    if (!formData.name.trim()) {
      setAiError("Le nom du produit est requis.");
      return;
    }

    setSaving(true);
    try {
      const productData = {
        name: formData.name,
        slug: formData.slug,
        variety: formData.variety || null,
        description: formData.description || null,
        category_id: formData.category_id || null,
        stock_quantity:
          typeof formData.stock_quantity === "number"
            ? formData.stock_quantity
            : null,
        cost_price_per_gram: formData.cost_price_per_gram,
        margin_percentage: formData.margin_percentage,
        price: 0,
        currency: "EUR",
        images: formData.images,
        tags: formData.tags,
        origin_flag: formData.origin_flag || null,
        is_active: formData.is_active,
      };

      let savedProduct: Product;

      if (editingProduct) {
        const response = await adminFetch(`/api/products/${editingProduct.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(productData),
        });

        if (!response.ok) throw new Error("Failed to update product");
        savedProduct = await response.json();
      } else {
        const response = await adminFetch("/api/products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(productData),
        });

        if (!response.ok) throw new Error("Failed to create product");
        savedProduct = await response.json();
      }

      // Save pricing tiers
      const tiersResponse = await adminFetch("/api/pricing-tiers", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product_id: savedProduct.id,
          tiers: formData.pricing_tiers,
        }),
      });

      if (!tiersResponse.ok) throw new Error("Failed to save pricing tiers");
      const savedTiers = await tiersResponse.json();

      const productWithTiers = { ...savedProduct, pricing_tiers: savedTiers };

      if (editingProduct) {
        setProducts((prev) =>
          prev.map((p) => (p.id === editingProduct.id ? productWithTiers : p))
        );
      } else {
        setProducts((prev) => [productWithTiers, ...prev]);
      }

      setDialogOpen(false);
    } catch (error) {
      console.error("Failed to save product:", error);
      setAiError("Erreur lors de l'enregistrement du produit");
    } finally {
      setSaving(false);
    }
  };

  // Delete product
  const handleDelete = async () => {
    if (!productToDelete) return;

    try {
      const response = await adminFetch(`/api/products/${productToDelete.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setProducts((prev) => prev.filter((p) => p.id !== productToDelete.id));
      }

      setDeleteDialogOpen(false);
      setProductToDelete(null);
    } catch (error) {
      console.error("Failed to delete product:", error);
    }
  };

  // Toggle active status
  const handleToggleActive = async (product: Product) => {
    try {
      const response = await adminFetch(`/api/products/${product.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !product.is_active }),
      });

      if (response.ok) {
        setProducts((prev) =>
          prev.map((p) =>
            p.id === product.id ? { ...p, is_active: !p.is_active } : p
          )
        );
      }
    } catch (error) {
      console.error("Failed to toggle product:", error);
    }
  };

  // Get category name
  const getCategoryName = (categoryId: string | null) => {
    if (!categoryId) return "Sans catégorie";
    return categories.find((c) => c.id === categoryId)?.name || "Sans catégorie";
  };

  // Get min tier price for display
  const getMinTierPrice = (product: Product & { pricing_tiers?: PricingTier[] }) => {
    if (!product.pricing_tiers || product.pricing_tiers.length === 0) {
      return product.price;
    }
    const minTier = product.pricing_tiers.reduce(
      (min, t) => (t.price < min.price ? t : min),
      product.pricing_tiers[0]
    );
    return minTier.price;
  };

  const activeCategories = useMemo(
    () => categories.filter((c) => c.is_active),
    [categories]
  );

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-foreground)]">
            Catalogue
          </h1>
          <p className="text-[var(--color-muted-foreground)] text-sm mt-1">
            Gérer les produits et catégories
          </p>
        </div>
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <Link href="/admin/categories">
              <Button variant="outline" size="sm" className="h-9">
                <FolderTree className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Catégories</span>
              </Button>
            </Link>
            <Button variant="outline" size="sm" className="h-9" onClick={() => setImportDialogOpen(true)}>
              <FileUp className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Importer</span>
            </Button>
            <Button variant="warning" size="sm" className="h-9" onClick={handleNew}>
              <Plus className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Nouveau</span>
            </Button>
          </div>
          {/* Badge explicatif visible uniquement en mobile */}
          <p className="sm:hidden text-xs text-[var(--color-muted-foreground)]">
            Catégories | Importer menu | Ajouter produit
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--color-muted-foreground)]" />
        <Input
          placeholder="Rechercher..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-12"
        />
      </div>

      {/* Products - Mobile Cards */}
      <div className="md:hidden space-y-3">
        {loading ? (
          [...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-2xl" />
          ))
        ) : filteredProducts.length === 0 ? (
          <div className="py-12 text-center text-[var(--color-muted-foreground)]">
            Aucun produit trouvé
          </div>
        ) : (
          filteredProducts.map((product) => {
            const images = (product.images as string[]) || [];
            const primaryMedia = images[0];
            const isVideo =
              primaryMedia &&
              [".mp4", ".webm", ".mov", ".m4v"].some((ext) =>
                primaryMedia.split("?")[0].toLowerCase().endsWith(ext)
              );
            return (
              <motion.div
                key={product.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="glass-card rounded-2xl p-4"
              >
                <div className="flex items-center gap-3">
                  <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-[var(--color-muted)]/10 shrink-0">
                    {primaryMedia ? (
                      isVideo ? (
                        <video
                          src={primaryMedia}
                          className="absolute inset-0 h-full w-full object-cover"
                          muted
                          playsInline
                          preload="metadata"
                        />
                      ) : (
                        <Image
                          src={primaryMedia}
                          alt={product.name}
                          fill
                          className="object-cover"
                        />
                      )
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ImagePlus className="w-5 h-5 text-[var(--color-muted-foreground)]" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-[var(--color-foreground)] truncate">
                        {product.origin_flag && <span className="mr-1">{product.origin_flag}</span>}
                        {product.variety || product.name}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Badge variant="outline" className="text-[10px]">
                        {getCategoryName(product.category_id)}
                      </Badge>
                      <span className="text-xs text-[var(--color-muted-foreground)]">
                        {product.pricing_tiers?.length || 0} paliers
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <p className="font-semibold text-sm text-[var(--color-foreground)]">
                        {formatPrice(getMinTierPrice(product))}
                      </p>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={product.is_active}
                          onCheckedChange={() => handleToggleActive(product)}
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleEdit(product)}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-[var(--color-destructive)]"
                          onClick={() => {
                            setProductToDelete(product);
                            setDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Products - Desktop Table */}
      <div className="hidden md:block glass-card rounded-[1.5rem] overflow-hidden shadow-[var(--shadow-card-soft)]">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[var(--color-border)] bg-[var(--color-muted)]/30">
                <th className="text-left px-6 py-4 text-sm font-semibold text-[var(--color-muted-foreground)]">
                  Produit
                </th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-[var(--color-muted-foreground)]">
                  Catégorie
                </th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-[var(--color-muted-foreground)]">
                  Prix min
                </th>
                <th className="text-center px-6 py-4 text-sm font-semibold text-[var(--color-muted-foreground)]">
                  Actif
                </th>
                <th className="text-right px-6 py-4 text-sm font-semibold text-[var(--color-muted-foreground)]">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(3)].map((_, i) => (
                  <tr key={i} className="border-b border-[var(--color-border)]">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <Skeleton className="w-12 h-12 rounded-xl" />
                        <div>
                          <Skeleton className="h-4 w-32 mb-2" />
                          <Skeleton className="h-3 w-20" />
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Skeleton className="h-4 w-24" />
                    </td>
                    <td className="px-6 py-4">
                      <Skeleton className="h-4 w-16" />
                    </td>
                    <td className="px-6 py-4">
                      <Skeleton className="h-6 w-10 mx-auto" />
                    </td>
                    <td className="px-6 py-4">
                      <Skeleton className="h-8 w-20 ml-auto" />
                    </td>
                  </tr>
                ))
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-12 text-center text-[var(--color-muted-foreground)]"
                  >
                    Aucun produit trouvé
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product) => {
                  const images = (product.images as string[]) || [];
                  const primaryMedia = images[0];
                  const isVideo =
                    primaryMedia &&
                    [".mp4", ".webm", ".mov", ".m4v"].some((ext) =>
                      primaryMedia.split("?")[0].toLowerCase().endsWith(ext)
                    );
                  return (
                    <motion.tr
                      key={product.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="border-b border-[var(--color-border)] hover:bg-[var(--color-muted)]/30 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-[var(--color-muted)]/10">
                            {primaryMedia ? (
                              isVideo ? (
                                <video
                                  src={primaryMedia}
                                  className="absolute inset-0 h-full w-full object-cover"
                                  muted
                                  playsInline
                                  preload="metadata"
                                />
                              ) : (
                                <Image
                                  src={primaryMedia}
                                  alt={product.name}
                                  fill
                                  className="object-cover"
                                />
                              )
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <ImagePlus className="w-5 h-5 text-[var(--color-muted-foreground)]" />
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-[var(--color-foreground)]">
                              {product.variety || product.name}
                            </p>
                            {product.origin_flag && (
                              <span className="text-sm mr-1">{product.origin_flag}</span>
                            )}
                            <span className="text-xs text-[var(--color-muted-foreground)]">
                              {product.pricing_tiers?.length || 0} paliers
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant="outline">
                          {getCategoryName(product.category_id)}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-semibold text-[var(--color-foreground)]">
                          {formatPrice(getMinTierPrice(product))}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-center">
                          <Switch
                            checked={product.is_active}
                            onCheckedChange={() => handleToggleActive(product)}
                          />
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(product)}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-[var(--color-destructive)]"
                            onClick={() => {
                              setProductToDelete(product);
                              setDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Product Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="w-[95vw] max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center gap-3">
              {wizardMode !== null && !editingProduct && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setWizardMode(null)}
                  className="h-9 w-9 rounded-full border border-[var(--color-border)] bg-[var(--color-glass)]"
                  aria-label="Retour"
                >
                  <ArrowLeft className="w-4 h-4" />
                </Button>
              )}
              <DialogTitle className="text-base">
                {editingProduct
                  ? "Modifier le produit"
                  : wizardMode === null
                  ? "Nouveau produit"
                  : wizardMode === "ai"
                  ? "Analyser avec IA"
                  : "Créer un produit"}
              </DialogTitle>
            </div>
          </DialogHeader>

          {/* Mode Selection */}
          {wizardMode === null && !editingProduct && (
            <div className="py-6">
              <p className="text-sm text-[var(--color-muted-foreground)] text-center mb-6">
                Comment voulez-vous ajouter le produit ?
              </p>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setWizardMode("ai")}
                  className="flex flex-col items-center gap-3 p-6 rounded-2xl border-2 border-[var(--color-border)] hover:border-[var(--color-primary)] hover:bg-[var(--color-glass)] transition-all"
                >
                  <div className="w-12 h-12 rounded-xl bg-[var(--color-primary)]/10 flex items-center justify-center">
                    <Bot className="w-6 h-6 text-[var(--color-primary)]" />
                  </div>
                  <div className="text-center">
                    <p className="font-medium text-[var(--color-foreground)]">IA</p>
                    <p className="text-xs text-[var(--color-muted-foreground)]">
                      Coller un texte
                    </p>
                  </div>
                </button>
                <button
                  onClick={() => setWizardMode("manual")}
                  className="flex flex-col items-center gap-3 p-6 rounded-2xl border-2 border-[var(--color-border)] hover:border-[var(--color-primary)] hover:bg-[var(--color-glass)] transition-all"
                >
                  <div className="w-12 h-12 rounded-xl bg-[var(--color-primary)]/10 flex items-center justify-center">
                    <PenLine className="w-6 h-6 text-[var(--color-primary)]" />
                  </div>
                  <div className="text-center">
                    <p className="font-medium text-[var(--color-foreground)]">Manuel</p>
                    <p className="text-xs text-[var(--color-muted-foreground)]">
                      Remplir les champs
                    </p>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* AI Mode */}
          {wizardMode === "ai" && !editingProduct && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Collez le texte du produit</Label>
                <Textarea
                  value={aiText}
                  onChange={(e) => setAiText(e.target.value)}
                  placeholder="Ex: GORILLA GLUE 🇲🇦 - 10g: 65€ / 25g: 150€"
                  rows={6}
                  className="font-mono text-sm"
                />
              </div>
              <p className="text-xs text-[var(--color-muted-foreground)]">
                L'IA extraira le nom, l'origine, et les prix automatiquement.
              </p>

              {aiError && (
                <p className="text-xs text-[var(--color-destructive)]">{aiError}</p>
              )}

              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Annuler
                </Button>
                <Button
                  variant="warning"
                  onClick={handleAiParse}
                  disabled={aiLoading || !aiText.trim()}
                >
                  {aiLoading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4 mr-2" />
                  )}
                  Analyser
                </Button>
              </DialogFooter>
            </div>
          )}

          {/* Manual Mode / Form */}
          {(wizardMode === "manual" || editingProduct) && (
            <div className="space-y-4 py-4">
              {/* Name & Category Row */}
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="name">Nom *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleChange("name", e.target.value)}
                    placeholder="Tropicana Cookies"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="category_id">Catégorie</Label>
                  <Select
                    value={formData.category_id || "none"}
                    onValueChange={(value) =>
                      handleChange("category_id", value === "none" ? "" : value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sans catégorie</SelectItem>
                      {activeCategories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Origin Flag */}
              <div className="space-y-1.5">
                <Label>Origine</Label>
                <FlagSelect
                  value={formData.origin_flag}
                  onChange={(value) => handleChange("origin_flag", value)}
                />
              </div>

              {/* Pricing Tiers - Compact Grid */}
              <div className="space-y-1.5">
                <Label>Prix par palier</Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
                  {formData.pricing_tiers.map((tier, index) => (
                    <div key={index} className="space-y-1 min-w-0">
                      <Label className="text-xs text-[var(--color-muted-foreground)]">
                        {tier.quantity_grams}g
                      </Label>
                      <div className="relative flex items-center">
                        <Input
                          type="number"
                          inputMode="decimal"
                          step="0.01"
                          value={tier.price > 0 ? (tier.price / 100).toFixed(2) : ""}
                          onChange={(e) =>
                            handleTierChange(
                              index,
                              "price",
                              Math.round(parseFloat(e.target.value) * 100) || 0
                            )
                          }
                          placeholder="0.00"
                          className="pr-7 text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                        <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-[var(--color-muted-foreground)] pointer-events-none">
                          €
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Description with AI Button */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <Label htmlFor="description">Description</Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleGenerateDescription}
                    disabled={descGenerating || !formData.name}
                    className="h-7 text-xs shrink-0"
                  >
                    {descGenerating ? (
                      <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                    ) : (
                      <Sparkles className="w-3 h-3 mr-1" />
                    )}
                    Générer avec IA
                  </Button>
                </div>
                <Textarea
                  id="description"
                  value={formData.description || ""}
                  onChange={(e) => handleChange("description", e.target.value)}
                  placeholder="Description du produit (optionnel)"
                  rows={3}
                />
              </div>

              {/* Advanced Section Toggle */}
              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="flex items-center gap-2 text-sm text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
              >
                <span>{showAdvanced ? "−" : "+"}</span>
                <span>Options avancées</span>
              </button>

              {/* Advanced Options */}
              {showAdvanced && (
                <div className="space-y-4 pt-2 border-t border-[var(--color-border)]">
                  {/* Variety & Slug */}
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="variety">Variété</Label>
                      <Input
                        id="variety"
                        value={formData.variety}
                        onChange={(e) => handleChange("variety", e.target.value)}
                        placeholder="Si différent du nom"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="slug">Slug</Label>
                      <Input
                        id="slug"
                        value={formData.slug}
                        onChange={(e) => handleChange("slug", e.target.value)}
                        placeholder="slug-produit"
                      />
                    </div>
                  </div>

                  {/* Images */}
                  <div className="space-y-1.5">
                    <Label>Médias</Label>
                    <ImageUploader
                      images={formData.images || []}
                      onChange={(images) => handleChange("images", images)}
                      maxImages={5}
                    />
                  </div>

                  {/* Tags */}
                  <div className="space-y-1.5">
                    <Label>Tags</Label>
                    <div className="flex gap-2">
                      <Input
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        placeholder="Ajouter un tag"
                        className="flex-1 min-w-0"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleAddTag();
                          }
                        }}
                      />
                      <Button type="button" variant="outline" onClick={handleAddTag} className="shrink-0">
                        Ajouter
                      </Button>
                    </div>
                    {formData.tags && formData.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {formData.tags.map((tag) => (
                          <Badge key={tag} variant="secondary" className="gap-1">
                            {tag}
                            <button
                              type="button"
                              onClick={() => handleRemoveTag(tag)}
                              className="hover:text-[var(--color-destructive)]"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Active Toggle */}
                  <div className="flex items-center justify-between">
                    <Label htmlFor="is_active">Produit actif</Label>
                    <Switch
                      id="is_active"
                      checked={formData.is_active}
                      onCheckedChange={(checked) => handleChange("is_active", checked)}
                    />
                  </div>
                </div>
              )}

              {aiError && (
                <p className="text-xs text-[var(--color-destructive)]">{aiError}</p>
              )}

              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Annuler
                </Button>
                <Button
                  variant="success"
                  onClick={handleSave}
                  disabled={saving || !formData.name}
                >
                  {saving ? "Enregistrement..." : editingProduct ? "Enregistrer" : "Créer le produit"}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer le produit</DialogTitle>
          </DialogHeader>
          <p className="text-[var(--color-muted-foreground)]">
            Êtes-vous sûr de vouloir supprimer "{productToDelete?.variety || productToDelete?.name}" ? Cette
            action est irréversible.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Annuler
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Menu Import Dialog */}
      <MenuImportDialog
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
        categories={categories}
        onImportComplete={refetchProducts}
        onCategoriesChange={refetchCategories}
      />
    </div>
  );
}
