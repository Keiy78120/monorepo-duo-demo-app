"use client";

import { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Loader2,
  Sparkles,
  Check,
  X,
  AlertCircle,
  ChevronLeft,
  Trash2,
  ImagePlus,
  Image as ImageIcon,
} from "lucide-react";
import Image from "next/image";
import { formatPrice } from "@/lib/store/cart";
import { adminFetch } from "@/lib/api/admin-fetch";
import type { ProductCategory } from "@/lib/db/types";

interface ParsedProduct {
  name: string;
  variety?: string;
  origin_flag?: string;
  category_suggestion?: string;
  pricing_tiers: { quantity_grams: number; price: number }[];
  tags?: string[];
  confidence: number;
}

interface ProductToImport extends ParsedProduct {
  id: string;
  selected: boolean;
  category_id: string;
  images: string[];
}

type DialogStep = "input" | "parsing" | "review" | "importing" | "done";

interface ImportResult {
  success: { name: string }[];
  errors: { name: string; error: string }[];
}

interface MenuImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: ProductCategory[];
  onImportComplete: () => void;
  onCategoriesChange?: () => void; // Callback to refresh categories list
}

const EXAMPLE_MENU = `GORILLA GLUE 🇲🇦 - 10g: 65€ / 25g: 150€ / 50g: 280€
AMNESIA (Indoor) 🇳🇱 - 10g: 80€ / 25g: 185€
CRITICAL 🇪🇸 - 10g: 55€ / 25g: 130€ / 50g: 240€
HASH MAROCAIN Premium - 10g: 45€ / 25g: 100€`;

