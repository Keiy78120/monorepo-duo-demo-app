"use client";

import { useState, useEffect } from "react";
import { motion } from "motion/react";
import {
  Package,
  ShoppingCart,
  MessageSquare,
  TrendingUp,
  TrendingDown,
  Users,
  Euro,
  Clock,
  CheckCircle2,
  Truck,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useAppModeStore } from "@/lib/store/app-mode";

interface DashboardStats {
  totalProducts: number;
  activeProducts: number;
  totalOrders: number;
  pendingOrders: number;
  processingOrders: number;
  shippedOrders: number;
  deliveredOrders: number;
  totalReviews: number;
  pendingReviews: number;
  totalRevenue: number;
  monthlyRevenue: number;
  previousMonthRevenue: number;
  totalUsers: number;
  newUsersThisMonth: number;
}

// Mock data for demonstration
const mockStats: DashboardStats = {
  totalProducts: 24,
  activeProducts: 20,
  totalOrders: 156,
  pendingOrders: 8,
  processingOrders: 12,
  shippedOrders: 5,
  deliveredOrders: 131,
  totalReviews: 89,
  pendingReviews: 5,
  totalRevenue: 124500,
  monthlyRevenue: 28750,
  previousMonthRevenue: 24200,
  totalUsers: 312,
  newUsersThisMonth: 47,
};

// Mock revenue data for chart (last 7 days)
const revenueData = [
  { day: "Lun", value: 4200 },
  { day: "Mar", value: 3800 },
  { day: "Mer", value: 5100 },
  { day: "Jeu", value: 4600 },
  { day: "Ven", value: 6200 },
  { day: "Sam", value: 7800 },
  { day: "Dim", value: 5400 },
];

// Mock recent orders
const recentOrders = [
  { id: "ORD-847", customer: "@marc_d", amount: 370, status: "processing", time: "Il y a 5 min" },
  { id: "ORD-846", customer: "@julie_m", amount: 185, status: "shipped", time: "Il y a 23 min" },
  { id: "ORD-845", customer: "@alex_p", amount: 520, status: "pending", time: "Il y a 1h" },
  { id: "ORD-844", customer: "@sophie_l", amount: 95, status: "delivered", time: "Il y a 2h" },
  { id: "ORD-843", customer: "@thomas_r", amount: 280, status: "delivered", time: "Il y a 3h" },
];

// Mock top products
const topProducts = [
  { name: "Tropicana", category: "Frozen Hash", sales: 45, revenue: 40500, growth: 12 },
  { name: "Cookie Kush", category: "Frozen Hash", sales: 38, revenue: 32300, growth: 8 },
  { name: "Purple Haze", category: "Hash Premium", sales: 32, revenue: 19200, growth: -3 },
  { name: "OG Kush", category: "Flower Indoor", sales: 28, revenue: 19600, growth: 15 },
];

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value / 100);
};

// Area Chart Component
function AreaChart({ data, height = 120 }: { data: typeof revenueData; height?: number }) {
  const maxValue = Math.max(...data.map((d) => d.value));
  const minValue = Math.min(...data.map((d) => d.value)) * 0.8;
  const range = maxValue - minValue;

  const points = data.map((d, i) => {
    const x = (i / (data.length - 1)) * 100;
    const y = 100 - ((d.value - minValue) / range) * 100;
    return `${x},${y}`;
  }).join(" ");

  const areaPath = `M0,100 L0,${100 - ((data[0].value - minValue) / range) * 100} ${points.split(" ").map((p, i) => `L${p}`).join(" ")} L100,100 Z`;
  const linePath = `M${points.split(" ").join(" L")}`;

  return (
    <div className="relative" style={{ height }}>
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full">
        <defs>
          <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0.3" />
            <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <motion.path
          d={areaPath}
          fill="url(#areaGradient)"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
        />
        <motion.path
          d={linePath}
          fill="none"
          stroke="var(--color-primary)"
          strokeWidth="2"
          vectorEffect="non-scaling-stroke"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
      </svg>
      {/* Data points */}
      <div className="absolute inset-0 flex justify-between items-end pb-6">
        {data.map((d, i) => (
          <div key={i} className="flex flex-col items-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.5 + i * 0.1 }}
              className="w-2 h-2 rounded-full bg-[var(--color-primary)] mb-1"
              style={{
                marginBottom: `${((d.value - minValue) / range) * (height - 30)}px`,
              }}
            />
          </div>
        ))}
      </div>
      {/* X axis labels */}
      <div className="absolute bottom-0 left-0 right-0 flex justify-between">
        {data.map((d, i) => (
          <span key={i} className="text-[10px] text-[var(--color-muted-foreground)]">
            {d.day}
          </span>
        ))}
      </div>
    </div>
  );
}

