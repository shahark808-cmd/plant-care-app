"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import { useAppData } from "@/components/AppProviders";
import { ScopeToggle } from "@/components/ScopeToggle";
import { TxRow } from "@/components/TxRow";
import { Button, Card, EmptyState, Input, Skeleton } from "@/components/ui/ui";
import { formatAgorot, parseToAgorot } from "@/lib/money";
import { daysLeftInPeriod, periodFor, toIsoDate } from "@/lib/period";
import { useLocalStorage } from "@/lib/useLocalStorage";
import { getSupabaseBrowser } from "@/lib/supabase/client";
import { filterByScope, summarize, useTransactions, type Scope } from "@/lib/useTransactions";

const RING = 2 * Math.PI * 52;

function SalaryCard({ onDone }: { onDone: () => void }) {
  const { household, categories, userId } = useAppData();
  const queryClient = useQueryClient();
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const salary = categories.find((c) => c.kind === "income" && c.name === "משכורת") ?? categories.find((c) => c.kind === "income");

  async function save() {
    const agorot = parseToAgorot(value);
    if (!agorot) return setError("הקלידו סכום תקין");
    setBusy(true);
    const { error } = await getSupabaseBrowser().from("transactions").insert({
      household_id: household.id,
      owner_id: userId,
      paid_by: userId,
      amount: agorot,
      type: "income",
      category_id: salary?.id ?? null,
      visibility: "private",
      note: "משכורת",
    });
    setBusy(false);
    if (error) return setError("השמירה לא הצליחה. נסו שוב.");
    await queryClient.invalidateQueries({ queryKey: ["transactions"] });
  }

  return (
    <Card className="space-y-3 border border-primary/30">
      <h2 className="text-lg font-semibold">נכנסה המשכורת? כמה? 💸</h2>
      <p className="text-sm text-muted">נשתמש בסכום כדי לחשב כמה נשאר לתקופה. הסכום פרטי.</p>
      <div className="flex gap-2">
        <Input inputMode="decimal" dir="ltr" value={value} onChange={(e) => setValue(e.target.value)} placeholder="₪" aria-label="סכום המשכורת" />
        <Button onClick={save} disabled={busy} className="h-11 shrink-0">שמירה</Button>
      </div>
      {error && <p role="alert" className="text-warn">{error}</p>}
      <Button variant="ghost" onClick={onDone} className="w-full">אחר כך</Button>
    </Card>
  );
}

export default function HomePage() {
  const { household, userId } = useAppData();
  const startDay = household.period_start_day;
  const today = toIsoDate(new Date());
  const period = useMemo(() => periodFor(today, startDay), [today, startDay]);
  const [scope, setScope] = useState<Scope>("personal");
  const [dismissedFlag, dismissSalary] = useLocalStorage(`salaryDismissed:${period.start}`);
  const salaryDismissed = dismissedFlag === "1";
  const { data, isLoading, isError } = useTransactions(period);

  const mine = useMemo(() => filterByScope(data ?? [], scope, userId), [data, scope, userId]);
  const { income, expense, balance } = summarize(mine);
  const ratio = income > 0 ? Math.min(1, expense / income) : 0;
  const daysLeft = daysLeftInPeriod(today, startDay);
  const hasPersonalIncome = (data ?? []).some((t) => t.owner_id === userId && t.type === "income");
  const showSalary = scope === "personal" && !isLoading && !hasPersonalIncome && !salaryDismissed;
  const recent = mine.slice(0, 5);

  return (
    <div className="space-y-4">
      <ScopeToggle value={scope} onChange={setScope} />

      {showSalary && (
        <SalaryCard
          onDone={() => dismissSalary("1")}
        />
      )}

      <Card className="flex items-center gap-5">
        <svg viewBox="0 0 120 120" className="size-28 shrink-0 -rotate-90" role="img" aria-label={`נוצל ${Math.round(ratio * 100)}% מההכנסות`}>
          <circle cx="60" cy="60" r="52" fill="none" stroke="var(--surface-2)" strokeWidth="12" />
          <circle
            cx="60" cy="60" r="52" fill="none" strokeWidth="12" strokeLinecap="round"
            stroke={ratio >= 1 ? "var(--danger)" : ratio >= 0.8 ? "var(--warn)" : "var(--primary)"}
            strokeDasharray={RING} strokeDashoffset={RING * (1 - ratio)}
            style={{ transition: "stroke-dashoffset 0.8s ease-out" }}
          />
        </svg>
        <div className="min-w-0">
          <p className="text-muted">{scope === "personal" ? "נשאר לך החודש" : "משותף: נטו בתקופה"}</p>
          {isLoading ? <Skeleton className="mt-1 h-10 w-36" /> : <p className="num text-3xl font-bold" dir="ltr">{formatAgorot(balance)}</p>}
          <p className="text-sm text-muted">{daysLeft === 1 ? "היום האחרון בתקופה" : `${daysLeft} ימים עד סוף התקופה`}</p>
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-3">
        <Card className="p-4">
          <p className="text-sm text-muted">הכנסות</p>
          <p className="num text-xl font-semibold text-income" dir="ltr">{formatAgorot(income)}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted">הוצאות</p>
          <p className="num text-xl font-semibold" dir="ltr">{formatAgorot(expense)}</p>
        </Card>
      </div>

      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">תנועות אחרונות</h2>
          <Link href="/transactions" className="flex items-center text-sm text-primary">הכל</Link>
        </div>
        {isLoading && <Skeleton />}
        {isError && <p role="alert" className="text-warn">לא הצלחנו לטעון את הנתונים. נסו לרענן.</p>}
        {!isLoading && !isError && recent.length === 0 && (
          <EmptyState emoji="✨" title="מתחילים מכאן" hint="הוסיפו הוצאה ראשונה עם הכפתור + שבתחתית המסך." />
        )}
        <ul className="space-y-2">
          {recent.map((t) => (
            <TxRow key={t.id} tx={t} />
          ))}
        </ul>
      </section>
    </div>
  );
}
