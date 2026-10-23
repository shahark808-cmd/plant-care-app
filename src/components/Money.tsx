import { formatAgorot } from "@/lib/money";

/** סכום בשקלים בתוך טקסט עברי: כיוון קבוע כדי שסימן ה-₪ לא יקפוץ לצד השני. */
export function Money({ agorot }: { agorot: number }) {
  return (
    <span dir="ltr" className="num inline-block">
      {formatAgorot(agorot)}
    </span>
  );
}
