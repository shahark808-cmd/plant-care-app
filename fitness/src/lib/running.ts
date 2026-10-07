import type { Run } from '../types'

export const paceSecPerKm = (km: number, sec: number) => (km > 0 ? sec / km : 0)

export function formatPace(secPerKm: number): string {
  if (!secPerKm || !Number.isFinite(secPerKm)) return '-'
  const m = Math.floor(secPerKm / 60)
  const s = Math.round(secPerKm % 60)
  return s === 60 ? `${m + 1}:00` : `${m}:${String(s).padStart(2, '0')}`
}

export function formatDuration(sec: number): string {
  const h = Math.floor(sec / 3600)
  const m = Math.floor((sec % 3600) / 60)
  const s = Math.round(sec % 60)
  const mm = String(m).padStart(2, '0'), ss = String(s).padStart(2, '0')
  return h ? `${h}:${mm}:${ss}` : `${m}:${ss}`
}

/** Parses "mm:ss", "h:mm:ss" or plain minutes. Returns seconds or 0. */
export function parseDuration(text: string): number {
  const parts = text.trim().replace(',', '.').split(':').map(Number)
  if (parts.some((n) => Number.isNaN(n) || n < 0) || parts.length === 0 || text.trim() === '') return 0
  if (parts.length === 1) return Math.round(parts[0] * 60)
  if (parts.length === 2) return parts[0] * 60 + parts[1]
  return parts[0] * 3600 + parts[1] * 60 + parts[2]
}

const dayMs = 86_400_000
const toUtc = (d: string) => Date.UTC(+d.slice(0, 4), +d.slice(5, 7) - 1, +d.slice(8, 10))
const fromUtc = (ms: number) => new Date(ms).toISOString().slice(0, 10)

/** Israeli week: starts on Sunday. */
export function weekStart(date: string): string {
  const dow = new Date(toUtc(date)).getUTCDay()
  return fromUtc(toUtc(date) - dow * dayMs)
}

export const addDays = (date: string, n: number) => fromUtc(toUtc(date) + n * dayMs)

export function weeklyKm(runs: Run[], anyDayInWeek: string): number {
  const start = weekStart(anyDayInWeek)
  const end = addDays(start, 6)
  return Math.round(runs.filter((r) => r.date >= start && r.date <= end).reduce((a, r) => a + r.distanceKm, 0) * 100) / 100
}

export interface VolumeWarning { pct: number; prevKm: number; curKm: number }

/** Warn when weekly volume rises by more than `limit` (default 10%) over the previous week. */
export function volumeSpike(runs: Run[], today: string, limit = 0.1): VolumeWarning | null {
  const cur = weeklyKm(runs, today)
  const prev = weeklyKm(runs, addDays(weekStart(today), -1))
  if (prev <= 0 || cur <= prev * (1 + limit)) return null
  return { pct: Math.round(((cur - prev) / prev) * 100), prevKm: prev, curKm: cur }
}

/** Same day, distance within 5% and duration within 10%. */
export function isDuplicate(a: Run, b: Run): boolean {
  if (a.date !== b.date || a.id === b.id) return false
  const near = (x: number, y: number, tol: number) => Math.abs(x - y) <= Math.max(x, y) * tol
  return near(a.distanceKm, b.distanceKm, 0.05) && near(a.durationSec, b.durationSec, 0.1)
}

/** Pairs where a manual run has a synced/imported twin. */
export function findDuplicates(runs: Run[]): [Run, Run][] {
  const out: [Run, Run][] = []
  for (const m of runs.filter((r) => r.source === 'manual'))
    for (const o of runs.filter((r) => r.source !== 'manual')) if (isDuplicate(m, o)) out.push([m, o])
  return out
}

/** The manual record wins; the other source only fills what is missing. */
export function mergeRuns(manual: Run, other: Run): Run {
  return {
    ...manual,
    avgHr: manual.avgHr ?? other.avgHr,
    maxHr: manual.maxHr ?? other.maxHr,
    stravaId: manual.stravaId ?? other.stravaId,
  }
}

/** Heavy leg sessions within `hours` of a hard run (before or after). */
export function legsConflicts(runAtMs: number, legSessionsAtMs: number[], hours = 24): number[] {
  return legSessionsAtMs.filter((t) => Math.abs(t - runAtMs) < hours * 3_600_000)
}

// ---- GPX import (fallback for devices without Strava sync) ----
const rad = (d: number) => (d * Math.PI) / 180
export function haversineKm(a: [number, number], b: [number, number]): number {
  const dLat = rad(b[0] - a[0]), dLon = rad(b[1] - a[1])
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a[0])) * Math.cos(rad(b[0])) * Math.sin(dLon / 2) ** 2
  return 2 * 6371 * Math.asin(Math.sqrt(h))
}

export interface ParsedGpx { date: string; distanceKm: number; durationSec: number; avgHr?: number; maxHr?: number }

export function parseGpx(xml: string): ParsedGpx | null {
  const pts = [...xml.matchAll(/<trkpt\b[^>]*?lat="([-\d.]+)"[^>]*?lon="([-\d.]+)"[^>]*?>([\s\S]*?)<\/trkpt>/g)].map((m) => ({
    pos: [Number(m[1]), Number(m[2])] as [number, number],
    time: /<time>([^<]+)<\/time>/.exec(m[3])?.[1],
    hr: Number(/<(?:\w+:)?hr>(\d+)<\/(?:\w+:)?hr>/.exec(m[3])?.[1]) || undefined,
  }))
  if (pts.length < 2) return null
  let km = 0
  for (let i = 1; i < pts.length; i++) km += haversineKm(pts[i - 1].pos, pts[i].pos)
  const t0 = pts.find((p) => p.time)?.time, t1 = [...pts].reverse().find((p) => p.time)?.time
  if (!t0 || !t1) return null
  const sec = Math.round((Date.parse(t1) - Date.parse(t0)) / 1000)
  if (!(sec > 0) || !(km > 0)) return null
  const hrs = pts.map((p) => p.hr).filter((h): h is number => !!h)
  const local = new Date(Date.parse(t0))
  const p2 = (n: number) => String(n).padStart(2, '0')
  return {
    date: `${local.getFullYear()}-${p2(local.getMonth() + 1)}-${p2(local.getDate())}`,
    distanceKm: Math.round(km * 100) / 100,
    durationSec: sec,
    avgHr: hrs.length ? Math.round(hrs.reduce((a, b) => a + b, 0) / hrs.length) : undefined,
    maxHr: hrs.length ? Math.max(...hrs) : undefined,
  }
}
