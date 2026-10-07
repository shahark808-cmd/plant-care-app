import { Footprints } from 'lucide-react'

export default function SoonRoute() {
  return (
    <main className="page">
      <div className="empty">
        <Footprints size={40} strokeWidth={1.4} aria-hidden />
        <h1>ריצה</h1>
        <p className="muted">יומן הריצות ותוכנית ה-10 ק״מ יגיעו בשלב הבא.</p>
      </div>
    </main>
  )
}
