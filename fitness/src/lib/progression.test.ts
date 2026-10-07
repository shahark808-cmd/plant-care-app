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

import { calcTargets, calorieAdvice, ema, macrosForGrams } from './nutrition'

describe('nutrition (spec section 13)', () => {
  const p = { weightKg: 75, heightCm: 175, age: 25, sex: 'male' as const, workoutsPerWeek: 4, goal: 'gain' as const }
  it('targets for 75kg male, 4 workouts, gain', () => {
    const t = calcTargets(p, '2026-10-07')
    expect(t.calories).toBe(2922)
    expect(t.protein).toBe(135)
    expect(t.fat).toBe(67.5)
    expect(t.carbs).toBeCloseTo(443.6, 0)
  })
  it('lose goal subtracts calories, female uses -161', () => {
    expect(calcTargets({ ...p, sex: 'female', goal: 'lose' }, 'x').calories).toBe(Math.round((10 * 75 + 6.25 * 175 - 125 - 161) * 1.55 - 400))
  })
  it('macros scale by grams', () => {
    expect(macrosForGrams({ id: 'a', name: 'x', source: 'user', per100: { kcal: 165, protein: 31, carbs: 0, fat: 3.6 } }, 200)).toEqual({ kcal: 330, protein: 62, carbs: 0, fat: 7.2 })
  })
  it('ema smooths', () => expect(ema([80, 82], 0.5)).toEqual([80, 81]))
  it('suggests calories when gaining and flat for 3 weeks', () => {
    const trend = [{ date: '2026-09-10', kg: 75 }, { date: '2026-09-30', kg: 75.05 }]
    expect(calorieAdvice('gain', trend)?.kcalDelta).toBe(150)
    expect(calorieAdvice('gain', [{ date: '2026-09-10', kg: 75 }, { date: '2026-09-30', kg: 76 }])).toBeNull()
    expect(calorieAdvice('lose', trend)).toBeNull()
  })
})

import { findDuplicates, formatPace, legsConflicts, mergeRuns, parseDuration, parseGpx, volumeSpike, weekStart } from './running'
import type { Run } from '../types'

const run = (o: Partial<Run>): Run => ({ id: Math.random().toString(), date: '2026-10-07', distanceKm: 5, durationSec: 1800, source: 'manual', ...o })

describe('running (spec section 13)', () => {
  it('week starts Sunday', () => expect(weekStart('2026-10-07')).toBe('2026-10-04'))
  it('warns when weekly volume goes 20 -> 24 km', () => {
    const runs = [run({ date: '2026-09-29', distanceKm: 20 }), run({ date: '2026-10-05', distanceKm: 24 })]
    expect(volumeSpike(runs, '2026-10-07')?.pct).toBe(20)
  })
  it('no warning for a 10% rise or less', () => {
    expect(volumeSpike([run({ date: '2026-09-29', distanceKm: 20 }), run({ date: '2026-10-05', distanceKm: 22 })], '2026-10-07')).toBeNull()
  })
  it('hard run 12h before heavy legs is flagged, 30h is not', () => {
    const legs = Date.parse('2026-10-08T18:00:00')
    expect(legsConflicts(Date.parse('2026-10-08T06:00:00'), [legs])).toHaveLength(1)
    expect(legsConflicts(Date.parse('2026-10-07T12:00:00'), [legs])).toHaveLength(0)
  })
  it('detects manual/synced duplicates and keeps manual fields', () => {
    const m = run({ distanceKm: 5, durationSec: 1800, note: 'נעים' })
    const s = run({ source: 'strava', distanceKm: 5.1, durationSec: 1830, avgHr: 150, stravaId: 9 })
    expect(findDuplicates([m, s])).toHaveLength(1)
    expect(findDuplicates([m, run({ source: 'strava', distanceKm: 8 })])).toHaveLength(0)
    expect(mergeRuns(m, s)).toMatchObject({ source: 'manual', note: 'נעים', avgHr: 150, stravaId: 9 })
  })
  it('formats pace and parses durations', () => {
    expect(formatPace(330)).toBe('5:30')
    expect(parseDuration('32:10')).toBe(1930)
    expect(parseDuration('45')).toBe(2700)
    expect(parseDuration('abc')).toBe(0)
  })
  it('parses a GPX track', () => {
    const gpx = `<gpx><trk><trkseg>
      <trkpt lat="32.0000" lon="34.8000"><time>2026-10-07T05:00:00Z</time><extensions><gpxtpx:hr>140</gpxtpx:hr></extensions></trkpt>
      <trkpt lat="32.0090" lon="34.8000"><time>2026-10-07T05:05:00Z</time><extensions><gpxtpx:hr>160</gpxtpx:hr></extensions></trkpt>
    </trkseg></trk></gpx>`
    const g = parseGpx(gpx)!
    expect(g.distanceKm).toBeCloseTo(1, 1)
    expect(g.durationSec).toBe(300)
    expect(g.avgHr).toBe(150)
    expect(g.maxHr).toBe(160)
  })
})

import { detectTriggers, weeklyStreak } from './insights'
import { INSIGHTS } from '../data/insights'

describe('insights & streak', () => {
  const base = { today: '2026-10-07', runs: [], proteinDays: [], stalledExercises: 0, deloadSuggested: false, easyRatings: 0, runLegsConflict: false }
  it('triggers on three low-protein days only when each is under 80% of target', () => {
    const low = [{ date: 'a', protein: 90 }, { date: 'b', protein: 100 }, { date: 'c', protein: 80 }]
    expect(detectTriggers({ ...base, proteinTarget: 135, proteinDays: low })).toContain('protein-intake')
    expect(detectTriggers({ ...base, proteinTarget: 135, proteinDays: [{ date: 'a', protein: 130 }, ...low.slice(1)] })).not.toContain('protein-intake')
    expect(detectTriggers({ ...base, proteinTarget: 135, proteinDays: low.slice(0, 2) })).toHaveLength(0)
  })
  it('flags stalls and repeated easy ratings', () => {
    expect(detectTriggers({ ...base, stalledExercises: 1 })).toEqual(['deload-consensus'])
    expect(detectTriggers({ ...base, easyRatings: 3 })).toEqual(['proximity-failure'])
  })
  it('every insight has a source and a limitation', () => {
    for (const i of INSIGHTS) { expect(i.source.pmid).toMatch(/^\d+$/); expect(i.limitation.length).toBeGreaterThan(10) }
  })
  it('streak forgives one missed week but not two', () => {
    expect(weeklyStreak([3, 3, 1, 3, 3], 0, 3)).toBe(4)
    expect(weeklyStreak([3, 1, 1, 3], 3, 3)).toBe(2)
    expect(weeklyStreak([], 3, 3)).toBe(1)
  })
})

import { lightWeekActive } from './session'
import { DEFAULT_SETTINGS } from './db'

describe('light week', () => {
  const s = (lastDeload?: string) => ({ ...DEFAULT_SETTINGS, lastDeload })
  it('starts the day after acceptance and lasts 7 days', () => {
    expect(lightWeekActive(s('2026-10-06'), '2026-10-06')).toBe(false)
    expect(lightWeekActive(s('2026-10-06'), '2026-10-07')).toBe(true)
    expect(lightWeekActive(s('2026-10-06'), '2026-10-13')).toBe(true)
    expect(lightWeekActive(s('2026-10-06'), '2026-10-14')).toBe(false)
    expect(lightWeekActive(s(undefined), '2026-10-07')).toBe(false)
  })
})
