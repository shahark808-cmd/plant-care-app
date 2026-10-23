"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Lock, Trash2, Users } from "lucide-react";
import { useAppData } from "@/components/AppProviders";
import { CategoryIcon } from "@/components/CategoryIcon";
import { VisibilityBadge } from "@/components/VisibilityBadge";
import { Button } from "@/components/ui/ui";
import { cn } from "@/lib/cn";
import { formatAgorot } from "@/lib/money";
import { getSupabaseBrowser } from "@/lib/supabase/client";
import type { Transaction } from "@/lib/types";

export function TxRow({ tx, editable = true }: { tx: Transaction; editable?: boolean }) {
  const { categories, userId, profiles } = useAppData();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const category = categories.find((c) => c.id === tx.category_id);
  const mine = tx.owner_id === userId;
  const ownerName = profiles.find((p) => p.id === tx.owner_id)?.display_name;

  async function mutate(action: "delete" | "toggle") {
    setError(null);
    const q = getSupabaseBrowser().from("transactions");
    const { error } =
      action === "delete"
        ? await q.delete().eq("id", tx.id)
        : await q.update({ visibility: tx.visibility === "private" ? "shared" : "private" }).eq("id", tx.id);
    if (error) return setError("הפעולה לא הצליחה. נסו שוב.");
    await queryClient.invalidateQueries({ queryKey: ["transactions"] });
  }

  return (
    <li className="rounded-2xl bg-surface shadow-card">
      <button type="button" onClick={() => setOpen(!open)} aria-expanded={open} className="flex w-full items-center gap-3 p-3 text-start">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full text-white" style={{ background: category?.color ?? "#64748b" }}>
          <CategoryIcon name={category?.icon ?? "circle"} size={20} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate font-medium">{category?.name ?? "ללא קטגוריה"}</span>
          <span className="flex items-center gap-2 text-sm text-muted">
            <VisibilityBadge visibility={tx.visibility} />
            <span className="truncate">{tx.note || (!mine && ownerName) || ""}</span>
          </span>
        </span>
        <span className={cn("num font-semibold", tx.type === "income" && "text-income")} dir="ltr">
          {tx.type === "income" ? "+" : "-"}
          {formatAgorot(tx.amount)}
        </span>
      </button>
      {open && editable && mine && (
        <div className="flex gap-2 border-t border-border p-3">
          <Button variant="secondary" className="flex-1" onClick={() => mutate("toggle")}>
            {tx.visibility === "private" ? <Users size={18} aria-hidden /> : <Lock size={18} aria-hidden />}
            {tx.visibility === "private" ? "שיתוף" : "הפיכה לפרטי"}
          </Button>
          <Button variant="secondary" className="text-danger" onClick={() => mutate("delete")}>
            <Trash2 size={18} aria-hidden /> מחיקה
          </Button>
        </div>
      )}
      {open && !mine && <p className="border-t border-border p-3 text-sm text-muted">הוצאה משותפת של {ownerName ?? "בן/בת הזוג"}. רק מי שיצר/ה אותה יכול/ה לערוך.</p>}
      {error && <p role="alert" className="px-3 pb-3 text-warn">{error}</p>}
    </li>
  );
}
