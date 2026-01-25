"use client";

import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Eye, Calendar, Filter, Truck } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { OrderStatusBadge } from "@/components/admin/OrderStatusSelect";
import { OrderDetailModal } from "@/components/admin/OrderDetailModal";
import { formatPrice } from "@/lib/store/cart";
import { adminFetch } from "@/lib/api/admin-fetch";
import type { Order, Driver, OrderItem } from "@/lib/supabase/database.types";

type OrderStatus = "pending" | "confirmed" | "processing" | "shipped" | "delivered" | "cancelled";

type OrderWithDriver = Order & {
  driver_name?: string | null;
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<OrderWithDriver[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("");
  const [driverFilter, setDriverFilter] = useState<string>("all");

  // Fetch orders
  const fetchOrders = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (dateFilter) params.set("date", dateFilter);
      if (driverFilter !== "all") params.set("driver_id", driverFilter);

      const response = await adminFetch(`/api/orders?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setOrders(data.orders);
        setDrivers(data.drivers || []);
      }
    } catch (error) {
      console.error("Failed to fetch orders:", error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch orders on mount and when filters change
  useEffect(() => {
    fetchOrders();
  }, [statusFilter, dateFilter, driverFilter]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchOrders();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [statusFilter, dateFilter, driverFilter]);

  // Update order
  const handleUpdateOrder = async (
    orderId: string,
    updates: { status?: OrderStatus; driver_id?: string | null }
  ) => {
    try {
      const response = await adminFetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });

      if (response.ok) {
        const data = await response.json();
        setOrders((prev) =>
          prev.map((o) =>
            o.id === orderId
              ? {
                  ...data.order,
                  driver_name: data.driver?.name || null,
                }
              : o
          )
        );
        // Also update selected order if it's the one being edited
        if (selectedOrder?.id === orderId) {
          setSelectedOrder(data.order);
        }
      }
    } catch (error) {
      console.error("Failed to update order:", error);
    }
  };

  // View order details
  const handleViewOrder = (order: Order) => {
    setSelectedOrder(order);
    setModalOpen(true);
  };

  // Get products summary for display
  const getProductsSummary = (items: OrderItem[]) => {
    if (!items || items.length === 0) return "Aucun produit";
    if (items.length === 1) {
      return `${items[0].product_name} ${items[0].quantity_grams}g ×${items[0].quantity}`;
    }
    return `${items[0].product_name} ${items[0].quantity_grams}g ×${items[0].quantity} +${items.length - 1}`;
  };

  // Set today's date as default filter
  const setTodayFilter = () => {
    const today = new Date().toISOString().split("T")[0];
    setDateFilter(today);
  };

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-foreground)]">
            Commandes
          </h1>
          <p className="text-[var(--color-muted-foreground)] text-sm mt-1">
            Gérer les commandes et les livraisons
          </p>
        </div>
        <Link href="/admin/drivers">
          <Button variant="outline">
            <Truck className="w-4 h-4 mr-2" />
            Drivers
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-[var(--color-muted-foreground)]" />
          <Input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="w-auto"
          />
          <Button variant="ghost" size="sm" onClick={setTodayFilter}>
            Aujourd'hui
          </Button>
          {dateFilter && (
            <Button variant="ghost" size="sm" onClick={() => setDateFilter("")}>
              Tout
            </Button>
          )}
        </div>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les statuts</SelectItem>
            <SelectItem value="pending">En attente</SelectItem>
            <SelectItem value="confirmed">Confirmé</SelectItem>
            <SelectItem value="processing">Préparation</SelectItem>
            <SelectItem value="shipped">En route</SelectItem>
            <SelectItem value="delivered">Livré</SelectItem>
            <SelectItem value="cancelled">Annulé</SelectItem>
          </SelectContent>
        </Select>

        <Select value={driverFilter} onValueChange={setDriverFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Driver" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les drivers</SelectItem>
            <SelectItem value="unassigned">Non assigné</SelectItem>
            {drivers.map((driver) => (
              <SelectItem key={driver.id} value={driver.id}>
                {driver.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Orders - Mobile Cards */}
      <div className="md:hidden space-y-3">
        {loading ? (
          [...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))
        ) : orders.length === 0 ? (
          <div className="py-12 text-center text-[var(--color-muted-foreground)]">
            Aucune commande trouvée
          </div>
        ) : (
          orders.map((order) => {
            const items = (order.items as OrderItem[]) || [];
            return (
              <motion.div
                key={order.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="glass-card rounded-2xl p-4 space-y-3"
                onClick={() => handleViewOrder(order)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[var(--color-primary)]">
                      #{order.daily_order_number || "?"}
                    </span>
                    <span className="text-sm text-[var(--color-foreground)]">
                      @{order.username || "anonymous"}
                    </span>
                  </div>
                  <OrderStatusBadge status={order.status} />
                </div>
                <p className="text-sm text-[var(--color-muted-foreground)]">
                  {getProductsSummary(items)}
                </p>
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-[var(--color-foreground)]">
                    {formatPrice(order.total)}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-[var(--color-muted-foreground)]">
                    {order.driver_name && (
                      <span>{order.driver_name}</span>
                    )}
                    <span>
                      {new Date(order.created_at).toLocaleTimeString("fr-FR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Orders - Desktop Table */}
      <div className="hidden md:block glass-card rounded-[1.5rem] overflow-hidden shadow-[var(--shadow-card-soft)]">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[var(--color-border)] bg-[var(--color-muted)]/30">
                <th className="text-left px-6 py-4 text-sm font-semibold text-[var(--color-muted-foreground)]">
                  #
                </th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-[var(--color-muted-foreground)]">
                  Client
                </th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-[var(--color-muted-foreground)]">
                  Produits
                </th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-[var(--color-muted-foreground)]">
                  Total
                </th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-[var(--color-muted-foreground)]">
                  Statut
                </th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-[var(--color-muted-foreground)]">
                  Driver
                </th>
                <th className="text-center px-6 py-4 text-sm font-semibold text-[var(--color-muted-foreground)]">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="border-b border-[var(--color-border)]">
                    <td className="px-6 py-4">
                      <Skeleton className="h-5 w-8" />
                    </td>
                    <td className="px-6 py-4">
                      <Skeleton className="h-5 w-24" />
                    </td>
                    <td className="px-6 py-4">
                      <Skeleton className="h-5 w-40" />
                    </td>
                    <td className="px-6 py-4">
                      <Skeleton className="h-5 w-16" />
                    </td>
                    <td className="px-6 py-4">
                      <Skeleton className="h-6 w-20" />
                    </td>
                    <td className="px-6 py-4">
                      <Skeleton className="h-5 w-20" />
                    </td>
                    <td className="px-6 py-4">
                      <Skeleton className="h-8 w-8 mx-auto" />
                    </td>
                  </tr>
                ))
              ) : orders.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-12 text-center text-[var(--color-muted-foreground)]"
                  >
                    Aucune commande trouvée
                  </td>
                </tr>
              ) : (
                orders.map((order) => {
                  const items = (order.items as OrderItem[]) || [];
                  return (
                    <motion.tr
                      key={order.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="border-b border-[var(--color-border)] hover:bg-[var(--color-muted)]/30 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <span className="font-bold text-[var(--color-primary)]">
                          #{order.daily_order_number || "?"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-medium text-[var(--color-foreground)]">
                          @{order.username || "anonymous"}
                        </p>
                        <p className="text-xs text-[var(--color-muted-foreground)]">
                          {new Date(order.created_at).toLocaleTimeString("fr-FR", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-[var(--color-foreground)]">
                          {getProductsSummary(items)}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-semibold text-[var(--color-foreground)]">
                          {formatPrice(order.total)}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <OrderStatusBadge status={order.status} />
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-[var(--color-foreground)]">
                          {order.driver_name || (
                            <span className="text-[var(--color-muted-foreground)]">—</span>
                          )}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-center">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleViewOrder(order)}
                          >
                            <Eye className="w-4 h-4" />
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

      {/* Order Detail Modal */}
      <OrderDetailModal
        order={selectedOrder}
        drivers={drivers}
        open={modalOpen}
        onOpenChange={setModalOpen}
        onUpdateOrder={handleUpdateOrder}
        onDriverCreated={(newDriver) => {
          setDrivers((prev) => [...prev, newDriver]);
        }}
      />
    </div>
  );
}
