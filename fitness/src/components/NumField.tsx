import { useEffect, useState } from 'react'

const parse = (s: string) => Number(s.replace(',', '.'))

/** Numeric text input that keeps in-progress text (e.g. "2.") while still reporting numbers. */
export default function NumField({ value, onChange, label, decimal = true, className = 'field' }: {
  value: number; onChange: (n: number) => void; label: string; decimal?: boolean; className?: string
}) {
  const [text, setText] = useState(String(value))
  useEffect(() => { if (parse(text) !== value) setText(String(value)) }, [value]) // eslint-disable-line
  return (
    <input className={className} aria-label={label} inputMode={decimal ? 'decimal' : 'numeric'} value={text}
      onFocus={(e) => e.currentTarget.select()}
      onChange={(e) => { setText(e.target.value); const n = parse(e.target.value); if (e.target.value !== '' && !Number.isNaN(n) && n >= 0) onChange(n) }} />
  )
}
