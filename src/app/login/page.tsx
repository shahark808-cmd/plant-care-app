"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button, Card, Input } from "@/components/ui/ui";
import { SetupNotice } from "@/components/SetupNotice";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { getSupabaseBrowser } from "@/lib/supabase/client";

function safeNext(raw: string | null) {
  return raw && raw.startsWith("/") && !raw.startsWith("//") ? raw : "/home";
}

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = safeNext(params.get("next"));
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(params.get("error") ? "הקישור לא תקף יותר. נסו לשלוח שוב." : null);

  async function sendLink(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const { error } = await getSupabaseBrowser().auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: `${location.origin}/auth/callback?next=${encodeURIComponent(next)}` },
    });
    setBusy(false);
    if (error) setError("לא הצלחנו לשלוח מייל. בדקו את הכתובת ונסו שוב.");
    else setSent(true);
  }

  async function verify(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const { error } = await getSupabaseBrowser().auth.verifyOtp({ email: email.trim(), token: code.trim(), type: "email" });
    setBusy(false);
    if (error) return setError("הקוד לא נכון או שפג תוקפו.");
    router.replace(next);
    router.refresh();
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-md items-center p-4">
      <Card className="w-full space-y-5">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold">התקציב שלנו</h1>
          <p className="text-muted">כסף משותף, פרטיות מלאה. נכנסים עם מייל, בלי סיסמה.</p>
        </div>

        {!sent ? (
          <form onSubmit={sendLink} className="space-y-3">
            <label className="block space-y-1">
              <span className="text-sm text-muted">כתובת מייל</span>
              <Input type="email" dir="ltr" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
            </label>
            <Button type="submit" disabled={busy} className="h-12 w-full">שלחו לי קישור כניסה</Button>
          </form>
        ) : (
          <form onSubmit={verify} className="space-y-3">
            <p>שלחנו מייל ל-<span dir="ltr">{email}</span>. לחצו על הקישור, או הקלידו כאן את הקוד שבמייל (נוח כשהאפליקציה מותקנת על המסך).</p>
            <Input inputMode="numeric" dir="ltr" autoComplete="one-time-code" value={code} onChange={(e) => setCode(e.target.value)} placeholder="קוד מהמייל" aria-label="קוד מהמייל" />
            <Button type="submit" disabled={busy || code.trim().length < 6} className="h-12 w-full">כניסה עם קוד</Button>
            <Button type="button" variant="ghost" onClick={() => setSent(false)} className="w-full">שליחה מחדש</Button>
          </form>
        )}

        {error && <p role="alert" className="text-warn">{error}</p>}
      </Card>
    </main>
  );
}

export default function LoginPage() {
  if (!hasSupabaseEnv) return <SetupNotice />;
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
