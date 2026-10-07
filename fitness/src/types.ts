export type Category = 'lower' | 'compound-upper' | 'isolation' | 'bodyweight'
export type Effort = 'easy' | 'ok' | 'very_hard'
export type SetKind = 'warmup' | 'working' | 'drop' | 'failure'

export interface Exercise {
  id: string
  nameHe: string
  nameEn: string
  muscle: string
  equipment: string
  category: Category
  defaultStepKg: number
  steps: string[]
  cues: string[]
  mistakes: string[]
  isCustom?: boolean
}

export interface TemplateItem {
  id: string
  exerciseId: string
  sets: number
  lo: number
  hi: number
  startWeight: number
  step: number
  note?: string
  restSec: number // 0 = timer off
  supersetGroup?: string
}

export interface WorkoutTemplate {
  id: string
  name: string
  weekday?: number // 0 = Sunday
  items: TemplateItem[]
  createdAt: number
}

export interface SetLog {
  id: string
  kind: SetKind
  weight: number
  reps: number
  done: boolean
  isPR?: boolean
}

export interface SessionEntry {
  id: string
  exerciseId: string
  sets: SetLog[]
  lo: number
  hi: number
  step: number
  restSec: number
  note?: string
  effort?: Effort
  suggestionReason?: string
  supersetGroup?: string
}

export interface WorkoutSession {
  id: string
  date: string // YYYY-MM-DD
  templateId?: string
  name: string
  startedAt: number
  finishedAt?: number
  entries: SessionEntry[]
  notes?: string
}

/** Per-exercise personal settings (range widening state, personal overrides). */
export interface ExerciseSettings {
  exerciseId: string
  step?: number
  lo?: number
  hi?: number
  rangeExpanded?: boolean
}

export interface ProgressionSettings {
  pctLower: number
  pctCompoundUpper: number
  pctIsolation: number
  sessionsAtTopBeforeRaise: number
  stallSessionsBeforeSuggestion: number
  deloadPct: number
  layoffDays: number
  layoffRestartPct: number
  bigJumpThreshold: number
  bodyweightAddKg: number
}

export interface AppSettings {
  id: 'main'
  progression: ProgressionSettings
  theme: 'auto' | 'light' | 'dark'
  barKg: number
  plates: number[]
  defaultRestSec: number
  warmupPcts: number[]
  /** YYYY-MM-DD of the last accepted light week. */
  lastDeload?: string
  deloadSnoozeUntil?: string
}
