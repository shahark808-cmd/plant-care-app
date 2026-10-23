"use client";

import { Money } from "@/components/Money";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { Check, ChevronDown, Lock, Users } from "lucide-react";
import { useAppData } from "@/components/AppProviders";
import { installmentPlan, nextChargeDate } from "@/lib/budget";
import { CategoryIcon } from "@/components/CategoryIcon";
import { NumPad } from "@/components/NumPad";
import { Button, Input } from "@/components/ui/ui";
import { cn } from "@/lib/cn";
import { formatAgorot, parseToAgorot } from "@/lib/money";
import { toIsoDate } from "@/lib/period";
import { useLocalStorage } from "@/lib/useLocalStorage";
import { getSupabaseBrowser } from "@/lib/supabase/client";
import type { TxType, Visibility } from "@/lib/types";

const LAST_CAT_KEY = "lastCategory";

export default function AddPage() {
  const { household, categories, userId, accounts } = useAppData();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [type, setType] = useState<TxType>("expense");
  const [amount, setAmount] = useState("");
  const [chosenCategory, setCategoryId] = useState<string | null>(null);
  const [visibility, setVisibility] = useState<Visibility>("private");
  const [date, setDate] = useState(() => toIsoDate(new Date()));
  const [note, setNote] = useState("");
  const [accountId, setAccountId] = useState<string | null>(null);
  const [installments, setInstallments] = useState("1");
  const [more, setMore] = useState(false);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const list = useMemo(() => categories.filter((c) => c.kind === type), [categories, type]);

  const [lastCategory, rememberCategory] = useLocalStorage(`${LAST_CAT_KEY}:${type}`);
  const categoryId = list.find((c) => c.id === chosenCategory)?.id ?? list.find((c) => c.id === lastCategory)?.id ?? list[0]?.id ?? null;

  const agorot = parseToAgorot(amount.replace(/\.$/, ""));

  async function save() {
    if (!agorot || agorot <= 0) return setError("הקלידו סכום");
    setBusy(true);
    setError(null);
    const account = accounts.find((a) => a.id === accountId);
    const card = account?.kind === "credit_card" ? (account.charge_day ?? 2) : null;
    const count = type === "expense" ? Math.min(36, Math.max(1, Math.trunc(Number(installments) || 1))) : 1;
    const base = {
      household_id: household.id,
      owner_id: userId,
      paid_by: userId,
      type,
      category_id: categoryId,
      account_id: accountId,
      visibility,
      note: note.trim() || null,
    };
    const rows =
      count > 1
        ? installmentPlan(agorot, count, date, card).map((p) => ({
            ...base,
            amount: p.amount,
            date: p.date,
            charge_date: p.chargeDate,
            installment_index: p.index,
            installments_total: count,
          }))
        : [{ ...base, amount: agorot, date, charge_date: card === null ? null : nextChargeDate(date, card) }];
    const { error } = await getSupabaseBrowser().from("transactions").insert(rows);
    setBusy(false);
    if (error) return setError("השמירה לא הצליחה. נסו שוב.");
    if (categoryId) rememberCategory(categoryId);
    navigator.vibrate?.([12, 40, 12]);
    await queryClient.invalidateQueries({ queryKey: ["transactions"] });
    setDone(true);
    setTimeout(() => router.replace("/home"), 650);
  }

  if (done) {
    return (
      <div className="flex min-h-[60dvh] flex-col items-center justify-center gap-3" role="status">
        <div className="pop flex size-20 items-center justify-center rounded-full bg-primary text-primary-fg">
          <Check size={44} aria-hidden />
        </div>
        <p className="text-lg font-medium">נרשם!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div role="group" aria-label="סוג תנועה" className="inline-flex rounded-2xl bg-surface-2 p-1">
          {(["expense", "income"] as const).map((t) => (
            <button
              key={t}
              type="button"
              aria-pressed={type === t}
              onClick={() => setType(t)}
              className={cn("rounded-xl px-4 text-sm font-medium", type === t ? "bg-surface shadow-card" : "text-muted")}
            >
              {t === "expense" ? "הוצאה" : "הכנסה"}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setVisibility(visibility === "private" ? "shared" : "private")}
          aria-pressed={visibility === "shared"}
          className={cn(
            "inline-flex items-center gap-2 rounded-2xl px-4 text-sm font-medium",
            visibility === "shared" ? "bg-primary text-primary-fg" : "bg-surface-2",
          )}
        >
          {visibility === "shared" ? <Users size={18} aria-hidden /> : <Lock size={18} aria-hidden />}
          {visibility === "shared" ? "משותף" : "פרטי"}
        </button>
      </div>

      <div className="py-2 text-center" aria-live="polite">
        <div className={cn("num text-5xl font-bold", type === "income" && "text-income")} dir="ltr">
          {agorot === null || amount === "" ? "₪0" : formatAgorot(agorot)}
          {amount.endsWith(".") && "."}
        </div>
      </div>

      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1" role="radiogroup" aria-label="קטגוריה">
        {list.map((c) => {
          const active = c.id === categoryId;
          return (
            <button
              key={c.id}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => setCategoryId(c.id)}
              className={cn("flex shrink-0 items-center gap-2 rounded-full border px-4 text-sm", active ? "border-transparent text-white" : "border-border bg-surface")}
              style={active ? { background: c.color } : undefined}
            >
              <CategoryIcon name={c.icon} size={18} style={active ? undefined : { color: c.color }} />
              {c.name}
            </button>
          );
        })}
      </div>

      <button type="button" onClick={() => setMore(!more)} aria-expanded={more} className="flex items-center gap-1 text-sm text-primary">
        עוד פרטים <ChevronDown size={16} className={cn("transition", more && "rotate-180")} aria-hidden />
      </button>
      {more && (
        <div className="grid gap-3">
          <label className="space-y-1">
            <span className="text-sm text-muted">תאריך</span>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </label>
          {accounts.length > 0 && (
            <div className="space-y-1">
              <span className="text-sm text-muted">אמצעי תשלום</span>
              <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="אמצעי תשלום">
                {[{ id: null as string | null, name: "ללא" }, ...accounts].map((a) => (
                  <button
                    key={a.id ?? "none"}
                    type="button"
                    role="radio"
                    aria-checked={accountId === a.id}
                    onClick={() => setAccountId(a.id)}
                    className={cn("rounded-full border px-4 text-sm", accountId === a.id ? "border-transparent bg-primary text-primary-fg" : "border-border bg-surface")}
                  >
                    {a.name}
                  </button>
                ))}
              </div>
            </div>
          )}
          {type === "expense" && (
            <label className="space-y-1">
              <span className="text-sm text-muted">מספר תשלומים</span>
              <Input type="number" inputMode="numeric" min={1} max={36} value={installments} onChange={(e) => setInstallments(e.target.value)} />
              {Number(installments) > 1 && agorot ? (
                <span className="num block text-sm text-muted">{Math.trunc(Number(installments))} תשלומים של כ-<Money agorot={Math.floor(agorot / Math.trunc(Number(installments)))} />, אחד בכל חודש</span>
              ) : null}
            </label>
          )}
          <label className="space-y-1">
            <span className="text-sm text-muted">הערה</span>
            <Input value={note} onChange={(e) => setNote(e.target.value)} maxLength={140} />
          </label>
        </div>
      )}

      <NumPad value={amount} onChange={setAmount} />
      {error && <p role="alert" className="text-warn">{error}</p>}
      <Button onClick={save} disabled={busy || !agorot} className="h-14 w-full text-lg">
        הוסף
      </Button>
    </div>
  );
}
