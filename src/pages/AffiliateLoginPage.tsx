import { useState } from 'react'
import type { FormEvent } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import '../AdminPortal.css'
import { buildApiUrl } from '../lib/productApi'
import { getAffiliateUser, saveAffiliateUser } from '../lib/affiliateAuth'

type AuthResponse = {
  message: string
  user: {
    id: number
    name: string
    phone: string
    email: string
    role: 'affiliate'
    referral_code: string
    discount_percentage: number
  }
}

function AffiliateLoginPage() {
  const navigate = useNavigate()
  const [mode, setMode] = useState<'login' | 'register'>('register')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  if (getAffiliateUser()) {
    return <Navigate to="/affiliate/dashboard" replace />
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const response = await fetch(buildApiUrl(mode === 'register' ? '/api/affiliate/register' : '/api/affiliate/login'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(mode === 'register' ? { name, phone, email, password } : { email, password }),
      })

      const data = (await response.json()) as AuthResponse | { message?: string }

      if (!response.ok || !('user' in data)) {
        throw new Error(data.message || 'Request failed.')
      }

      saveAffiliateUser(data.user)
      setSuccess(data.message)
      navigate('/affiliate/dashboard')
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Request failed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="portal-shell">
      <div className="portal-card">
        <h1>{mode === 'register' ? 'Affiliate Register' : 'Affiliate Login'}</h1>
        <p className="portal-subtitle">
          {mode === 'register'
            ? 'Partner account banayein — details users table mein affiliate role ke saath save hongi. Referral code auto-generate hoga.'
            : 'Apne affiliate email aur password se login karein.'}
        </p>

        {error ? <div className="portal-error">{error}</div> : null}
        {success ? <div className="portal-success">{success}</div> : null}

        <form className="portal-form" onSubmit={handleSubmit}>
          {mode === 'register' ? (
            <>
              <label className="portal-field">
                <span>Name</span>
                <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Enter your name" required />
              </label>

              <label className="portal-field">
                <span>Phone Number</span>
                <input value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="Enter your number" required />
              </label>
            </>
          ) : null}

          <label className="portal-field">
            <span>Email</span>
            <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Enter your email" required />
          </label>

          <label className="portal-field">
            <span>Password</span>
            <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Enter your password" required />
          </label>

          <button className="portal-submit" type="submit" disabled={loading}>
            {loading ? 'Please wait...' : mode === 'register' ? 'Create Affiliate Account' : 'Login'}
          </button>

          <button className="portal-secondary" type="button" onClick={() => setMode((prev) => (prev === 'register' ? 'login' : 'register'))}>
            {mode === 'register' ? 'Already registered? Login' : 'Naye affiliate? Register'}
          </button>

          <button className="portal-secondary" type="button" onClick={() => navigate('/')}>
            Back to Home
          </button>
        </form>
      </div>
    </div>
  )
}

export default AffiliateLoginPage
