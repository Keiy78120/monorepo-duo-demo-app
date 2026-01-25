"use client";

import { useState, useEffect } from "react";
import { motion } from "motion/react";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  GripVertical,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { adminFetch } from "@/lib/api/admin-fetch";
import type { ProductCategory } from "@/lib/supabase/database.types";

type CategoryFormData = Omit<ProductCategory, "id" | "created_at">;

const emptyCategory: CategoryFormData = {
  name: "",
  slug: "",
  description: "",
  sort_order: 0,
  is_active: true,
};

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ProductCategory | null>(null);
  const [formData, setFormData] = useState<CategoryFormData>(emptyCategory);
  const [saving, setSaving] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<ProductCategory | null>(null);

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await adminFetch("/api/categories?active=false");
        if (response.ok) {
          const data = await response.json();
          setCategories(data);
        }
      } catch (error) {
        console.error("Failed to fetch categories:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  // Filter categories
  const filteredCategories = categories.filter((category) =>
    category.name.toLowerCase().includes(search.toLowerCase()) ||
    category.slug.toLowerCase().includes(search.toLowerCase())
  );

  // Generate slug from name
  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  };

  // Handle form changes
  const handleChange = (field: keyof CategoryFormData, value: any) => {
    setFormData((prev) => {
      const updated = { ...prev, [field]: value };
      if (field === "name") {
        updated.slug = generateSlug(value);
      }
      return updated;
    });
  };

  // Open dialog for new category
  const handleNew = () => {
    setEditingCategory(null);
    setFormData({
      ...emptyCategory,
      sort_order: categories.length,
    });
    setDialogOpen(true);
  };

  // Open dialog for editing
  const handleEdit = (category: ProductCategory) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      slug: category.slug,
      description: category.description || "",
      sort_order: category.sort_order,
      is_active: category.is_active,
    });
    setDialogOpen(true);
  };

  // Save category
  const handleSave = async () => {
    setSaving(true);
    try {
      if (editingCategory) {
        // Update existing
        const response = await adminFetch(`/api/categories/${editingCategory.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });

        if (response.ok) {
          const updated = await response.json();
          setCategories((prev) =>
            prev.map((c) => (c.id === editingCategory.id ? updated : c))
          );
        }
      } else {
        // Create new
        const response = await adminFetch("/api/categories", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });

        if (response.ok) {
          const created = await response.json();
          setCategories((prev) => [...prev, created]);
        }
      }

      setDialogOpen(false);
    } catch (error) {
      console.error("Failed to save category:", error);
    } finally {
      setSaving(false);
    }
  };

  // Delete category
  const handleDelete = async () => {
    if (!categoryToDelete) return;

    try {
      const response = await adminFetch(`/api/categories/${categoryToDelete.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setCategories((prev) =>
          prev.filter((c) => c.id !== categoryToDelete.id)
        );
      } else {
        const error = await response.json();
        alert(error.error || "Failed to delete category");
      }

      setDeleteDialogOpen(false);
      setCategoryToDelete(null);
    } catch (error) {
      console.error("Failed to delete category:", error);
    }
  };

  // Toggle active status
  const handleToggleActive = async (category: ProductCategory) => {
    try {
      const response = await adminFetch(`/api/categories/${category.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !category.is_active }),
      });

      if (response.ok) {
        setCategories((prev) =>
          prev.map((c) =>
            c.id === category.id ? { ...c, is_active: !c.is_active } : c
          )
        );
      }
    } catch (error) {
      console.error("Failed to toggle category:", error);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-foreground)]">
            Catégories
          </h1>
          <p className="text-[var(--color-muted-foreground)] text-sm mt-1">
            Gérer les catégories de produits
          </p>
        </div>
          <Button variant="warning" onClick={handleNew}>
            <Plus className="w-5 h-5 mr-2" />
            Nouvelle Catégorie
          </Button>
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

      {/* Categories - Mobile Cards */}
      <div className="md:hidden space-y-3">
        {loading ? (
          [...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-2xl" />
          ))
        ) : filteredCategories.length === 0 ? (
          <div className="py-12 text-center text-[var(--color-muted-foreground)]">
            Aucune catégorie trouvée
          </div>
        ) : (
          filteredCategories
            .sort((a, b) => a.sort_order - b.sort_order)
            .map((category) => (
              <motion.div
                key={category.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="glass-card rounded-2xl p-4"
              >
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-[var(--color-muted)]/20 text-[var(--color-muted-foreground)] font-medium shrink-0">
                    {category.sort_order + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-[var(--color-foreground)] truncate">
                      {category.name}
                    </p>
                    {category.description && (
                      <p className="text-xs text-[var(--color-muted-foreground)] line-clamp-1">
                        {category.description}
                      </p>
                    )}
                    <code className="text-[10px] text-[var(--color-muted-foreground)] bg-[var(--color-muted)]/10 px-1.5 py-0.5 rounded mt-1 inline-block">
                      {category.slug}
                    </code>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Switch
                      checked={category.is_active}
                      onCheckedChange={() => handleToggleActive(category)}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleEdit(category)}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-[var(--color-destructive)]"
                      onClick={() => {
                        setCategoryToDelete(category);
                        setDeleteDialogOpen(true);
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))
        )}
      </div>

      {/* Categories - Desktop Table */}
      <div className="hidden md:block glass-card rounded-2xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[var(--color-border)]">
              <th className="text-left p-4 text-sm font-medium text-[var(--color-muted-foreground)] w-16">
                #
              </th>
              <th className="text-left p-4 text-sm font-medium text-[var(--color-muted-foreground)]">
                Catégorie
              </th>
              <th className="text-left p-4 text-sm font-medium text-[var(--color-muted-foreground)]">
                Slug
              </th>
              <th className="text-center p-4 text-sm font-medium text-[var(--color-muted-foreground)]">
                Actif
              </th>
              <th className="text-right p-4 text-sm font-medium text-[var(--color-muted-foreground)]">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              [...Array(4)].map((_, i) => (
                <tr key={i} className="border-b border-[var(--color-border)]">
                  <td className="p-4">
                    <Skeleton className="h-4 w-6" />
                  </td>
                  <td className="p-4">
                    <Skeleton className="h-4 w-32" />
                  </td>
                  <td className="p-4">
                    <Skeleton className="h-4 w-24" />
                  </td>
                  <td className="p-4">
                    <Skeleton className="h-6 w-10 mx-auto" />
                  </td>
                  <td className="p-4">
                    <Skeleton className="h-8 w-20 ml-auto" />
                  </td>
                </tr>
              ))
            ) : filteredCategories.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-[var(--color-muted-foreground)]">
                  Aucune catégorie trouvée
                </td>
              </tr>
            ) : (
              filteredCategories
                .sort((a, b) => a.sort_order - b.sort_order)
                .map((category) => (
                  <motion.tr
                    key={category.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="border-b border-[var(--color-border)] hover:bg-[var(--color-glass)] transition-colors"
                  >
                    <td className="p-4">
                      <span className="flex items-center gap-1 text-[var(--color-muted-foreground)]">
                        <GripVertical className="w-4 h-4" />
                        {category.sort_order + 1}
                      </span>
                    </td>
                    <td className="p-4">
                      <div>
                        <p className="font-medium text-[var(--color-foreground)]">
                          {category.name}
                        </p>
                        {category.description && (
                          <p className="text-xs text-[var(--color-muted-foreground)] line-clamp-1">
                            {category.description}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <code className="text-sm text-[var(--color-muted-foreground)] bg-[var(--color-muted)]/10 px-2 py-1 rounded">
                        {category.slug}
                      </code>
                    </td>
                    <td className="p-4">
                      <div className="flex justify-center">
                        <Switch
                          checked={category.is_active}
                          onCheckedChange={() => handleToggleActive(category)}
                        />
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(category)}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-[var(--color-destructive)]"
                          onClick={() => {
                            setCategoryToDelete(category);
                            setDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </motion.tr>
                ))
            )}
          </tbody>
        </table>
      </div>

      {/* Category Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? "Modifier la catégorie" : "Nouvelle catégorie"}
            </DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nom</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleChange("name", e.target.value)}
                placeholder="Ex: Frozen From Hashland"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">Slug</Label>
              <Input
                id="slug"
                value={formData.slug}
                onChange={(e) => handleChange("slug", e.target.value)}
                placeholder="frozen-hashland"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description || ""}
                onChange={(e) => handleChange("description", e.target.value)}
                placeholder="Description de la catégorie..."
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sort_order">Ordre d'affichage</Label>
              <Input
                id="sort_order"
                type="number"
                value={formData.sort_order}
                onChange={(e) =>
                  handleChange("sort_order", parseInt(e.target.value) || 0)
                }
                min={0}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="is_active">Actif</Label>
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => handleChange("is_active", checked)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Annuler
            </Button>
            <Button variant="success" onClick={handleSave} disabled={saving || !formData.name}>
              {saving ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer la catégorie</DialogTitle>
          </DialogHeader>
          <p className="text-[var(--color-muted-foreground)]">
            Êtes-vous sûr de vouloir supprimer "{categoryToDelete?.name}" ? Cette action est irréversible.
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
    </div>
  );
}
