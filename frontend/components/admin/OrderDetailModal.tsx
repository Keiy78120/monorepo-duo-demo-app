"use client";

import { useState } from "react";
import { Copy, Check, User, MapPin, Package, Truck, StickyNote } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { OrderStatusSelect } from "./OrderStatusSelect";
import { DriverSelect } from "./DriverSelect";
import { formatPrice } from "@/lib/store/cart";
import type { Order, Driver, OrderItem } from "@/lib/supabase/database.types";

type OrderStatus = "pending" | "confirmed" | "processing" | "shipped" | "delivered" | "cancelled";

interface OrderDetailModalProps {
  order: Order | null;
  drivers: Driver[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdateOrder: (orderId: string, updates: { status?: OrderStatus; driver_id?: string | null }) => Promise<void>;
  onDriverCreated?: (driver: Driver) => void;
}

export function OrderDetailModal({
  order,
  drivers,
  open,
  onOpenChange,
  onUpdateOrder,
  onDriverCreated,
}: OrderDetailModalProps) {
  const [updating, setUpdating] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!order) return null;

  const items = (order.items as OrderItem[]) || [];
  const orderDate = new Date(order.created_at);

  const handleStatusChange = async (status: OrderStatus) => {
    setUpdating(true);
    try {
      await onUpdateOrder(order.id, { status });
    } finally {
      setUpdating(false);
    }
  };

  const handleDriverChange = async (driverId: string | null) => {
    setUpdating(true);
    try {
      await onUpdateOrder(order.id, { driver_id: driverId });
    } finally {
      setUpdating(false);
    }
  };

  const copyAddress = () => {
    if (order.delivery_address) {
      navigator.clipboard.writeText(order.delivery_address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="text-xl font-bold">
              #{order.daily_order_number || "?"}
            </span>
            <span className="text-[var(--color-muted-foreground)] font-normal">
              — {orderDate.toLocaleDateString("fr-FR", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Client Info */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[var(--color-primary)]/10 flex items-center justify-center">
              <User className="w-5 h-5 text-[var(--color-primary)]" />
            </div>
            <div>
              <p className="font-medium text-[var(--color-foreground)]">
                @{order.username || "anonymous"}
              </p>
              <p className="text-xs text-[var(--color-muted-foreground)]">
                ID: {order.telegram_user_id}
              </p>
            </div>
          </div>

          <Separator />

          {/* Delivery Address */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="w-4 h-4 text-[var(--color-muted-foreground)]" />
              <span className="text-sm font-medium text-[var(--color-foreground)]">
                Adresse de livraison
              </span>
            </div>
            <div className="relative">
              <div className="p-3 bg-[var(--color-glass)] rounded-xl text-sm text-[var(--color-foreground)] whitespace-pre-wrap">
                {order.delivery_address || "Non renseignée"}
              </div>
              {order.delivery_address && (
                <button
                  onClick={copyAddress}
                  className="absolute top-2 right-2 p-1.5 rounded-lg hover:bg-[var(--color-muted)]/20 transition-colors"
                  title="Copier l'adresse"
                >
                  {copied ? (
                    <Check className="w-4 h-4 text-green-500" />
                  ) : (
                    <Copy className="w-4 h-4 text-[var(--color-muted-foreground)]" />
                  )}
                </button>
              )}
            </div>
          </div>

          <Separator />

          {/* Products */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Package className="w-4 h-4 text-[var(--color-muted-foreground)]" />
              <span className="text-sm font-medium text-[var(--color-foreground)]">
                Produits
              </span>
            </div>
            <div className="space-y-2">
              {items.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-[var(--color-glass)] rounded-xl"
                >
                  <div>
                    <p className="font-medium text-[var(--color-foreground)]">
                      {item.product_name}
                    </p>
                    <p className="text-xs text-[var(--color-muted-foreground)]">
                      {item.quantity_grams}g × {item.quantity}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-[var(--color-foreground)]">
                      {formatPrice(item.total_price)}
                    </p>
                    <p className="text-xs text-[var(--color-muted-foreground)]">
                      {formatPrice(item.unit_price)} / unité
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-between items-center mt-3 pt-3 border-t border-[var(--color-border)]">
              <span className="font-medium text-[var(--color-foreground)]">Total</span>
              <span className="text-lg font-bold text-[var(--color-primary)]">
                {formatPrice(order.total)}
              </span>
            </div>
          </div>

          {/* Notes */}
          {order.notes && (
            <>
              <Separator />
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <StickyNote className="w-4 h-4 text-[var(--color-muted-foreground)]" />
                  <span className="text-sm font-medium text-[var(--color-foreground)]">
                    Notes
                  </span>
                </div>
                <p className="p-3 bg-[var(--color-glass)] rounded-xl text-sm text-[var(--color-foreground)] italic">
                  "{order.notes}"
                </p>
              </div>
            </>
          )}

          <Separator />

          {/* Driver Assignment */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Truck className="w-4 h-4 text-[var(--color-muted-foreground)]" />
              <span className="text-sm font-medium text-[var(--color-foreground)]">
                Driver
              </span>
            </div>
            <DriverSelect
              value={order.driver_id}
              onChange={(driverId) => handleDriverChange(driverId)}
              drivers={drivers}
              onDriverCreated={onDriverCreated}
              disabled={updating}
            />
          </div>

          <Separator />

          {/* Status */}
          <div>
            <span className="text-sm font-medium text-[var(--color-foreground)] mb-3 block">
              Statut
            </span>
            <OrderStatusSelect
              value={order.status}
              onChange={handleStatusChange}
              disabled={updating}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
