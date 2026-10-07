import type { TemplateItem, WorkoutTemplate } from '../types'
import { SEED_EXERCISES } from './exercises'

const step = (id: string) => SEED_EXERCISES.find((e) => e.id === id)?.defaultStepKg ?? 2.5

const item = (exerciseId: string, sets: number, lo: number, hi: number, startWeight = 0, restSec = 120): TemplateItem => ({
  id: `${exerciseId}-${sets}-${lo}`, exerciseId, sets, lo, hi, startWeight, step: step(exerciseId), restSec,
})

/** Section 5.3: full-body A/B, editable starting templates. Weights are filled in by the user. */
export const SEED_TEMPLATES: WorkoutTemplate[] = [
  {
    id: 'template-a', name: 'אימון A', createdAt: 1,
    items: [
      item('back-squat', 3, 6, 10, 0, 150),
      item('barbell-bench-press', 3, 6, 10, 0, 150),
      item('pull-up', 3, 5, 8, 0, 120),
      item('romanian-deadlift', 3, 8, 10, 0, 120),
      item('dumbbell-shoulder-press', 3, 10, 15, 0, 90),
      item('plank', 3, 30, 45, 0, 60),
    ],
  },
  {
    id: 'template-b', name: 'אימון B', createdAt: 2,
    items: [
      item('leg-press', 3, 8, 12, 0, 120),
      item('dips', 3, 8, 12, 0, 120),
      item('machine-row', 3, 8, 12, 0, 90),
      item('hip-thrust', 3, 10, 12, 0, 120),
      item('dumbbell-curl', 3, 10, 12, 0, 75),
      item('standing-calf-raise', 3, 12, 15, 0, 60),
    ],
  },
]
