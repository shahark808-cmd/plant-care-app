"use client";

import { cn } from "@/lib/cn";
import type { Scope } from "@/lib/useTransactions";

export function ScopeToggle({ value, onChange }: { value: Scope; onChange: (s: Scope) => void }) {
  return (
    <div role="group" aria-label="תצוגה" className="grid grid-cols-2 rounded-2xl bg-surface-2 p-1">
      {(["personal", "shared"] as const).map((s) => (
        <button
          key={s}
          type="button"
          aria-pressed={value === s}
          onClick={() => onChange(s)}
          className={cn("rounded-xl text-sm font-medium", value === s ? "bg-surface shadow-card" : "text-muted")}
        >
          {s === "personal" ? "אישי" : "משותף"}
        </button>
      ))}
    </div>
  );
}
