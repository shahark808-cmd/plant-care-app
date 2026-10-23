import { Card } from "@/components/ui/ui";

export function SetupNotice() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md items-center p-4">
      <Card className="w-full min-w-0 space-y-3">
        <h1 className="text-xl font-bold">כמעט שם — צריך לחבר את Supabase</h1>
        <p className="text-muted">
          צרו קובץ <code dir="ltr">.env.local</code> עם הערכים של הפרויקט שלכם, והפעילו מחדש את השרת:
        </p>
        <pre dir="ltr" className="overflow-x-auto rounded-2xl bg-surface-2 p-3 text-sm">
{`NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...`}
        </pre>
        <p className="text-muted">את הסכמה מריצים מהקבצים ב-<code dir="ltr">supabase/migrations</code>. הפרטים המלאים ב-README.</p>
      </Card>
    </main>
  );
}
