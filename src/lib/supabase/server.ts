import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { SUPABASE_ANON_KEY, SUPABASE_URL, hasSupabaseEnv } from "./env";

/** מחזיר null אם משתני הסביבה של Supabase לא הוגדרו. */
export async function getSupabaseServer() {
  if (!hasSupabaseEnv) return null;
  const store = await cookies();
  return createServerClient(SUPABASE_URL!, SUPABASE_ANON_KEY!, {
    cookies: {
      getAll: () => store.getAll(),
      setAll(list) {
        try {
          for (const { name, value, options } of list) store.set(name, value, options);
        } catch {
          // נקרא מ-Server Component: הרענון נעשה ב-proxy
        }
      },
    },
  });
}
