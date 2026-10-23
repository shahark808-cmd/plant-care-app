"use client";

import { useMemo } from "react";
import { Users } from "lucide-react";
import { useAppData } from "@/components/AppProviders";
import { TxRow } from "@/components/TxRow";
import { EmptyState, Skeleton } from "@/components/ui/ui";
import { formatAgorot } from "@/lib/money";
import { periodFor, toIsoDate } from "@/lib/period";
import { filterByScope, summarize, useTransactions } from "@/lib/useTransactions";

export default function SharedPage() {
  const { household, userId } = useAppData();
  const period = useMemo(() => periodFor(toIsoDate(new Date()), household.period_start_day), [household.period_start_day]);
  const { data, isLoading } = useTransactions(period);
  const shared = filterByScope(data ?? [], "shared", userId);
  const total = summarize(shared).expense;

  return (
    <div className="space-y-4">
      <h1 className="flex items-center gap-2 text-2xl font-bold">
        <Users aria-hidden /> משותף
      </h1>
      <div className="rounded-3xl bg-surface p-5 shadow-card">
        <p className="text-muted">הוצאות משותפות בתקופה</p>
        <p className="num text-3xl font-bold" dir="ltr">{formatAgorot(total)}</p>
        <p className="mt-2 text-sm text-muted">מאזן התחשבנות ויעדי חיסכון משותפים יגיעו בשלב הבא.</p>
      </div>
      {isLoading && <Skeleton />}
      {!isLoading && shared.length === 0 && (
        <EmptyState emoji="🤝" title="עוד לא שיתפתם הוצאות" hint="בהוספת הוצאה אפשר לסמן אותה כ״משותף״. רק היא תיראה לבן/בת הזוג." />
      )}
      <ul className="space-y-2">
        {shared.map((t) => (
          <TxRow key={t.id} tx={t} />
        ))}
      </ul>
    </div>
  );
}
