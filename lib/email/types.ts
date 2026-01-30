const EMAIL_ENABLED_TYPES = new Set<string>([
  'booking_confirmed',
  'new_booking_assigned',
  'admin_announcement',
  'role_announcement',
])

export function shouldSendEmail(type?: string) {
  if (!type) return false
  return EMAIL_ENABLED_TYPES.has(type)
}
