import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import '../AdminPortal.css'
import ProductManagementPanel from '../components/ProductManagementPanel'
import { clearAdminUser } from '../lib/adminAuth'
import type { AdminUser } from '../lib/adminAuth'

type Props = {
  user: AdminUser
}

function AdminDashboardPage({ user }: Props) {
  const navigate = useNavigate()
  const [activeSection, setActiveSection] = useState<'dashboard' | 'product'>('dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const sidebarItems = useMemo(
    () => [
      { key: 'dashboard', label: 'Dashboard' },
      { key: 'product', label: 'Product' },
    ] as const,
    [],
  )

  const handleLogout = () => {
    clearAdminUser()
    navigate('/admin/login')
    setSidebarOpen(false)
  }

  const toggleSidebar = () => setSidebarOpen((prev) => !prev)

  const handleSectionChange = (section: 'dashboard' | 'product') => {
    setActiveSection(section)
    setSidebarOpen(false)
  }

  return (
    <div className="dashboard-layout">
      <div className="dashboard-topbar">
        <span className="dashboard-topbar-brand">Admin Panel</span>
        <button className="dashboard-menu-button" type="button" aria-label="Toggle menu" onClick={toggleSidebar}>
          ☰
        </button>
      </div>

      <div className={`dashboard-sidebar-backdrop ${sidebarOpen ? 'active' : ''}`} onClick={() => setSidebarOpen(false)} />

      <div className="dashboard-shell">
        <aside className={`dashboard-sidebar ${sidebarOpen ? 'mobile-open' : ''}`}>
          <div className="dashboard-sidebar-brand">Admin Panel</div>
          <div className="dashboard-sidebar-menu">
            {sidebarItems.map((item) => (
              <button
                key={item.key}
                className={`dashboard-sidebar-link ${activeSection === item.key ? 'active' : ''}`}
                onClick={() => handleSectionChange(item.key)}
                type="button"
              >
                {item.label}
              </button>
            ))}
          </div>
          <button className="dashboard-action dashboard-sidebar-logout" onClick={handleLogout}>Logout</button>
        </aside>

        <div className="dashboard-card">
          <div className="dashboard-header">
            <div>
              <div className="dashboard-badge">Admin Dashboard</div>
              <h1>Welcome, {user.name}</h1>
              <p className="dashboard-subtitle">
                Yeh page admin users ke liye hai. Aapka login `users` table me verify hone ke baad yahan redirect kiya gaya hai.
              </p>
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
                <h3>Access</h3>
                <p>Admin product management</p>
                <p>Gallery management</p>
                <p>Order tracking</p>
              </section>
              <section className="dashboard-panel">
                <h3>Next Step</h3>
                <p>Yahan se hum aage real admin modules connect kar sakte hain.</p>
              </section>
            </div>
          ) : (
            <ProductManagementPanel
              allowDelete={false}
              allowEdit={false}
              title="Product"
              description="Admin yahan se product add kar sakta hai aur current product list dekh sakta hai."
            />
          )}
        </div>
      </div>
    </div>
  )
}

export default AdminDashboardPage
