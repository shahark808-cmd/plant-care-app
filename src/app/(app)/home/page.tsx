"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import { useAppData } from "@/components/AppProviders";
import { CategoryIcon } from "@/components/CategoryIcon";
import { ScopeToggle } from "@/components/ScopeToggle";
import { ViewModeToggle, useViewMode } from "@/components/ViewModeToggle";
import { TxRow } from "@/components/TxRow";
import { Button, Card, EmptyState, Input, Skeleton } from "@/components/ui/ui";
import { dailyAllowance, daysBetween, effectiveBudgets, nextOccurrence, upcomingCharge } from "@/lib/budget";
import { formatAgorot, parseToAgorot } from "@/lib/money";
import { daysLeftInPeriod, periodFor, toIsoDate } from "@/lib/period";
import { useLocalStorage } from "@/lib/useLocalStorage";
import { getSupabaseBrowser } from "@/lib/supabase/client";
import { useBudgets, useRecurring } from "@/lib/useBudgets";
import { filterByScope, summarize, useFutureCharges, useTransactions, type Scope } from "@/lib/useTransactions";

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
  const { household, userId, categories } = useAppData();
  const startDay = household.period_start_day;
  const today = toIsoDate(new Date());
  const period = useMemo(() => periodFor(today, startDay), [today, startDay]);
  const [scope, setScope] = useState<Scope>("personal");
  const [dismissedFlag, dismissSalary] = useLocalStorage(`salaryDismissed:${period.start}`);
  const salaryDismissed = dismissedFlag === "1";
  const [mode, setMode] = useViewMode();
  const { data, isLoading, isError } = useTransactions(period, mode);
  const budgets = useBudgets(userId);
  const recurring = useRecurring();
  const future = useFutureCharges(today);

  const mine = useMemo(() => filterByScope(data ?? [], scope, userId), [data, scope, userId]);
  const { income, expense, balance } = summarize(mine);
  const ratio = income > 0 ? Math.min(1, expense / income) : 0;
  const daysLeft = daysLeftInPeriod(today, startDay);
  const hasPersonalIncome = (data ?? []).some((t) => t.owner_id === userId && t.type === "income");
  const showSalary = scope === "personal" && !isLoading && !hasPersonalIncome && !salaryDismissed;
  const recent = mine.slice(0, 5);

  const budgetMap = effectiveBudgets(budgets.data ?? [], period.start);
  const totalBudget = [...budgetMap.values()].reduce((a, b) => a + b, 0);
  const hasBudget = totalBudget > 0;
  const allowance = dailyAllowance(totalBudget, expense, daysLeft);
  const spentBy = new Map<string, number>();
  for (const t of mine) if (t.type === "expense" && t.category_id) spentBy.set(t.category_id, (spentBy.get(t.category_id) ?? 0) + t.amount);
  const budgetRows = categories.filter((c) => budgetMap.has(c.id));
  const charge = upcomingCharge(
    (future.data ?? []).filter((t) => t.owner_id === userId),
    today,
  );
  const reminders = (recurring.data ?? [])
    .filter((r) => r.active && r.is_subscription && r.type === "expense")
    .map((r) => ({ r, due: nextOccurrence(r.day_of_month, today) }))
    .map((x) => ({ ...x, days: daysBetween(today, x.due) }))
    .filter((x) => x.days >= 0 && x.days <= 3);


  return (
    <div className="space-y-4">
      <ScopeToggle value={scope} onChange={setScope} />
      <ViewModeToggle value={mode} onChange={setMode} />

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
          {scope === "personal" && hasBudget && (
            <p className="num mt-1 font-medium text-primary">
              אפשר להוציא היום עד <span dir="ltr">{formatAgorot(allowance.perDay)}</span>
            </p>
          )}
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

      {scope === "personal" && reminders.map(({ r, days }) => (
        <Card key={r.id} className="p-4 text-sm" role="status">
          🔔 {r.note || "מנוי"} מתחדש {days === 0 ? "היום" : days === 1 ? "מחר" : `בעוד ${days} ימים`} ({formatAgorot(r.amount)})
        </Card>
      ))}

      {scope === "personal" && charge && (
        <Card className="space-y-1 p-4">
          <p className="text-sm text-muted">החיוב הקרוב בכרטיס</p>
          <p className="num text-xl font-semibold" dir="ltr">{formatAgorot(charge.amount)}</p>
          <p className="text-sm text-muted">יורד מהבנק ב-{new Intl.DateTimeFormat("he-IL", { day: "numeric", month: "long" }).format(new Date(`${charge.date}T00:00:00`))}. כדאי להשאיר את הסכום בחשבון.</p>
        </Card>
      )}

      {scope === "personal" && !budgets.isLoading && !hasBudget && (
        <Card className="space-y-2 p-4">
          <p className="font-medium">רוצים לדעת כמה אפשר להוציא כל יום?</p>
          <p className="text-sm text-muted">הגדירו תקציב לקטגוריות (אפשר להתחיל מתבנית 50/30/20) ונחשב לכם אוטומטית.</p>
          <Link href="/budget" className="flex items-center font-medium text-primary">להגדרת תקציב</Link>
        </Card>
      )}

      {scope === "personal" && budgetRows.length > 0 && (
        <section className="space-y-2" aria-label="התקדמות קטגוריות">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">קטגוריות</h2>
            <Link href="/budget" className="flex items-center text-sm text-primary">לתקציב</Link>
          </div>
          <ul className="space-y-3">
            {budgetRows.map((c) => {
              const amount = budgetMap.get(c.id) ?? 0;
              const spent = spentBy.get(c.id) ?? 0;
              const ratio = amount > 0 ? spent / amount : 0;
              return (
                <li key={c.id} className="space-y-1">
                  <div className="flex items-center gap-2 text-sm">
                    <CategoryIcon name={c.icon} size={16} style={{ color: c.color }} />
                    <span className="flex-1">{c.name}</span>
                    <span className="num text-muted" dir="ltr">{formatAgorot(spent)} / {formatAgorot(amount)}</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-surface-2" role="progressbar" aria-valuenow={Math.round(ratio * 100)} aria-valuemin={0} aria-valuemax={100} aria-label={`ניצול ${c.name}`}>
                    <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(100, ratio * 100)}%`, background: ratio > 1 ? "var(--danger)" : ratio >= 0.8 ? "var(--warn)" : "var(--primary)" }} />
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      )}

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
