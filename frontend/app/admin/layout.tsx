"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { motion } from "motion/react";
import {
  LayoutDashboard,
  Package,
  MessageSquare,
  Settings,
  Menu,
  X,
  ShoppingCart,
  Eye,
  Users,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useSession } from "@/lib/auth/client";
import { useTelegramStore } from "@/lib/store/telegram";
import { adminFetch } from "@/lib/api/admin-fetch";
import { useAppModeStore } from "@/lib/store/app-mode";
import { useDemoSessionStore } from "@/lib/store/demo-session";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session, isPending } = useSession();
  const { userId, initData, initialize } = useTelegramStore();
  const { mode, loadMode } = useAppModeStore();
  const { sessionId, loadDemoSession } = useDemoSessionStore();
  const isSimple = mode === "simple";

  const navItems = [
    { href: "/admin", icon: LayoutDashboard, label: "Dashboard" },
    { href: "/admin/orders", icon: ShoppingCart, label: "Commandes" },
    { href: "/admin/products", icon: Package, label: "Catalogue" },
    { href: "/admin/reviews", icon: MessageSquare, label: "Avis" },
    {
      href: "/admin/contacts",
      icon: Users,
      label: isSimple ? "Modération" : "Contacts",
    },
    { href: "/admin/settings", icon: Settings, label: "Paramètres" },
    // AI Features (Advanced mode only)
    ...(isSimple ? [] : [
      { href: "/admin/ai-tools", icon: Sparkles, label: "AI Tools" }
    ]),
  ];
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [adminCheckDone, setAdminCheckDone] = useState(false);
  const [adminAccess, setAdminAccess] = useState(false);
  const [serverSession, setServerSession] = useState<{ user?: { id?: string; name?: string; email?: string } } | null>(null);
  const [serverSessionChecked, setServerSessionChecked] = useState(false);
  const [telegramVerifyDone, setTelegramVerifyDone] = useState(false);

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    loadMode();
    loadDemoSession();
  }, [loadMode, loadDemoSession]);

  useEffect(() => {
    let cancelled = false;
    const verifyTelegram = async () => {
      if (!initData) {
        if (!cancelled) setTelegramVerifyDone(true);
        return;
      }

      try {
        await fetch("/api/telegram/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ initData }),
        });
      } catch (error) {
        console.error("Telegram verify failed:", error);
      } finally {
        if (!cancelled) setTelegramVerifyDone(true);
      }
    };

    verifyTelegram();

    return () => {
      cancelled = true;
    };
  }, [initData]);

  useEffect(() => {
    const fetchServerSession = async () => {
      try {
        const response = await adminFetch("/api/admin/session");
        if (!response.ok) return;
        const data = await response.json();
        if (data?.authenticated) {
          setServerSession({ user: data.user });
          setAdminAccess(true);
        }
      } catch (error) {
        console.error("Failed to fetch admin session:", error);
      } finally {
        setServerSessionChecked(true);
      }
    };

    fetchServerSession();
  }, []);

  // Skip auth in development or demo mode
  const isDev = process.env.NODE_ENV === "development";
  const isPublicAdminPage = pathname === "/admin/login" || pathname === "/admin/unauthorized";
  const hasDemoSession = !!sessionId; // Allow access if demo session exists
  const hasAdminAccess = isDev || !!session || !!serverSession || adminAccess || hasDemoSession;

  const visibleNavItems = isSimple
    ? navItems.filter((item) =>
        ["/admin", "/admin/products", "/admin/reviews", "/admin/contacts", "/admin/settings"].includes(item.href)
      )
    : navItems;

  useEffect(() => {
    if (!isSimple) return;
    const allowed = [
      "/admin",
      "/admin/products",
      "/admin/reviews",
      "/admin/contacts",
      "/admin/settings",
      "/admin/login",
      "/admin/unauthorized",
    ];
    if (!allowed.includes(pathname)) {
      router.replace("/admin");
    }
  }, [isSimple, pathname, router]);

  // Check admin access via API
  useEffect(() => {
    const checkAdminAccess = async () => {
      // Skip check for public admin pages
      const publicAdminPages = ["/admin/login", "/admin/unauthorized"];
      if (publicAdminPages.includes(pathname)) {
        setAdminCheckDone(true);
        return;
      }

      // Skip admin check if demo session exists
      if (sessionId) {
        setAdminAccess(true);
        setAdminCheckDone(true);
        return;
      }

      // If we have a Telegram user, check if they're admin
      if (userId) {
        try {
          const response = await adminFetch("/api/admin/check", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ telegram_user_id: userId.toString() }),
          });

          if (!response.ok) {
            router.push("/admin/unauthorized");
            return;
          }

          setAdminAccess(true);
          setAdminCheckDone(true);
        } catch (error) {
          console.error("Admin check failed:", error);
          router.push("/admin/unauthorized");
        }
      } else {
        // No Telegram user yet, wait a bit
        setTimeout(() => setAdminCheckDone(true), 1000);
      }
    };

    checkAdminAccess();
  }, [userId, pathname, router]);

  // Redirect to login if not authenticated (only in production)
  useEffect(() => {
    if (!isDev && !isPending && serverSessionChecked && adminCheckDone && !hasAdminAccess && !isPublicAdminPage) {
      router.push("/admin/login");
    }
  }, [session, isPending, pathname, router, isDev, serverSessionChecked, isPublicAdminPage, hasAdminAccess, adminCheckDone]);

  // Show nothing while checking auth or admin access
  if (!isDev && !isPublicAdminPage && (isPending || !adminCheckDone || !serverSessionChecked || !telegramVerifyDone)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-background)]">
        <div className="w-10 h-10 rounded-full border-2 border-[var(--color-primary)] border-t-transparent animate-spin" />
      </div>
    );
  }

  // Login page doesn't need the admin layout
  if (isPublicAdminPage) {
    return <>{children}</>;
  }

  // If not authenticated and not on login page, show nothing (redirect will happen) - only in production
  if (!isDev && !hasAdminAccess) {
    return null;
  }

  // Mock session for development
  const displaySession = isDev && !session && !serverSession
    ? { user: { name: "Dev Admin", email: "dev@local" } }
    : (session || serverSession);

  return (
    <div className="min-h-screen bg-[var(--color-background)]">
      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 glass-nav h-16 flex items-center justify-between px-4">
        <h1 className="text-lg font-semibold text-[var(--color-foreground)]">
          Administration
        </h1>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </Button>
      </header>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="lg:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-50 h-full w-64 bg-[var(--color-card)] border-r border-[var(--color-border)] transition-transform duration-300 lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="h-16 flex items-center px-6 border-b border-[var(--color-border)]">
            <h1 className="text-xl font-bold text-[var(--color-foreground)]">
              Admin
            </h1>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2">
            {visibleNavItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-200",
                    isActive
                      ? "bg-[var(--color-primary)] text-[var(--color-primary-foreground)] shadow-[0_4px_12px_oklch(0.55_0.15_250_/_0.3)]"
                      : "text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)]/50 hover:text-[var(--color-foreground)]"
                  )}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* User & Actions */}
          <div className="p-4 border-t border-[var(--color-border)] space-y-2">
            <div className="flex items-center gap-3 px-4 py-3 mb-2">
              <div className="w-8 h-8 rounded-full bg-[var(--color-primary)] flex items-center justify-center text-sm font-semibold text-white">
                {displaySession?.user?.name?.[0]?.toUpperCase() || "A"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[var(--color-foreground)] truncate">
                  {displaySession?.user?.name || "Admin"}
                </p>
                <p className="text-xs text-[var(--color-muted-foreground)] truncate">
                  {displaySession?.user?.email}
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              className="w-full justify-start gap-3"
              onClick={() => {
                if (typeof window !== "undefined") {
                  window.localStorage.setItem("admin-preview", "1");
                }
                router.push("/");
              }}
            >
              <Eye className="w-5 h-5" />
              Vue Client
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="lg:ml-64 pt-16 lg:pt-0 min-h-screen">
        <div className="p-6 lg:p-8">{children}</div>
      </main>
    </div>
  );
}
