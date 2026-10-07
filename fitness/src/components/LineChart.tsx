export default function LineChart({ points, unit = '' }: { points: { x: string; y: number }[]; unit?: string }) {
  if (points.length < 2) return <p className="muted small">צריך לפחות שני אימונים כדי להציג גרף.</p>
  const W = 320, H = 120, P = 8
  const ys = points.map((p) => p.y)
  const lo = Math.min(...ys), hi = Math.max(...ys)
  const span = hi - lo || 1
  const px = (i: number) => P + (i * (W - 2 * P)) / (points.length - 1)
  const py = (y: number) => H - P - ((y - lo) / span) * (H - 2 * P)
  const d = points.map((p, i) => `${i ? 'L' : 'M'}${px(i).toFixed(1)},${py(p.y).toFixed(1)}`).join(' ')
  return (
    <figure style={{ margin: 0 }}>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label={`גרף, מ-${lo}${unit} עד ${hi}${unit}`} style={{ direction: 'ltr' }}>
        <path d={d} fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        {points.map((p, i) => <circle key={i} cx={px(i)} cy={py(p.y)} r="3" fill="var(--accent)" />)}
      </svg>
      <figcaption className="row between label"><span>{points[0].x.slice(5)}</span><span>{points[points.length - 1].x.slice(5)}</span></figcaption>
    </figure>
  )
}
