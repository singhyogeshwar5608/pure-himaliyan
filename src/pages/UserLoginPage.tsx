import { useMemo, useState, useEffect } from 'react'
import type { FormEvent } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import '../AdminPortal.css'
import '../App.css'
import { buildApiUrl } from '../lib/productApi'
import { SEO } from '../components/SEO'
import Header from '../components/Header'
import Footer from '../components/Footer'
import { saveUser, getUser } from '../lib/userAuth'

type AuthResponse = {
  message: string
  user: {
    id: number
    name: string
    phone: string
    email: string
    role: 'user'
    referral_code: string | null
    discount_percentage: number | null
  }
}

function UserLoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  // Redirect if already logged in
  useEffect(() => {
    if (getUser()) {
      navigate('/user/dashboard', { replace: true })
    }
  }, [navigate])

  const redirectAfterAuth = useMemo(() => {
    const raw =
      location.state && typeof location.state === 'object' && location.state !== null && 'redirectAfterAuth' in location.state
        ? (location.state as { redirectAfterAuth?: unknown }).redirectAfterAuth
        : undefined
    if (typeof raw !== 'string' || raw === '') {
      return null
    }
    if (!raw.startsWith('/') || raw.startsWith('//')) {
      return null
    }
    return raw
  }, [location.state])

  const [mode, setMode] = useState<'login' | 'register'>('register')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const response = await fetch(buildApiUrl(mode === 'register' ? '/api/user/register' : '/api/user/login'), {
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

      saveUser(data.user)
      setSuccess(data.message)
      navigate(redirectAfterAuth ?? '/user/dashboard', { replace: true })
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Request failed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="site-shell gallery-page">
      <SEO title="User Login / Register" description="Login or create your Pure Himalyan account to order Himalayan Shilajit and track your purchases." canonical="https://purehimalyan.com/user/login" noIndex />
      <Header />

      <div className="portal-shell" style={{ minHeight: '60vh', padding: '4rem 1rem' }}>
        <div className="portal-card">
          <h1>{mode === 'register' ? 'User Register' : 'User Login'}</h1>
          <p className="portal-subtitle">
            {redirectAfterAuth
              ? 'Aage badhne ke liye pehle login / register karein — uske baad aap wapas product page par jayenge.'
              : mode === 'register'
                ? 'Name, number, email aur password ke saath account banao.'
                : 'Apne email aur password se login karo.'}
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
              {loading ? 'Please wait...' : mode === 'register' ? 'Create Account' : 'Login'}
            </button>

            <button className="portal-secondary" type="button" onClick={() => setMode((prev) => (prev === 'register' ? 'login' : 'register'))}>
              {mode === 'register' ? 'Already have an account? Login' : 'New user? Register'}
            </button>
          </form>
        </div>
      </div>

      <Footer />
    </main>
  )
}

export default UserLoginPage
