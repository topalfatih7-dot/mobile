// @ts-nocheck

export function getRemainingDays(expiresAt) {
  if (!expiresAt) return null
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  const exp = new Date(expiresAt)
  exp.setHours(0, 0, 0, 0)
  return Math.ceil((exp - now) / (1000 * 60 * 60 * 24))
}
