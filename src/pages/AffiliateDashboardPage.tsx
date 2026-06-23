import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import '../AdminPortal.css'
import ProductAdsPanel from '../components/ProductAdsPanel'
import {
  fetchAffiliateProductDiscounts,
  fetchGallery,
  fetchProducts,
  fetchUserDashboard,
  saveAffiliateProductCustomerDiscount,
} from '../lib/productApi'
import type {
  AffiliateProductDiscountRow,
  AffiliateWalletTransactionRecord,
  GalleryRecord,
  OrderRecord,
  ProductRecord,
  ReferralOrderRecord,
  UserDashboardResponse,
} from '../lib/productApi'
import { buildProductReferralLink } from '../lib/referralLink'
import { clearAffiliateUser, getAffiliateUser } from '../lib/affiliateAuth'

type AffiliateSection = 'overview' | 'discounts' | 'links' | 'ads' | 'wallet' | 'referral-orders' | 'profile' | 'orders'

function AffiliateDashboardPage() {
  const navigate = useNavigate()
  const [activeSection, setActiveSection] = useState<AffiliateSection>('overview')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [dashboard, setDashboard] = useState<UserDashboardResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [shareProducts, setShareProducts] = useState<ProductRecord[]>([])
  const [shareProductsLoading, setShareProductsLoading] = useState(false)
  const [shareProductsError, setShareProductsError] = useState('')
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null)
  const [discountRows, setDiscountRows] = useState<AffiliateProductDiscountRow[]>([])
  const [discountLoading, setDiscountLoading] = useState(false)
  const [discountError, setDiscountError] = useState('')
  const [discountInputs, setDiscountInputs] = useState<Record<number, string>>({})
  const [savingProductId, setSavingProductId] = useState<number | null>(null)
  const [galleryItems, setGalleryItems] = useState<GalleryRecord[]>([])

  const user = useMemo(() => getAffiliateUser(), [])

  const sidebarItems = useMemo(
    () =>
      [
        { key: 'overview' as const, label: 'Overview', icon: '📊' },
        { key: 'discounts' as const, label: 'Discount settings', icon: '🏷️' },
        { key: 'links' as const, label: 'Product links', icon: '🔗' },
        { key: 'ads' as const, label: 'Product ads', icon: '📢' },
        { key: 'wallet' as const, label: 'Wallet', icon: '💰' },
        { key: 'referral-orders' as const, label: 'Referral orders', icon: '📝' },
        { key: 'profile' as const, label: 'Profile', icon: '👤' },
        { key: 'orders' as const, label: 'My purchases', icon: '🛍️' },
      ] as const,
    [],
  )

  useEffect(() => {
    if (!user) {
      navigate('/affiliate/login', { replace: true })
      return
    }

    const loadDashboard = async () => {
      setLoading(true)
      setError('')

      try {
        const data = await fetchUserDashboard(user.id)
        setDashboard(data)
      } catch (requestError) {
        setError(requestError instanceof Error ? requestError.message : 'Unable to load dashboard.')
      } finally {
        setLoading(false)
      }
    }

    void loadDashboard()
  }, [navigate, user])

  useEffect(() => {
    if (!user) {
      return
    }

    const loadProducts = async () => {
      setShareProductsLoading(true)
      setShareProductsError('')

      try {
        const [list, gallery] = await Promise.all([
          fetchProducts(),
          fetchGallery()
        ])
        setShareProducts(list.filter((item) => item.is_active))
        setGalleryItems(gallery)
      } catch (requestError) {
        setShareProductsError(requestError instanceof Error ? requestError.message : 'Data load nahi ho paya.')
      } finally {
        setShareProductsLoading(false)
      }
    }

    void loadProducts()
  }, [user])

  const reloadDiscountRows = useCallback(async () => {
    if (!user) {
      return
    }

    setDiscountLoading(true)
    setDiscountError('')

    try {
      const data = await fetchAffiliateProductDiscounts(user.id)
      setDiscountRows(data.items)
      const next: Record<number, string> = {}
      for (const row of data.items) {
        next[row.product_id] = String(row.configured_pool_share_percent ?? row.implied_pool_share_percent ?? 0)
      }
      setDiscountInputs(next)
    } catch (requestError) {
      setDiscountError(requestError instanceof Error ? requestError.message : 'Discount settings load nahi ho paye.')
    } finally {
      setDiscountLoading(false)
    }
  }, [user])

  useEffect(() => {
    if (!user) {
      return
    }

    void reloadDiscountRows()
  }, [user, reloadDiscountRows])

  const handleLogout = () => {
    clearAffiliateUser()
    navigate('/affiliate/login')
    setSidebarOpen(false)
  }

  const toggleSidebar = () => setSidebarOpen((prev) => !prev)

  const handleSectionChange = (section: AffiliateSection) => {
    setActiveSection(section)
    setSidebarOpen(false)
  }

  const orders = dashboard?.orders || []
  const referralOrdersList = dashboard?.referral_orders ?? []
  const walletTransactions = dashboard?.affiliate_wallet_transactions ?? []
  const walletBalance = dashboard?.affiliate_wallet_balance ?? '0.00'

  const copyAffiliateProductLink = async (slug: string, referralCode: string) => {
    const link = buildProductReferralLink(window.location.origin, slug, referralCode)

    try {
      await navigator.clipboard.writeText(link)
      setCopiedSlug(slug)
      window.setTimeout(() => setCopiedSlug(null), 2000)
    } catch {
      window.prompt('Link copy karein:', link)
    }
  }

  const handleSaveProductDiscount = async (row: AffiliateProductDiscountRow) => {
    if (!user) {
      return
    }

    const raw = discountInputs[row.product_id] ?? '0'
    const parsed = parseFloat(raw)
    const value = isFinite(parsed) ? parsed : 0
    const maxPool = row.max_pool_share_percent ?? 100
    const capped = Math.min(Math.max(0, value), maxPool)

    setSavingProductId(row.product_id)
    setDiscountError('')

    try {
      // We round to nearest integer to maintain compatibility with existing integer-based logic if any
      await saveAffiliateProductCustomerDiscount(user.id, row.product_id, Math.round(capped))
      await reloadDiscountRows()
    } catch (requestError) {
      setDiscountError(requestError instanceof Error ? requestError.message : 'Save failed.')
    } finally {
      setSavingProductId(null)
    }
  }

  if (!user) {
    return null
  }

  return (
    <div className="dashboard-layout">
      <div className="dashboard-topbar">
        <span className="dashboard-topbar-brand">Affiliate Panel</span>
        <button className="dashboard-menu-button" type="button" aria-label="Toggle menu" onClick={toggleSidebar}>
          ☰
        </button>
      </div>

      <div className={`dashboard-sidebar-backdrop ${sidebarOpen ? 'active' : ''}`} onClick={() => setSidebarOpen(false)} role="presentation" />

      <div className="dashboard-shell">
        <aside className={`dashboard-sidebar ${sidebarOpen ? 'mobile-open' : ''}`}>
          <div className="dashboard-sidebar-brand">Affiliate Panel</div>
          
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
            <Link 
              to="/" 
              className="dashboard-sidebar-link" 
              style={{ textDecoration: 'none' }} 
              onClick={() => setSidebarOpen(false)}
            >
              <span className="dashboard-sidebar-link-icon">🏠</span>
              Store home
            </Link>
          </div>
          <button className="dashboard-action dashboard-sidebar-logout" type="button" onClick={handleLogout}>
            <span>🚪</span> Logout
          </button>
        </aside>

        <div className="dashboard-card">
          <div className="dashboard-header">
            <div>
              <div className="dashboard-badge">Affiliate Dashboard</div>
              <h1>Welcome, {dashboard?.user.name ?? user.name}</h1>
            </div>
          </div>

          {error ? <div className="portal-error">{error}</div> : null}

          {loading ? (
            <p className="dashboard-subtitle" style={{ marginTop: 0 }}>
              Loading dashboard…
            </p>
          ) : null}

          {!loading && dashboard ? (
            <>
              {activeSection === 'overview' ? (
                <div className="dashboard-grid">
                  <section className="dashboard-panel">
                    <h3>Total orders</h3>
                    <p style={{ fontSize: '2rem', fontWeight: 800, margin: '8px 0' }}>{dashboard.stats.total_orders}</p>
                    <p style={{ color: '#64748b', margin: 0 }}>Aapke account se judi order activity.</p>
                  </section>
                  <section className="dashboard-panel">
                    <h3>Referral orders</h3>
                    <p style={{ fontSize: '2rem', fontWeight: 800, margin: '8px 0' }}>{dashboard.stats.referral_orders}</p>
                    <p style={{ color: '#64748b', margin: 0 }}>Aapke referral code se complete hue orders.</p>
                  </section>
                  <section className="dashboard-panel">
                    <h3>Referral code</h3>
                    <p style={{ fontSize: '1.35rem', fontWeight: 800, margin: '8px 0', letterSpacing: '0.08em', fontFamily: 'ui-monospace, monospace' }}>
                      {dashboard.user.referral_code}
                    </p>
                    <p style={{ color: '#64748b', margin: 0 }}>
                      <strong>Discount settings</strong> tab mein har product par discount set karein.
                    </p>
                  </section>
                  <section className="dashboard-panel">
                    <h3>Wallet balance</h3>
                    <p style={{ fontSize: '2rem', fontWeight: 800, margin: '8px 0' }}>₹{walletBalance}</p>
                    <p style={{ color: '#64748b', margin: 0 }}>Order complete (place) hone par credit — detail <strong>Wallet</strong> tab mein.</p>
                  </section>
                </div>
              ) : null}

              {activeSection === 'discounts' ? (
                <section className="dashboard-panel dashboard-panel-wide">
                  <div className="product-toolbar" style={{ marginBottom: 12 }}>
                    <div>
                      <h3 style={{ margin: 0 }}>Discount Settings</h3>
                    </div>
                  </div>
                  {discountError ? <div className="portal-error">{discountError}</div> : null}
                  {discountLoading ? (
                    <p className="dashboard-subtitle" style={{ marginTop: 0 }}>
                      Loading…
                    </p>
                  ) : discountRows.length === 0 ? (
                    <p className="product-empty">Koi active product nahi mila.</p>
                  ) : (
                    <div className="product-table-wrap">
                      <table className="product-table inquiry-table">
                        <thead>
                          <tr>
                            <th>Product</th>
                            <th>Total Discount</th>
                            <th>Discount Setting</th>
                            <th>Remaining Amount</th>
                            <th />
                          </tr>
                        </thead>
                        <tbody>
                          {discountRows.map((row) => {
                            const priceNum = parseFloat(row.price) || 0
                            const totalDiscountAmount = (priceNum * (row.affiliate_commission_percent ?? 0)) / 100
                            
                            const currentPercent = parseFloat(discountInputs[row.product_id] ?? '0') || 0
                            const customerDiscountAmount = (totalDiscountAmount * currentPercent) / 100
                            const remainingAmount = totalDiscountAmount - customerDiscountAmount

                            const disabled = totalDiscountAmount <= 0
                            const inputVal = customerDiscountAmount.toFixed(0)

                            return (
                              <tr key={row.product_id}>
                                <td>
                                  <strong>{row.name}</strong>
                                  <div style={{ color: '#64748b', fontSize: '0.82rem', marginTop: 4 }}>Price: ₹{row.price}</div>
                                </td>
                                <td>
                                  <strong>₹{totalDiscountAmount.toFixed(0)}</strong>
                                </td>
                                <td>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <span style={{ color: '#64748b' }}>₹</span>
                                    <input
                                      type="number"
                                      min={0}
                                      max={totalDiscountAmount}
                                      disabled={disabled}
                                      value={inputVal}
                                      onChange={(event) => {
                                        const newAmount = parseFloat(event.target.value) || 0
                                        const newPercent = totalDiscountAmount > 0 ? (newAmount / totalDiscountAmount) * 100 : 0
                                        setDiscountInputs((prev) => ({
                                          ...prev,
                                          [row.product_id]: String(Math.min(100, Math.max(0, newPercent))),
                                        }))
                                      }}
                                      className="inquiry-filter-input"
                                      style={{ maxWidth: '6rem' }}
                                    />
                                  </div>
                                </td>
                                <td>₹{remainingAmount.toFixed(0)}</td>
                                <td>
                                  <button
                                    type="button"
                                    className="product-action-button"
                                    disabled={disabled || savingProductId === row.product_id}
                                    onClick={() => void handleSaveProductDiscount(row)}
                                  >
                                    {savingProductId === row.product_id ? 'Saving…' : 'Save'}
                                  </button>
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </section>
              ) : null}

              {activeSection === 'links' ? (
                <section className="dashboard-panel dashboard-panel-wide">
                  <div className="product-toolbar" style={{ marginBottom: 12 }}>
                    <div>
                      <h3 style={{ margin: 0 }}>Product share links</h3>
                      <p className="dashboard-subtitle" style={{ marginTop: 8, marginBottom: 0 }}>
                        Har link mein code <strong>{dashboard.user.referral_code}</strong>. Customer order kare to admin orders mein aapka naam / role dikhega.
                      </p>
                    </div>
                  </div>
                  {shareProductsError ? <div className="portal-error">{shareProductsError}</div> : null}
                  {shareProductsLoading ? (
                    <p className="dashboard-subtitle" style={{ marginTop: 0 }}>
                      Products load ho rahe hain…
                    </p>
                  ) : shareProducts.length === 0 ? (
                    <p className="product-empty">Koi active product nahi mila.</p>
                  ) : (
                    <div className="product-table-wrap">
                      <table className="product-table inquiry-table">
                        <thead>
                          <tr>
                            <th>Product</th>
                            <th>Share link</th>
                            <th />
                          </tr>
                        </thead>
                        <tbody>
                          {shareProducts.map((item) => (
                            <tr key={item.id}>
                              <td>
                                <strong>{item.name}</strong>
                                <div style={{ color: '#64748b', fontSize: '0.82rem', marginTop: 4 }}>{item.slug}</div>
                              </td>
                              <td>
                                <code style={{ fontSize: '0.78rem', wordBreak: 'break-all', display: 'block', maxWidth: 'min(42rem, 100%)' }}>
                                  {buildProductReferralLink(window.location.origin, item.slug, dashboard.user.referral_code ?? '')}
                                </code>
                              </td>
                              <td>
                                <button
                                  type="button"
                                  className="product-action-button"
                                  onClick={() => void copyAffiliateProductLink(item.slug, dashboard.user.referral_code ?? '')}
                                >
                                  {copiedSlug === item.slug ? 'Copied!' : 'Copy link'}
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </section>
              ) : null}

              {activeSection === 'ads' ? (
                <ProductAdsPanel 
                  gallery={galleryItems} 
                  referralCode={dashboard.user.referral_code ?? ''} 
                />
              ) : null}

              {activeSection === 'wallet' ? (
                <div className="dashboard-grid" style={{ gridTemplateColumns: '1fr' }}>
                  <section className="dashboard-panel dashboard-panel-wide">
                    <h3>Wallet</h3>
                    <p style={{ fontSize: '1.75rem', fontWeight: 800, margin: '0 0 12px' }}>₹{walletBalance}</p>
                    <h4 style={{ marginTop: '1.25rem', marginBottom: 8 }}>Recent credits</h4>
                    {walletTransactions.length === 0 ? (
                      <p className="product-empty">Abhi koi wallet transaction nahi.</p>
                    ) : (
                      <div className="product-table-wrap">
                        <table className="product-table inquiry-table">
                          <thead>
                            <tr>
                              <th>Date</th>
                              <th>Order</th>
                              <th>Total Disc ₹</th>
                              <th>Customer Disc ₹</th>
                              <th>Credit ₹</th>
                              <th>Balance after</th>
                            </tr>
                          </thead>
                          <tbody>
                            {walletTransactions.map((row: AffiliateWalletTransactionRecord) => (
                              <tr key={row.id}>
                                <td>{new Date(row.created_at).toLocaleString()}</td>
                                <td>#{row.order_id}</td>
                                <td>{row.commission_pool_amount != null ? `₹${row.commission_pool_amount}` : '—'}</td>
                                <td>{row.customer_discount_amount != null ? `₹${row.customer_discount_amount}` : '—'}</td>
                                <td>
                                  <strong>{row.amount != null ? `₹${row.amount}` : '—'}</strong>
                                </td>
                                <td>{row.balance_after != null ? `₹${row.balance_after}` : '—'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </section>
                </div>
              ) : null}

              {activeSection === 'referral-orders' ? (
                <section className="dashboard-panel dashboard-panel-wide">
                  <div className="product-toolbar" style={{ marginBottom: 12 }}>
                    <div>
                      <h3 style={{ margin: 0 }}>Referral orders</h3>
                      <p className="dashboard-subtitle" style={{ marginTop: 8, marginBottom: 0 }}>
                        Jo orders aapke referral code / link se aaye — aur wallet credit (agar apply hua).
                      </p>
                    </div>
                  </div>
                  {referralOrdersList.length === 0 ? (
                    <p className="product-empty">Abhi koi referral order nahi.</p>
                  ) : (
                    <div className="product-table-wrap">
                      <table className="product-table inquiry-table">
                        <thead>
                          <tr>
                            <th>Order</th>
                            <th>Product</th>
                            <th>Final ₹</th>
                            <th>Buyer Disc ₹</th>
                            <th>Total Disc ₹</th>
                            <th>Wallet +₹</th>
                            <th>Status</th>
                            <th>Date</th>
                          </tr>
                        </thead>
                        <tbody>
                          {referralOrdersList.map((order: ReferralOrderRecord) => (
                            <tr key={order.id}>
                              <td>#{order.id}</td>
                              <td>{order.product_name}</td>
                              <td>₹{order.grand_total ?? order.final_price ?? order.product_price}</td>
                              <td>{order.discount_amount ? `₹${order.discount_amount}` : '—'}</td>
                              <td>{order.commission_pool_amount != null ? `₹${order.commission_pool_amount}` : '—'}</td>
                              <td>{order.affiliate_wallet_credit != null ? `₹${order.affiliate_wallet_credit}` : order.affiliate_wallet_credited ? '₹0' : '—'}</td>
                              <td>{order.status}</td>
                              <td>{new Date(order.created_at).toLocaleString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </section>
              ) : null}

              {activeSection === 'profile' ? (
                <div className="dashboard-grid">
                  <section className="dashboard-panel">
                    <h3>Account</h3>
                    <p>
                      <strong>Name:</strong> {dashboard.user.name}
                    </p>
                    <p>
                      <strong>Email:</strong> {dashboard.user.email}
                    </p>
                    <p>
                      <strong>Phone:</strong> {dashboard.user.phone}
                    </p>
                    <p>
                      <strong>Role:</strong> {dashboard.user.role}
                    </p>
                  </section>
                  <section className="dashboard-panel">
                    <h3>Referral</h3>
                    <p>
                      <strong>Code:</strong>{' '}
                      <span style={{ fontFamily: 'ui-monospace, monospace', fontWeight: 700, letterSpacing: '0.06em' }}>{dashboard.user.referral_code}</span>
                    </p>
                    <p>
                      <strong>Referral default (price par %):</strong> {dashboard.user.discount_percentage}% — sirf un products ke liye jahan aapne manual discount set nahi kiya hai.
                    </p>
                  </section>
                </div>
              ) : null}

              {activeSection === 'orders' ? (
                <section className="dashboard-panel dashboard-panel-wide">
                  <div className="product-toolbar" style={{ marginBottom: 12 }}>
                    <div>
                      <h3 style={{ margin: 0 }}>My purchases</h3>
                      <p className="dashboard-subtitle" style={{ marginTop: 8, marginBottom: 0 }}>
                        Aapke phone / email se place hue orders (referral list alag tab mein).
                      </p>
                    </div>
                  </div>
                  {orders.length === 0 ? (
                    <p className="product-empty">No orders found yet.</p>
                  ) : (
                    <div className="product-table-wrap">
                      <table className="product-table inquiry-table">
                        <thead>
                          <tr>
                            <th>Order ID</th>
                            <th>Product</th>
                            <th>Final Price</th>
                            <th>Discount</th>
                            <th>Status</th>
                            <th>Date</th>
                          </tr>
                        </thead>
                        <tbody>
                          {orders.map((order: OrderRecord) => (
                            <tr key={order.id}>
                              <td>#{order.id}</td>
                              <td>{order.product_name}</td>
                              <td>₹{order.grand_total ?? order.final_price ?? order.product_price}</td>
                              <td>{order.discount_percentage ? `${order.discount_percentage}%` : '—'}</td>
                              <td>{order.status}</td>
                              <td>{new Date(order.created_at).toLocaleString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </section>
              ) : null}
            </>
          ) : null}
        </div>
      </div>
    </div>
  )
}

export default AffiliateDashboardPage
