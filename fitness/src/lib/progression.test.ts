import { describe, expect, it } from 'vitest'
import { DEFAULT_PROGRESSION, deloadSignal, epley1RM, nextSuggestion, roundToStep } from './progression'
import { plateBreakdown, warmupSets } from './gym'

const today = '2026-10-07'
const base = { today, rangeExpanded: false }

describe('nextSuggestion (spec section 13)', () => {
  it('1. machine row 42kg 12/12/12 ok -> 44.5, target 8-9', () => {
    const s = nextSuggestion({ ...base, category: 'compound-upper', lo: 8, hi: 12, step: 2.5, history: [{ date: '2026-10-05', weight: 42, reps: [12, 12, 12], effort: 'ok' }] })
    expect(s.kind).toBe('raise')
    expect(s.weight).toBe(44.5)
    expect([s.targetLo, s.targetHi]).toEqual([8, 9])
  })

  it('2. dumbbell press 15kg 10/10/10 on 6-10: widen first, then 17.5', () => {
    const a = nextSuggestion({ ...base, category: 'compound-upper', lo: 6, hi: 10, step: 2.5, history: [{ date: '2026-10-05', weight: 15, reps: [10, 10, 10] }] })
    expect(a.kind).toBe('widen')
    expect(a.weight).toBe(15)
    expect(a.newHi).toBe(12)
    const b = nextSuggestion({ ...base, category: 'compound-upper', lo: 6, hi: 12, step: 2.5, rangeExpanded: true, history: [{ date: '2026-10-05', weight: 15, reps: [12, 12, 12] }] })
    expect(b.weight).toBe(17.5)
  })

  it('3. lateral raise 5kg 15/15/15 step 1 -> 6', () => {
    const s = nextSuggestion({ ...base, category: 'isolation', lo: 12, hi: 15, step: 1, history: [{ date: '2026-10-05', weight: 5, reps: [15, 15, 15] }] })
    expect(s.weight).toBe(6)
  })

  it('4. pull-up bodyweight 10/10/10 -> +2.5kg, start at 6 reps', () => {
    const s = nextSuggestion({ ...base, category: 'bodyweight', lo: 6, hi: 10, step: 2.5, history: [{ date: '2026-10-05', weight: 0, reps: [10, 10, 10] }] })
    expect(s.kind).toBe('add-load')
    expect(s.weight).toBe(2.5)
    expect(s.targetLo).toBe(6)
  })

  it('5. 16 days off, 40kg -> 37.5', () => {
    const s = nextSuggestion({ ...base, category: 'lower', lo: 6, hi: 10, step: 2.5, history: [{ date: '2026-09-21', weight: 40, reps: [10, 10, 10] }] })
    expect(s.kind).toBe('layoff')
    expect(s.weight).toBe(37.5)
  })

  it('6. three sessions without progress offers deload / add set / swap', () => {
    const h = ['2026-10-05', '2026-10-02', '2026-09-29'].map((date) => ({ date, weight: 40, reps: [8, 8, 7] }))
    const s = nextSuggestion({ ...base, category: 'lower', lo: 8, hi: 12, step: 2.5, history: h })
    expect(s.kind).toBe('stall')
    expect(s.options).toEqual(['deload', 'add-set', 'swap'])
    expect(s.deloadWeight).toBe(35)
  })

  it('7. easy effort doubles the jump, capped at one extra step', () => {
    const s = nextSuggestion({ ...base, category: 'compound-upper', lo: 8, hi: 12, step: 2.5, history: [{ date: '2026-10-05', weight: 42, reps: [12, 12, 12], effort: 'easy' }] })
    expect(s.weight).toBe(47)
  })

  it('holds and adds a rep when the top of the range was missed', () => {
    const s = nextSuggestion({ ...base, category: 'compound-upper', lo: 8, hi: 12, step: 2.5, history: [{ date: '2026-10-05', weight: 42, reps: [10, 9, 8] }] })
    expect(s.kind).toBe('hold')
    expect(s.weight).toBe(42)
    expect(s.targetLo).toBe(9)
  })

  it('steps down after two sessions with the first set under the range', () => {
    const h = [{ date: '2026-10-05', weight: 60, reps: [5, 5, 4] }, { date: '2026-10-02', weight: 60, reps: [5, 5, 5] }]
    const s = nextSuggestion({ ...base, category: 'lower', lo: 8, hi: 12, step: 2.5, history: h })
    expect(s.kind).toBe('reduce')
    expect(s.weight).toBe(57.5)
  })

  it('respects editable settings', () => {
    const s = nextSuggestion(
      { ...base, category: 'lower', lo: 8, hi: 12, step: 2.5, history: [{ date: '2026-10-05', weight: 100, reps: [12, 12, 12] }] },
      { ...DEFAULT_PROGRESSION, pctLower: 0.1 },
    )
    expect(s.weight).toBe(110)
  })
})

describe('helpers', () => {
  it('rounds to step without float noise', () => {
    expect(roundToStep(44.5, 2.5)).toBe(45)
    expect(roundToStep(37, 2.5)).toBe(37.5)
    expect(roundToStep(6.1, 1)).toBe(6)
  })
  it('epley', () => expect(epley1RM(100, 5)).toBeCloseTo(116.67, 1))
  it('plates for 100kg on a 20kg bar', () => {
    expect(plateBreakdown(100, 20, [25, 20, 15, 10, 5, 2.5, 1.25])).toEqual({ perSide: [25, 15], remainder: 0 })
  })
  it('warmup sets at 50% and 75%', () => {
    expect(warmupSets(80, 2.5, [0.5, 0.75])).toEqual([{ weight: 40, reps: 8 }, { weight: 60, reps: 5 }])
  })
  it('deload signal', () => {
    expect(deloadSignal(8, 0, 0).suggest).toBe(true)
    expect(deloadSignal(2, 0, 0).suggest).toBe(false)
  })
})
