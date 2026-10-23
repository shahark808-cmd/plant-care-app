"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useAppData } from "@/components/AppProviders";
import { ScopeToggle } from "@/components/ScopeToggle";
import { ViewModeToggle, useViewMode } from "@/components/ViewModeToggle";
import { TxRow } from "@/components/TxRow";
import { EmptyState, Skeleton } from "@/components/ui/ui";
import { effectiveDate } from "@/lib/budget";
import { formatAgorot } from "@/lib/money";
import { periodFor, toIsoDate } from "@/lib/period";
import { filterByScope, summarize, useTransactions, type Scope } from "@/lib/useTransactions";

const dateFmt = new Intl.DateTimeFormat("he-IL", { day: "numeric", month: "long" });
const shortFmt = new Intl.DateTimeFormat("he-IL", { day: "numeric", month: "short" });

function shiftPeriod(start: string, delta: number, startDay: number) {
  const d = new Date(`${start}T00:00:00`);
  d.setMonth(d.getMonth() + delta);
  return periodFor(toIsoDate(d), startDay);
}

export default function TransactionsPage() {
  const { household, userId } = useAppData();
  const startDay = household.period_start_day;
  const [period, setPeriod] = useState(() => periodFor(toIsoDate(new Date()), startDay));
  const [scope, setScope] = useState<Scope>("personal");
  const [mode, setMode] = useViewMode();
  const { data, isLoading, isError } = useTransactions(period, mode);

  const txs = useMemo(() => filterByScope(data ?? [], scope, userId), [data, scope, userId]);
  const totals = summarize(txs);
  const groups = useMemo(() => {
    const map = new Map<string, typeof txs>();
    for (const t of txs) {
      const key = effectiveDate(t, mode);
      map.set(key, [...(map.get(key) ?? []), t]);
    }
    return [...map.entries()].sort((a, b) => b[0].localeCompare(a[0]));
  }, [txs, mode]);

  return (
    <div className="space-y-4">
      <ScopeToggle value={scope} onChange={setScope} />
      <ViewModeToggle value={mode} onChange={setMode} />

      <div className="flex items-center justify-between">
        <button type="button" aria-label="תקופה קודמת" onClick={() => setPeriod(shiftPeriod(period.start, -1, startDay))} className="size-11 rounded-full bg-surface-2">
          <ChevronRight className="mx-auto" aria-hidden />
        </button>
        <div className="text-center">
          <div className="font-semibold">
            {shortFmt.format(new Date(`${period.start}T00:00:00`))} – {shortFmt.format(new Date(`${period.end}T00:00:00`))}
          </div>
          <div className="num text-sm text-muted">
            הכנסות {formatAgorot(totals.income)} · הוצאות {formatAgorot(totals.expense)}
          </div>
        </div>
        <button type="button" aria-label="תקופה הבאה" onClick={() => setPeriod(shiftPeriod(period.start, 1, startDay))} className="size-11 rounded-full bg-surface-2">
          <ChevronLeft className="mx-auto" aria-hidden />
        </button>
      </div>

      {isLoading && (
        <div className="space-y-2">
          <Skeleton /><Skeleton /><Skeleton />
        </div>
      )}
      {isError && <p role="alert" className="text-warn">לא הצלחנו לטעון את התנועות. נסו לרענן.</p>}
      {!isLoading && !isError && groups.length === 0 && (
        <EmptyState emoji="🌱" title="עוד אין תנועות בתקופה הזו" hint="לחצו על + כדי להוסיף את הראשונה. זה לוקח כמה שניות." />
      )}
      {groups.map(([date, rows]) => (
        <section key={date} className="space-y-2">
          <h2 className="text-sm font-medium text-muted">{mode === "charge" ? "יורד ב-" : ""}{dateFmt.format(new Date(`${date}T00:00:00`))}</h2>
          <ul className="space-y-2">
            {rows.map((t) => (
              <TxRow key={t.id} tx={t} />
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
