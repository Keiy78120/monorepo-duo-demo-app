"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const COUNTRY_FLAGS = [
  { value: "", label: "Aucun" },
  { value: "\u{1F1F2}\u{1F1E6}", label: "Maroc" },
  { value: "\u{1F1EB}\u{1F1F7}", label: "France" },
  { value: "\u{1F1EA}\u{1F1F8}", label: "Espagne" },
  { value: "\u{1F1F3}\u{1F1F1}", label: "Pays-Bas" },
  { value: "\u{1F1FA}\u{1F1F8}", label: "États-Unis" },
  { value: "\u{1F1E8}\u{1F1E6}", label: "Canada" },
  { value: "\u{1F1EE}\u{1F1F9}", label: "Italie" },
  { value: "\u{1F1E8}\u{1F1ED}", label: "Suisse" },
  { value: "\u{1F1E7}\u{1F1EA}", label: "Belgique" },
  { value: "\u{1F1E9}\u{1F1EA}", label: "Allemagne" },
  { value: "\u{1F1F5}\u{1F1F9}", label: "Portugal" },
  { value: "\u{1F1EC}\u{1F1E7}", label: "Royaume-Uni" },
] as const;

interface FlagSelectProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function FlagSelect({
  value,
  onChange,
  placeholder = "Origine",
  className,
}: FlagSelectProps) {
  const selectedCountry = COUNTRY_FLAGS.find((c) => c.value === value);

  return (
    <Select value={value || "none"} onValueChange={(v) => onChange(v === "none" ? "" : v)}>
      <SelectTrigger className={className}>
        <SelectValue placeholder={placeholder}>
          {selectedCountry ? (
            <span className="flex items-center gap-2">
              {selectedCountry.value && <span>{selectedCountry.value}</span>}
              <span>{selectedCountry.label}</span>
            </span>
          ) : (
            placeholder
          )}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {COUNTRY_FLAGS.map((country) => (
          <SelectItem key={country.label} value={country.value || "none"}>
            <span className="flex items-center gap-2">
              {country.value && <span>{country.value}</span>}
              <span>{country.label}</span>
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
