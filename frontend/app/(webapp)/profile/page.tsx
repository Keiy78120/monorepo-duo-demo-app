"use client";

import { useState, useEffect } from "react";
import { motion } from "motion/react";
import {
  User,
  Package,
  Clock,
  CheckCircle2,
  Truck,
  XCircle,
  ChevronRight,
  TrendingUp,
  Sparkles,
} from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useTelegramStore } from "@/lib/store/telegram";
import { formatPrice } from "@/lib/store/cart";
import { cn } from "@/lib/utils";
import type { Order } from "@/lib/supabase/database.types";

const statusConfig = {
  pending: {
    label: "En attente",
    icon: Clock,
    color: "bg-amber-500/15 text-amber-300 border-amber-400/30",
  },
  confirmed: {
    label: "Confirmée",
    icon: CheckCircle2,
    color: "bg-blue-500/15 text-blue-300 border-blue-400/30",
  },
  processing: {
    label: "En préparation",
    icon: Package,
    color: "bg-purple-500/15 text-purple-300 border-purple-400/30",
  },
  shipped: {
    label: "Expédiée",
    icon: Truck,
    color: "bg-cyan-500/15 text-cyan-300 border-cyan-400/30",
  },
  delivered: {
    label: "Livrée",
    icon: CheckCircle2,
    color: "bg-[var(--color-primary)]/15 text-[var(--color-primary)] border-[var(--color-primary)]/30",
  },
  cancelled: {
    label: "Annulée",
    icon: XCircle,
    color: "bg-red-500/15 text-red-300 border-red-400/30",
  },
};

// Mini bar chart component
function MiniBarChart({ data, maxValue }: { data: number[]; maxValue: number }) {
  return (
    <div className="flex items-end gap-1 h-12">
      {data.map((value, i) => (
        <motion.div
          key={i}
          initial={{ height: 0 }}
          animate={{ height: `${(value / maxValue) * 100}%` }}
          transition={{ delay: i * 0.1, duration: 0.4, ease: "easeOut" }}
          className="flex-1 rounded-t-sm bg-gradient-to-t from-[var(--color-primary)] to-[var(--color-chart-2)]"
          style={{ minHeight: value > 0 ? "4px" : "0" }}
        />
      ))}
    </div>
  );
}

// Circular progress component
function CircularProgress({ value, max, size = 80 }: { value: number; max: number; size?: number }) {
  const percentage = max > 0 ? (value / max) * 100 : 0;
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="var(--color-border)"
          strokeWidth={strokeWidth}
          fill="none"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="url(#gradient)"
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: "easeOut" }}
          style={{
            strokeDasharray: circumference,
          }}
        />
        <defs>
          <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="var(--color-primary)" />
            <stop offset="100%" stopColor="var(--color-accent)" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-lg font-bold text-[var(--color-foreground)]">{value}</span>
      </div>
    </div>
  );
}

