"use client";

import { createContext, useContext, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { Category, Household, Profile } from "@/lib/types";

export interface AppData {
  userId: string;
  household: Household;
  categories: Category[];
  profiles: Profile[];
}

const AppDataContext = createContext<AppData | null>(null);

export function useAppData(): AppData {
  const ctx = useContext(AppDataContext);
  if (!ctx) throw new Error("useAppData outside provider");
  return ctx;
}

export function AppProviders({ data, children }: { data: AppData; children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({ defaultOptions: { queries: { staleTime: 30_000 } } }));
  return (
    <QueryClientProvider client={queryClient}>
      <AppDataContext.Provider value={data}>{children}</AppDataContext.Provider>
    </QueryClientProvider>
  );
}
