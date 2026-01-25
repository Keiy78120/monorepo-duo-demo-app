"use client";

import { cn } from "@/lib/utils";

// Map emoji flags to country codes and names
const countryData: Record<string, { code: string; name: string }> = {
  "🇫🇷": { code: "FR", name: "France" },
  "🇪🇸": { code: "ES", name: "Espagne" },
  "🇮🇹": { code: "IT", name: "Italie" },
  "🇺🇸": { code: "US", name: "USA" },
  "🇨🇦": { code: "CA", name: "Canada" },
  "🇲🇦": { code: "MA", name: "Maroc" },
  "🇳🇱": { code: "NL", name: "Pays-Bas" },
  "🇨🇭": { code: "CH", name: "Suisse" },
  "🇯🇲": { code: "JM", name: "Jamaïque" },
  "🇹🇭": { code: "TH", name: "Thaïlande" },
  "🇨🇴": { code: "CO", name: "Colombie" },
  "🇦🇫": { code: "AF", name: "Afghanistan" },
  "🇵🇰": { code: "PK", name: "Pakistan" },
  "🇮🇳": { code: "IN", name: "Inde" },
  "🇱🇧": { code: "LB", name: "Liban" },
  "🇵🇹": { code: "PT", name: "Portugal" },
  "🇩🇪": { code: "DE", name: "Allemagne" },
  "🇬🇧": { code: "UK", name: "UK" },
  "🇧🇪": { code: "BE", name: "Belgique" },
  "🇿🇦": { code: "ZA", name: "Afrique du Sud" },
  "🇦🇺": { code: "AU", name: "Australie" },
  "🇲🇽": { code: "MX", name: "Mexique" },
  "🇧🇷": { code: "BR", name: "Brésil" },
};

interface CountryBadgeProps {
  origin: string; // Can be emoji flag or country code
  variant?: "default" | "compact" | "full";
  className?: string;
}

export function CountryBadge({ origin, variant = "default", className }: CountryBadgeProps) {
  // Try to find country data from emoji or use the origin directly as code
  const country = countryData[origin];
  const displayCode = country?.code || origin.toUpperCase().slice(0, 2);
  const displayName = country?.name || origin;

  if (variant === "compact") {
    return (
      <div
        className={cn(
          "inline-flex items-center justify-center px-1.5 py-0.5 rounded text-[10px] font-bold",
          "bg-black/60 text-white backdrop-blur-sm",
          className
        )}
      >
        {displayCode}
      </div>
    );
  }

  if (variant === "full") {
    return (
      <div
        className={cn(
          "inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium",
          "bg-[var(--color-card)] text-[var(--color-foreground)] border border-[var(--color-border)]",
          "shadow-sm",
          className
        )}
      >
        <span className="font-bold text-[var(--color-primary)]">{displayCode}</span>
        <span className="text-[var(--color-muted-foreground)]">{displayName}</span>
      </div>
    );
  }

  // Default variant
  return (
    <div
      className={cn(
        "inline-flex items-center justify-center px-2 py-1 rounded-md text-[11px] font-semibold",
        "bg-black/70 text-white backdrop-blur-sm",
        "shadow-sm",
        className
      )}
    >
      {displayCode}
    </div>
  );
}
