import { useState } from 'react'
import Chip from '../components/common/Chip'
import { PHRASES } from '../data/phrases'
import { translateToKorean } from '../lib/translate'
import type { Phrase } from '../types'

export default function TranslateRoute() {
  const [selected, setSelected] = useState<Phrase>(PHRASES[0])
  const [copied, setCopied] = useState(false)

  const [freeText, setFreeText] = useState('')
  const [freeResult, setFreeResult] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function selectPhrase(phrase: Phrase) {
    setSelected(phrase)
    setCopied(false)
  }

  async function copyKorean() {
    try {
      await navigator.clipboard.writeText(selected.ko)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      setError('לא ניתן להעתיק במכשיר הזה')
    }
  }

  async function handleTranslate() {
    if (!freeText.trim()) return
    setLoading(true)
    setError('')
    setFreeResult('')
    try {
      const result = await translateToKorean(freeText)
      setFreeResult(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'שגיאה בתרגום')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="px-5 pb-6 pt-8">
      <h1 className="text-2xl font-bold text-ink">תרגום</h1>

      <div className="mt-4 flex flex-wrap gap-2">
        {PHRASES.map((phrase) => (
          <Chip key={phrase.he} active={selected.he === phrase.he} onClick={() => selectPhrase(phrase)}>
            {phrase.he}
          </Chip>
        ))}
      </div>

      <div className="mt-4 rounded-2xl border border-border bg-card p-5 text-center">
        <p className="text-sm text-muted">{selected.he}</p>
        <p className="mt-2 text-3xl font-bold text-ink">{selected.ko}</p>
        <p className="mt-1.5 text-sm text-muted">{selected.romanization}</p>
        <button
          type="button"
          onClick={copyKorean}
          className="mt-4 rounded-full bg-accent px-5 py-2 text-sm font-semibold text-white"
        >
          {copied ? 'הועתק!' : 'העתקה'}
        </button>
      </div>

      <h2 className="mt-8 mb-3 text-lg font-bold text-ink">תרגום חופשי</h2>
      <textarea
        value={freeText}
        onChange={(e) => setFreeText(e.target.value)}
        placeholder="כתבו כאן משפט בעברית..."
        rows={3}
        className="w-full rounded-2xl border border-border bg-card px-4 py-3 text-base text-ink placeholder:text-muted focus:border-accent focus:outline-none"
      />
      <button
        type="button"
        onClick={handleTranslate}
        disabled={!freeText.trim() || loading}
        className="mt-3 w-full rounded-full bg-accent px-6 py-3.5 text-base font-semibold text-white disabled:opacity-40"
      >
        {loading ? 'מתרגם...' : 'תרגמו לקוריאנית'}
      </button>

      {error && <p className="mt-3 text-sm text-warn">{error}</p>}
      {freeResult && (
        <div className="mt-4 rounded-2xl border border-border bg-card p-4">
          <p className="text-lg font-semibold text-ink">{freeResult}</p>
        </div>
      )}
    </div>
  )
}
