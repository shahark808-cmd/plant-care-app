import { DndContext, PointerSensor, TouchSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core'
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useLiveQuery } from 'dexie-react-hooks'
import { ChevronDown, ChevronRight, GripVertical, Link2, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import ExercisePicker from '../components/ExercisePicker'
import { db, uid } from '../lib/db'
import { useExercises, useSettings } from '../lib/hooks'
import type { TemplateItem, WorkoutTemplate } from '../types'
import { WEEKDAYS } from './WorkoutsRoute'

const num = (v: string) => (v === '' ? 0 : Number(v.replace(',', '.')) || 0)

export default function WorkoutEditRoute() {
  const { id = '' } = useParams()
  const nav = useNavigate()
  const tpl = useLiveQuery(() => db.templates.get(id), [id])
  const { byId, list } = useExercises()
  const settings = useSettings()
  const [picking, setPicking] = useState(false)
  const [open, setOpen] = useState<string | null>(null)
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }), useSensor(TouchSensor, { activationConstraint: { delay: 120, tolerance: 6 } }))

  if (tpl === undefined) return <main className="page" />
  if (!tpl) return <main className="page"><div className="empty"><p>האימון לא נמצא.</p></div></main>

  const save = (patch: Partial<WorkoutTemplate>) => db.templates.update(tpl.id, patch)
  const setItems = (items: TemplateItem[]) => save({ items })
  const patchItem = (iid: string, patch: Partial<TemplateItem>) => setItems(tpl.items.map((i) => (i.id === iid ? { ...i, ...patch } : i)))

  const onDragEnd = (e: DragEndEvent) => {
    if (!e.over || e.active.id === e.over.id) return
    const from = tpl.items.findIndex((i) => i.id === e.active.id)
    const to = tpl.items.findIndex((i) => i.id === e.over!.id)
    setItems(arrayMove(tpl.items, from, to))
  }

  const add = (ids: string[]) => {
    const items = ids.map((eid): TemplateItem => {
      const ex = list.find((x) => x.id === eid)!
      return { id: uid(), exerciseId: eid, sets: 3, lo: ex.category === 'isolation' ? 10 : 8, hi: ex.category === 'isolation' ? 15 : 12, startWeight: 0, step: ex.defaultStepKg, restSec: settings.defaultRestSec }
    })
    setItems([...tpl.items, ...items])
    setPicking(false)
  }

  const toggleSuperset = (idx: number) => {
    const cur = tpl.items[idx], prev = tpl.items[idx - 1]
    if (!prev) return
    if (cur.supersetGroup && cur.supersetGroup === prev.supersetGroup) {
      const g = cur.supersetGroup
      const others = tpl.items.filter((i) => i.supersetGroup === g).length
      setItems(tpl.items.map((i) => (i.id === cur.id || (others === 2 && i.id === prev.id) ? { ...i, supersetGroup: undefined } : i)))
    } else {
      const g = prev.supersetGroup ?? uid()
      setItems(tpl.items.map((i) => (i.id === cur.id || i.id === prev.id ? { ...i, supersetGroup: g } : i)))
    }
  }

  return (
    <main className="page">
      <div className="row">
        <button className="icon-btn" aria-label="חזרה" onClick={() => nav('/workouts')}><ChevronRight size={22} /></button>
        <input className="field" aria-label="שם האימון" value={tpl.name} onChange={(e) => save({ name: e.target.value })} />
      </div>
      <label className="row"><span className="label">יום בשבוע</span>
        <select className="field" value={tpl.weekday ?? ''} onChange={(e) => save({ weekday: e.target.value === '' ? undefined : Number(e.target.value) })}>
          <option value="">ללא</option>{WEEKDAYS.map((d, i) => <option key={d} value={i}>{d}</option>)}
        </select>
      </label>

      {tpl.items.length === 0 && <div className="empty"><h2>האימון ריק</h2><p className="muted">הוסף תרגילים מהמאגר.</p></div>}

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={tpl.items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
          <div className="stack">
            {tpl.items.map((it, idx) => (
              <Row key={it.id} it={it} name={byId.get(it.exerciseId)?.nameHe ?? it.exerciseId} open={open === it.id}
                linked={!!it.supersetGroup} canLink={idx > 0}
                onToggle={() => setOpen(open === it.id ? null : it.id)}
                onPatch={(p) => patchItem(it.id, p)} onLink={() => toggleSuperset(idx)}
                onRemove={() => setItems(tpl.items.filter((i) => i.id !== it.id))} />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      <button className="btn btn-block" onClick={() => setPicking(true)}><Plus size={18} />הוסף תרגילים</button>
      <button className="btn btn-ghost btn-danger btn-block" onClick={async () => { if (confirm('למחוק את האימון?')) { await db.templates.delete(tpl.id); nav('/workouts') } }}>מחק אימון</button>
      {picking && <ExercisePicker onPick={add} onClose={() => setPicking(false)} />}
    </main>
  )
}

function Row({ it, name, open, linked, canLink, onToggle, onPatch, onLink, onRemove }: {
  it: TemplateItem; name: string; open: boolean; linked: boolean; canLink: boolean
  onToggle: () => void; onPatch: (p: Partial<TemplateItem>) => void; onLink: () => void; onRemove: () => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: it.id })
  const field = (label: string, value: number, key: keyof TemplateItem, mode: 'numeric' | 'decimal' = 'numeric') => (
    <label className="stack" style={{ gap: 4 }}><span className="label">{label}</span>
      <input className="field" inputMode={mode} defaultValue={value || ''} onBlur={(e) => onPatch({ [key]: num(e.target.value) } as Partial<TemplateItem>)} />
    </label>
  )
  return (
    <div ref={setNodeRef} className="card" style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.7 : 1, padding: '8px 12px', borderInlineStart: linked ? '3px solid var(--accent)' : undefined }}>
      <div className="row">
        <span className="handle" {...attributes} {...listeners} aria-label="גרור לשינוי סדר"><GripVertical size={20} /></span>
        <button className="item-btn grow" style={{ padding: 0 }} onClick={onToggle} aria-expanded={open}>
          <div>{name}</div>
          <div className="label">{it.sets}×{it.lo}–{it.hi}{it.startWeight ? ` · ${it.startWeight} ק״ג` : ''}{linked ? ' · סופר-סט' : ''}</div>
        </button>
        <ChevronDown size={18} className="muted" style={{ transform: open ? 'rotate(180deg)' : undefined, transition: 'transform .2s' }} aria-hidden />
      </div>
      {open && (
        <div className="stack" style={{ padding: '8px 4px 8px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
            {field('סטים', it.sets, 'sets')}{field('חזרות מ-', it.lo, 'lo')}{field('עד', it.hi, 'hi')}
            {field('משקל התחלתי', it.startWeight, 'startWeight', 'decimal')}{field('צעד (ק״ג)', it.step, 'step', 'decimal')}{field('מנוחה (שנ׳)', it.restSec, 'restSec')}
          </div>
          <textarea className="field" placeholder="הערה אישית" defaultValue={it.note} onBlur={(e) => onPatch({ note: e.target.value })} />
          <div className="row">
            {canLink && <button className="btn grow" onClick={onLink}><Link2 size={18} />{linked ? 'בטל סופר-סט' : 'סופר-סט עם הקודם'}</button>}
            <button className="btn btn-danger" onClick={onRemove} aria-label="הסר תרגיל"><Trash2 size={18} /></button>
          </div>
        </div>
      )}
    </div>
  )
}
