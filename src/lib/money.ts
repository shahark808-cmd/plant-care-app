/** כל הסכומים נשמרים כאגורות (מספר שלם). אין float. */

const shekel = new Intl.NumberFormat("he-IL", {
  style: "currency",
  currency: "ILS",
  maximumFractionDigits: 0,
});

const shekelWithAgorot = new Intl.NumberFormat("he-IL", {
  style: "currency",
  currency: "ILS",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** "12.5" / "₪1,234.56" -> אגורות. מחזיר null אם לא תקין. */
export function parseToAgorot(input: string): number | null {
  const cleaned = input.replace(/[₪\s,]/g, "");
  const match = /^(\d*)(?:\.(\d{1,2}))?$/.exec(cleaned);
  if (!match || (match[1] === "" && match[2] === undefined)) return null;
  const agorot = Number(match[1] || "0") * 100 + Number((match[2] ?? "").padEnd(2, "0"));
  return Number.isSafeInteger(agorot) ? agorot : null;
}

/** שקלים שלמים כשאין אגורות, אחרת עם שתי ספרות. */
export function formatAgorot(agorot: number): string {
  const sign = agorot < 0 ? "-" : "";
  const abs = Math.abs(agorot);
  const formatter = abs % 100 === 0 ? shekel : shekelWithAgorot;
  return sign + formatter.format(abs / 100);
}

/** חלוקה בלי אובדן אגורות: ratioPercent הוא החלק של הצד הראשון (0-100). */
export function splitAgorot(total: number, ratioPercent: number): [number, number] {
  const first = Math.round((total * ratioPercent) / 100);
  return [first, total - first];
}

/** אגורות -> מחרוזת לשדה קלט ("12.5" ל-1250, "12" ל-1200). */
export function agorotToInput(agorot: number): string {
  const whole = Math.trunc(agorot / 100);
  const frac = agorot % 100;
  return frac === 0 ? String(whole) : `${whole}.${String(frac).padStart(2, "0").replace(/0$/, "")}`;
}
