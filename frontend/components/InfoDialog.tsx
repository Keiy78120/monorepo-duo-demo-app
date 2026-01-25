"use client";

import { useState, useEffect } from "react";
import { motion } from "motion/react";
import {
  Clock,
  MapPin,
  Phone,
  Mail,
  MessageCircle,
  Truck,
  Shield,
  Leaf,
  Loader2,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useTelegramStore, useHapticFeedback } from "@/lib/store/telegram";

interface InfoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface InfoSection {
  id: string;
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

interface Feature {
  id: string;
  icon: string;
  title: string;
  description: string;
}

interface AppSettings {
  info?: {
    sections?: InfoSection[];
    contact?: ContactInfo;
    features?: Feature[];
  };
}

const iconMap: Record<string, React.ElementType> = {
  truck: Truck,
  shield: Shield,
  leaf: Leaf,
};

const defaultContact: ContactInfo = {
  hours: "",
  address: "",
  phone: "",
  email: "",
  telegram: "",
};

export function InfoDialog({ open, onOpenChange }: InfoDialogProps) {
  const { webApp } = useTelegramStore();
  const { impact } = useHapticFeedback();
  const [loading, setLoading] = useState(true);
  const [sections, setSections] = useState<InfoSection[]>([]);
  const [contactInfo, setContactInfo] = useState<ContactInfo>(defaultContact);
  const [features, setFeatures] = useState<Feature[]>([]);

  useEffect(() => {
    if (!open) return;

    const fetchSettings = async () => {
      setLoading(true);
      try {
        const response = await fetch("/api/settings?key=app_settings");
        if (response.ok) {
          const data = await response.json();
          if (data?.setting?.value) {
            const parsed: AppSettings =
              typeof data.setting.value === "string"
                ? JSON.parse(data.setting.value)
                : data.setting.value;

            if (parsed.info?.sections) {
              setSections(parsed.info.sections);
            }
            if (parsed.info?.contact) {
              setContactInfo({ ...defaultContact, ...parsed.info.contact });
            }
            if (parsed.info?.features) {
              setFeatures(parsed.info.features);
            }
          }
        }
      } catch (error) {
        console.error("Failed to fetch info settings:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, [open]);

  const handleContact = (type: "phone" | "email" | "telegram") => {
    impact("light");

    switch (type) {
      case "phone":
        if (contactInfo.phone) {
          window.open(`tel:${contactInfo.phone}`, "_blank");
        }
        break;
      case "email":
        if (contactInfo.email) {
          window.open(`mailto:${contactInfo.email}`, "_blank");
        }
        break;
      case "telegram":
        if (contactInfo.telegram) {
          const username = contactInfo.telegram.replace("@", "");
          if (webApp) {
            webApp.openTelegramLink(`https://t.me/${username}`);
          } else {
            window.open(`https://t.me/${username}`, "_blank");
          }
        }
        break;
    }
  };

  const hasContactInfo =
    contactInfo.hours ||
    contactInfo.address ||
    contactInfo.phone ||
    contactInfo.email ||
    contactInfo.telegram;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="overflow-hidden p-0 flex flex-col" style={{ maxHeight: '85vh' }}>
        <DialogHeader className="p-5 pb-4 pr-12 sm:p-6 sm:pb-4">
          <DialogTitle className="text-xl">Informations</DialogTitle>
        </DialogHeader>

        <div className="px-5 pb-6 space-y-6 sm:px-6 flex-1 overflow-y-auto min-h-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-[var(--color-muted-foreground)]" />
            </div>
          ) : (
            <>
              {/* Features */}
              {features.length > 0 && (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  {features.map((feature, index) => {
                    const Icon = iconMap[feature.icon] || Truck;
                    return (
                      <motion.div
                        key={feature.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.1 }}
                        className="glass-card rounded-xl p-3 text-left sm:text-center"
                      >
                        <div className="w-10 h-10 rounded-xl bg-[var(--color-primary)]/10 flex items-center justify-center sm:mx-auto mb-2">
                          <Icon className="w-5 h-5 text-[var(--color-primary)]" />
                        </div>
                        <p className="text-xs font-semibold text-[var(--color-foreground)] mb-1">
                          {feature.title}
                        </p>
                        <p className="text-[10px] text-[var(--color-muted-foreground)]">
                          {feature.description}
                        </p>
                      </motion.div>
                    );
                  })}
                </div>
              )}

              {/* Info Sections */}
              {sections.length > 0 && (
                <div className="space-y-3">
                  {sections.map((section, index) => (
                    <motion.div
                      key={section.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 + index * 0.1 }}
                      className="glass-card rounded-xl p-4"
                    >
                      <h3 className="font-semibold text-[var(--color-foreground)] mb-2 text-sm">
                        {section.title}
                      </h3>
                      <p className="text-xs text-[var(--color-muted-foreground)] leading-relaxed">
                        {section.content}
                      </p>
                    </motion.div>
                  ))}
                </div>
              )}

              {/* Contact */}
              {hasContactInfo && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="glass-card rounded-2xl overflow-hidden"
                >
                  <div className="p-4 pb-2">
                    <h3 className="font-semibold text-[var(--color-foreground)] text-sm">
                      Nous contacter
                    </h3>
                  </div>

                  <div className="divide-y divide-[var(--color-border)]">
                    {/* Hours */}
                    {contactInfo.hours && (
                      <div className="flex items-center gap-3 px-4 py-3">
                        <div className="w-8 h-8 rounded-xl bg-[var(--color-muted)] flex items-center justify-center">
                          <Clock className="w-4 h-4 text-[var(--color-muted-foreground)]" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[10px] text-[var(--color-muted-foreground)]">Horaires</p>
                          <p className="text-xs text-[var(--color-foreground)] break-words">
                            {contactInfo.hours}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Address */}
                    {contactInfo.address && (
                      <div className="flex items-center gap-3 px-4 py-3">
                        <div className="w-8 h-8 rounded-xl bg-[var(--color-muted)] flex items-center justify-center">
                          <MapPin className="w-4 h-4 text-[var(--color-muted-foreground)]" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[10px] text-[var(--color-muted-foreground)]">Adresse</p>
                          <p className="text-xs text-[var(--color-foreground)] break-words">
                            {contactInfo.address}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Phone */}
                    {contactInfo.phone && (
                      <button
                        onClick={() => handleContact("phone")}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[var(--color-muted)] transition-colors text-left"
                      >
                        <div className="w-8 h-8 rounded-xl bg-[var(--color-muted)] flex items-center justify-center">
                          <Phone className="w-4 h-4 text-[var(--color-muted-foreground)]" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[10px] text-[var(--color-muted-foreground)]">Téléphone</p>
                          <p className="text-xs text-[var(--color-foreground)] break-words">
                            {contactInfo.phone}
                          </p>
                        </div>
                      </button>
                    )}

                    {/* Email */}
                    {contactInfo.email && (
                      <button
                        onClick={() => handleContact("email")}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[var(--color-muted)] transition-colors text-left"
                      >
                        <div className="w-8 h-8 rounded-xl bg-[var(--color-muted)] flex items-center justify-center">
                          <Mail className="w-4 h-4 text-[var(--color-muted-foreground)]" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[10px] text-[var(--color-muted-foreground)]">Email</p>
                          <p className="text-xs text-[var(--color-foreground)] break-words">
                            {contactInfo.email}
                          </p>
                        </div>
                      </button>
                    )}

                    {/* Telegram */}
                    {contactInfo.telegram && (
                      <button
                        onClick={() => handleContact("telegram")}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[var(--color-muted)] transition-colors text-left"
                      >
                        <div className="w-8 h-8 rounded-xl bg-[var(--color-muted)] flex items-center justify-center">
                          <MessageCircle className="w-4 h-4 text-[var(--color-muted-foreground)]" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[10px] text-[var(--color-muted-foreground)]">Telegram</p>
                          <p className="text-xs text-[var(--color-foreground)] break-words">
                            {contactInfo.telegram}
                          </p>
                        </div>
                      </button>
                    )}
                  </div>
                </motion.div>
              )}

              {/* Empty State */}
              {!loading && sections.length === 0 && features.length === 0 && !hasContactInfo && (
                <div className="text-center py-8">
                  <p className="text-sm text-[var(--color-muted-foreground)]">
                    Aucune information disponible.
                  </p>
                </div>
              )}

              {/* Footer */}
              <p className="text-center text-[10px] text-[var(--color-muted-foreground)]">
                Application Telegram v1.0.0
              </p>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
