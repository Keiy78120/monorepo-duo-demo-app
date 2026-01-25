"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AdminPreviewBar() {
  const router = useRouter();
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setEnabled(window.localStorage.getItem("admin-preview") === "1");
  }, []);

  if (!enabled) return null;

  return (
    <div className="fixed top-4 left-1/2 z-50 -translate-x-1/2">
      <Button
        variant="secondary"
        className="shadow-lg"
        onClick={() => {
          if (typeof window !== "undefined") {
            window.localStorage.removeItem("admin-preview");
          }
          router.push("/admin");
        }}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Retour admin
      </Button>
    </div>
  );
}
