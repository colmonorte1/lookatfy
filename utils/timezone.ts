import { format } from 'date-fns'
import { toZonedTime, fromZonedTime } from 'date-fns-tz'

export function toUTC(dateInTZ: Date, tz: string): Date {
  return fromZonedTime(dateInTZ, tz)
}

export function fromUTC(utcDate: Date, tz: string): Date {
  return toZonedTime(utcDate, tz)
}

export function formatInTZ(utcDate: Date, tz: string, pattern: string): string {
  const zoned = toZonedTime(utcDate, tz)
  return format(zoned, pattern)
}

export function buildLocalDate(year: number, month: number, day: number, hours: number, minutes: number, tz: string): Date {
  const local = new Date(year, month - 1, day, hours, minutes, 0, 0)
  return fromZonedTime(local, tz)
}

export function addMinutesUTC(utcDate: Date, minutes: number): Date {
  return new Date(utcDate.getTime() + minutes * 60_000)
}

export function toISODateInTZ(utcDate: Date, tz: string): string {
  const zoned = toZonedTime(utcDate, tz)
  const y = zoned.getFullYear()
  const m = String(zoned.getMonth() + 1).padStart(2, '0')
  const d = String(zoned.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function toISOTimeInTZ(utcDate: Date, tz: string): string {
  const zoned = toZonedTime(utcDate, tz)
  const hh = String(zoned.getHours()).padStart(2, '0')
  const mm = String(zoned.getMinutes()).padStart(2, '0')
  return `${hh}:${mm}`
}
