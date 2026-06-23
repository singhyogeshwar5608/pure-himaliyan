import { useEffect } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import type { ReactElement } from 'react'
import HomePage from './pages/HomePage'
import GalleryPage from './pages/GalleryPage'
import ProductsPage from './pages/ProductsPage'
import ProductDetailPage from './pages/ProductDetailPage'
import PrivacyPolicyPage from './pages/PrivacyPolicyPage'
import TermsPage from './pages/TermsPage'
import BlogPage from './pages/BlogPage'
import AdminLoginPage from './pages/AdminLoginPage'
import AdminDashboardPage from './pages/AdminDashboardPage'
import SuperAdminDashboardPage from './pages/SuperAdminDashboardPage'
import UserLoginPage from './pages/UserLoginPage'
import UserDashboardPage from './pages/UserDashboardPage'
import AffiliateLoginPage from './pages/AffiliateLoginPage'
import AffiliateDashboardPage from './pages/AffiliateDashboardPage'
import { getAdminUser } from './lib/adminAuth'

type ProtectedRole = 'admin' | 'super-admin'

function ScrollToTop() {
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
  }, [pathname])

  return null
}

function ProtectedRoute({ role, children }: { role: ProtectedRole; children: ReactElement }) {
  const user = getAdminUser()

  if (!user) {
    return <Navigate to="/admin/login" replace />
  }

  if (role === 'super-admin' && user.role !== 'super-admin') {
    return <Navigate to="/admin/dashboard" replace />
  }

  if (role === 'admin' && user.role !== 'admin' && user.role !== 'super-admin') {
    return <Navigate to="/admin/login" replace />
  }

  return children
}

function AdminDashboardRoute() {
  const user = getAdminUser()

  if (!user) {
    return <Navigate to="/admin/login" replace />
  }

  return <AdminDashboardPage user={user} />
}

function SuperAdminDashboardRoute() {
  const user = getAdminUser()

  if (!user) {
    return <Navigate to="/admin/login" replace />
  }

  return <SuperAdminDashboardPage user={user} />
}

function App() {
  const user = getAdminUser()

  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/gallery" element={<GalleryPage />} />
        <Route path="/products" element={<ProductsPage />} />
        <Route path="/products/:slug" element={<ProductDetailPage />} />
        <Route path="/privacy" element={<PrivacyPolicyPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/blog" element={<BlogPage />} />
        <Route path="/user/login" element={<UserLoginPage />} />
        <Route path="/user/dashboard" element={<UserDashboardPage />} />
        <Route path="/affiliate/login" element={<AffiliateLoginPage />} />
        <Route path="/affiliate/dashboard" element={<AffiliateDashboardPage />} />
        <Route
          path="/admin/login"
          element={user ? <Navigate to={user.role === 'super-admin' ? '/super-admin/dashboard' : '/admin/dashboard'} replace /> : <AdminLoginPage />}
        />
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute role="admin">
              <AdminDashboardRoute />
            </ProtectedRoute>
          }
        />
        <Route
          path="/super-admin/dashboard"
          element={
            <ProtectedRoute role="super-admin">
              <SuperAdminDashboardRoute />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  )
}

export default App
