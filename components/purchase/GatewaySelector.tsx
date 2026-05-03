"use client";

import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";

const GATEWAYS = [
  { id: "zaincash", label: "ZainCash" },
  { id: "qi-card", label: "QI Card" },
  { id: "fib", label: "FIB" },
  { id: "asia-pay", label: "Asia Pay" },
  { id: "fast-pay", label: "Fast Pay" },
];

interface GatewaySelectorProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export function GatewaySelector({ value, onChange, disabled }: GatewaySelectorProps) {
  return (
    <RadioGroup value={value} onValueChange={onChange} disabled={disabled} className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {GATEWAYS.map((gw) => (
        <label
          key={gw.id}
          htmlFor={gw.id}
          className={cn(
            "rounded-xl border border-border/60 bg-secondary/50 p-4 cursor-pointer transition-all min-h-[44px] flex flex-col items-center justify-center gap-1 hover:border-primary/30",
            value === gw.id && "border-primary/60 bg-primary/10 ring-1 ring-primary/40",
            disabled && "cursor-not-allowed opacity-50"
          )}
        >
          <RadioGroupItem value={gw.id} id={gw.id} className="sr-only" />
          <span className="text-xs font-semibold text-center">{gw.label}</span>
        </label>
      ))}
    </RadioGroup>
  );
}
