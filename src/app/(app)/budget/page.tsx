"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useAppData } from "@/components/AppProviders";
import { CategoryIcon } from "@/components/CategoryIcon";
import { Button, Card, Input, Skeleton } from "@/components/ui/ui";
import { BUCKET_LABEL, effectiveBudgets, split503020, type Bucket } from "@/lib/budget";
import { agorotToInput, formatAgorot, parseToAgorot } from "@/lib/money";
import { periodFor, toIsoDate } from "@/lib/period";
import { getSupabaseBrowser } from "@/lib/supabase/client";
import { useBudgets } from "@/lib/useBudgets";
import { filterByScope, summarize, useTransactions } from "@/lib/useTransactions";

function barColor(ratio: number) {
  return ratio > 1 ? "var(--danger)" : ratio >= 0.8 ? "var(--warn)" : "var(--primary)";
}

export default function BudgetPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { household, categories, userId } = useAppData();
  const period = useMemo(() => periodFor(toIsoDate(new Date()), household.period_start_day), [household.period_start_day]);
  const { data: txs, isLoading } = useTransactions(period);
  const budgets = useBudgets(userId);
  const [confirm, setConfirm] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const expenseCats = categories.filter((c) => c.kind === "expense");
  const mine = filterByScope(txs ?? [], "personal", userId);
  const income = summarize(mine).income;
  const budgetMap = effectiveBudgets(budgets.data ?? [], period.start);
  const spentBy = new Map<string, number>();
  for (const t of mine) if (t.type === "expense" && t.category_id) spentBy.set(t.category_id, (spentBy.get(t.category_id) ?? 0) + t.amount);
  const totalBudget = [...budgetMap.values()].reduce((a, b) => a + b, 0);
  const totalSpent = summarize(mine).expense;

  async function saveBudgets(entries: Record<string, number>) {
    const rows = Object.entries(entries).map(([category_id, amount]) => ({
      household_id: household.id,
      owner_id: userId,
      visibility: "private" as const,
      category_id,
      period_start: period.start,
      amount,
    }));
    const { error } = await getSupabaseBrowser().from("budgets").upsert(rows, { onConflict: "owner_id,category_id,period_start,visibility" });
    if (error) return setMessage("השמירה לא הצליחה. נסו שוב.");
    setMessage(null);
    await queryClient.invalidateQueries({ queryKey: ["budgets"] });
  }

  async function apply503020() {
    if (income <= 0) return setMessage("הוסיפו קודם את המשכורת של התקופה, ואז נחלק אותה.");
    if (!confirm) return setConfirm(true);
    setConfirm(false);
    await saveBudgets(split503020(income, expenseCats.map((c) => ({ id: c.id, bucket: c.bucket }))));
  }

  async function setBucket(id: string, bucket: Bucket | "") {
    const { error } = await getSupabaseBrowser().from("categories").update({ bucket: bucket || null }).eq("id", id);
    if (error) return setMessage("השמירה לא הצליחה. נסו שוב.");
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">תקציב</h1>

      <Card className="space-y-2">
        <div className="flex items-baseline justify-between">
          <span className="text-muted">סה״כ תקציב לתקופה</span>
          <span className="num text-xl font-semibold" dir="ltr">{formatAgorot(totalBudget)}</span>
        </div>
        <div className="flex items-baseline justify-between">
          <span className="text-muted">הוצאתם עד עכשיו</span>
          <span className="num font-semibold" dir="ltr">{formatAgorot(totalSpent)}</span>
        </div>
        <p className="text-sm text-muted">
          כל קטגוריה היא &quot;מעטפה&quot;: כמה מותר לה בתקופה, וכמה נשאר בה. התקציב ממשיך אוטומטית לתקופות הבאות עד שתשנו אותו.
        </p>
      </Card>

      <Card className="space-y-3">
        <h2 className="font-semibold">תבנית 50/30/20</h2>
        <p className="text-sm text-muted">
          50% לצרכים, 30% לרצונות ו-20% לחיסכון, לפי המשכורת בתקופה
          {income > 0 ? ` (${formatAgorot(income)})` : ""}. אפשר לשנות כל סכום אחר כך.
        </p>
        <Button onClick={apply503020} variant={confirm ? "primary" : "secondary"} className="h-12 w-full">
          {confirm ? "בטוחים? זה יחליף את התקציב של התקופה" : "החלת התבנית"}
        </Button>
      </Card>

      {message && <p role="alert" className="text-warn">{message}</p>}
      {(isLoading || budgets.isLoading) && <Skeleton />}

      <ul className="space-y-3">
        {expenseCats.map((c) => {
          const amount = budgetMap.get(c.id) ?? 0;
          const spent = spentBy.get(c.id) ?? 0;
          const ratio = amount > 0 ? spent / amount : 0;
          return (
            <li key={c.id}>
              <Card className="space-y-3 p-4">
                <div className="flex items-center gap-3">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-full text-white" style={{ background: c.color }}>
                    <CategoryIcon name={c.icon} size={18} />
                  </span>
                  <span className="flex-1 font-medium">{c.name}</span>
                  <Input
                    key={`${c.id}-${amount}`}
                    inputMode="decimal"
                    dir="ltr"
                    defaultValue={amount ? agorotToInput(amount) : ""}
                    placeholder="₪0"
                    aria-label={`תקציב ל${c.name}`}
                    className="w-28 text-center"
                    onBlur={(e) => {
                      const parsed = e.target.value.trim() === "" ? 0 : parseToAgorot(e.target.value);
                      if (parsed === null) return setMessage("הקלידו סכום תקין");
                      if (parsed !== amount) void saveBudgets({ [c.id]: parsed });
                    }}
                  />
                </div>
                {amount > 0 && (
                  <>
                    <div className="h-2 overflow-hidden rounded-full bg-surface-2" role="progressbar" aria-valuenow={Math.round(ratio * 100)} aria-valuemin={0} aria-valuemax={100} aria-label={`ניצול ${c.name}`}>
                      <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(100, ratio * 100)}%`, background: barColor(ratio) }} />
                    </div>
                    <p className="num text-sm text-muted">
                      {amount >= spent ? `נשאר ${formatAgorot(amount - spent)}` : `חרגתם ב-${formatAgorot(spent - amount)}. זה קורה, נאזן בהמשך`}
                    </p>
                  </>
                )}
                <label className="flex items-center justify-between gap-3 text-sm text-muted">
                  קבוצה לתבנית
                  <select
                    value={c.bucket ?? ""}
                    onChange={(e) => setBucket(c.id, e.target.value as Bucket | "")}
                    className="rounded-xl border border-border bg-surface px-3 text-text"
                    aria-label={`קבוצה של ${c.name}`}
                  >
                    <option value="">ללא</option>
                    {(Object.keys(BUCKET_LABEL) as Bucket[]).map((b) => (
                      <option key={b} value={b}>{BUCKET_LABEL[b]}</option>
                    ))}
                  </select>
                </label>
              </Card>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
