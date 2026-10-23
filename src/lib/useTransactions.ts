"use client";

import { useQuery } from "@tanstack/react-query";
import { getSupabaseBrowser } from "@/lib/supabase/client";
import type { Period } from "@/lib/period";
import type { Transaction } from "@/lib/types";

export function useTransactions(period: Period) {
  return useQuery({
    queryKey: ["transactions", period.start, period.end],
    queryFn: async () => {
      const { data, error } = await getSupabaseBrowser()
        .from("transactions")
        .select("*")
        .gte("date", period.start)
        .lte("date", period.end)
        .order("date", { ascending: false })
        .order("created_at", { ascending: false });
      if (error) throw new Error("טעינת התנועות נכשלה");
      return (data ?? []) as Transaction[];
    },
  });
}

export type Scope = "personal" | "shared";

/** אישי: כל מה שלי (פרטי + משותף ששילמתי/יצרתי). משותף: רק שורות shared משני הצדדים. */
export function filterByScope(txs: Transaction[], scope: Scope, userId: string) {
  return scope === "personal" ? txs.filter((t) => t.owner_id === userId) : txs.filter((t) => t.visibility === "shared");
}

export function summarize(txs: Transaction[]) {
  let income = 0;
  let expense = 0;
  for (const t of txs) (t.type === "income" ? (income += t.amount) : (expense += t.amount));
  return { income, expense, balance: income - expense };
}
