import { BookOpen } from 'lucide-react'
import { insightLink, type Insight } from '../data/insights'
import { db } from '../lib/db'

export default function InsightCard({ insight }: { insight: Insight }) {
  return (
    <aside className="card stack" aria-label="דגש מבוסס מחקר">
      <div className="row"><BookOpen size={18} className="muted" aria-hidden /><h2>{insight.title}</h2></div>
      <p>{insight.text}</p>
      <div className="label stack" style={{ gap: 2 }}>
        <span>סוג מחקר: {insight.studyType}. {insight.sample}.</span>
        <span>מגבלה: {insight.limitation}</span>
      </div>
      <div className="row between">
        <a href={insightLink(insight)} target="_blank" rel="noreferrer" className="small" style={{ textDecoration: 'underline' }}>{insight.source.label} (PubMed)</a>
        <button className="btn btn-ghost" onClick={() => db.hiddenInsights.put({ id: insight.id })}>לא רלוונטי</button>
      </div>
      <p className="label">הנחיה כללית בלבד ולא ייעוץ רפואי. בכאב או פציעה כדאי להתייעץ עם איש מקצוע.</p>
    </aside>
  )
}
