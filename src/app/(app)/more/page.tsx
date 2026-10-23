"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, Copy, CreditCard, LogOut, PiggyBank, Plus, Repeat } from "lucide-react";
import { useAppData } from "@/components/AppProviders";
import { Button, Card, Input } from "@/components/ui/ui";
import { cn } from "@/lib/cn";
import { CategoryIcon } from "@/components/CategoryIcon";
import { COLORS, ICONS } from "@/lib/icons";
import { getSupabaseBrowser } from "@/lib/supabase/client";
import type { Category } from "@/lib/types";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card className="space-y-3">
      <h2 className="text-lg font-semibold">{title}</h2>
      {children}
    </Card>
  );
}

function CategoryEditor({ category, onSaved }: { category: Category; onSaved: () => void }) {
  const [name, setName] = useState(category.name);
  const [icon, setIcon] = useState(category.icon);
  const [color, setColor] = useState(category.color);
  const [error, setError] = useState<string | null>(null);

  async function save(patch: Partial<Category>) {
    setError(null);
    const { error } = await getSupabaseBrowser().from("categories").update(patch).eq("id", category.id);
    if (error) return setError("השמירה לא הצליחה");
    onSaved();
  }

  return (
    <details className="rounded-2xl bg-surface-2 p-3">
      <summary className="flex cursor-pointer items-center gap-3">
        <span className="flex size-9 items-center justify-center rounded-full text-white" style={{ background: color }}>
          <CategoryIcon name={icon} size={18} />
        </span>
        <span className="flex-1 font-medium">{category.name}</span>
        <span className="text-sm text-muted">{category.kind === "income" ? "הכנסה" : "הוצאה"}</span>
      </summary>
      <div className="mt-3 space-y-3">
        <Input value={name} onChange={(e) => setName(e.target.value)} aria-label="שם קטגוריה" onBlur={() => name.trim() && name !== category.name && save({ name: name.trim() })} />
        <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="אייקון">
          {Object.keys(ICONS).map((key) => {
            return (
              <button key={key} type="button" role="radio" aria-checked={icon === key} aria-label={key}
                onClick={() => { setIcon(key); save({ icon: key }); }}
                className={cn("flex size-11 items-center justify-center rounded-xl bg-surface", icon === key && "ring-2 ring-primary")}>
                <CategoryIcon name={key} size={20} />
              </button>
            );
          })}
        </div>
        <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="צבע">
          {COLORS.map((c) => (
            <button key={c} type="button" role="radio" aria-checked={color === c} aria-label={c}
              onClick={() => { setColor(c); save({ color: c }); }}
              className={cn("size-11 rounded-full", color === c && "ring-2 ring-primary ring-offset-2 ring-offset-surface-2")}
              style={{ background: c }} />
          ))}
        </div>
        <Button variant="secondary" className="w-full text-danger" onClick={() => save({ archived: true })}>הסתרת הקטגוריה</Button>
        {error && <p role="alert" className="text-warn">{error}</p>}
      </div>
    </details>
  );
}

