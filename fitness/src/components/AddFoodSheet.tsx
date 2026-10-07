import { useLiveQuery } from 'dexie-react-hooks'
import { Camera, Search } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { SEED_FOODS } from '../data/foods'
import { db, uid } from '../lib/db'
import { addItems, lookupBarcode } from '../lib/meals'
import { macrosForGrams } from '../lib/nutrition'
import type { Food, MealItem, MealType } from '../types'
import NumField from './NumField'
import Sheet from './Sheet'

type Tab = 'search' | 'saved' | 'manual' | 'barcode'
const TABS: [Tab, string][] = [['search', 'חיפוש'], ['saved', 'שמורות'], ['manual', 'ידני'], ['barcode', 'ברקוד']]

export default function AddFoodSheet({ date, type, onClose }: { date: string; type: MealType; onClose: () => void }) {
  const [tab, setTab] = useState<Tab>('search')
  const [picked, setPicked] = useState<Food | null>(null)
  const done = async (items: Omit<MealItem, 'id'>[]) => { await addItems(date, type, items); onClose() }

  if (picked) return <AmountSheet food={picked} onBack={() => setPicked(null)} onAdd={(i) => done([i])} />

  return (
    <Sheet title="הוספת אוכל" onClose={onClose}>
      <div className="seg" role="tablist">
        {TABS.map(([k, l]) => <button key={k} role="tab" aria-selected={tab === k} className={tab === k ? 'on' : ''} onClick={() => setTab(k)}>{l}</button>)}
      </div>
      {tab === 'search' && <Search_ onPick={setPicked} />}
      {tab === 'saved' && <Saved onAdd={done} />}
      {tab === 'manual' && <Manual onAdd={(i) => done([i])} />}
      {tab === 'barcode' && <Barcode onPick={setPicked} />}
    </Sheet>
  )
}

function Search_({ onPick }: { onPick: (f: Food) => void }) {
  const [q, setQ] = useState('')
  const personal = useLiveQuery(() => db.foods.toArray(), [], [] as Food[])
  const recentIds = useLiveQuery(async () => {
    const ms = await db.meals.orderBy('date').reverse().limit(30).toArray()
    return [...new Set(ms.flatMap((m) => m.items.map((i) => i.foodId).filter(Boolean) as string[]))].slice(0, 8)
  }, [], [] as string[])
  const all = useMemo(() => [...personal, ...SEED_FOODS], [personal])
  const shown = q.trim() ? all.filter((f) => f.name.includes(q.trim())) : recentIds.map((id) => all.find((f) => f.id === id)).filter(Boolean) as Food[]
  return (
    <>
      <div className="row"><Search size={18} className="muted" aria-hidden /><input className="field" autoFocus placeholder="חפש מזון (למשל אורז)" value={q} onChange={(e) => setQ(e.target.value)} /></div>
      {!q.trim() && shown.length > 0 && <p className="label">אחרונים</p>}
      <div className="divided">
        {shown.map((f) => (
          <button key={f.id} className="item-btn" onClick={() => onPick(f)}>
            <div>{f.name}</div><div className="label">{f.per100.kcal} קל׳ ו-{f.per100.protein} ג׳ חלבון ל-100 ג׳</div>
          </button>
        ))}
        {q.trim() && shown.length === 0 && <p className="muted" style={{ padding: 12 }}>לא נמצא. אפשר להוסיף ידנית או בברקוד.</p>}
      </div>
      <p className="label">ערכים כלליים משוערים. במנות מבושלות ובמסעדות ייתכן הפרש של 20% עד 30%.</p>
    </>
  )
}

function AmountSheet({ food, onBack, onAdd }: { food: Food; onBack: () => void; onAdd: (i: Omit<MealItem, 'id'>) => void }) {
  const [unit, setUnit] = useState<string>('g')
  const [qty, setQty] = useState(100)
  const unitG = unit === 'g' ? 1 : food.units?.find((u) => u.name === unit)?.grams ?? 1
  const grams = qty * unitG
  const m = macrosForGrams(food, grams)
  const pick = (u: string) => { setUnit(u); setQty(u === 'g' ? 100 : 1) }
  return (
    <Sheet title={food.name} onClose={onBack}>
      <div className="chips">
        <button className={`chip ${unit === 'g' ? 'on' : ''}`} onClick={() => pick('g')}>גרמים</button>
        {food.units?.map((u) => <button key={u.name} className={`chip ${unit === u.name ? 'on' : ''}`} onClick={() => pick(u.name)}>{u.name} ({u.grams} ג׳)</button>)}
      </div>
      <label className="stack"><span className="label">{unit === 'g' ? 'כמות בגרמים' : `מספר (${unit})`}</span><NumField label="כמות" value={qty} onChange={setQty} /></label>
      <div className="card row between"><div><div className="num">{m.kcal}</div><div className="label">קלוריות</div></div>
        <div className="label" style={{ textAlign: 'end' }}>חלבון {m.protein} ג׳<br />פחמימות {m.carbs} ג׳<br />שומן {m.fat} ג׳</div></div>
      <button className="btn btn-primary btn-block btn-lg" disabled={qty <= 0} onClick={() => onAdd({ ...m, foodId: food.id, name: food.name, amount: unit === 'g' ? `${qty} ג׳` : `${qty} ${unit}` })}>הוסף</button>
    </Sheet>
  )
}

