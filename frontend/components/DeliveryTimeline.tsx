"use client";

import { motion } from "motion/react";
import { ClipboardCheck, ChefHat, Truck, PackageCheck } from "lucide-react";
import { cn } from "@/lib/utils";

type DeliveryStep = "confirmed" | "preparing" | "shipping" | "delivered";

interface DeliveryTimelineProps {
  currentStep?: DeliveryStep;
  className?: string;
}

const steps: { id: DeliveryStep; label: string; icon: typeof ClipboardCheck }[] = [
  { id: "confirmed", label: "Confirmée", icon: ClipboardCheck },
  { id: "preparing", label: "Préparation", icon: ChefHat },
  { id: "shipping", label: "En route", icon: Truck },
  { id: "delivered", label: "Livrée", icon: PackageCheck },
];

const stepIndex = (step: DeliveryStep) => steps.findIndex((s) => s.id === step);

export function DeliveryTimeline({ currentStep = "confirmed", className }: DeliveryTimelineProps) {
  const activeIdx = stepIndex(currentStep);

  return (
    <div className={cn("w-full", className)}>
      <div className="flex items-center justify-between relative">
        {/* Progress bar background */}
        <div className="absolute top-5 left-[10%] right-[10%] h-0.5 bg-[var(--color-border)]" />
        {/* Progress bar active */}
        <motion.div
          className="absolute top-5 left-[10%] h-0.5 bg-[var(--color-primary)]"
          initial={{ width: "0%" }}
          animate={{ width: `${(activeIdx / (steps.length - 1)) * 80}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />

        {steps.map((step, idx) => {
          const isActive = idx === activeIdx;
          const isDone = idx < activeIdx;
          const isPending = idx > activeIdx;
          const Icon = step.icon;

          return (
            <div key={step.id} className="flex flex-col items-center z-10 flex-1">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: idx * 0.15, duration: 0.3 }}
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center transition-colors",
                  isDone && "bg-[var(--color-primary)] text-[var(--color-primary-foreground)]",
                  isActive && "bg-[var(--color-primary)] text-[var(--color-primary-foreground)] ring-4 ring-[var(--color-primary)]/20",
                  isPending && "bg-[var(--color-muted)] text-[var(--color-muted-foreground)]"
                )}
              >
                {isActive ? (
                  <motion.div
                    animate={{ scale: [1, 1.15, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <Icon className="w-5 h-5" />
                  </motion.div>
                ) : (
                  <Icon className="w-5 h-5" />
                )}
              </motion.div>
              <p
                className={cn(
                  "text-[10px] sm:text-xs mt-2 font-medium text-center",
                  (isDone || isActive) ? "text-[var(--color-foreground)]" : "text-[var(--color-muted-foreground)]"
                )}
              >
                {step.label}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
