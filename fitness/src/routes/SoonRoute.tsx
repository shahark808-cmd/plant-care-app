import { Footprints, Salad } from 'lucide-react'

export default function SoonRoute({ kind }: { kind: 'running' | 'nutrition' }) {
  const Icon = kind === 'running' ? Footprints : Salad
  return (
    <main className="page">
      <div className="empty">
        <Icon size={40} strokeWidth={1.4} aria-hidden />
        <h1>{kind === 'running' ? 'ריצה' : 'תזונה'}</h1>
        <p className="muted">{kind === 'running' ? 'יומן הריצות ותוכנית ה-10 ק״מ יגיעו בשלב הבא.' : 'מעקב קלוריות וחלבון יגיע בשלב הבא.'}</p>
      </div>
    </main>
  )
}
