export function buildICS(params: {
  uid: string
  startAtUTC: string
  durationMinutes: number
  summary: string
  description?: string
  location?: string
  url?: string
}) {
  const dtStart = new Date(params.startAtUTC)
  const dtEnd = new Date(dtStart.getTime() + params.durationMinutes * 60_000)
  const fmt = (d: Date) =>
    `${d.getUTCFullYear()}${String(d.getUTCMonth() + 1).padStart(2, '0')}${String(d.getUTCDate()).padStart(2, '0')}T${String(d.getUTCHours()).padStart(2, '0')}${String(d.getUTCMinutes()).padStart(2, '0')}${String(d.getUTCSeconds()).padStart(2, '0')}Z`
  const now = fmt(new Date())
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Lookatfy//Scheduling//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${params.uid}`,
    `DTSTAMP:${now}`,
    `DTSTART:${fmt(dtStart)}`,
    `DTEND:${fmt(dtEnd)}`,
    `SUMMARY:${escapeText(params.summary)}`,
    params.description ? `DESCRIPTION:${escapeText(params.description)}` : undefined,
    params.location ? `LOCATION:${escapeText(params.location)}` : undefined,
    params.url ? `URL:${params.url}` : undefined,
    'END:VEVENT',
    'END:VCALENDAR',
  ].filter(Boolean)
  return lines.join('\r\n')
}

function escapeText(text: string) {
  return text.replace(/(\r\n|\n|\r)/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;')
}