export function MenuImportDialog({
  open,
  onOpenChange,
  categories,
  onImportComplete,
  onCategoriesChange,
}: MenuImportDialogProps) {
  const [step, setStep] = useState<DialogStep>("input");
  const [menuText, setMenuText] = useState("");
  const [products, setProducts] = useState<ProductToImport[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [parseError, setParseError] = useState<string | null>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [importProgress, setImportProgress] = useState(0);
  const [createdCategories, setCreatedCategories] = useState<string[]>([]);
  const [localCategories, setLocalCategories] = useState<ProductCategory[]>(categories);

  // Keep local categories in sync with prop
  const effectiveCategories = localCategories.length > 0 ? localCategories : categories;

  // Get active categories for selection
  const activeCategories = useMemo(
    () => effectiveCategories.filter((c) => c.is_active),
    [effectiveCategories]
  );

  // Find category ID from suggestion slug
  const findCategoryId = (suggestion?: string, cats: ProductCategory[] = effectiveCategories): string => {
    if (!suggestion) return "";
    const slug = suggestion.replace("cat-", "");
    // Try to match by exact slug first, then partial match
    const matched = cats.find(
      (c) => c.slug === slug || c.slug === suggestion || c.slug.includes(slug)
    );
    return matched?.id || "";
  };

  // Create missing categories before import
  const ensureCategoriesExist = async (productsToCheck: ProductToImport[]): Promise<ProductCategory[]> => {
    // Collect unique category suggestions
    const suggestions = [...new Set(
      productsToCheck
        .map(p => p.category_suggestion)
        .filter((s): s is string => Boolean(s))
    )];

    const created: string[] = [];
    let updatedCategories = [...effectiveCategories];

    for (const suggestion of suggestions) {
      const slug = suggestion.replace("cat-", "");
      const exists = updatedCategories.find(
        c => c.slug === slug || c.slug === suggestion || c.slug.includes(slug)
      );

      if (!exists) {
        // Create a readable name from slug: "frozen" → "Frozen", "indoor-premium" → "Indoor Premium"
        const name = slug
          .split("-")
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(" ");

        try {
          const response = await adminFetch("/api/categories", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name,
              slug,
              is_active: true,
            }),
          });

          if (response.ok) {
            const newCategory = await response.json();
            updatedCategories.push(newCategory);
            created.push(name);
          } else {
            const errorData = await response.json().catch(() => ({}));
            console.warn(`Failed to create category ${slug}:`, errorData.error);
          }
        } catch (error) {
          console.error(`Error creating category ${slug}:`, error);
        }
      }
    }

    if (created.length > 0) {
      setCreatedCategories(created);
      setLocalCategories(updatedCategories);
      onCategoriesChange?.();
    }

    return updatedCategories;
  };

  const handleParse = async () => {
    if (!menuText.trim()) {
      setParseError("Veuillez coller un menu avant de parser");
      return;
    }

    setStep("parsing");
    setParseError(null);
    setWarnings([]);

    try {
      const response = await adminFetch("/api/admin/ai/parse-menu", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ menu_text: menuText }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Échec du parsing");
      }

      if (data.warnings && data.warnings.length > 0) {
        setWarnings(data.warnings);
      }

      if (!data.products || data.products.length === 0) {
        setParseError("Aucun produit détecté. Vérifiez le format du menu.");
        setStep("input");
        return;
      }

      // Convert to ProductToImport with unique IDs
      const productsToImport: ProductToImport[] = data.products.map(
        (p: ParsedProduct, index: number) => ({
          ...p,
          id: `import-${Date.now()}-${index}`,
          selected: true,
          category_id: findCategoryId(p.category_suggestion),
          images: [],
        })
      );

      setProducts(productsToImport);
      setStep("review");
    } catch (error) {
      console.error("Parse error:", error);
      setParseError(
        error instanceof Error ? error.message : "Erreur lors du parsing"
      );
      setStep("input");
    }
  };

  const handleToggleProduct = (id: string) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, selected: !p.selected } : p))
    );
  };

  const handleRemoveProduct = (id: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
  };

  const handleUpdateProduct = (
    id: string,
    field: keyof ProductToImport,
    value: unknown
  ) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, [field]: value } : p))
    );
  };

  const handleUpdateTierPrice = (
    productId: string,
    tierIndex: number,
    price: number
  ) => {
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id !== productId) return p;
        const newTiers = [...p.pricing_tiers];
        newTiers[tierIndex] = { ...newTiers[tierIndex], price };
        return { ...p, pricing_tiers: newTiers };
      })
    );
  };

  // Image upload for a product
  const [uploadingProductId, setUploadingProductId] = useState<string | null>(null);

  const handleImageUpload = async (productId: string, file: File) => {
    // Validate file
    const isImage = file.type.startsWith("image/");
    const isVideo = file.type.startsWith("video/");
    if (!isImage && !isVideo) return;

    const maxSize = isVideo ? 20 : 5; // MB
    if (file.size > maxSize * 1024 * 1024) return;

    setUploadingProductId(productId);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await adminFetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setProducts((prev) =>
          prev.map((p) =>
            p.id === productId
              ? { ...p, images: [...p.images, data.url] }
              : p
          )
        );
      }
    } catch (error) {
      console.error("Upload error:", error);
    } finally {
      setUploadingProductId(null);
    }
  };

  const handleRemoveImage = (productId: string, imageIndex: number) => {
    setProducts((prev) =>
      prev.map((p) =>
        p.id === productId
          ? { ...p, images: p.images.filter((_, i) => i !== imageIndex) }
          : p
      )
    );
  };

  const generateSlug = (name: string, variety?: string) => {
    const base = variety || name;
    return base
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  };

  // Track used slugs during import to handle duplicates
  const usedSlugsRef = { current: new Set<string>() };

  const generateUniqueSlug = (name: string, variety?: string): string => {
    let baseSlug = generateSlug(name, variety);
    let slug = baseSlug;
    let counter = 2;

    // Check if slug is already used in this import batch
    while (usedSlugsRef.current.has(slug)) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    usedSlugsRef.current.add(slug);
    return slug;
  };

  const handleImport = async () => {
    const selectedProducts = products.filter((p) => p.selected);
    if (selectedProducts.length === 0) {
      setParseError("Sélectionnez au moins un produit à importer");
      return;
    }

    setStep("importing");
    setImportProgress(0);

    // Reset used slugs for this import batch
    usedSlugsRef.current = new Set<string>();

    // Step 1: Create missing categories first
    const updatedCategories = await ensureCategoriesExist(selectedProducts);

    // Step 2: Update products with correct category IDs after categories are created
    const productsWithCategories = selectedProducts.map(p => ({
      ...p,
      category_id: p.category_id || findCategoryId(p.category_suggestion, updatedCategories),
    }));

    const result: ImportResult = { success: [], errors: [] };

    for (let i = 0; i < productsWithCategories.length; i++) {
      const product = productsWithCategories[i];
      setImportProgress(Math.round(((i + 1) / productsWithCategories.length) * 100));

      try {
        // Create the product with unique slug
        const productData = {
          name: product.name,
          slug: generateUniqueSlug(product.name, product.variety),
          variety: product.variety || product.name,
          description: null,
          category_id: product.category_id || null,
          stock_quantity: null,
          cost_price_per_gram: 0,
          margin_percentage: 50,
          price: 0,
          currency: "EUR",
          images: product.images || [],
          tags: product.tags || [],
          origin_flag: product.origin_flag || null,
          is_active: false, // Start as inactive for review
        };

        const createResponse = await adminFetch("/api/products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(productData),
        });

        if (!createResponse.ok) {
          const errorData = await createResponse.json().catch(() => ({}));
          // Extract detailed error from API response
          let errorMessage = "Échec de création";
          if (errorData.error) {
            errorMessage = errorData.error;
          }
          if (errorData.details) {
            // Handle Zod validation errors
            if (Array.isArray(errorData.details)) {
              errorMessage += `: ${errorData.details.map((d: { message?: string }) => d.message).join(", ")}`;
            } else if (typeof errorData.details === "object") {
              errorMessage += `: ${JSON.stringify(errorData.details)}`;
            }
          }
          throw new Error(errorMessage);
        }

        const savedProduct = await createResponse.json();

        // Save pricing tiers
        if (product.pricing_tiers.length > 0) {
          const tiersData = product.pricing_tiers.map((tier, index) => ({
            quantity_grams: tier.quantity_grams,
            price: tier.price,
            is_custom_price: true,
            sort_order: index,
          }));

          const tiersResponse = await adminFetch("/api/pricing-tiers", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              product_id: savedProduct.id,
              tiers: tiersData,
            }),
          });

          if (!tiersResponse.ok) {
            const tiersError = await tiersResponse.json().catch(() => ({}));
            console.warn(`Warning: Failed to save pricing tiers for ${product.name}:`, tiersError.error);
          }
        }

        result.success.push({ name: product.name });
      } catch (error) {
        console.error(`Failed to import ${product.name}:`, error);
        result.errors.push({
          name: product.name,
          error: error instanceof Error ? error.message : "Erreur inconnue",
        });
      }
    }

    setImportResult(result);
    setStep("done");

    if (result.success.length > 0) {
      onImportComplete();
    }
  };

  const handleClose = () => {
    // Reset state
    setStep("input");
    setMenuText("");
    setProducts([]);
    setWarnings([]);
    setParseError(null);
    setImportResult(null);
    setImportProgress(0);
    setCreatedCategories([]);
    setLocalCategories(categories);
    onOpenChange(false);
  };

  const handleBack = () => {
    if (step === "review") {
      setStep("input");
    }
  };

  const selectedCount = products.filter((p) => p.selected).length;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
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
            <DialogTitle>
              {step === "input" && "Importer un menu"}
              {step === "parsing" && "Analyse en cours..."}
              {step === "review" && `${products.length} produits détectés`}
              {step === "importing" && "Importation en cours..."}
              {step === "done" && "Import terminé"}
            </DialogTitle>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto py-4">
          {/* Input Step */}
          {step === "input" && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="menu-text">Collez le texte du menu</Label>
                <Textarea
                  id="menu-text"
                  value={menuText}
                  onChange={(e) => setMenuText(e.target.value)}
                  placeholder={`Exemple:\n${EXAMPLE_MENU}`}
                  rows={12}
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
                  <strong>Formats supportés:</strong>
                  <br />
                  NOM PRODUIT [emoji drapeau] - 10g: 65€ / 25g: 150€
                  <br />
                  Variantes: (Indoor), [Premium], qualificatifs dans le nom
                </p>
              </div>
            </div>
          )}

          {/* Parsing Step */}
          {step === "parsing" && (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <Loader2 className="w-8 h-8 animate-spin text-[var(--color-primary)]" />
              <p className="text-[var(--color-muted-foreground)]">
                L'IA analyse le menu...
              </p>
            </div>
          )}

          {/* Review Step */}
          {step === "review" && (
            <div className="space-y-4">
              {/* Show categories that will be created */}
              {(() => {
                const missingCategories = [...new Set(
                  products
                    .filter(p => p.selected && p.category_suggestion && !findCategoryId(p.category_suggestion))
                    .map(p => {
                      const slug = (p.category_suggestion || "").replace("cat-", "");
                      return slug.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
                    })
                )];

                if (missingCategories.length > 0) {
                  return (
                    <div className="p-3 bg-[var(--color-primary)]/10 rounded-xl">
                      <p className="text-sm text-[var(--color-primary)] font-medium mb-1">
                        Catégories à créer automatiquement:
                      </p>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {missingCategories.map((cat, i) => (
                          <Badge key={i} variant="secondary" className="text-xs">
                            + {cat}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  );
                }
                return null;
              })()}

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
                {products.map((product) => (
                  <div
                    key={product.id}
                    className={`p-4 rounded-xl border transition-colors ${
                      product.selected
                        ? "border-[var(--color-primary)] bg-[var(--color-glass)]"
                        : "border-[var(--color-border)] bg-[var(--color-muted)]/20 opacity-60"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Selection checkbox */}
                      <button
                        onClick={() => handleToggleProduct(product.id)}
                        className={`mt-1 w-5 h-5 rounded border flex items-center justify-center shrink-0 transition-colors ${
                          product.selected
                            ? "bg-[var(--color-primary)] border-[var(--color-primary)] text-white"
                            : "border-[var(--color-border)]"
                        }`}
                      >
                        {product.selected && <Check className="w-3 h-3" />}
                      </button>

                      {/* Image upload */}
                      <div className="shrink-0">
                        {product.images.length > 0 ? (
                          <div className="relative w-16 h-16 rounded-lg overflow-hidden group">
                            <Image
                              src={product.images[0]}
                              alt={product.name}
                              fill
                              className="object-cover"
                            />
                            <button
                              type="button"
                              onClick={() => handleRemoveImage(product.id, 0)}
                              className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X className="w-4 h-4 text-white" />
                            </button>
                            {product.images.length > 1 && (
                              <span className="absolute bottom-0.5 right-0.5 px-1 text-[10px] bg-black/60 text-white rounded">
                                +{product.images.length - 1}
                              </span>
                            )}
                          </div>
                        ) : (
                          <label
                            className={`w-16 h-16 rounded-lg border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-colors ${
                              uploadingProductId === product.id
                                ? "border-[var(--color-primary)] bg-[var(--color-primary)]/5"
                                : "border-[var(--color-border)] hover:border-[var(--color-primary)]/50"
                            }`}
                          >
                            <input
                              type="file"
                              accept="image/*,video/*"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleImageUpload(product.id, file);
                                e.target.value = "";
                              }}
                              disabled={uploadingProductId !== null}
                            />
                            {uploadingProductId === product.id ? (
                              <Loader2 className="w-5 h-5 text-[var(--color-primary)] animate-spin" />
                            ) : (
                              <>
                                <ImagePlus className="w-5 h-5 text-[var(--color-muted-foreground)]" />
                                <span className="text-[9px] text-[var(--color-muted-foreground)] mt-0.5">
                                  Image
                                </span>
                              </>
                            )}
                          </label>
                        )}
                      </div>

                      <div className="flex-1 min-w-0 space-y-3">
                        {/* Product header */}
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            {product.origin_flag && (
                              <span className="text-lg shrink-0">{product.origin_flag}</span>
                            )}
                            <Input
                              value={product.name}
                              onChange={(e) =>
                                handleUpdateProduct(product.id, "name", e.target.value)
                              }
                              className="font-medium flex-1 min-w-0 sm:min-w-[200px]"
                            />
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <Badge
                              variant={
                                product.confidence >= 0.8
                                  ? "default"
                                  : product.confidence >= 0.5
                                  ? "secondary"
                                  : "outline"
                              }
                            >
                              {Math.round(product.confidence * 100)}%
                            </Badge>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-[var(--color-destructive)]"
                              onClick={() => handleRemoveProduct(product.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>

                        {/* Category selection */}
                        <div className="flex items-center gap-2">
                          <Label className="text-xs shrink-0">Catégorie:</Label>
                          <Select
                            value={product.category_id || "none"}
                            onValueChange={(value) =>
                              handleUpdateProduct(
                                product.id,
                                "category_id",
                                value === "none" ? "" : value
                              )
                            }
                          >
                            <SelectTrigger className="h-8 text-xs max-w-[140px] sm:max-w-none">
                              <SelectValue className="truncate" placeholder="Sans catégorie" />
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

                        {/* Pricing tiers */}
                        <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2">
                          {product.pricing_tiers.map((tier, index) => (
                            <div
                              key={index}
                              className="flex items-center gap-1 bg-[var(--color-muted)]/30 rounded-lg px-2 py-1"
                            >
                              <span className="text-xs text-[var(--color-muted-foreground)]">
                                {tier.quantity_grams}g:
                              </span>
                              <Input
                                type="number"
                                step="0.01"
                                value={(tier.price / 100).toFixed(2)}
                                onChange={(e) =>
                                  handleUpdateTierPrice(
                                    product.id,
                                    index,
                                    Math.round(parseFloat(e.target.value) * 100) || 0
                                  )
                                }
                                className="w-16 sm:w-20 h-6 text-xs px-2"
                              />
                              <span className="text-xs text-[var(--color-muted-foreground)]">
                                €
                              </span>
                            </div>
                          ))}
                        </div>

                        {/* Tags */}
                        {product.tags && product.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {product.tags.map((tag, i) => (
                              <Badge key={i} variant="outline" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Importing Step */}
          {step === "importing" && (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <Loader2 className="w-8 h-8 animate-spin text-[var(--color-primary)]" />
              <p className="text-[var(--color-muted-foreground)]">
                Importation en cours... {importProgress}%
              </p>
              <div className="w-full max-w-xs h-2 bg-[var(--color-muted)]/30 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[var(--color-primary)] transition-all duration-300"
                  style={{ width: `${importProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Done Step */}
          {step === "done" && importResult && (
            <div className="space-y-4 py-4">
              {createdCategories.length > 0 && (
                <div className="p-4 bg-[var(--color-primary)]/10 rounded-xl">
                  <p className="text-sm font-medium text-[var(--color-primary)] mb-2">
                    {createdCategories.length} catégorie(s) créée(s)
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {createdCategories.map((cat, i) => (
                      <Badge key={i} variant="secondary" className="text-xs">
                        {cat}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {importResult.success.length > 0 && (
                <div className="p-4 bg-[var(--color-success)]/10 rounded-xl">
                  <p className="text-sm font-medium text-[var(--color-success)] mb-2">
                    {importResult.success.length} produit(s) importé(s)
                  </p>
                  <ul className="text-xs text-[var(--color-muted-foreground)] space-y-1">
                    {importResult.success.map((s, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <Check className="w-3 h-3 text-[var(--color-success)]" />
                        {s.name}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {importResult.errors.length > 0 && (
                <div className="p-4 bg-[var(--color-destructive)]/10 rounded-xl">
                  <p className="text-sm font-medium text-[var(--color-destructive)] mb-2">
                    {importResult.errors.length} erreur(s)
                  </p>
                  <ul className="text-xs text-[var(--color-muted-foreground)] space-y-1">
                    {importResult.errors.map((e, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <X className="w-3 h-3 text-[var(--color-destructive)]" />
                        {e.name}: {e.error}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <p className="text-xs text-[var(--color-muted-foreground)] text-center">
                Les produits importés sont désactivés par défaut.
                <br />
                Activez-les après vérification.
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
                disabled={!menuText.trim()}
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Parser avec IA
              </Button>
            </>
          )}

          {step === "review" && (
            <>
              <Button variant="outline" onClick={handleClose}>
                Annuler
              </Button>
              <Button
                variant="success"
                onClick={handleImport}
                disabled={selectedCount === 0}
              >
                Importer {selectedCount} produit(s)
              </Button>
            </>
          )}

          {step === "done" && (
            <Button variant="outline" onClick={handleClose}>
              Fermer
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
