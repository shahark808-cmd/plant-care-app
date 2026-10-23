"use client";

import { Delete } from "lucide-react";

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", ".", "0", "back"] as const;

/** מקלדת מספרים גדולה. הערך נשמר כמחרוזת (עד 2 ספרות אחרי הנקודה). */
export function NumPad({ value, onChange }: { value: string; onChange: (next: string) => void }) {
  function press(key: (typeof KEYS)[number]) {
    navigator.vibrate?.(8);
    if (key === "back") return onChange(value.slice(0, -1));
    if (key === ".") {
      if (value.includes(".")) return;
      return onChange(value === "" ? "0." : value + ".");
    }
    const [whole = "", frac] = value.split(".");
    if (frac !== undefined && frac.length >= 2) return;
    if (frac === undefined && whole.length >= 7) return;
    if (value === "0") return onChange(key);
    onChange(value + key);
  }

  return (
    <div dir="ltr" className="grid grid-cols-3 gap-2">
      {KEYS.map((key) => (
        <button
          key={key}
          type="button"
          onClick={() => press(key)}
          aria-label={key === "back" ? "מחיקה" : key === "." ? "נקודה עשרונית" : key}
          className="num flex h-16 items-center justify-center rounded-2xl bg-surface text-2xl font-medium shadow-card active:bg-surface-2"
        >
          {key === "back" ? <Delete aria-hidden /> : key}
        </button>
      ))}
    </div>
  );
}
