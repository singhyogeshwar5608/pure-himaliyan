export type AdminRole = 'super-admin' | 'admin'

export type AdminUser = {
  id: number
  name: string
  email: string
  role: AdminRole
}

const STORAGE_KEY = 'pure-himalyan-admin-user'

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

export function saveAdminUser(user: AdminUser) {
  const storage = getStorage()

  if (!storage) {
    return
  }

  storage.setItem(STORAGE_KEY, JSON.stringify(user))
}

export function getAdminUser(): AdminUser | null {
  const storage = getStorage()

  if (!storage) {
    return null
  }

  const stored = storage.getItem(STORAGE_KEY)

  if (!stored) {
    return null
  }

  try {
    return JSON.parse(stored) as AdminUser
  } catch {
    storage.removeItem(STORAGE_KEY)
    return null
  }
}

export function clearAdminUser() {
  const storage = getStorage()

  if (!storage) {
    return
  }

  storage.removeItem(STORAGE_KEY)
}
