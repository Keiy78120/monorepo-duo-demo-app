"use client";

import { useState, useEffect } from "react";
import { motion } from "motion/react";
import {
  Clock,
  MapPin,
  Phone,
  Mail,
  MessageCircle,
  ChevronRight,
  Truck,
  Shield,
  Leaf,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/PageHeader";
import { useTelegramStore, useHapticFeedback } from "@/lib/store/telegram";

interface InfoSection {
  title: string;
  content: string;
}

interface ContactInfo {
  hours: string;
  address: string;
  phone: string;
  email: string;
  telegram: string;
}

interface InfoData {
  sections: InfoSection[];
  contact: ContactInfo;
  features: { icon: string; title: string; description: string }[];
}

const iconMap: Record<string, React.ElementType> = {
  truck: Truck,
  shield: Shield,
  leaf: Leaf,
};

export default function InfoPage() {
  const [info, setInfo] = useState<InfoData | null>(null);
  const [loading, setLoading] = useState(true);
  const { webApp } = useTelegramStore();
  const { impact } = useHapticFeedback();

  // Fetch info from settings
  useEffect(() => {
    const fetchInfo = async () => {
      try {
        const response = await fetch("/api/settings?key=info");
        if (!response.ok) {
          throw new Error("Failed to fetch info");
        }
        const data = await response.json();
        const value = data?.setting?.value;
        let parsed: InfoData | null = null;
        if (typeof value === "string") {
          try {
            parsed = JSON.parse(value) as InfoData;
          } catch {
            parsed = null;
          }
        } else {
          parsed = value as InfoData;
        }
        setInfo(parsed || null);
      } catch (error) {
        console.error("Échec du chargement des informations:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchInfo();
  }, []);

  const handleContact = (type: "phone" | "email" | "telegram") => {
    impact("light");

    if (!info) return;

    switch (type) {
      case "phone":
        window.open(`tel:${info.contact.phone}`, "_blank");
        break;
      case "email":
        window.open(`mailto:${info.contact.email}`, "_blank");
        break;
      case "telegram":
        if (webApp) {
          webApp.openTelegramLink(`https://t.me/${info.contact.telegram.replace("@", "")}`);
        } else {
          window.open(`https://t.me/${info.contact.telegram.replace("@", "")}`, "_blank");
        }
        break;
    }
  };

  if (loading) {
    return (
      <div className="px-5 pt-6">
        <PageHeader title="Infos" />
        <div className="space-y-4">
          <Skeleton className="h-32 rounded-2xl" />
          <Skeleton className="h-48 rounded-2xl" />
          <Skeleton className="h-40 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!info) {
    return (
      <div className="px-5 pt-6">
        <PageHeader title="Infos" />
        <p className="text-[var(--color-muted-foreground)]">
          Informations non disponibles
        </p>
      </div>
    );
  }

  return (
    <div className="px-5 pt-6">
      <PageHeader title="Infos" subtitle="En savoir plus sur nous" showBack />

      {/* Features */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-3 gap-3 mb-6"
      >
        {info.features.map((feature, index) => {
          const Icon = iconMap[feature.icon] || Shield;
          return (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              className="glass-card rounded-2xl p-4 text-center"
            >
              <div className="w-10 h-10 rounded-xl bg-[var(--color-primary)]/10 flex items-center justify-center mx-auto mb-2">
                <Icon className="w-5 h-5 text-[var(--color-primary)]" />
              </div>
              <p className="text-xs font-medium text-[var(--color-foreground)] mb-1">
                {feature.title}
              </p>
              <p className="text-[10px] text-[var(--color-muted-foreground)]">
                {feature.description}
              </p>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Info Sections */}
      <div className="space-y-4 mb-6">
        {info.sections.map((section, index) => (
          <motion.div
            key={section.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + index * 0.1 }}
            className="glass-card rounded-2xl p-5"
          >
            <h3 className="font-semibold text-[var(--color-foreground)] mb-2">
              {section.title}
            </h3>
            <p className="text-sm text-[var(--color-muted-foreground)] leading-relaxed">
              {section.content}
            </p>
          </motion.div>
        ))}
      </div>

      {/* Contact */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="glass-card rounded-2xl overflow-hidden"
      >
        <div className="p-5 pb-3">
          <h3 className="font-semibold text-[var(--color-foreground)]">
            Nous contacter
          </h3>
        </div>

        <div className="divide-y divide-[var(--color-border)]">
          {/* Hours */}
          <div className="flex items-center gap-4 px-5 py-4">
            <div className="w-10 h-10 rounded-xl bg-[var(--color-glass)] flex items-center justify-center">
              <Clock className="w-5 h-5 text-[var(--color-muted-foreground)]" />
            </div>
            <div>
              <p className="text-xs text-[var(--color-muted-foreground)]">Horaires</p>
              <p className="text-sm text-[var(--color-foreground)]">
                {info.contact.hours}
              </p>
            </div>
          </div>

          {/* Address */}
          <div className="flex items-center gap-4 px-5 py-4">
            <div className="w-10 h-10 rounded-xl bg-[var(--color-glass)] flex items-center justify-center">
              <MapPin className="w-5 h-5 text-[var(--color-muted-foreground)]" />
            </div>
            <div>
              <p className="text-xs text-[var(--color-muted-foreground)]">Adresse</p>
              <p className="text-sm text-[var(--color-foreground)]">
                {info.contact.address}
              </p>
            </div>
          </div>

          {/* Phone */}
          <button
            onClick={() => handleContact("phone")}
            className="w-full flex items-center justify-between gap-4 px-5 py-4 hover:bg-[var(--color-glass)] transition-colors"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-[var(--color-glass)] flex items-center justify-center">
                <Phone className="w-5 h-5 text-[var(--color-muted-foreground)]" />
              </div>
              <div className="text-left">
                <p className="text-xs text-[var(--color-muted-foreground)]">Téléphone</p>
                <p className="text-sm text-[var(--color-foreground)]">
                  {info.contact.phone}
                </p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-[var(--color-muted-foreground)]" />
          </button>

          {/* Email */}
          <button
            onClick={() => handleContact("email")}
            className="w-full flex items-center justify-between gap-4 px-5 py-4 hover:bg-[var(--color-glass)] transition-colors"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-[var(--color-glass)] flex items-center justify-center">
                <Mail className="w-5 h-5 text-[var(--color-muted-foreground)]" />
              </div>
              <div className="text-left">
                <p className="text-xs text-[var(--color-muted-foreground)]">Email</p>
                <p className="text-sm text-[var(--color-foreground)]">
                  {info.contact.email}
                </p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-[var(--color-muted-foreground)]" />
          </button>

          {/* Telegram */}
          <button
            onClick={() => handleContact("telegram")}
            className="w-full flex items-center justify-between gap-4 px-5 py-4 hover:bg-[var(--color-glass)] transition-colors"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-[var(--color-glass)] flex items-center justify-center">
                <MessageCircle className="w-5 h-5 text-[var(--color-muted-foreground)]" />
              </div>
              <div className="text-left">
                <p className="text-xs text-[var(--color-muted-foreground)]">Telegram</p>
                <p className="text-sm text-[var(--color-foreground)]">
                  {info.contact.telegram}
                </p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-[var(--color-muted-foreground)]" />
          </button>
        </div>
      </motion.div>

      {/* Footer */}
      <p className="text-center text-xs text-[var(--color-muted-foreground)] mt-8 mb-4">
        Application Telegram v1.0.0
      </p>
    </div>
  );
}
