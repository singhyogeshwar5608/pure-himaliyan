import { useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import '../AdminPortal.css'
import { saveAdminUser } from '../lib/adminAuth'
import { buildApiUrl } from '../lib/productApi'

type LoginResponse = {
  message: string
  redirectTo: string
  user: {
    id: number
    name: string
    email: string
    role: 'super-admin' | 'admin'
  }
}

function AdminLoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch(buildApiUrl('/api/admin/login'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })

      const data = (await response.json()) as LoginResponse | { message?: string }

      if (!response.ok || !('user' in data) || !('redirectTo' in data)) {
        throw new Error(data.message || 'Login failed.')
      }

      saveAdminUser(data.user)
      navigate(data.redirectTo)
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Login failed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="portal-shell">
      <div className="portal-card">
        <h1>Admin Login</h1>

        {error ? <div className="portal-error">{error}</div> : null}

        <form className="portal-form" onSubmit={handleSubmit}>
          <label className="portal-field">
            <span>Email ID</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="Enter admin email"
              required
            />
          </label>

          <label className="portal-field">
            <span>Password</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter password"
              required
            />
          </label>

          <button className="portal-submit" type="submit" disabled={loading}>
            {loading ? 'Checking...' : 'Login'}
          </button>

          <button className="portal-secondary" type="button" onClick={() => navigate('/')}>
            Back to Home
          </button>
        </form>
      </div>
    </div>
  )
}

export default AdminLoginPage
