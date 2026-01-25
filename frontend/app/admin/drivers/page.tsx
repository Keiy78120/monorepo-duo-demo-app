"use client";

import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Plus, Pencil, Trash2, Phone, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import type { Driver } from "@/lib/supabase/database.types";

interface DriverFormData {
  name: string;
  phone: string;
  is_active: boolean;
}

const emptyDriver: DriverFormData = {
  name: "",
  phone: "",
  is_active: true,
};

export default function AdminDriversPage() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null);
  const [formData, setFormData] = useState<DriverFormData>(emptyDriver);
  const [saving, setSaving] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [driverToDelete, setDriverToDelete] = useState<Driver | null>(null);

  // Fetch drivers
  useEffect(() => {
    const fetchDrivers = async () => {
      try {
        const response = await adminFetch("/api/drivers");
        if (response.ok) {
          const data = await response.json();
          setDrivers(data.drivers);
        }
      } catch (error) {
        console.error("Failed to fetch drivers:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDrivers();
  }, []);

  // Handle form changes
  const handleChange = (field: keyof DriverFormData, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Open dialog for new driver
  const handleNew = () => {
    setEditingDriver(null);
    setFormData(emptyDriver);
    setDialogOpen(true);
  };

  // Open dialog for editing
  const handleEdit = (driver: Driver) => {
    setEditingDriver(driver);
    setFormData({
      name: driver.name,
      phone: driver.phone || "",
      is_active: driver.is_active,
    });
    setDialogOpen(true);
  };

  // Save driver
  const handleSave = async () => {
    setSaving(true);
    try {
      const url = editingDriver
        ? `/api/drivers/${editingDriver.id}`
        : "/api/drivers";
      const method = editingDriver ? "PATCH" : "POST";

      const response = await adminFetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const data = await response.json();
        if (editingDriver) {
          setDrivers((prev) =>
            prev.map((d) => (d.id === editingDriver.id ? data.driver : d))
          );
        } else {
          setDrivers((prev) => [...prev, data.driver]);
        }
        setDialogOpen(false);
      }
    } catch (error) {
      console.error("Failed to save driver:", error);
    } finally {
      setSaving(false);
    }
  };

  // Delete driver
  const handleDelete = async () => {
    if (!driverToDelete) return;

    try {
      const response = await adminFetch(`/api/drivers/${driverToDelete.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        const data = await response.json();
        if (data.driver) {
          // Driver was deactivated instead of deleted
          setDrivers((prev) =>
            prev.map((d) => (d.id === driverToDelete.id ? data.driver : d))
          );
        } else {
          // Driver was deleted
          setDrivers((prev) => prev.filter((d) => d.id !== driverToDelete.id));
        }
      }

      setDeleteDialogOpen(false);
      setDriverToDelete(null);
    } catch (error) {
      console.error("Failed to delete driver:", error);
    }
  };

  // Toggle active status
  const handleToggleActive = async (driver: Driver) => {
    try {
      const response = await adminFetch(`/api/drivers/${driver.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !driver.is_active }),
      });

      if (response.ok) {
        setDrivers((prev) =>
          prev.map((d) =>
            d.id === driver.id ? { ...d, is_active: !d.is_active } : d
          )
        );
      }
    } catch (error) {
      console.error("Failed to toggle driver:", error);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-foreground)]">
            Drivers
          </h1>
          <p className="text-[var(--color-muted-foreground)] text-sm mt-1">
            Gérer les livreurs
          </p>
        </div>
          <Button variant="warning" onClick={handleNew}>
            <Plus className="w-5 h-5 mr-2" />
            Nouveau Driver
          </Button>
      </div>

      {/* Drivers Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          [...Array(3)].map((_, i) => (
            <div key={i} className="glass-card rounded-2xl p-6">
              <div className="flex items-center gap-4 mb-4">
                <Skeleton className="w-12 h-12 rounded-full" />
                <div>
                  <Skeleton className="h-5 w-24 mb-2" />
                  <Skeleton className="h-4 w-32" />
                </div>
              </div>
              <Skeleton className="h-8 w-full" />
            </div>
          ))
        ) : drivers.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <User className="w-12 h-12 mx-auto text-[var(--color-muted-foreground)] mb-4" />
            <p className="text-[var(--color-muted-foreground)]">
              Aucun driver configuré
            </p>
            <Button variant="warning" onClick={handleNew} className="mt-4">
              <Plus className="w-5 h-5 mr-2" />
              Ajouter un driver
            </Button>
          </div>
        ) : (
          drivers.map((driver) => (
            <motion.div
              key={driver.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card rounded-2xl p-6"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      driver.is_active
                        ? "bg-[var(--color-primary)]/10"
                        : "bg-[var(--color-muted)]/20"
                    }`}
                  >
                    <User
                      className={`w-6 h-6 ${
                        driver.is_active
                          ? "text-[var(--color-primary)]"
                          : "text-[var(--color-muted-foreground)]"
                      }`}
                    />
                  </div>
                  <div>
                    <p className="font-medium text-[var(--color-foreground)]">
                      {driver.name}
                    </p>
                    {driver.phone && (
                      <p className="text-sm text-[var(--color-muted-foreground)] flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        {driver.phone}
                      </p>
                    )}
                  </div>
                </div>
                <Switch
                  checked={driver.is_active}
                  onCheckedChange={() => handleToggleActive(driver)}
                />
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => handleEdit(driver)}
                >
                  <Pencil className="w-4 h-4 mr-2" />
                  Modifier
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-[var(--color-destructive)]"
                  onClick={() => {
                    setDriverToDelete(driver);
                    setDeleteDialogOpen(true);
                  }}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Driver Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingDriver ? "Modifier le driver" : "Nouveau driver"}
            </DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nom *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleChange("name", e.target.value)}
                placeholder="Ex: Marco"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Téléphone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => handleChange("phone", e.target.value)}
                placeholder="Ex: +33 6 12 34 56 78"
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
            <DialogTitle>Supprimer le driver</DialogTitle>
          </DialogHeader>
          <p className="text-[var(--color-muted-foreground)]">
            Êtes-vous sûr de vouloir supprimer "{driverToDelete?.name}" ?
            {" "}
            Si ce driver a des commandes assignées, il sera désactivé au lieu d'être supprimé.
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
