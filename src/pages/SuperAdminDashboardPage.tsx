import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import '../AdminPortal.css'
import BannerManagementPanel from '../components/BannerManagementPanel'
import BlogManagementPanel from '../components/BlogManagementPanel'
import InquiryManagementPanel from '../components/InquiryManagementPanel'
import ProductManagementPanel from '../components/ProductManagementPanel'
import ReferralUsersPanel from '../components/ReferralUsersPanel'
import GalleryManagementPanel from '../components/GalleryManagementPanel'
import OrdersManagementPanel from '../components/OrdersManagementPanel'
import ReviewManagementPanel from '../components/ReviewManagementPanel'
import MobileBannerManagementPanel from '../components/MobileBannerManagementPanel'
import { SEO } from '../components/SEO'
import { clearAdminUser } from '../lib/adminAuth'
import type { AdminUser } from '../lib/adminAuth'

type Props = {
  user: AdminUser
}

type DashboardSection =
  | 'dashboard'
  | 'orders'
  | 'product'
  | 'reviews'
  | 'inquiry'
  | 'banner'
  | 'mobile-banner'
  | 'gallery'
  | 'referral-users'
  | 'blog'

function SuperAdminDashboardPage({ user }: Props) {
  const navigate = useNavigate()
  const [activeSection, setActiveSection] = useState<DashboardSection>('dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const sidebarItems = useMemo(
    () => [
      { key: 'dashboard', label: 'Dashboard', icon: '📊' },
      { key: 'orders', label: 'Orders', icon: '📦' },
      { key: 'product', label: 'Product', icon: '🛒' },
      { key: 'reviews', label: 'Reviews', icon: '⭐' },
      { key: 'inquiry', label: 'Inquiry', icon: '📧' },
      { key: 'banner', label: 'Banner Images', icon: '🖼️' },
      { key: 'mobile-banner', label: 'Mobile Banner Images', icon: '📱' },
      { key: 'gallery', label: 'Gallery', icon: '📷' },
      { key: 'referral-users', label: 'Referral Users', icon: '👥' },
      { key: 'blog', label: 'Blog', icon: '📝' },
    ] as const,
    [],
  )

  const handleLogout = () => {
    clearAdminUser()
    navigate('/admin/login')
    setSidebarOpen(false)
  }

  const toggleSidebar = () => setSidebarOpen((prev) => !prev)

  const handleSectionChange = (section: DashboardSection) => {
    setActiveSection(section)
    setSidebarOpen(false)
  }

  return (
    <div className="dashboard-layout">
      <SEO title="Super Admin Dashboard" description="Pure Himalyan super admin panel — full store management including orders, products, reviews, banners, gallery, and users." noIndex />
      <div className="dashboard-topbar">
        <span className="dashboard-topbar-brand">Super Admin</span>
        <button className="dashboard-menu-button" type="button" aria-label="Toggle menu" onClick={toggleSidebar}>
          ☰
        </button>
      </div>

      <div className={`dashboard-sidebar-backdrop ${sidebarOpen ? 'active' : ''}`} onClick={() => setSidebarOpen(false)} />

      <div className="dashboard-shell">
        <aside className={`dashboard-sidebar ${sidebarOpen ? 'mobile-open' : ''}`}>
          <div className="dashboard-sidebar-brand">Super Admin</div>
          
          <div className="dashboard-sidebar-user-info">
            <p className="dashboard-sidebar-user-name">{user.name}</p>
            <p className="dashboard-sidebar-user-email">{user.email}</p>
          </div>

          <div className="dashboard-sidebar-menu">
            {sidebarItems.map((item) => (
              <button
                key={item.key}
                className={`dashboard-sidebar-link ${activeSection === item.key ? 'active' : ''}`}
                onClick={() => handleSectionChange(item.key)}
                type="button"
              >
                <span className="dashboard-sidebar-link-icon">{item.icon}</span>
                {item.label}
              </button>
            ))}
          </div>
          <button className="dashboard-action dashboard-sidebar-logout" onClick={handleLogout}>
            <span>🚪</span> Logout
          </button>
        </aside>

        <div className="dashboard-card">
          <div className="dashboard-header">
            <div>
              <div className="dashboard-badge">Super Admin Dashboard</div>
              <h1>Welcome, {user.name}</h1>
            </div>
          </div>

          {activeSection === 'dashboard' ? (
            <div className="dashboard-grid">
              <section className="dashboard-panel">
                <h3>Profile</h3>
                <p><strong>Name:</strong> {user.name}</p>
                <p><strong>Email:</strong> {user.email}</p>
                <p><strong>Role:</strong> {user.role}</p>
              </section>
              <section className="dashboard-panel">
                <h3>High-Level Access</h3>
                <p>Admin management</p>
                <p>Role assignments</p>
                <p>System oversight</p>
              </section>
              <section className="dashboard-panel">
                <h3>Next Step</h3>
                <p>Yahan se hum super-admin specific controls aur analytics add kar sakte hain.</p>
              </section>
            </div>
          ) : activeSection === 'orders' ? (
            <OrdersManagementPanel />
          ) : activeSection === 'product' ? (
            <ProductManagementPanel
              allowDelete={true}
              allowEdit={true}
              title="Product Management"
              description="Super admin yahan se products add, view, edit aur delete kar sakta hai."
            />
          ) : activeSection === 'reviews' ? (
            <ReviewManagementPanel />
          ) : activeSection === 'inquiry' ? (
            <InquiryManagementPanel />
          ) : activeSection === 'banner' ? (
            <BannerManagementPanel />
          ) : activeSection === 'mobile-banner' ? (
            <MobileBannerManagementPanel />
          ) : activeSection === 'gallery' ? (
            <GalleryManagementPanel />
          ) : activeSection === 'blog' ? (
            <BlogManagementPanel />
          ) : (
            <ReferralUsersPanel />
          )}
        </div>
      </div>
    </div>
  )
}

export default SuperAdminDashboardPage
