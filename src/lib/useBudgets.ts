"use client";

import { useQuery } from "@tanstack/react-query";
import { getSupabaseBrowser } from "@/lib/supabase/client";
import type { Budget, RecurringRule } from "@/lib/types";

/** כל שורות התקציב הפרטי שלי (התקף לתקופה נבחר ע"י effectiveBudgets). */
export function useBudgets(userId: string) {
  return useQuery({
    queryKey: ["budgets", userId],
    queryFn: async () => {
      const { data, error } = await getSupabaseBrowser().from("budgets").select("id,category_id,period_start,amount,visibility").eq("owner_id", userId).eq("visibility", "private");
      if (error) throw new Error("טעינת התקציב נכשלה");
      return (data ?? []) as Budget[];
    },
  });
}

export function useRecurring() {
  return useQuery({
    queryKey: ["recurring"],
    queryFn: async () => {
      const { data, error } = await getSupabaseBrowser().from("recurring_rules").select("*").order("day_of_month");
      if (error) throw new Error("טעינת ההוצאות הקבועות נכשלה");
      return (data ?? []) as RecurringRule[];
    },
  });
}
