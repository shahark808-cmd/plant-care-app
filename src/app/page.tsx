import { redirect } from "next/navigation";
import { SetupNotice } from "@/components/SetupNotice";
import { hasSupabaseEnv } from "@/lib/supabase/env";

export default function Index() {
  if (!hasSupabaseEnv) return <SetupNotice />;
  redirect("/home");
}
