import Dexie, { type Table } from 'dexie'
import type { AppSettings, BodyWeight, Exercise, Food, MealLog, SavedMeal, ExerciseSettings, WorkoutSession, WorkoutTemplate } from '../types'
import { SEED_EXERCISES } from '../data/exercises'
import { SEED_TEMPLATES } from '../data/templates'
import { DEFAULT_PROGRESSION } from './progression'

class FitnessDB extends Dexie {
  customExercises!: Table<Exercise, string>
  templates!: Table<WorkoutTemplate, string>
  sessions!: Table<WorkoutSession, string>
  exerciseSettings!: Table<ExerciseSettings, string>
  settings!: Table<AppSettings, string>
  foods!: Table<Food, string>
  meals!: Table<MealLog, string>
  savedMeals!: Table<SavedMeal, string>
  bodyWeights!: Table<BodyWeight, string>

  constructor() {
    super('fitness-app')
    this.version(1).stores({
      customExercises: 'id',
      templates: 'id, weekday',
      sessions: 'id, date, finishedAt',
      exerciseSettings: 'exerciseId',
      settings: 'id',
    })
    this.version(2).stores({
      foods: 'id, name, barcode',
      meals: 'id, date',
      savedMeals: 'id',
      bodyWeights: 'date',
    })
  }
}

export const db = new FitnessDB()

export const DEFAULT_SETTINGS: AppSettings = {
  id: 'main',
  progression: DEFAULT_PROGRESSION,
  theme: 'auto',
  barKg: 20,
  plates: [25, 20, 15, 10, 5, 2.5, 1.25],
  defaultRestSec: 90,
  warmupPcts: [0.5, 0.75],
}

export const uid = () => crypto.randomUUID()

export const todayStr = (d = new Date()) => {
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

export async function getSettings(): Promise<AppSettings> {
  const s = await db.settings.get('main')
  return s ? { ...DEFAULT_SETTINGS, ...s, progression: { ...DEFAULT_PROGRESSION, ...s.progression } } : DEFAULT_SETTINGS
}

export async function seedIfEmpty() {
  if ((await db.settings.count()) === 0) {
    await db.settings.put(DEFAULT_SETTINGS)
    await db.templates.bulkPut(SEED_TEMPLATES)
  }
}

export async function allExercises(): Promise<Exercise[]> {
  return [...SEED_EXERCISES, ...(await db.customExercises.toArray())]
}
