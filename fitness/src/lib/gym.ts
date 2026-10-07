import { roundToStep } from './progression'

export interface PlateLoad {
  perSide: number[]
  remainder: number
}

/** Greedy plate breakdown for one side of the bar. */
export function plateBreakdown(target: number, bar: number, plates: number[]): PlateLoad {
  let side = Math.max(0, (target - bar) / 2)
  const perSide: number[] = []
  for (const p of [...plates].sort((a, b) => b - a)) {
    while (side + 1e-9 >= p) {
      perSide.push(p)
      side -= p
    }
  }
  return { perSide, remainder: Math.round(side * 2 * 100) / 100 }
}

export interface WarmupSet {
  weight: number
  reps: number
}

/** Warm-up sets as a share of the working weight, e.g. 50% and 75%. */
export function warmupSets(workWeight: number, step: number, pcts: number[], bar = 0): WarmupSet[] {
  const reps = [8, 5, 3, 2]
  const out: WarmupSet[] = []
  pcts.forEach((p, i) => {
    const w = Math.max(roundToStep(workWeight * p, step), bar)
    if (w > 0 && w < workWeight && !out.some((o) => o.weight === w)) out.push({ weight: w, reps: reps[i] ?? 3 })
  })
  return out
}
