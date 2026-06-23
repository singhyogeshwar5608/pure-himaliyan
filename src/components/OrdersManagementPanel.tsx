import { useEffect, useMemo, useState } from 'react'
import '../AdminPortal.css'
import { fetchOrders, updateOrderStatus } from '../lib/productApi'
import type { OrderRecord } from '../lib/productApi'

function OrdersManagementPanel() {
  const [orders, setOrders] = useState<OrderRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedDate, setSelectedDate] = useState('')
  const [updatingId, setUpdatingId] = useState<number | null>(null)

  const loadOrders = async () => {
    setLoading(true)
    setError('')

    try {
      const items = await fetchOrders()
      setOrders(items)
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to load orders.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadOrders()
  }, [])

  const handleStatusUpdate = async (orderId: number, status: string, payment_status?: string) => {
    setUpdatingId(orderId)
    try {
      await updateOrderStatus(orderId, { status, payment_status })
      await loadOrders()
    } catch (err) {
      window.alert(err instanceof Error ? err.message : 'Update failed')
    } finally {
      setUpdatingId(null)
    }
  }

  const filteredOrders = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase()

    return orders.filter((order) => {
      const matchesQuery =
        normalizedQuery === '' ||
        String(order.id).includes(normalizedQuery) ||
        order.product_name.toLowerCase().includes(normalizedQuery) ||
        order.customer_name.toLowerCase().includes(normalizedQuery) ||
        order.customer_phone.toLowerCase().includes(normalizedQuery) ||
        (order.customer_email || '').toLowerCase().includes(normalizedQuery) ||
        (order.city || '').toLowerCase().includes(normalizedQuery) ||
        (order.state || '').toLowerCase().includes(normalizedQuery) ||
        (order.payment_method || '').toLowerCase().includes(normalizedQuery) ||
        (order.payment_status || '').toLowerCase().includes(normalizedQuery) ||
        (order.shiprocket_status || '').toLowerCase().includes(normalizedQuery) ||
        (order.shiprocket_shipment_id || '').toLowerCase().includes(normalizedQuery) ||
        (order.referral_code || '').toLowerCase().includes(normalizedQuery) ||
        (order.referral_owner?.name || '').toLowerCase().includes(normalizedQuery) ||
        (order.referral_owner?.email || '').toLowerCase().includes(normalizedQuery) ||
        (order.referral_owner?.phone || '').toLowerCase().includes(normalizedQuery) ||
        (order.referral_owner?.role || '').toLowerCase().includes(normalizedQuery)

      const orderDate = new Date(order.created_at).toISOString().slice(0, 10)
      const matchesDate = selectedDate === '' || orderDate === selectedDate

      return matchesQuery && matchesDate
    })
  }, [orders, searchQuery, selectedDate])

  return (
    <section className="dashboard-panel dashboard-panel-wide">
      <div className="product-toolbar">
        <div>
          <h3>Orders</h3>
        </div>
      </div>

      <div className="inquiry-filters">
        <input
          className="inquiry-filter-input"
          type="search"
          placeholder="Search orders, customer, product, affiliate / referral, Shiprocket"
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
        />
        <input
          className="inquiry-filter-input"
          type="date"
          value={selectedDate}
          onChange={(event) => setSelectedDate(event.target.value)}
        />
      </div>

      {error ? <div className="portal-error">{error}</div> : null}

      {loading ? (
        <p className="product-empty">Loading orders...</p>
      ) : filteredOrders.length === 0 ? (
        <p className="product-empty">No orders found yet.</p>
      ) : (
        <div className="product-table-wrap">
          <table className="product-table inquiry-table">
            <thead>
              <tr>
                <th>Order</th>
                <th>Product</th>
                <th>Referral / Affiliate</th>
                <th>Customer</th>
                <th>Address</th>
                <th>Payment</th>
                <th>Shiprocket</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((order) => (
                <tr key={order.id}>
                  <td>
                    <strong>#{order.id}</strong>
                    <div style={{ marginTop: 8 }}>
                      <select
                        value={order.status}
                        onChange={(e) => handleStatusUpdate(order.id, e.target.value, order.payment_status)}
                        disabled={updatingId === order.id}
                        className="admin-select"
                        style={{ fontSize: '0.75rem', padding: '4px 8px' }}
                      >
                        <option value="pending">Pending</option>
                        <option value="success">Success</option>
                        <option value="failed">Failed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </div>
                  </td>
                  <td>
                    <strong>{order.product_name}</strong>
                    <div style={{ color: '#64748b', fontSize: '0.82rem', marginTop: 4 }}>
                      ₹{order.grand_total ?? order.final_price}
                      {order.discount_percentage > 0 ? ` (${order.discount_percentage}% off)` : ''}
                    </div>
                  </td>
                  <td>
                    {order.referral_code ? (
                      <>
                        <strong style={{ letterSpacing: '0.04em' }}>{order.referral_code}</strong>
                        {order.referral_owner ? (
                          <div style={{ color: '#64748b', fontSize: '0.82rem', marginTop: 4 }}>
                            {order.referral_owner.name}
                            <span style={{ margin: '0 0.35rem' }}>•</span>
                            {order.referral_owner.role}
                            {order.referral_owner.phone ? (
                              <>
                                <br />
                                {order.referral_owner.phone}
                              </>
                            ) : null}
                            <br />
                            {order.referral_owner.email}
                          </div>
                        ) : (
                          <div style={{ color: '#64748b', fontSize: '0.82rem', marginTop: 4 }}>Owner lookup unavailable</div>
                        )}
                      </>
                    ) : (
                      <span style={{ color: '#64748b' }}>—</span>
                    )}
                  </td>
                  <td>
                    <strong>{order.customer_name}</strong>
                    <div style={{ color: '#64748b', fontSize: '0.82rem', marginTop: 4 }}>
                      {order.customer_phone}
                      {order.customer_email ? ` • ${order.customer_email}` : ''}
                    </div>
                  </td>
                  <td>
                    <div style={{ fontSize: '0.92rem' }}>
                      {order.city}, {order.state} {order.postal_code}
                    </div>
                    <div style={{ color: '#64748b', fontSize: '0.82rem', marginTop: 4 }}>
                      {order.address_line}
                    </div>
                  </td>
                  <td>
                    <strong style={{ textTransform: 'uppercase' }}>{order.payment_method}</strong>
                    <div style={{ marginTop: 8 }}>
                      <select
                        value={order.payment_status}
                        onChange={(e) => handleStatusUpdate(order.id, order.status, e.target.value)}
                        disabled={updatingId === order.id}
                        className="admin-select"
                        style={{ fontSize: '0.75rem', padding: '4px 8px' }}
                      >
                        <option value="pending">Pending</option>
                        <option value="paid">Paid</option>
                        <option value="handling_paid">Handling Paid (COD)</option>
                        <option value="failed">Failed</option>
                      </select>
                    </div>
                    {(() => {
                      const codCharges = Number(order.cod_charges || 0)
                      const grandTotal = Number(order.grand_total || 0)
                      let paid = 0
                      let pending = 0

                      if (order.payment_status === 'paid') {
                        paid = grandTotal + codCharges
                        pending = 0
                      } else if (order.payment_status === 'handling_paid') {
                        paid = codCharges
                        pending = grandTotal
                      } else {
                        paid = 0
                        pending = grandTotal + codCharges
                      }

                      return (
                        <div style={{ marginTop: 8, fontSize: '0.82rem' }}>
                          <div style={{ color: '#059669' }}><strong>Paid:</strong> ₹{paid.toFixed(2)}</div>
                          <div style={{ color: pending > 0 ? '#dc2626' : '#64748b' }}><strong>Pending:</strong> ₹{pending.toFixed(2)}</div>
                          <div style={{ borderTop: '1px solid #e2e8f0', marginTop: 4, paddingTop: 4, color: '#1e293b' }}>
                            <strong>Net Total:</strong> ₹{(paid + pending).toFixed(2)}
                          </div>
                        </div>
                      )
                    })()}
                    {order.razorpay_payment_id ? (
                      <div style={{ color: '#64748b', fontSize: '0.75rem', marginTop: 4 }}>
                        RP: {order.razorpay_payment_id}
                      </div>
                    ) : null}
                  </td>
                  <td>
                    <strong>{order.shiprocket_status || '-'}</strong>
                    <div style={{ color: '#64748b', fontSize: '0.82rem', marginTop: 4 }}>
                      Shipment: {order.shiprocket_shipment_id || '-'}
                    </div>
                  </td>
                  <td>{new Date(order.created_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}

export default OrdersManagementPanel

