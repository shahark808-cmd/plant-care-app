"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { toIsoDate } from "@/lib/period";
import { getSupabaseBrowser } from "@/lib/supabase/client";
import type { Account, Category, Household, Profile } from "@/lib/types";

export interface AppData {
  userId: string;
  household: Household;
  categories: Category[];
  profiles: Profile[];
  accounts: Account[];
}

const AppDataContext = createContext<AppData | null>(null);

export function useAppData(): AppData {
  const ctx = useContext(AppDataContext);
  if (!ctx) throw new Error("useAppData outside provider");
  return ctx;
}

/** יוצר תנועות מהוצאות קבועות שהגיע מועדן (פעם אחת בכל טעינה, idempotent בצד השרת). */
function RecurringSync() {
  const queryClient = useQueryClient();
  useEffect(() => {
    void (async () => {
      const { data, error } = await getSupabaseBrowser().rpc("materialize_recurring", { p_today: toIsoDate(new Date()) });
      if (!error && typeof data === "number" && data > 0) await queryClient.invalidateQueries({ queryKey: ["transactions"] });
    })();
  }, [queryClient]);
  return null;
}

export function AppProviders({ data, children }: { data: AppData; children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({ defaultOptions: { queries: { staleTime: 30_000 } } }));
  return (
    <QueryClientProvider client={queryClient}>
      <AppDataContext.Provider value={data}>
        <RecurringSync />
        {children}
      </AppDataContext.Provider>
    </QueryClientProvider>
  );
}