function Saved({ onAdd }: { onAdd: (items: Omit<MealItem, 'id'>[]) => void }) {
  const saved = useLiveQuery(() => db.savedMeals.toArray(), [], [])
  if (saved.length === 0) return <div className="empty"><h2>אין ארוחות שמורות</h2><p className="muted">בארוחה עם כמה פריטים לחץ על סימנייה כדי לשמור אותה.</p></div>
  return (
    <div className="divided">
      {saved.map((s) => (
        <div key={s.id} className="item">
          <button className="item-btn grow" onClick={() => onAdd(s.items)}>
            <div>{s.name}</div><div className="label">{Math.round(s.items.reduce((a, i) => a + i.kcal, 0))} קלוריות · {s.items.length} פריטים</div>
          </button>
          <button className="btn btn-ghost btn-danger" onClick={() => confirm('למחוק את הארוחה השמורה?') && db.savedMeals.delete(s.id)}>מחק</button>
        </div>
      ))}
    </div>
  )
}

function Manual({ onAdd }: { onAdd: (i: Omit<MealItem, 'id'>) => void }) {
  const [name, setName] = useState('')
  const [kcal, setKcal] = useState(0)
  const [protein, setProtein] = useState(0)
  const [carbs, setCarbs] = useState(0)
  const [fat, setFat] = useState(0)
  const [remember, setRemember] = useState(true)
  const save = async () => {
    const n = name.trim() || 'הוספה מהירה'
    if (remember && name.trim()) await db.foods.put({ id: `user-${uid()}`, name: n, source: 'user', per100: { kcal, protein, carbs, fat }, units: [{ name: 'מנה', grams: 100 }] })
    onAdd({ name: n, amount: 'מנה', kcal, protein, carbs, fat })
  }
  return (
    <>
      <input className="field" placeholder="שם (אפשר להשאיר ריק)" value={name} onChange={(e) => setName(e.target.value)} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {([['קלוריות', kcal, setKcal], ['חלבון (ג׳)', protein, setProtein], ['פחמימות (ג׳)', carbs, setCarbs], ['שומן (ג׳)', fat, setFat]] as const).map(([l, v, set]) => (
          <label key={l} className="stack" style={{ gap: 4 }}><span className="label">{l}</span><NumField label={l} value={v} onChange={set} /></label>
        ))}
      </div>
      <label className="row"><input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />שמור במאגר האישי שלי (הערכים נחשבים למנה אחת)</label>
      <button className="btn btn-primary btn-block btn-lg" disabled={kcal <= 0} onClick={save}>הוסף</button>
    </>
  )
}

function Barcode({ onPick }: { onPick: (f: Food) => void }) {
  const [code, setCode] = useState('')
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)
  const [scanning, setScanning] = useState(false)
  const video = useRef<HTMLVideoElement>(null)
  const supported = typeof window !== 'undefined' && 'BarcodeDetector' in window

  const find = async (c: string) => {
    setBusy(true); setMsg('')
    const r = await lookupBarcode(c)
    setBusy(false)
    if (r === 'not-found') setMsg('המוצר לא נמצא במאגר. אפשר להוסיף אותו ידנית.')
    else if (r === 'error') setMsg('אין חיבור או שהשירות לא זמין כרגע. נסה שוב בעוד רגע.')
    else onPick(r)
  }

  useEffect(() => {
    if (!scanning) return
    let stream: MediaStream | undefined
    let timer: number | undefined
    let stopped = false
    ;(async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
        if (video.current) { video.current.srcObject = stream; await video.current.play() }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const det = new (window as any).BarcodeDetector({ formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e'] })
        const tick = async () => {
          if (stopped || !video.current) return
          try { const r = await det.detect(video.current); if (r[0]) { setScanning(false); setCode(r[0].rawValue); find(r[0].rawValue); return } } catch { /* retry */ }
          timer = window.setTimeout(tick, 300)
        }
        tick()
      } catch { setMsg('אין גישה למצלמה. אפשר להקליד את מספר הברקוד.'); setScanning(false) }
    })()
    return () => { stopped = true; clearTimeout(timer); stream?.getTracks().forEach((t) => t.stop()) }
  }, [scanning]) // eslint-disable-line

  return (
    <>
      {scanning && <video ref={video} playsInline muted style={{ width: '100%', borderRadius: 12 }} />}
      {supported && <button className="btn btn-block" onClick={() => setScanning(!scanning)}><Camera size={18} />{scanning ? 'עצור סריקה' : 'סרוק במצלמה'}</button>}
      <input className="field" inputMode="numeric" placeholder="מספר ברקוד" value={code} onChange={(e) => setCode(e.target.value)} />
      <button className="btn btn-primary btn-block btn-lg" disabled={busy || code.replace(/\D/g, '').length < 8} onClick={() => find(code)}>{busy ? 'מחפש...' : 'חפש'}</button>
      {msg && <p className="notice">{msg}</p>}
      <p className="label">הנתונים מ-Open Food Facts, מאגר קהילתי פתוח (ODbL). הכיסוי בישראל חלקי וייתכנו אי דיוקים.</p>
    </>
  )
}
