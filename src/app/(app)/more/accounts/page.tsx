"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Banknote, CreditCard, Landmark, Trash2 } from "lucide-react";
import { useAppData } from "@/components/AppProviders";
import { Button, Card, EmptyState, Input } from "@/components/ui/ui";
import { cn } from "@/lib/cn";
import { getSupabaseBrowser } from "@/lib/supabase/client";
import type { Account } from "@/lib/types";

const KINDS = [
  { key: "credit_card", label: "כרטיס אשראי", Icon: CreditCard },
  { key: "bank", label: "בנק", Icon: Landmark },
  { key: "cash", label: "מזומן", Icon: Banknote },
] as const;

export default function AccountsPage() {
  const router = useRouter();
  const { household, accounts, userId } = useAppData();
  const mine = accounts.filter((a) => a.owner_id === userId);
  const [name, setName] = useState("");
  const [kind, setKind] = useState<Account["kind"]>("credit_card");
  const [chargeDay, setChargeDay] = useState("2");
  const [message, setMessage] = useState<string | null>(null);

  async function add() {
    if (!name.trim()) return setMessage("תנו שם לאמצעי התשלום");
    const day = Number(chargeDay);
    if (kind === "credit_card" && (!Number.isInteger(day) || day < 1 || day > 31)) return setMessage("יום החיוב צריך להיות בין 1 ל-31");
    const { error } = await getSupabaseBrowser().from("accounts").insert({
      household_id: household.id,
      owner_id: userId,
      name: name.trim(),
      kind,
      charge_day: kind === "credit_card" ? day : null,
    });
    if (error) return setMessage("ההוספה לא הצליחה. נסו שוב.");
    setName("");
    setMessage(null);
    router.refresh();
  }

  async function updateChargeDay(id: string, value: string) {
    const day = Number(value);
    if (!Number.isInteger(day) || day < 1 || day > 31) return setMessage("יום החיוב צריך להיות בין 1 ל-31");
    const { error } = await getSupabaseBrowser().from("accounts").update({ charge_day: day }).eq("id", id);
    setMessage(error ? "השמירה לא הצליחה" : "נשמר");
    router.refresh();
  }

  async function remove(id: string) {
    const { error } = await getSupabaseBrowser().from("accounts").delete().eq("id", id);
    if (error) return setMessage("המחיקה לא הצליחה");
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">אמצעי תשלום</h1>
      <p className="text-muted">הכרטיסים שלכם פרטיים. בן/בת הזוג לא רואים אותם. לכרטיס אשראי מגדירים את יום החיוב, וההוצאות עליו יירדו מהבנק באותו יום.</p>

      {mine.length === 0 && <EmptyState emoji="💳" title="עוד לא הוספתם אמצעי תשלום" hint="אפשר להתחיל בכרטיס אשראי אחד." />}
      <ul className="space-y-2">
        {mine.map((a) => {
          const Icon = KINDS.find((k) => k.key === a.kind)?.Icon ?? Banknote;
          return (
            <li key={a.id}>
              <Card className="flex items-center gap-3 p-4">
                <Icon aria-hidden className="shrink-0 text-primary" />
                <span className="flex-1 font-medium">{a.name}</span>
                {a.kind === "credit_card" && (
                  <label className="flex items-center gap-2 text-sm text-muted">
                    חיוב ב-
                    <Input
                      type="number" inputMode="numeric" min={1} max={31} defaultValue={a.charge_day ?? 2}
                      aria-label={`יום חיוב של ${a.name}`} className="w-16 text-center"
                      onBlur={(e) => Number(e.target.value) !== a.charge_day && updateChargeDay(a.id, e.target.value)}
                    />
                  </label>
                )}
                <Button variant="ghost" aria-label={`מחיקת ${a.name}`} onClick={() => remove(a.id)} className="text-danger"><Trash2 size={18} aria-hidden /></Button>
              </Card>
            </li>
          );
        })}
      </ul>

      <Card className="space-y-3">
        <h2 className="font-semibold">הוספה</h2>
        <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="סוג">
          {KINDS.map(({ key, label }) => (
            <button key={key} type="button" role="radio" aria-checked={kind === key} onClick={() => setKind(key)}
              className={cn("rounded-2xl px-2 text-sm", kind === key ? "bg-primary text-primary-fg" : "bg-surface-2")}>
              {label}
            </button>
          ))}
        </div>
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="שם (למשל: מקס)" aria-label="שם אמצעי התשלום" />
        {kind === "credit_card" && (
          <label className="flex items-center gap-2 text-sm text-muted">
            יום חיוב בחודש
            <Input type="number" inputMode="numeric" min={1} max={31} value={chargeDay} onChange={(e) => setChargeDay(e.target.value)} className="w-20 text-center" />
          </label>
        )}
        <Button onClick={add} className="h-12 w-full">הוספה</Button>
      </Card>
      {message && <p role="status" className="text-center text-muted">{message}</p>}
    </div>
  );
}
