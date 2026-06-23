import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import '../App.css'
import { fetchUserDashboard, resolveProductImageUrl } from '../lib/productApi'
import type { OrderRecord, UserDashboardResponse } from '../lib/productApi'
import { SEO } from '../components/SEO'
import Header from '../components/Header'
import Footer from '../components/Footer'
import { clearUser, getUser } from '../lib/userAuth'

function formatOrderDate(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function orderAmount(order: OrderRecord) {
  return order.grand_total ?? order.final_price ?? order.product_price
}

function orderStatusLabel(order: OrderRecord) {
  const raw = (order.status || '').trim()
  if (!raw) {
    return 'Processing'
  }
  return raw.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

function orderProcessingHint(order: OrderRecord) {
  const ship = (order.shiprocket_status || '').toLowerCase()
  if (ship === 'created') {
    return 'Shipment booked — tracking SMS / updates from the courier will follow.'
  }
  if (ship === 'failed') {
    return 'Shipping sync delayed — our team may contact you to complete dispatch.'
  }
  if (ship === 'not_configured') {
    return 'Order received — dispatch & logistics are being arranged.'
  }
  return 'We are processing your purchase and will update you as it moves forward.'
}

function paymentSummary(order: OrderRecord) {
  const method = order.payment_method === 'online' ? 'Online (UPI / card / netbanking)' : 'Cash on delivery'
  const codCharges = Number(order.cod_charges || 0)
  const grandTotal = Number(order.grand_total || 0)
  
  let state = ''
  let paidAmount = 0
  let pendingAmount = 0

  if (order.payment_status === 'paid') {
    state = 'Paid'
    paidAmount = grandTotal + codCharges
    pendingAmount = 0
  } else if (order.payment_status === 'handling_paid') {
    state = 'COD Charges Paid (Handling)'
    paidAmount = codCharges
    pendingAmount = grandTotal
  } else {
    state = order.payment_method === 'online' ? 'Payment pending' : 'Pay when delivered'
    paidAmount = 0
    pendingAmount = grandTotal + codCharges
  }

  return { method, state, paidAmount, pendingAmount }
}

function UserDashboardPage() {
  const navigate = useNavigate()
  const [dashboard, setDashboard] = useState<UserDashboardResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const current = getUser()
    if (!current) {
      navigate('/user/login', { replace: true })
      return
    }

    const loadDashboard = async () => {
      setLoading(true)
      setError('')

      try {
        const data = await fetchUserDashboard(current.id)
        setDashboard(data)
      } catch (requestError) {
        setError(requestError instanceof Error ? requestError.message : 'Unable to load dashboard.')
      } finally {
        setLoading(false)
      }
    }

    void loadDashboard()
  }, [navigate])

  const handleLogout = () => {
    clearUser()
    navigate('/')
  }

  const orders = dashboard?.orders || []

  const scrollToSection = (target: string) => {
    document.getElementById(target)?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <main className="site-shell gallery-page products-page-shell user-dashboard-shell">
      <SEO title="My Dashboard" description="View your Pure Himalyan order history and account details." noIndex />
      <Header />

      <section className="gallery-collection gallery-page-content user-dashboard-content user-dashboard-page">
        <div className="container user-dashboard-container">
          <div className="user-dashboard-hero">
            <h1 className="user-dashboard-welcome">
              Welcome,{' '}
              <span className="user-dashboard-welcome-name">{dashboard?.user.name || getUser()?.name}</span>
            </h1>
            <div className="user-dashboard-hero-actions" role="toolbar" aria-label="Account actions">
              <button className="user-dashboard-btn user-dashboard-btn--ghost" type="button" onClick={() => scrollToSection('user-profile-section')}>
                View profile
              </button>
              <button className="user-dashboard-btn user-dashboard-btn--danger" type="button" onClick={handleLogout}>
                Log out
              </button>
            </div>
          </div>

          {error ? <div className="portal-error">{error}</div> : null}

          {loading ? (
            <p className="section-subtext">Loading dashboard...</p>
          ) : dashboard ? (
            <div className="user-dashboard-main user-dashboard-main--solo" id="user-dashboard-overview">
                <section className="dashboard-panel user-profile-panel user-dashboard-panel" id="user-profile-section">
                  <div className="user-panel-header">
                    <h3>Profile</h3>
                    <span className="user-badge">Account</span>
                  </div>
                  <div className="user-profile-grid">
                    <div>
                      <span className="field-label">Name</span>
                      <p>{dashboard.user.name}</p>
                    </div>
                    <div>
                      <span className="field-label">Email</span>
                      <p>{dashboard.user.email}</p>
                    </div>
                    <div>
                      <span className="field-label">Phone</span>
                      <p>{dashboard.user.phone}</p>
                    </div>
                  </div>
                </section>

                <section className="dashboard-panel dashboard-panel-wide user-orders-panel user-dashboard-panel" id="user-orders-section">
                  <div className="user-panel-header user-panel-header--stack">
                    <div>
                      <h3>Orders</h3>
                      <p className="panel-subtitle user-dashboard-panel-sub">Purchases linked to this account</p>
                    </div>
                  </div>
                  {orders.length === 0 ? (
                    <p className="product-empty">No orders found yet.</p>
                  ) : (
                      <div className="user-order-card-list" aria-label="Order history">
                        {orders.map((order: OrderRecord) => {
                          const productHref = order.product_slug ? `/products/${order.product_slug}` : '/products'
                          const imgSrc = resolveProductImageUrl(order.product_image_url ?? null)
                          const { method, state, paidAmount, pendingAmount } = paymentSummary(order)
                          const addr = [order.address_line, order.city, order.state, order.postal_code].filter(Boolean).join(', ')
                          return (
                            <article className="user-order-card" key={order.id}>
                              <div className="user-order-card__top">
                                <Link className="user-order-card__thumb" to={productHref} aria-label={`View ${order.product_name}`}>
                                  <img src={imgSrc} alt="" loading="lazy" />
                                </Link>
                                <div className="user-order-card__main">
                                  <Link className="user-order-card__title" to={productHref}>
                                    {order.product_name}
                                  </Link>
                                  <p className="user-order-card__meta">
                                    Order #{order.id} · {formatOrderDate(order.created_at)}
                                  </p>
                                  <div className="user-order-card__price-row">
                                    <span className="user-order-card__amount">₹{Number(orderAmount(order)).toFixed(2)}</span>
                                    <span
                                      className={`user-order-card__pill user-order-card__pill--${(order.status || 'pending')
                                        .toLowerCase()
                                        .replace(/[^a-z0-9]+/g, '-')
                                        .replace(/^-|-$/g, '') || 'pending'}`}
                                    >
                                      {orderStatusLabel(order)}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <p className="user-order-card__process">{orderProcessingHint(order)}</p>
                              <div className="user-order-card__payment">
                                <span className="user-order-card__payment-label">Payment</span>
                                <div className="user-order-card__payment-info">
                                  <p className="user-order-card__payment-value">
                                    {method} · <strong>{state}</strong>
                                  </p>
                                  <div className="user-order-card__payment-amounts" style={{ marginTop: '0.5rem', fontSize: '0.88rem', display: 'flex', gap: '1rem' }}>
                                    <span style={{ color: '#059669' }}><strong>Paid:</strong> ₹{paidAmount.toFixed(2)}</span>
                                    <span style={{ color: pendingAmount > 0 ? '#dc2626' : '#64748b' }}><strong>Pending:</strong> ₹{pendingAmount.toFixed(2)}</span>
                                  </div>
                                </div>
                              </div>
                              <details className="user-order-card__details">
                                <summary>Delivery &amp; full details</summary>
                                <dl className="user-order-card__dl">
                                  <div>
                                    <dt>Deliver to</dt>
                                    <dd>{addr || '—'}</dd>
                                  </div>
                                  <div>
                                    <dt>Phone</dt>
                                    <dd>{order.customer_phone}</dd>
                                  </div>
                                  {order.discount_percentage || Number(order.discount_amount) > 0 ? (
                                    <div>
                                      <dt>Referral discount</dt>
                                      <dd>
                                        {order.discount_percentage ? `${order.discount_percentage}%` : '—'}
                                        {Number(order.discount_amount) > 0 ? ` (₹${Number(order.discount_amount).toFixed(2)})` : ''}
                                      </dd>
                                    </div>
                                  ) : null}
                                  {(Number(order.shipping_amount || 0) > 0 || Number(order.prepaid_discount_amount || 0) > 0) ? (
                                    <div>
                                      <dt>Shipping / online discount</dt>
                                      <dd>
                                        Shipping ₹{Number(order.shipping_amount || 0).toFixed(2)}
                                        {Number(order.prepaid_discount_amount || 0) > 0
                                          ? ` · Online discount −₹${Number(order.prepaid_discount_amount).toFixed(2)}`
                                          : ''}
                                      </dd>
                                    </div>
                                  ) : null}
                                  {Number(order.gst_amount || 0) > 0 ? (
                                    <div>
                                      <dt>GST</dt>
                                      <dd>
                                        {order.gst_percent != null && String(order.gst_percent) !== '' ? `${order.gst_percent}%` : '—'} · ₹
                                        {Number(order.gst_amount).toFixed(2)}
                                      </dd>
                                    </div>
                                  ) : null}
                                  {order.notes ? (
                                    <div>
                                      <dt>Your note</dt>
                                      <dd>{order.notes}</dd>
                                    </div>
                                  ) : null}
                                </dl>
                              </details>
                            </article>
                          )
                        })}
                      </div>
                  )}
                </section>
            </div>
          ) : null}
        </div>
      </section>

      <Footer />
    </main>
  )
}

export default UserDashboardPage
