"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button, Card, Input } from "@/components/ui/ui";
import { getSupabaseBrowser } from "@/lib/supabase/client";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { SetupNotice } from "@/components/SetupNotice";

function Onboarding() {
  const router = useRouter();
  const params = useSearchParams();
  const [name, setName] = useState("");
  const [code, setCode] = useState(params.get("code") ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run(fn: () => PromiseLike<{ error: { message: string } | null }>) {
    setBusy(true);
    setError(null);
    const { error } = await fn();
    setBusy(false);
    if (error) {
      setError(
        error.message.includes("full") ? "משק הבית הזה כבר מלא (שני אנשים)."
        : error.message.includes("invalid") ? "קוד ההזמנה לא נמצא. בדקו שהעתקתם אותו נכון."
        : error.message.includes("already") ? "אתם כבר חלק ממשק בית."
        : "משהו השתבש. נסו שוב.",
      );
      return;
    }
    router.replace("/home");
    router.refresh();
  }

  return (
    <main className="mx-auto min-h-dvh max-w-md space-y-4 p-4">
      <h1 className="pt-6 text-2xl font-bold">נתחיל?</h1>
      <p className="text-muted">משק בית הוא המקום המשותף שלכם. הכל פרטי עד שתסמנו אחרת.</p>

      <Card className="space-y-3">
        <h2 className="text-lg font-semibold">יצירת משק בית חדש</h2>
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="משק הבית (שם אופציונלי)" aria-label="שם משק הבית" />
        <Button disabled={busy} className="h-12 w-full" onClick={() => run(() => getSupabaseBrowser().rpc("create_household", { p_name: name || "משק הבית" }))}>
          יצירה
        </Button>
        <p className="text-sm text-muted">אחרי היצירה תקבלו קוד הזמנה לבן/בת הזוג במסך &quot;עוד&quot;.</p>
      </Card>

      <Card className="space-y-3">
        <h2 className="text-lg font-semibold">יש לי קוד הזמנה</h2>
        <Input dir="ltr" value={code} onChange={(e) => setCode(e.target.value)} placeholder="ABCD1234" aria-label="קוד הזמנה" autoCapitalize="characters" />
        <Button variant="secondary" disabled={busy || code.trim().length < 4} className="h-12 w-full" onClick={() => run(() => getSupabaseBrowser().rpc("join_household", { p_code: code }))}>
          הצטרפות
        </Button>
      </Card>

      {error && <p role="alert" className="text-warn">{error}</p>}
    </main>
  );
}

export default function OnboardingPage() {
  if (!hasSupabaseEnv) return <SetupNotice />;
  return (
    <Suspense>
      <Onboarding />
    </Suspense>
  );
}