// Donut Chart Component
function DonutChart({ data }: { data: { label: string; value: number; color: string }[] }) {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  let currentAngle = -90;

  return (
    <div className="relative w-32 h-32">
      <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
        {data.map((segment, i) => {
          const percentage = (segment.value / total) * 100;
          const angle = (percentage / 100) * 360;
          const startAngle = currentAngle;
          currentAngle += angle;

          const radius = 40;
          const circumference = 2 * Math.PI * radius;
          const strokeDasharray = `${(percentage / 100) * circumference} ${circumference}`;
          const strokeDashoffset = -((startAngle + 90) / 360) * circumference;

          return (
            <motion.circle
              key={i}
              cx="50"
              cy="50"
              r={radius}
              fill="none"
              stroke={segment.color}
              strokeWidth="12"
              strokeDasharray={strokeDasharray}
              strokeDashoffset={strokeDashoffset}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.2, duration: 0.5 }}
            />
          );
        })}
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <p className="text-2xl font-bold text-[var(--color-foreground)]">{total}</p>
          <p className="text-[10px] text-[var(--color-muted-foreground)]">Total</p>
        </div>
      </div>
    </div>
  );
}

// Progress Bar Component
function ProgressBar({ value, max, color }: { value: number; max: number; color: string }) {
  const percentage = (value / max) * 100;
  return (
    <div className="h-2 bg-[var(--color-muted)] rounded-full overflow-hidden">
      <motion.div
        className="h-full rounded-full"
        style={{ backgroundColor: color }}
        initial={{ width: 0 }}
        animate={{ width: `${percentage}%` }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      />
    </div>
  );
}

// Status Badge Component
function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; class: string }> = {
    pending: { label: "En attente", class: "bg-amber-500/15 text-amber-300" },
    processing: { label: "Préparation", class: "bg-purple-500/15 text-purple-300" },
    shipped: { label: "Expédié", class: "bg-cyan-500/15 text-cyan-300" },
    delivered: { label: "Livré", class: "bg-[var(--color-primary)]/15 text-[var(--color-primary)]" },
  };
  const { label, class: className } = config[status] || config.pending;
  return <Badge className={cn("text-[10px]", className)}>{label}</Badge>;
}

