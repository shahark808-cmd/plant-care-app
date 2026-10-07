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
  profile?: Profile
  /** Start date (YYYY-MM-DD) of week 1 of the 10 km plan. */
  runPlanStart?: string
  /** Workouts + runs per week that count as a good week (flexible weekly streak). */
  weeklyGoal?: number
  /** Gentle in-app reminders on the home screen (no push notifications). */
  remindersOff?: boolean
  targets?: Targets
  deloadSnoozeUntil?: string
}

// ---- Nutrition (stage 2) ----
export type Sex = 'male' | 'female'
export type Goal = 'gain' | 'maintain' | 'lose'
export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack'

export interface Profile {
  weightKg: number
  heightCm: number
  age: number
  sex: Sex
  workoutsPerWeek: number
  goal: Goal
}

export interface Targets {
  calories: number
  protein: number
  carbs: number
  fat: number
  source: 'calculated' | 'manual'
  updatedAt: string
}

export interface Macros { kcal: number; protein: number; carbs: number; fat: number }

export interface Food {
  id: string
  name: string
  per100: Macros
  units?: { name: string; grams: number }[]
  source: 'user' | 'off' | 'seed'
  barcode?: string
}

export interface MealItem extends Macros {
  id: string
  foodId?: string
  name: string
  amount: string // human readable, e.g. "150 ג׳" or "2 יחידות"
  estimated?: boolean
}

export interface MealLog { id: string; date: string; type: MealType; items: MealItem[] }
export interface SavedMeal { id: string; name: string; items: Omit<MealItem, 'id'>[] }
export interface BodyWeight { date: string; kg: number }

// ---- Running (stage 3) ----
export type RunFeel = 'easy' | 'ok' | 'hard' | 'pain'
export interface Run {
  id: string
  date: string // YYYY-MM-DD (local)
  distanceKm: number
  durationSec: number
  avgHr?: number
  maxHr?: number
  source: 'manual' | 'strava' | 'file'
  stravaId?: number
  note?: string
  feel?: RunFeel
  /** Hard / quality effort (intervals, tempo). Easy runs are the default. */
  quality?: boolean
}