function OrderCard({ order, index }: { order: Order; index: number }) {
  const status = statusConfig[order.status];
  const StatusIcon = status.icon;
  const items = order.items as Array<{ name: string; quantity: number; tier: string; price: number }>;
  const orderDate = new Date(order.created_at);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Card className="glass-card overflow-hidden">
        <CardContent className="p-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-xs text-[var(--color-muted-foreground)]">
                #{order.id.slice(-6).toUpperCase()}
              </span>
              <span className="text-xs text-[var(--color-muted-foreground)]">•</span>
              <span className="text-xs text-[var(--color-muted-foreground)]">
                {orderDate.toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
              </span>
            </div>
            <Badge className={cn("text-xs", status.color)}>
              <StatusIcon className="w-3 h-3 mr-1" />
              {status.label}
            </Badge>
          </div>

          {/* Items */}
          <div className="space-y-1 mb-3">
            {items.slice(0, 2).map((item, i) => (
              <div key={i} className="flex justify-between text-sm">
                <span className="text-[var(--color-foreground)]">
                  {item.name} <span className="text-[var(--color-muted-foreground)]">({item.tier})</span>
                </span>
                <span className="text-[var(--color-muted-foreground)]">×{item.quantity}</span>
              </div>
            ))}
            {items.length > 2 && (
              <p className="text-xs text-[var(--color-muted-foreground)]">
                +{items.length - 2} autres articles
              </p>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-3 border-t border-[var(--color-border)]">
            <span className="font-semibold text-[var(--color-foreground)]">
              {formatPrice(order.total)}
            </span>
            <ChevronRight className="w-4 h-4 text-[var(--color-muted-foreground)]" />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default function ProfilePage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const { firstName, lastName, username, userId } = useTelegramStore();

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        // Si on a un userId Telegram, récupérer les vraies commandes
        if (userId) {
          const response = await fetch(`/api/orders/user?telegram_user_id=${userId}`);
          if (response.ok) {
            const data = await response.json();
            setOrders(data.orders);
          } else {
            console.warn("API failed, no orders loaded");
            setOrders([]);
          }
        } else {
          setOrders([]);
        }
      } catch (error) {
        console.error("Failed to fetch orders:", error);
        setOrders([]);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [userId]);

  // Calculate stats
  const deliveredOrders = orders.filter((o) => o.status === "delivered");
  const totalSpent = deliveredOrders.reduce((sum, o) => sum + o.total, 0);
  const totalOrders = deliveredOrders.length;
  const activeOrders = orders.filter((o) => !["delivered", "cancelled"].includes(o.status));

  // Monthly spending for chart (last 6 months)
  const now = new Date();
  const monthBuckets = Array.from({ length: 6 }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1);
    return { year: date.getFullYear(), month: date.getMonth() };
  });
  const monthlyData = monthBuckets.map(({ year, month }) => {
    return deliveredOrders.reduce((sum, order) => {
      const date = new Date(order.created_at);
      if (date.getFullYear() === year && date.getMonth() === month) {
        return sum + order.total;
      }
      return sum;
    }, 0);
  });
  const maxMonthly = Math.max(1, ...monthlyData);

  const displayName = firstName
    ? `${firstName}${lastName ? ` ${lastName}` : ""}`
    : username || "Client";

  return (
    <div className="px-5 pt-6 pb-24">
      <PageHeader title="Mon Profil" />

      {/* User Card with Stats Overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-4"
      >
        <Card className="glass-card overflow-hidden">
          <CardContent className="p-0">
            {/* User Header */}
            <div className="p-5 pb-4 flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-emerald flex items-center justify-center shadow-lg">
                <User className="w-7 h-7 text-white" />
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-bold text-[var(--color-foreground)]">
                  {displayName}
                </h2>
                {username && (
                  <p className="text-sm text-[var(--color-muted-foreground)]">@{username}</p>
                )}
              </div>
              {activeOrders.length > 0 && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--color-accent)]/20 border border-[var(--color-accent)]/30">
                  <Sparkles className="w-3.5 h-3.5 text-[var(--color-accent)]" />
                  <span className="text-xs font-medium text-[var(--color-accent-foreground)]">
                    {activeOrders.length} en cours
                  </span>
                </div>
              )}
            </div>

            {/* Stats Dashboard */}
            {loading ? (
              <div className="p-5 pt-0">
                <Skeleton className="h-32 rounded-xl" />
              </div>
            ) : (
              <div className="px-5 pb-5">
                <div className="bg-[var(--color-muted)]/50 rounded-2xl p-4">
                  <div className="flex items-stretch gap-4">
                    {/* Left: Circular Progress */}
                    <div className="flex flex-col items-center justify-center">
                      <CircularProgress value={totalOrders} max={Math.max(totalOrders, 10)} />
                      <p className="text-[10px] text-[var(--color-muted-foreground)] mt-1.5 font-medium">
                        Commandes
                      </p>
                    </div>

                    {/* Center: Main Stats */}
                    <div className="flex-1 flex flex-col justify-center gap-2">
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-[var(--color-muted-foreground)] font-medium">
                          Total dépensé
                        </p>
                        <p className="text-2xl font-bold text-gradient">
                          {formatPrice(totalSpent)}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 text-[var(--color-success)]">
                        <TrendingUp className="w-3.5 h-3.5" />
                        <span className="text-xs font-medium">+12% ce mois</span>
                      </div>
                    </div>

                    {/* Right: Mini Chart */}
                    <div className="w-24 flex flex-col justify-center">
                      <MiniBarChart data={monthlyData} maxValue={maxMonthly} />
                      <p className="text-[10px] text-[var(--color-muted-foreground)] text-center mt-1">
                        6 derniers mois
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Active Orders */}
      {!loading && activeOrders.length > 0 && (
        <section className="mt-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-base font-semibold text-[var(--color-foreground)]">
              Commandes en cours
            </h3>
            <Badge variant="secondary" className="text-xs">
              {activeOrders.length}
            </Badge>
          </div>
          <div className="space-y-3">
            {activeOrders.map((order, index) => (
              <OrderCard key={order.id} order={order} index={index} />
            ))}
          </div>
        </section>
      )}

      {/* Order History */}
      <section className="mt-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base font-semibold text-[var(--color-foreground)]">
            Historique
          </h3>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[...Array(2)].map((_, i) => (
              <Skeleton key={i} className="h-28 rounded-2xl" />
            ))}
          </div>
        ) : deliveredOrders.length === 0 ? (
          <Card className="glass-card">
            <CardContent className="py-10 text-center">
              <Package className="w-10 h-10 mx-auto text-[var(--color-muted-foreground)] mb-2" />
              <p className="text-sm text-[var(--color-muted-foreground)]">
                Aucune commande passée
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {deliveredOrders.map((order, index) => (
              <OrderCard key={order.id} order={order} index={index} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