export default function AdminDashboardPage() {
  const mode = useAppModeStore((s) => s.mode);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        await new Promise((resolve) => setTimeout(resolve, 600));
        setStats(mockStats);
      } catch (error) {
        console.error("Failed to fetch stats:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const revenueGrowth = stats
    ? ((stats.monthlyRevenue - stats.previousMonthRevenue) / stats.previousMonthRevenue) * 100
    : 0;

  const orderStatusData = stats
    ? [
        { label: "En attente", value: stats.pendingOrders, color: "var(--color-warning)" },
        { label: "Préparation", value: stats.processingOrders, color: "#a855f7" },
        { label: "Expédié", value: stats.shippedOrders, color: "#06b6d4" },
        { label: "Livré", value: stats.deliveredOrders, color: "var(--color-primary)" },
      ]
    : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[var(--color-foreground)]">Dashboard</h1>
        <p className="text-[var(--color-muted-foreground)] text-sm mt-1">
          Vue d'ensemble de votre activité
        </p>
      </div>

      {/* Hero Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {loading ? (
          [...Array(4)].map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />)
        ) : (
          <>
            {/* Revenue */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <Card className="glass-card border-[var(--color-primary)]/20">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-emerald flex items-center justify-center shadow-[0_4px_12px_oklch(0.55_0.15_250_/_0.3)]">
                      <Euro className="w-6 h-6 text-white" />
                    </div>
                    <div className={cn(
                      "flex items-center gap-1 text-sm font-semibold px-2 py-1 rounded-full",
                      revenueGrowth >= 0
                        ? "text-[var(--color-success)] bg-[var(--color-success)]/10"
                        : "text-[var(--color-destructive)] bg-[var(--color-destructive)]/10"
                    )}>
                      {revenueGrowth >= 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                      {Math.abs(revenueGrowth).toFixed(1)}%
                    </div>
                  </div>
                  <p className="text-3xl font-bold text-[var(--color-foreground)]">
                    {formatCurrency(stats?.monthlyRevenue || 0)}
                  </p>
                  <p className="text-sm text-[var(--color-muted-foreground)] mt-1">Revenu ce mois</p>
                </CardContent>
              </Card>
            </motion.div>

            {/* Orders */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <Card className="glass-card">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-[0_4px_12px_oklch(0.70_0.15_300_/_0.3)]">
                      <ShoppingCart className="w-6 h-6 text-white" />
                    </div>
                    <Badge variant="secondary" className="text-xs px-2.5 py-1">
                      {stats?.pendingOrders} en attente
                    </Badge>
                  </div>
                  <p className="text-3xl font-bold text-[var(--color-foreground)]">{stats?.totalOrders}</p>
                  <p className="text-sm text-[var(--color-muted-foreground)] mt-1">Commandes totales</p>
                </CardContent>
              </Card>
            </motion.div>

            {/* Users */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <Card className="glass-card">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-cyan-600 flex items-center justify-center shadow-[0_4px_12px_oklch(0.65_0.15_200_/_0.3)]">
                      <Users className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex items-center gap-1 text-sm font-semibold text-[var(--color-success)] bg-[var(--color-success)]/10 px-2 py-1 rounded-full">
                      <ArrowUpRight className="w-4 h-4" />
                      +{stats?.newUsersThisMonth}
                    </div>
                  </div>
                  <p className="text-3xl font-bold text-[var(--color-foreground)]">{stats?.totalUsers}</p>
                  <p className="text-sm text-[var(--color-muted-foreground)] mt-1">Clients actifs</p>
                </CardContent>
              </Card>
            </motion.div>

            {/* Reviews */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <Card className="glass-card">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-gold flex items-center justify-center shadow-[0_4px_12px_oklch(0.65_0.18_200_/_0.3)]">
                      <MessageSquare className="w-6 h-6 text-white" />
                    </div>
                    {stats?.pendingReviews ? (
                      <Badge className="text-xs px-2.5 py-1 bg-amber-500/15 text-amber-300">
                        {stats.pendingReviews} à modérer
                      </Badge>
                    ) : null}
                  </div>
                  <p className="text-3xl font-bold text-[var(--color-foreground)]">{stats?.totalReviews}</p>
                  <p className="text-sm text-[var(--color-muted-foreground)] mt-1">Avis clients</p>
                </CardContent>
              </Card>
            </motion.div>
          </>
        )}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="lg:col-span-2"
        >
          <Card className="glass-card h-full">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold">Revenus (7 derniers jours)</CardTitle>
                <p className="text-lg font-bold text-gradient">
                  {formatCurrency(revenueData.reduce((sum, d) => sum + d.value * 100, 0))}
                </p>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-32 rounded-xl" />
              ) : (
                <AreaChart data={revenueData} height={140} />
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Order Status */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="glass-card h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold">Statut des commandes</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-32 rounded-xl" />
              ) : (
                <div className="flex items-center justify-center gap-6">
                  <DonutChart data={orderStatusData} />
                  <div className="space-y-2">
                    {orderStatusData.map((item, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="text-xs text-[var(--color-muted-foreground)]">
                          {item.label}
                        </span>
                        <span className="text-xs font-semibold text-[var(--color-foreground)]">
                          {item.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Bottom Row */}
      <div className={cn(
        "grid gap-6",
        mode === "simple" ? "grid-cols-1" : "grid-cols-1 lg:grid-cols-2"
      )}>
        {/* Recent Orders - Hidden in Simple Mode */}
        {mode !== "simple" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <Card className="glass-card">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <Clock className="w-4 h-4 text-[var(--color-primary)]" />
                    Commandes récentes
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-3">
                    {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-12 rounded-lg" />)}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {recentOrders.map((order, i) => (
                      <motion.div
                        key={order.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.7 + i * 0.05 }}
                        className="flex items-center justify-between p-3 rounded-xl bg-[var(--color-muted)]/30 hover:bg-[var(--color-muted)]/50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-[var(--color-primary)]/10 flex items-center justify-center">
                            <ShoppingCart className="w-4 h-4 text-[var(--color-primary)]" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-[var(--color-foreground)]">
                              {order.id}
                            </p>
                            <p className="text-xs text-[var(--color-muted-foreground)]">
                              {order.customer} • {order.time}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <p className="text-sm font-semibold text-[var(--color-foreground)]">
                            {formatCurrency(order.amount * 100)}
                          </p>
                          <StatusBadge status={order.status} />
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Top Products */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <Card className="glass-card">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-[var(--color-primary)]" />
                  Produits populaires
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-4">
                  {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-16 rounded-lg" />)}
                </div>
              ) : (
                <div className="space-y-4">
                  {topProducts.map((product, i) => (
                    <motion.div
                      key={product.name}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.8 + i * 0.05 }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-gradient-emerald flex items-center justify-center text-white text-sm font-bold">
                            {i + 1}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-[var(--color-foreground)]">
                              {product.name}
                            </p>
                            <p className="text-[10px] text-[var(--color-muted-foreground)]">
                              {product.category} • {product.sales} ventes
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-[var(--color-foreground)]">
                            {formatCurrency(product.revenue)}
                          </p>
                          <div className={cn(
                            "flex items-center justify-end gap-0.5 text-[10px]",
                            product.growth >= 0 ? "text-[var(--color-success)]" : "text-[var(--color-destructive)]"
                          )}>
                            {product.growth >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                            {product.growth >= 0 ? "+" : ""}{product.growth}%
                          </div>
                        </div>
                      </div>
                      <ProgressBar
                        value={product.sales}
                        max={topProducts[0].sales}
                        color={i === 0 ? "var(--color-primary)" : i === 1 ? "var(--color-chart-2)" : i === 2 ? "var(--color-chart-3)" : "var(--color-accent)"}
                      />
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
