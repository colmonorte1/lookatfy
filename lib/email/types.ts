const EMAIL_ENABLED_TYPES = new Set<string>([
  // Bookings
  'booking_confirmed',
  'new_booking_assigned',
  'booking_cancelled',
  // Disputes
  'dispute_opened',
  'dispute_resolved',
  // Withdrawals
  'withdrawal_approved',
  'withdrawal_paid',
  'withdrawal_rejected',
  // Expert
  'expert_verified',
  'expert_unverified',
  // Admin
  'admin_announcement',
  'role_announcement',
])

export function shouldSendEmail(type?: string) {
  if (!type) return false
  return EMAIL_ENABLED_TYPES.has(type)
}
