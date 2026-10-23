import { redirect } from "next/navigation";
import { AppProviders } from "@/components/AppProviders";
import { BottomNav } from "@/components/BottomNav";
import { SetupNotice } from "@/components/SetupNotice";
import { getSupabaseServer } from "@/lib/supabase/server";
import type { Account, Category, Household, Profile } from "@/lib/types";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await getSupabaseServer();
  if (!supabase) return <SetupNotice />;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: member } = await supabase.from("household_members").select("household_id").maybeSingle();
  if (!member) redirect("/onboarding");

  const [household, categories, profiles, accounts] = await Promise.all([
    supabase.from("households").select("id,name,period_start_day,invite_code").eq("id", member.household_id).single(),
    supabase.from("categories").select("*").eq("household_id", member.household_id).eq("archived", false).order("sort_order"),
    supabase.from("profiles").select("id,display_name"),
    supabase.from("accounts").select("*").order("created_at"),
  ]);
  if (!household.data) redirect("/onboarding");

  return (
    <AppProviders
      data={{
        userId: user.id,
        household: household.data as Household,
        categories: (categories.data ?? []) as Category[],
        profiles: (profiles.data ?? []) as Profile[],
        accounts: (accounts.data ?? []) as Account[],
      }}
    >
      <main className="mx-auto max-w-md px-4 pb-28 pt-4">{children}</main>
      <BottomNav />
    </AppProviders>
  );
}
