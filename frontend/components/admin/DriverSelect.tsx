"use client";

import { useState } from "react";
import { Plus, Check, ChevronsUpDown, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { adminFetch } from "@/lib/api/admin-fetch";
import type { Driver } from "@/lib/db/types";

interface DriverSelectProps {
  value: string | null;
  onChange: (driverId: string | null, driver?: Driver) => void;
  drivers: Driver[];
  onDriverCreated?: (driver: Driver) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function DriverSelect({
  value,
  onChange,
  drivers,
  onDriverCreated,
  disabled,
  placeholder = "Assigner un driver",
}: DriverSelectProps) {
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newDriverName, setNewDriverName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedDriver = drivers.find((d) => d.id === value);

  const handleSelect = (driver: Driver | null) => {
    onChange(driver?.id ?? null, driver ?? undefined);
    setOpen(false);
    setCreating(false);
    setNewDriverName("");
  };

  const handleCreateDriver = async () => {
    if (!newDriverName.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const response = await adminFetch("/api/drivers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newDriverName.trim(),
          is_active: true,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const newDriver = data.driver as Driver;

        // Notify parent about new driver
        if (onDriverCreated) {
          onDriverCreated(newDriver);
        }

        // Select the new driver
        onChange(newDriver.id, newDriver);
        setOpen(false);
        setCreating(false);
        setNewDriverName("");
      }
    } catch (error) {
      console.error("Failed to create driver:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className="w-full justify-between"
        >
          {selectedDriver ? (
            <div className="flex items-center gap-2">
              <span
                className={`w-2 h-2 rounded-full ${
                  selectedDriver.is_active ? "bg-green-500" : "bg-gray-400"
                }`}
              />
              {selectedDriver.name}
            </div>
          ) : (
            <span className="text-[var(--color-muted-foreground)]">{placeholder}</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[250px] p-0" align="start">
        <div className="max-h-[300px] overflow-y-auto">
          {/* Unassigned option */}
          <button
            onClick={() => handleSelect(null)}
            className={cn(
              "flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-[var(--color-glass)] transition-colors",
              !value && "bg-[var(--color-glass)]"
            )}
          >
            <Check className={cn("h-4 w-4", !value ? "opacity-100" : "opacity-0")} />
            <span className="text-[var(--color-muted-foreground)]">Non assigné</span>
          </button>

          {/* Divider */}
          <div className="h-px bg-[var(--color-border)] my-1" />

          {/* Existing drivers */}
          {drivers.map((driver) => (
            <button
              key={driver.id}
              onClick={() => handleSelect(driver)}
              className={cn(
                "flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-[var(--color-glass)] transition-colors",
                value === driver.id && "bg-[var(--color-glass)]"
              )}
            >
              <Check className={cn("h-4 w-4", value === driver.id ? "opacity-100" : "opacity-0")} />
              <span
                className={`w-2 h-2 rounded-full ${
                  driver.is_active ? "bg-green-500" : "bg-gray-400"
                }`}
              />
              {driver.name}
            </button>
          ))}

          {/* Divider */}
          <div className="h-px bg-[var(--color-border)] my-1" />

          {/* Create new driver */}
          {creating ? (
            <div className="p-2 space-y-2">
              <Input
                placeholder="Nom du driver"
                value={newDriverName}
                onChange={(e) => setNewDriverName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleCreateDriver();
                  }
                  if (e.key === "Escape") {
                    setCreating(false);
                    setNewDriverName("");
                  }
                }}
                autoFocus
                disabled={isSubmitting}
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  className="flex-1"
                  onClick={() => {
                    setCreating(false);
                    setNewDriverName("");
                  }}
                  disabled={isSubmitting}
                >
                  Annuler
                </Button>
                <Button
                  size="sm"
                  className="flex-1"
                  onClick={handleCreateDriver}
                  disabled={!newDriverName.trim() || isSubmitting}
                >
                  {isSubmitting ? "..." : "Créer"}
                </Button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setCreating(true)}
              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-[var(--color-primary)] hover:bg-[var(--color-glass)] transition-colors"
            >
              <Plus className="h-4 w-4" />
              Nouveau driver
            </button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
