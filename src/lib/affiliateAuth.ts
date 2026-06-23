export type AffiliateAuthUser = {
  id: number
  name: string
  phone: string
  email: string
  role: 'affiliate'
  referral_code: string
  discount_percentage: number
}

const STORAGE_KEY = 'pure-himalyan-affiliate'

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

export function saveAffiliateUser(user: AffiliateAuthUser) {
  const storage = getStorage()

  if (!storage) {
    return
  }

  storage.setItem(STORAGE_KEY, JSON.stringify(user))
}

export function getAffiliateUser(): AffiliateAuthUser | null {
  const storage = getStorage()

  if (!storage) {
    return null
  }

  const stored = storage.getItem(STORAGE_KEY)

  if (!stored) {
    return null
  }

  try {
    const parsed = JSON.parse(stored) as AffiliateAuthUser
    if (parsed.role !== 'affiliate') {
      storage.removeItem(STORAGE_KEY)
      return null
    }
    return parsed
  } catch {
    storage.removeItem(STORAGE_KEY)
    return null
  }
}

export function clearAffiliateUser() {
  const storage = getStorage()

  if (!storage) {
    return
  }

  storage.removeItem(STORAGE_KEY)
}
