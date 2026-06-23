import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import checkoutLogo from '../assets/checkout_logo.png'
import { applyReferralCode, fetchProducts, resolveProductImageUrl } from '../lib/productApi'
import type { OrderPayload, ProductRecord } from '../lib/productApi'
import { getUser } from '../lib/userAuth'

type Props = {
  isOpen: boolean
  isSubmitting: boolean
  product: ProductRecord | null
  /** From product URL `?ref=xxxxxxxx` — auto-fills and validates referral at checkout. */
  urlReferralCode?: string | null
  onClose: () => void
  onSubmit: (payload: OrderPayload) => Promise<void>
}

type OrderFormState = Omit<OrderPayload, 'product_id'>

const emptyForm: OrderFormState = {
  customer_name: '',
  customer_phone: '',
  customer_email: '',
  referral_code: '',
  address_line: '',
  city: '',
  state: '',
  postal_code: '',
  notes: '',
  quantity: 1,
  payment_method: 'cod',
}

/** Bill-style amounts like `1199/-` (whole rupees when .00). */
function formatCheckoutRupees(amount: number): string {
  if (!Number.isFinite(amount)) {
    return '0/-'
  }
  const rounded = Math.round(amount * 100) / 100
  const core = rounded % 1 === 0 ? String(rounded) : rounded.toFixed(2)
  return `${core}/-`
}

