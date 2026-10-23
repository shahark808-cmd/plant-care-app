"use client";

import { cn } from "@/lib/cn";
import type { ViewMode } from "@/lib/budget";
import { useLocalStorage } from "@/lib/useLocalStorage";

export function useViewMode(): [ViewMode, (m: ViewMode) => void] {
  const [raw, set] = useLocalStorage("viewMode");
  return [raw === "charge" ? "charge" : "purchase", set as (m: ViewMode) => void];
}

export function ViewModeToggle({ value, onChange }: { value: ViewMode; onChange: (m: ViewMode) => void }) {
  return (
    <div role="group" aria-label="סוג תצוגה" className="grid grid-cols-2 rounded-2xl bg-surface-2 p-1 text-sm">
      {(["purchase", "charge"] as const).map((m) => (
        <button
          key={m}
          type="button"
          aria-pressed={value === m}
          onClick={() => onChange(m)}
          className={cn("rounded-xl font-medium", value === m ? "bg-surface shadow-card" : "text-muted")}
        >
          {m === "purchase" ? "לפי קנייה" : "לפי חיוב"}
        </button>
      ))}
    </div>
  );
}