export default function MorePage() {
  const router = useRouter();
  const { household, categories, profiles, userId } = useAppData();
  const me = profiles.find((p) => p.id === userId);
  const partner = profiles.find((p) => p.id !== userId);
  const [displayName, setDisplayName] = useState(me?.display_name ?? "");
  const [startDay, setStartDay] = useState(String(household.period_start_day));
  const [newCat, setNewCat] = useState("");
  const [copied, setCopied] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const refresh = () => router.refresh();
  const sb = () => getSupabaseBrowser();

  async function saveName() {
    const { error } = await sb().from("profiles").update({ display_name: displayName.trim() }).eq("id", userId);
    setMessage(error ? "השמירה לא הצליחה" : "נשמר");
    refresh();
  }

  async function saveStartDay() {
    const day = Number(startDay);
    if (!Number.isInteger(day) || day < 1 || day > 31) return setMessage("בחרו יום בין 1 ל-31");
    const { error } = await sb().from("households").update({ period_start_day: day }).eq("id", household.id);
    setMessage(error ? "השמירה לא הצליחה" : "נשמר. החישובים יתעדכנו");
    refresh();
  }

  async function addCategory(kind: "expense" | "income") {
    if (!newCat.trim()) return;
    const { error } = await sb().from("categories").insert({ household_id: household.id, name: newCat.trim(), kind, sort_order: categories.length + 1 });
    if (error) return setMessage("הוספת הקטגוריה לא הצליחה");
    setNewCat("");
    refresh();
  }

  async function copyInvite() {
    const link = `${location.origin}/onboarding?code=${household.invite_code}`;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setMessage(link);
    }
  }

  async function signOut() {
    await sb().auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">עוד</h1>

      <Card className="divide-y divide-border p-2">
        {[
          { href: "/budget", label: "תקציב לקטגוריות", Icon: PiggyBank },
          { href: "/more/recurring", label: "הוצאות קבועות ומנויים", Icon: Repeat },
          { href: "/more/accounts", label: "כרטיסים ואמצעי תשלום", Icon: CreditCard },
        ].map(({ href, label, Icon }) => (
          <Link key={href} href={href} className="flex items-center gap-3 px-3 py-2">
            <Icon aria-hidden className="text-primary" />
            <span className="flex-1">{label}</span>
            <ChevronLeft aria-hidden className="text-muted" size={18} />
          </Link>
        ))}
      </Card>

      <Section title="פרופיל">
        <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} aria-label="השם שלי" placeholder="השם שלי" />
        <Button variant="secondary" onClick={saveName} className="w-full">שמירת שם</Button>
      </Section>

      <Section title="בן/בת הזוג">
        {partner ? (
          <p>מחוברים עם <strong>{partner.display_name || "בן/בת הזוג"}</strong> 💚</p>
        ) : (
          <>
            <p className="text-muted">שלחו את קוד ההזמנה. בן/בת הזוג מצטרפים אחרי הכניסה.</p>
            <div className="flex items-center gap-2">
              <code dir="ltr" className="num flex-1 rounded-2xl bg-surface-2 p-3 text-center text-xl tracking-widest">{household.invite_code}</code>
              <Button variant="secondary" onClick={copyInvite} aria-label="העתקת קישור הזמנה"><Copy size={18} aria-hidden />{copied ? "הועתק" : "קישור"}</Button>
            </div>
          </>
        )}
      </Section>

      <Section title="חודש פיננסי">
        <p className="text-sm text-muted">התקופה מתחילה ביום הזה בכל חודש. אפשר להוסיף תנועות בכל תאריך. זה משפיע רק על החישובים.</p>
        <div className="flex gap-2">
          <Input type="number" inputMode="numeric" min={1} max={31} value={startDay} onChange={(e) => setStartDay(e.target.value)} aria-label="יום תחילת החודש הפיננסי" />
          <Button variant="secondary" onClick={saveStartDay} className="shrink-0">שמירה</Button>
        </div>
      </Section>

      <Section title="קטגוריות">
        <div className="space-y-2">{categories.map((c) => <CategoryEditor key={c.id} category={c} onSaved={refresh} />)}</div>
        <div className="flex gap-2">
          <Input value={newCat} onChange={(e) => setNewCat(e.target.value)} placeholder="קטגוריה חדשה" aria-label="שם קטגוריה חדשה" />
          <Button variant="secondary" onClick={() => addCategory("expense")} aria-label="הוספה כהוצאה"><Plus size={18} aria-hidden />הוצאה</Button>
          <Button variant="secondary" onClick={() => addCategory("income")} aria-label="הוספה כהכנסה"><Plus size={18} aria-hidden />הכנסה</Button>
        </div>
      </Section>

      {message && <p role="status" className="text-center text-muted">{message}</p>}
      <Button variant="ghost" onClick={signOut} className="w-full"><LogOut size={18} aria-hidden /> התנתקות</Button>
    </div>
  );
}