function OrderModal({ isOpen, isSubmitting, product, urlReferralCode = null, onClose, onSubmit }: Props) {
  const navigate = useNavigate()
  const location = useLocation()
  const [form, setForm] = useState<OrderFormState>(emptyForm)
  const [error, setError] = useState('')
  const [appliedDiscountPercentage, setAppliedDiscountPercentage] = useState(0)
  const [referralError, setReferralError] = useState('')
  const [affiliateThankName, setAffiliateThankName] = useState<string | null>(null)
  const [agreeReturnPolicy, setAgreeReturnPolicy] = useState(true)
  const [agreePrivacyPolicy, setAgreePrivacyPolicy] = useState(true)
  const [suggestedProducts, setSuggestedProducts] = useState<ProductRecord[]>([])

  const linkReferralActive = useMemo(() => {
    const digits = (urlReferralCode || '').trim().replace(/\D/g, '').slice(0, 8)
    return digits.length === 8
  }, [urlReferralCode])

  useEffect(() => {
    if (!isOpen) {
      setForm(emptyForm)
      setError('')
      setAppliedDiscountPercentage(0)
      setReferralError('')
      setAffiliateThankName(null)
      setAgreeReturnPolicy(true)
      setAgreePrivacyPolicy(true)
      setSuggestedProducts([])
    } else {
      const user = getUser()
      if (user) {
        setForm((prev) => ({
          ...prev,
          customer_name: user.name ?? '',
          customer_email: user.email ?? '',
          customer_phone: user.phone ?? '',
        }))
      }
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen || !product) {
      setSuggestedProducts([])
      return
    }

    let cancelled = false
    void fetchProducts()
      .then((items) => {
        if (cancelled) {
          return
        }
        const others = items
          .filter((p) => p.is_active && p.id !== product.id)
          .sort((a, b) => {
            if (a.id === 4 && b.id !== 4) {
              return -1
            }
            if (b.id === 4 && a.id !== 4) {
              return 1
            }
            return 0
          })
          .slice(0, 6)
        setSuggestedProducts(others)
      })
      .catch(() => {
        if (!cancelled) {
          setSuggestedProducts([])
        }
      })

    return () => {
      cancelled = true
    }
  }, [isOpen, product?.id])

  useEffect(() => {
    if (!isOpen || !product) {
      return
    }

    const fromUrl = (urlReferralCode || '').trim().replace(/\D/g, '').slice(0, 8)
    if (fromUrl.length !== 8) {
      setForm(prev => ({ ...prev, referral_code: '' }))
      setAppliedDiscountPercentage(0)
      setReferralError('')
      setAffiliateThankName(null)
      return
    }

    let cancelled = false
    setForm(prev => ({ ...prev, referral_code: fromUrl }))
    setAppliedDiscountPercentage(0)
    setReferralError('')
    setAffiliateThankName(null)

    void applyReferralCode(fromUrl, product.id)
      .then((response) => {
        if (cancelled) {
          return
        }
        setAppliedDiscountPercentage(response.discount_percentage)
        setReferralError('')
        const name = typeof response.affiliate_name === 'string' ? response.affiliate_name.trim() : ''
        setAffiliateThankName(name.length > 0 ? name : null)
      })
      .catch((requestError: unknown) => {
        if (cancelled) {
          return
        }
        setAppliedDiscountPercentage(0)
        setAffiliateThankName(null)
        const message = requestError instanceof Error ? requestError.message : ''
        setReferralError(
          message.toLowerCase().includes('invalid referral code') ? 'Invalid referral code' : message || 'Referral link invalid.',
        )
      })

    return () => {
      cancelled = true
    }
  }, [isOpen, product?.id, urlReferralCode])

  useEffect(() => {
    if (!isOpen || !product) {
      return
    }
    if (!getUser()) {
      onClose()
      navigate('/user/login', {
        replace: true,
        state: { redirectAfterAuth: `${location.pathname}${location.search}` },
      })
    }
  }, [isOpen, product, onClose, navigate, location.pathname, location.search])

  if (!isOpen || !product) {
    return null
  }

  if (!getUser()) {
    return null
  }

  const qty = form.quantity
  const basePrice = Math.round(Number(product.price || 0)) * qty
  const mrpPrice = Math.round(Number(product.original_price || 0)) * qty
  const allIncluded = product.all_charges_included ?? false
  const shippingRate = allIncluded ? 0 : Math.round(Number(product.shipping_rate || 0))
  const prepaidPercent = Math.min(100, Math.max(0, Number(product.prepaid_discount_percent || 0)))
  const previewDiscountPercentage = appliedDiscountPercentage
  const previewDiscountAmount = Math.round((basePrice * previewDiscountPercentage) / 100)
  const subtotalAfterReferral = Math.round(basePrice - previewDiscountAmount)
  const rawPrepaidRupees =
    form.payment_method === 'online'
      ? Math.round((subtotalAfterReferral * prepaidPercent) / 100)
      : 0
  const prepaidApplied = Math.min(rawPrepaidRupees, Math.max(0, subtotalAfterReferral))
  const gstPercentValue = allIncluded ? 0 : Math.min(100, Math.max(0, Number(product.gst_percent || 0)))
  const gstAmount =
    gstPercentValue > 0 ? Math.round((subtotalAfterReferral * gstPercentValue) / 100) : 0
  const codCharges = Math.round(Number(product.cod_charges || 0))
  const grandTotal = Math.round(subtotalAfterReferral + gstAmount + shippingRate - prepaidApplied)
  
  const amountToPayNow = form.payment_method === 'cod' ? codCharges : grandTotal
  const amountOnDelivery = form.payment_method === 'cod' ? Math.max(0, grandTotal - codCharges) : 0

  const productImageSrc = product.image_url || product.images?.[0] || ''

  const handleChange = (field: keyof OrderFormState, value: string | number) => {
    if (field === 'referral_code') {
      setAppliedDiscountPercentage(0)
      setReferralError('')
    }

    setForm((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleQtyChange = (delta: number) => {
    setForm((prev) => ({
      ...prev,
      quantity: Math.max(1, prev.quantity + delta),
    }))
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')

    if (!getUser()) {
      onClose()
      navigate('/user/login', {
        replace: true,
        state: { redirectAfterAuth: `${location.pathname}${location.search}` },
      })
      return
    }

    if (!agreeReturnPolicy || !agreePrivacyPolicy) {
      setError('Please accept the Return/Refund Policy and Privacy Policy before placing your order.')
      return
    }

    try {
      await onSubmit({
        product_id: product.id,
        ...form,
      })
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Order place nahi ho paaya.')
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content order-modal-content" onClick={(event) => event.stopPropagation()}>
        <button className="close-button" type="button" onClick={onClose}>
          ×
        </button>
        <div className="order-checkout-header">
          <Link className="order-checkout-logo-link" to="/" aria-label="Pure Himalyan home" onClick={(event) => event.stopPropagation()}>
            <img className="order-checkout-logo-img" src={checkoutLogo} alt="" />
          </Link>
          <div className="order-checkout-header-title">
            <p className="order-checkout-kicker">Checkout</p>
            <h2>Place Order</h2>
          </div>
        </div>
        <form className="modal-form order-modal-form" onSubmit={handleSubmit}>
          <div className="order-checkout-layout">
            <div className="order-checkout-main" aria-label="Delivery details">
              <div className="order-checkout-card">
                <div className="order-checkout-card-header">
                  <h3 className="order-checkout-card-title">Delivery details</h3>
                </div>

                <div className="order-modal-grid">
                  <label>
                    <span>Name</span>
                    <input value={form.customer_name} onChange={(event) => handleChange('customer_name', event.target.value)} required />
                  </label>
                  <label>
                    <span>Phone</span>
                    <input value={form.customer_phone} onChange={(event) => handleChange('customer_phone', event.target.value)} required />
                  </label>
                </div>

                <div className="order-modal-grid">
                  <label>
                    <span>Email (optional)</span>
                    <input type="email" value={form.customer_email} onChange={(event) => handleChange('customer_email', event.target.value)} />
                  </label>
                  <label>
                    <span>Pincode</span>
                    <input value={form.postal_code} onChange={(event) => handleChange('postal_code', event.target.value)} required />
                  </label>
                </div>

                <label>
                  <span>Address</span>
                  <textarea value={form.address_line} onChange={(event) => handleChange('address_line', event.target.value)} rows={3} required />
                </label>

                <div className="order-modal-grid">
                  <label>
                    <span>City</span>
                    <input value={form.city} onChange={(event) => handleChange('city', event.target.value)} required />
                  </label>
                  <label>
                    <span>State</span>
                    <input value={form.state} onChange={(event) => handleChange('state', event.target.value)} required />
                  </label>
                </div>

                <label>
                  <span>Delivery instructions (optional)</span>
                  <textarea value={form.notes} onChange={(event) => handleChange('notes', event.target.value)} rows={3} placeholder="Landmark, preferred delivery time, etc." />
                </label>

                {suggestedProducts.length > 0 ? (
                  <div className="order-checkout-suggested">
                    <p className="order-checkout-suggested-title">Suggested products</p>
                    <div className="order-checkout-suggested-track">
                      {suggestedProducts.map((item) => (
                        <Link
                          key={item.id}
                          className="order-checkout-suggested-card"
                          to={`/products/${item.slug}`}
                          onClick={() => {
                            onClose()
                          }}
                        >
                          <span className="order-checkout-suggested-thumb">
                            <img
                              src={resolveProductImageUrl(item.image_url || item.images?.[0] || null)}
                              alt=""
                              loading="lazy"
                            />
                          </span>
                          <span className="order-checkout-suggested-name">{item.name}</span>
                          <span className="order-checkout-suggested-price">₹{item.price}</span>
                        </Link>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>

            <aside className="order-checkout-sidebar" aria-label="Order summary">
              <div className="order-checkout-card order-checkout-summary-card">
                <div className="order-checkout-card-header order-checkout-summary-header">
                  <h3 className="order-checkout-card-title">Order summary</h3>
                  <p className="order-checkout-card-subtitle">Review items and confirm payment.</p>
                </div>

                <div className="order-checkout-product-row">
                  <div className="order-checkout-product-thumb" aria-hidden="true">
                    {productImageSrc ? <img src={productImageSrc} alt="" loading="lazy" /> : <span className="order-checkout-product-fallback" />}
                  </div>
                  <div className="order-checkout-product-meta">
                    <p className="order-checkout-product-name">{product.name}</p>
                    <div className="order-checkout-qty-controls">
                      <button type="button" onClick={() => handleQtyChange(-1)} disabled={qty <= 1}>−</button>
                      <span className="order-checkout-product-qty">Qty {qty}</span>
                      <button type="button" onClick={() => handleQtyChange(1)}>+</button>
                    </div>
                  </div>
                </div>

                {affiliateThankName && appliedDiscountPercentage > 0 ? (
                  <p className="order-checkout-affiliate-thanks">
                    Thanks to affiliate <strong>{affiliateThankName}</strong> for this referral.
                  </p>
                ) : null}

                {linkReferralActive && referralError ? <div className="portal-error order-checkout-referral-error">{referralError}</div> : null}

                <div className="order-checkout-divider" role="separator" />

                <div className="order-price-summary order-price-summary--bill" aria-label="Price breakdown">
                  <p className="order-checkout-bill-heading">Price details</p>
                  <div className="order-checkout-bill-rows">
                    {mrpPrice > 0 ? (
                      <div className="order-checkout-bill-row">
                        <span className="order-checkout-bill-label">MRP:</span>
                        <span className="order-checkout-bill-value" style={{ color: '#dc2626', textDecoration: 'line-through' }}>{formatCheckoutRupees(mrpPrice)}</span>
                      </div>
                    ) : null}
                    <div className="order-checkout-bill-row">
                      <span className="order-checkout-bill-label">Offer price:</span>
                      <span className="order-checkout-bill-value">{formatCheckoutRupees(basePrice)}</span>
                    </div>
                    {previewDiscountAmount > 0 ? (
                      <div className="order-checkout-bill-row order-checkout-bill-row--deduct">
                        <span className="order-checkout-bill-label">Discount offered:</span>
                        <span className="order-checkout-bill-value order-checkout-bill-value--sign">
                          -  {formatCheckoutRupees(previewDiscountAmount)}
                        </span>
                      </div>
                    ) : null}
                    {allIncluded ? (
                      <>
                        <div className="order-checkout-bill-row">
                          <span className="order-checkout-bill-label">GST:</span>
                          <span className="order-checkout-bill-value" style={{ color: '#059669', fontWeight: 600 }}>Included</span>
                        </div>
                        <div className="order-checkout-bill-row">
                          <span className="order-checkout-bill-label">Shipping:</span>
                          <span className="order-checkout-bill-value" style={{ color: '#059669', fontWeight: 600 }}>Free</span>
                        </div>
                      </>
                    ) : gstPercentValue > 0 ? (
                      <div className="order-checkout-bill-row order-checkout-bill-row--add">
                        <span className="order-checkout-bill-label">
                          GST (
                          {gstPercentValue % 1 === 0 ? String(Math.round(gstPercentValue)) : gstPercentValue.toFixed(2)}
                          %):
                        </span>
                        <span className="order-checkout-bill-value order-checkout-bill-value--sign">+  {formatCheckoutRupees(gstAmount)}</span>
                      </div>
                    ) : null}
                    {prepaidPercent > 0 && form.payment_method === 'online' && prepaidApplied > 0 ? (
                      <div className="order-checkout-bill-row order-checkout-bill-row--deduct">
                        <span className="order-checkout-bill-label">Pre-paid discount:</span>
                        <span className="order-checkout-bill-value order-checkout-bill-value--sign">
                          -  {formatCheckoutRupees(prepaidApplied)}
                        </span>
                      </div>
                    ) : null}
                  </div>
                  {!allIncluded ? (
                    <>
                      <hr className="order-checkout-bill-rule" />
                      <div className="order-checkout-bill-row order-checkout-bill-row--add">
                        <span className="order-checkout-bill-label">Shipping charges:</span>
                        <span className="order-checkout-bill-value order-checkout-bill-value--sign">+  {formatCheckoutRupees(shippingRate)}</span>
                      </div>
                    </>
                  ) : null}
                  <div className="order-checkout-bill-row order-checkout-bill-row--total">
                    <span className="order-checkout-bill-label">Total amount:</span>
                    <span className="order-checkout-bill-value">{formatCheckoutRupees(grandTotal)}</span>
                  </div>

                  {form.payment_method === 'cod' && codCharges > 0 ? (
                    <div className="order-checkout-payment-breakdown" style={{ marginTop: '1rem', padding: '1rem', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                      <div className="order-checkout-bill-row" style={{ marginBottom: '0.5rem' }}>
                        <span className="order-checkout-bill-label" style={{ fontWeight: '600', color: '#0f172a' }}>Pay Now (Online):</span>
                        <span className="order-checkout-bill-value" style={{ fontWeight: '700', color: '#b37c2c' }}>{formatCheckoutRupees(amountToPayNow)}</span>
                      </div>
                      <div className="order-checkout-bill-row">
                        <span className="order-checkout-bill-label" style={{ fontWeight: '600', color: '#0f172a' }}>Pay on Delivery (COD):</span>
                        <span className="order-checkout-bill-value" style={{ fontWeight: '700', color: '#0f172a' }}>{formatCheckoutRupees(amountOnDelivery)}</span>
                      </div>
                      <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.75rem', lineHeight: '1.4' }}>
                        * COD orders require an upfront payment of ₹{codCharges} as handling charges via Online Payment.
                      </p>
                    </div>
                  ) : null}
                </div>

                <div className="order-checkout-divider" role="separator" />

                <div className="order-checkout-payment">
                  <p className="order-checkout-section-title">Payment method</p>
                  
                  {prepaidPercent > 0 && (
                    <div style={{ 
                      color: '#059669', 
                      fontWeight: '700', 
                      fontSize: '0.95rem', 
                      marginBottom: '10px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path>
                        <line x1="7" y1="7" x2="7.01" y2="7"></line>
                      </svg>
                      Extra {prepaidPercent}% OFF on Online Payment!
                    </div>
                  )}

                  <div className="order-payment-method-row" role="radiogroup" aria-label="Payment method">
                    <label className={`order-payment-option ${form.payment_method === 'cod' ? 'selected' : ''}`}>
                      <input
                        type="radio"
                        name="payment_method"
                        value="cod"
                        checked={form.payment_method === 'cod'}
                        onChange={(event) => handleChange('payment_method', event.target.value)}
                      />
                      <span className="order-payment-option-content">
                        <span className="order-payment-option-title">Cash on Delivery</span>
                        <span className="order-payment-option-subtitle">
                          Pay when product delivered
                          {codCharges > 0 && (
                            <span className="order-payment-option-extra">
                              · COD handling charges ₹{codCharges.toFixed(2)} will be collected via Online Payment
                            </span>
                          )}
                        </span>
                      </span>
                    </label>
                    <label className={`order-payment-option ${form.payment_method === 'online' ? 'selected' : ''}`}>
                      <input
                        type="radio"
                        name="payment_method"
                        value="online"
                        checked={form.payment_method === 'online'}
                        onChange={(event) => handleChange('payment_method', event.target.value)}
                      />
                      <span className="order-payment-option-content">
                        <span className="order-payment-option-title">Online Payment</span>
                        <span className="order-payment-option-subtitle">
                          UPI / Card / Netbanking
                        </span>
                        <div className="payment-method-icons">
                          <img src="https://img.icons8.com/color/48/google-pay.png" alt="GPay" className="payment-icon" />
                          <img src="https://img.icons8.com/color/48/paytm.png" alt="Paytm" className="payment-icon" />
                          <img src="https://img.icons8.com/color/48/visa.png" alt="Visa" className="payment-icon" />
                          <img src="https://img.icons8.com/color/48/mastercard.png" alt="Mastercard" className="payment-icon" />
                        </div>
                      </span>
                    </label>
                  </div>
                </div>

                <div className="order-policy-checklist">
                  <label className="order-policy-check">
                    <span className="order-policy-box">
                      <input
                        type="checkbox"
                        checked={agreeReturnPolicy}
                        onChange={(event) => setAgreeReturnPolicy(event.target.checked)}
                      />
                    </span>
                    <span className="order-policy-text">
                      I have read and accept the{' '}
                      <a href="/terms" target="_blank" rel="noreferrer" className="order-policy-link">
                        Return, Refund &amp; Cancellation Policy
                      </a>
                    </span>
                  </label>
                  <label className="order-policy-check">
                    <span className="order-policy-box">
                      <input
                        type="checkbox"
                        checked={agreePrivacyPolicy}
                        onChange={(event) => setAgreePrivacyPolicy(event.target.checked)}
                      />
                    </span>
                    <span className="order-policy-text">
                      I agree to the{' '}
                      <a href="/privacy" target="_blank" rel="noreferrer" className="order-policy-link">
                        Privacy Policy
                      </a>
                    </span>
                  </label>
                </div>

                {error ? <div className="portal-error">{error}</div> : null}

                <div className="order-checkout-actions">
                  <button className="modal-submit order-checkout-submit" type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Confirming...' : `Place order • ₹${grandTotal.toFixed(2)}`}
                  </button>
                  <button className="modal-cancel order-checkout-cancel" type="button" onClick={onClose}>
                    Back
                  </button>
                </div>
              </div>
            </aside>
          </div>
        </form>
      </div>
    </div>
  )
}

export default OrderModal
