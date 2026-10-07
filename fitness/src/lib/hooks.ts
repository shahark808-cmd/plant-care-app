import { useLiveQuery } from 'dexie-react-hooks'
import { useMemo } from 'react'
import { SEED_EXERCISES } from '../data/exercises'
import type { Exercise } from '../types'
import { DEFAULT_SETTINGS, db } from './db'

export function useSettings() {
  const s = useLiveQuery(() => db.settings.get('main'), [])
  return useMemo(() => (s ? { ...DEFAULT_SETTINGS, ...s, progression: { ...DEFAULT_SETTINGS.progression, ...s.progression } } : DEFAULT_SETTINGS), [s])
}

export function useExercises() {
  const custom = useLiveQuery(() => db.customExercises.toArray(), [], [])
  const list = useMemo(() => [...SEED_EXERCISES, ...custom], [custom])
  const byId = useMemo(() => new Map(list.map((e) => [e.id, e] as const)), [list])
  return { list, byId }
}

export const exerciseName = (byId: Map<string, Exercise>, id: string) => byId.get(id)?.nameHe ?? id

export function useFinishedSessions() {
  return useLiveQuery(() => db.sessions.where('finishedAt').above(0).reverse().sortBy('date'), [], [])
}
