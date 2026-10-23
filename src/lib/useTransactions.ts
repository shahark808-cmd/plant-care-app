"use client";

import { useQuery } from "@tanstack/react-query";
import { getSupabaseBrowser } from "@/lib/supabase/client";
import type { Period } from "@/lib/period";
import type { ViewMode } from "@/lib/budget";
import type { Transaction } from "@/lib/types";

/** purchase: לפי תאריך קנייה. charge: לפי תאריך חיוב (charge_date, ובהיעדרו date). */
export function useTransactions(period: Period, mode: ViewMode = "purchase") {
  return useQuery({
    queryKey: ["transactions", mode, period.start, period.end],
    queryFn: async () => {
      let q = getSupabaseBrowser().from("transactions").select("*");
      q =
        mode === "purchase"
          ? q.gte("date", period.start).lte("date", period.end)
          : q.or(
              `and(charge_date.gte.${period.start},charge_date.lte.${period.end}),and(charge_date.is.null,date.gte.${period.start},date.lte.${period.end})`,
            );
      const { data, error } = await q.order("date", { ascending: false }).order("created_at", { ascending: false });
      if (error) throw new Error("טעינת התנועות נכשלה");
      return (data ?? []) as Transaction[];
    },
  });
}

/** כל ההוצאות עם תאריך חיוב עתידי (לכרטיס "החיוב הקרוב"). */
export function useFutureCharges(today: string) {
  return useQuery({
    queryKey: ["transactions", "future-charges", today],
    queryFn: async () => {
      const { data, error } = await getSupabaseBrowser()
        .from("transactions")
        .select("amount,type,charge_date,owner_id")
        .gte("charge_date", today);
      if (error) throw new Error("טעינת החיובים נכשלה");
      return (data ?? []) as Pick<Transaction, "amount" | "type" | "charge_date" | "owner_id">[];
    },
  });
}

export type Scope = "personal" | "shared";

/** אישי: כל מה שלי (פרטי + משותף ששילמתי/יצרתי). משותף: רק שורות shared משני הצדדים. */
export function filterByScope<T extends Pick<Transaction, "owner_id" | "visibility">>(txs: T[], scope: Scope, userId: string) {
  return scope === "personal" ? txs.filter((t) => t.owner_id === userId) : txs.filter((t) => t.visibility === "shared");
}

export function summarize(txs: Pick<Transaction, "type" | "amount">[]) {
  let income = 0;
  let expense = 0;
  for (const t of txs) (t.type === "income" ? (income += t.amount) : (expense += t.amount));
  return { income, expense, balance: income - expense };
}
