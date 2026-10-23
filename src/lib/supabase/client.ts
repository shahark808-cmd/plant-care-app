import { createBrowserClient } from "@supabase/ssr";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "./env";

let client: ReturnType<typeof createBrowserClient> | undefined;

export function getSupabaseBrowser() {
  client ??= createBrowserClient(SUPABASE_URL!, SUPABASE_ANON_KEY!);
  return client;
}
