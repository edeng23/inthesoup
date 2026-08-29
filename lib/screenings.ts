import { format, parseISO } from "date-fns"
import { moviesData, type Movie } from "@/data/movies"

export type Screening = Movie & {
  /** "YYYY-MM" key of the month the screening belongs to */
  monthKey: string
  /** 1-based position in the club's whole history, used as a catalogue number */
  no: number
}

/** Every month that has at least one screening, chronological. */
export const monthKeys: string[] = Object.keys(moviesData)
  .filter((key) => moviesData[key] && moviesData[key].length > 0)
  .sort()

/** Every screening ever, chronological, numbered like a catalogue. */
export const allScreenings: Screening[] = monthKeys
  .flatMap((monthKey) => moviesData[monthKey].map((movie) => ({ ...movie, monthKey })))
  .sort((a, b) => a.date.localeCompare(b.date))
  .map((screening, i) => ({ ...screening, no: i + 1 }))

export const screeningsByMonth: Record<string, Screening[]> = allScreenings.reduce(
  (acc, screening) => {
    ;(acc[screening.monthKey] ||= []).push(screening)
    return acc
  },
  {} as Record<string, Screening[]>
)

export function monthDate(monthKey: string): Date {
  return parseISO(`${monthKey}-01`)
}

export function monthLabel(monthKey: string, pattern = "MMMM yyyy"): string {
  return format(monthDate(monthKey), pattern)
}

/**
 * Index into `monthKeys` for the month to open on: today's month when the club
 * screened something, otherwise the nearest month that did (the most recent
 * past one, or the first upcoming one if the club hasn't started yet).
 */
export function defaultMonthIndex(today: Date = new Date()): number {
  const key = format(today, "yyyy-MM")
  const exact = monthKeys.indexOf(key)
  if (exact !== -1) return exact
  const upcoming = monthKeys.findIndex((k) => k > key)
  if (upcoming === -1) return monthKeys.length - 1
  return upcoming === 0 ? 0 : upcoming - 1
}

/** The next screening at or after `today`, or null once the schedule runs out. */
export function nextScreening(today: Date = new Date()): Screening | null {
  const key = format(today, "yyyy-MM-dd")
  return allScreenings.find((s) => s.date >= key) ?? null
}

export function daysUntil(dateISO: string, today: Date = new Date()): number {
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const target = parseISO(dateISO)
  return Math.round((target.getTime() - start.getTime()) / 86_400_000)
}

export const firstMonthKey = monthKeys[0]
export const lastMonthKey = monthKeys[monthKeys.length - 1]
export const totalScreenings = allScreenings.length

export type { Movie }
