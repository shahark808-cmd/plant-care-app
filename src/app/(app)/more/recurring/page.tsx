"use client";

import { Money } from "@/components/Money";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Lock, Repeat, Trash2, Users } from "lucide-react";
import { useAppData } from "@/components/AppProviders";
import { Button, Card, EmptyState, Input, Skeleton } from "@/components/ui/ui";
import { cn } from "@/lib/cn";
import { formatAgorot, parseToAgorot } from "@/lib/money";
import { getSupabaseBrowser } from "@/lib/supabase/client";
import { useRecurring } from "@/lib/useBudgets";
import type { TxType, Visibility } from "@/lib/types";

export default function RecurringPage() {
  const queryClient = useQueryClient();
  const { household, categories, accounts, userId } = useAppData();
  const { data, isLoading } = useRecurring();
  const [type, setType] = useState<TxType>("expense");
  const [amount, setAmount] = useState("");
  const [day, setDay] = useState("1");
  const [note, setNote] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [accountId, setAccountId] = useState("");
  const [subscription, setSubscription] = useState(false);
  const [visibility, setVisibility] = useState<Visibility>("private");
  const [message, setMessage] = useState<string | null>(null);

  const refresh = () => queryClient.invalidateQueries({ queryKey: ["recurring"] });
  const cats = categories.filter((c) => c.kind === type);

  async function add() {
    const agorot = parseToAgorot(amount);
    const d = Number(day);
    if (!agorot) return setMessage("הקלידו סכום");
    if (!Number.isInteger(d) || d < 1 || d > 31) return setMessage("היום בחודש צריך להיות בין 1 ל-31");
    const { error } = await getSupabaseBrowser().from("recurring_rules").insert({
      household_id: household.id,
      owner_id: userId,
      visibility,
      category_id: categoryId || null,
      account_id: accountId || null,
      amount: agorot,
      type,
      day_of_month: d,
      note: note.trim() || null,
      is_subscription: subscription,
    });
    if (error) return setMessage("ההוספה לא הצליחה. נסו שוב.");
    setAmount("");
    setNote("");
    setMessage("נוסף. ההוצאה תירשם אוטומטית בכל חודש ביום שבחרתם");
    await refresh();
  }

  async function toggle(id: string, active: boolean) {
    await getSupabaseBrowser().from("recurring_rules").update({ active: !active }).eq("id", id);
    await refresh();
  }

  async function remove(id: string) {
    await getSupabaseBrowser().from("recurring_rules").delete().eq("id", id);
    await refresh();
  }

  const mine = (data ?? []).filter((r) => r.owner_id === userId);

  return (
    <div className="space-y-4">
      <h1 className="flex items-center gap-2 text-2xl font-bold"><Repeat aria-hidden /> הוצאות קבועות</h1>
      <p className="text-muted">שכירות, ביטוחים, מנויים. הן נרשמות לבד ביום שבחרתם, ואין צורך להקליד כל חודש.</p>

      {isLoading && <Skeleton />}
      {!isLoading && mine.length === 0 && <EmptyState emoji="🔁" title="עוד אין הוצאות קבועות" hint="הוסיפו את הראשונה למטה." />}
      <ul className="space-y-2">
        {mine.map((r) => {
          const cat = categories.find((c) => c.id === r.category_id);
          return (
            <li key={r.id}>
              <Card className={cn("flex items-center gap-3 p-4", !r.active && "opacity-60")}>
                {r.visibility === "shared" ? <Users size={16} aria-label="משותף" /> : <Lock size={16} aria-label="פרטי" />}
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{r.note || cat?.name || "הוצאה קבועה"}{r.is_subscription ? " · מנוי" : ""}</p>
                  <p className="num text-sm text-muted">ב-{r.day_of_month} לחודש · {r.type === "income" ? "+" : ""}<Money agorot={r.amount} /></p>
                </div>
                <Button variant="secondary" onClick={() => toggle(r.id, r.active)} className="px-3 text-sm">{r.active ? "השהיה" : "הפעלה"}</Button>
                <Button variant="ghost" aria-label="מחיקה" onClick={() => remove(r.id)} className="text-danger"><Trash2 size={18} aria-hidden /></Button>
              </Card>
            </li>
          );
        })}
      </ul>

      <Card className="space-y-3">
        <h2 className="font-semibold">הוספה</h2>
        <div role="group" aria-label="סוג" className="grid grid-cols-2 rounded-2xl bg-surface-2 p-1 text-sm">
          {(["expense", "income"] as const).map((t) => (
            <button key={t} type="button" aria-pressed={type === t} onClick={() => { setType(t); setCategoryId(""); }}
              className={cn("rounded-xl font-medium", type === t ? "bg-surface shadow-card" : "text-muted")}>
              {t === "expense" ? "הוצאה" : "הכנסה"}
            </button>
          ))}
        </div>
        <Input inputMode="decimal" dir="ltr" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="סכום ₪" aria-label="סכום" />
        <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="שם (למשל: שכירות, נטפליקס)" aria-label="שם" />
        <div className="grid grid-cols-2 gap-2">
          <label className="space-y-1 text-sm text-muted">
            יום בחודש
            <Input type="number" inputMode="numeric" min={1} max={31} value={day} onChange={(e) => setDay(e.target.value)} />
          </label>
          <label className="space-y-1 text-sm text-muted">
            קטגוריה
            <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="w-full rounded-2xl border border-border bg-surface px-3 text-text">
              <option value="">ללא</option>
              {cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </label>
        </div>
        {accounts.length > 0 && (
          <label className="space-y-1 text-sm text-muted">
            אמצעי תשלום
            <select value={accountId} onChange={(e) => setAccountId(e.target.value)} className="w-full rounded-2xl border border-border bg-surface px-3 text-text">
              <option value="">ללא</option>
              {accounts.filter((a) => a.owner_id === userId).map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </label>
        )}
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={subscription} onChange={(e) => setSubscription(e.target.checked)} className="size-5" />
          מנוי (אזכיר 3 ימים לפני החידוש)
        </label>
        <button type="button" onClick={() => setVisibility(visibility === "private" ? "shared" : "private")} aria-pressed={visibility === "shared"}
          className={cn("inline-flex w-full items-center justify-center gap-2 rounded-2xl text-sm font-medium", visibility === "shared" ? "bg-primary text-primary-fg" : "bg-surface-2")}>
          {visibility === "shared" ? <Users size={18} aria-hidden /> : <Lock size={18} aria-hidden />}
          {visibility === "shared" ? "משותף" : "פרטי"}
        </button>
        <Button onClick={add} className="h-12 w-full">הוספה</Button>
      </Card>
      {message && <p role="status" className="text-center text-muted">{message}</p>}
    </div>
  );
}
