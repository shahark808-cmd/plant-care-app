import { monthLabel, shiftMonth } from '../lib/format'

export default function MonthNav({ value, onChange }: { value: string; onChange: (m: string) => void }) {
  return (
    <div className="flex items-center justify-between">
      <button onClick={() => onChange(shiftMonth(value, -1))} aria-label="חודש קודם" className="size-10 rounded-full border border-line bg-surface">›</button>
      <span className="font-semibold">{monthLabel(value)}</span>
      <button onClick={() => onChange(shiftMonth(value, 1))} aria-label="חודש הבא" className="size-10 rounded-full border border-line bg-surface">‹</button>
    </div>
  )
}
