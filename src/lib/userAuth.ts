export type UserRole = 'user'

export type AuthUser = {
  id: number
  name: string
  phone: string
  email: string
  role: UserRole
  /** Normal users do not get a referral code; only affiliates do (separate login). */
  referral_code: string | null
  discount_percentage: number | null
}

const STORAGE_KEY = 'pure-himalyan-user'

function getStorage(): Storage | null {
  if (typeof window === 'undefined') {
    return null
  }

  try {
    return window.localStorage
  } catch {
    return null
  }
}

export function saveUser(user: AuthUser) {
  const storage = getStorage()

  if (!storage) {
    return
  }

  storage.setItem(STORAGE_KEY, JSON.stringify(user))
}

function parseStoredUser(storage: Storage, stored: string): AuthUser | null {
  let parsed: unknown

  try {
    parsed = JSON.parse(stored)
  } catch {
    storage.removeItem(STORAGE_KEY)
    return null
  }

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    storage.removeItem(STORAGE_KEY)
    return null
  }

  const o = parsed as Record<string, unknown>
  const idRaw = o.id
  const id = typeof idRaw === 'number' && Number.isFinite(idRaw) ? idRaw : Number(idRaw)
  if (!Number.isFinite(id) || id <= 0) {
    storage.removeItem(STORAGE_KEY)
    return null
  }

  const name = typeof o.name === 'string' ? o.name.trim() : ''
  const phone = typeof o.phone === 'string' ? o.phone : ''
  const email = typeof o.email === 'string' ? o.email.trim() : ''
  if (!name || !email) {
    storage.removeItem(STORAGE_KEY)
    return null
  }

  const role: UserRole = o.role === 'user' ? 'user' : 'user'

  let referral_code: string | null = null
  if (typeof o.referral_code === 'string' && o.referral_code.length > 0) {
    referral_code = o.referral_code
  }

  let discount_percentage: number | null = null
  if (o.discount_percentage != null) {
    const n = typeof o.discount_percentage === 'number' ? o.discount_percentage : Number(o.discount_percentage)
    discount_percentage = Number.isFinite(n) ? n : null
  }

  const user: AuthUser = {
    id,
    name,
    phone,
    email,
    role,
    referral_code,
    discount_percentage,
  }

  const normalized = JSON.stringify(user)
  if (normalized !== stored) {
    storage.setItem(STORAGE_KEY, normalized)
  }

  return user
}

export function getUser(): AuthUser | null {
  const storage = getStorage()

  if (!storage) {
    return null
  }

  const stored = storage.getItem(STORAGE_KEY)

  if (!stored) {
    return null
  }

  return parseStoredUser(storage, stored)
}

export function clearUser() {
  const storage = getStorage()

  if (!storage) {
    return
  }

  storage.removeItem(STORAGE_KEY)
}
