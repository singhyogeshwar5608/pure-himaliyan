import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import '../AdminPortal.css'
import {
  deleteReferralUser,
  fetchReferralUsers,
  updateReferralUser,
} from '../lib/productApi'
import type { ReferralUserPayload, ReferralUserRecord } from '../lib/productApi'

const emptyForm: ReferralUserPayload = {
  name: '',
  email: '',
  phone: '',
  referral_code: '',
  discount_percentage: '10',
}

function ReferralUsersPanel() {
  const [referralUsers, setReferralUsers] = useState<ReferralUserRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [editingReferralUser, setEditingReferralUser] = useState<ReferralUserRecord | null>(null)
  const [form, setForm] = useState<ReferralUserPayload>(emptyForm)
  const [submitting, setSubmitting] = useState(false)

  const loadReferralUsers = async () => {
    setLoading(true)
    setError('')

    try {
      const items = await fetchReferralUsers()
      setReferralUsers(items)
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to load referral users.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadReferralUsers()
  }, [])

  const filteredReferralUsers = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase()

    return referralUsers.filter((item) => {
      if (normalizedQuery === '') {
        return true
      }

      return (
        item.name.toLowerCase().includes(normalizedQuery) ||
        item.email.toLowerCase().includes(normalizedQuery) ||
        item.phone.toLowerCase().includes(normalizedQuery) ||
        item.referral_code.toLowerCase().includes(normalizedQuery)
      )
    })
  }, [referralUsers, searchQuery])

  const handleEditClick = (item: ReferralUserRecord) => {
    setEditingReferralUser(item)
    setForm({
      name: item.name,
      email: item.email,
      phone: item.phone,
      referral_code: item.referral_code,
      discount_percentage: String(item.discount_percentage),
    })
    setError('')
  }

  const handleModalClose = () => {
    if (submitting) {
      return
    }

    setEditingReferralUser(null)
    setForm(emptyForm)
  }

  const handleChange = (field: keyof ReferralUserPayload, value: string) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!editingReferralUser) {
      return
    }

    setSubmitting(true)
    setError('')

    try {
      const updated = await updateReferralUser(editingReferralUser.id, form)
      setReferralUsers((current) => current.map((item) => (item.id === updated.id ? updated : item)))
      setEditingReferralUser(null)
      setForm(emptyForm)
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to update referral user.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (item: ReferralUserRecord) => {
    const confirmed = window.confirm(`Delete referral user ${item.name}?`)

    if (!confirmed) {
      return
    }

    try {
      await deleteReferralUser(item.id)
      setReferralUsers((current) => current.filter((referralUser) => referralUser.id !== item.id))
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to delete referral user.')
    }
  }

  return (
    <section className="dashboard-panel dashboard-panel-wide">
      <div className="product-toolbar">
        <div>
          <h3>Affiliate referral partners</h3>
          <p>Affiliate accounts with referral code and discount settings (normal customer accounts are not listed).</p>
        </div>
      </div>

      <div className="inquiry-filters">
        <input
          className="inquiry-filter-input"
          type="search"
          placeholder="Search by name, email, phone, referral code"
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
        />
      </div>

      {error ? <div className="portal-error">{error}</div> : null}

      {loading ? (
        <p className="product-empty">Loading referral users...</p>
      ) : filteredReferralUsers.length === 0 ? (
        <p className="product-empty">No referral users found yet.</p>
      ) : (
        <div className="product-table-wrap">
          <table className="product-table inquiry-table">
            <thead>
              <tr>
                <th>User Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Referral Code</th>
                <th>Discount</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredReferralUsers.map((item) => (
                <tr key={item.id}>
                  <td><strong>{item.name}</strong></td>
                  <td>{item.email}</td>
                  <td>{item.phone}</td>
                  <td>{item.referral_code}</td>
                  <td>{item.discount_percentage}%</td>
                  <td>
                    <div className="product-actions">
                      <button className="product-action-button" type="button" onClick={() => handleEditClick(item)}>
                        Edit
                      </button>
                      <button className="product-action-button delete" type="button" onClick={() => handleDelete(item)}>
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editingReferralUser ? (
        <div className="admin-modal-backdrop" onClick={handleModalClose}>
          <div className="admin-modal" onClick={(event) => event.stopPropagation()}>
            <div className="admin-modal-header">
              <h2>Edit Referral User</h2>
              <button className="admin-modal-close" type="button" onClick={handleModalClose}>&times;</button>
            </div>

            <form className="product-form" onSubmit={handleSave}>
              <div className="product-form-grid">
                <label className="portal-field">
                  <span>Name</span>
                  <input value={form.name} onChange={(event) => handleChange('name', event.target.value)} required />
                </label>

                <label className="portal-field">
                  <span>Email</span>
                  <input type="email" value={form.email} onChange={(event) => handleChange('email', event.target.value)} required />
                </label>

                <label className="portal-field">
                  <span>Phone</span>
                  <input value={form.phone} onChange={(event) => handleChange('phone', event.target.value)} required />
                </label>

                <label className="portal-field">
                  <span>Referral Code</span>
                  <input
                    value={form.referral_code}
                    onChange={(event) => handleChange('referral_code', event.target.value.replace(/\D/g, '').slice(0, 8))}
                    required
                  />
                </label>

                <label className="portal-field">
                  <span>Discount Percentage</span>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={form.discount_percentage}
                    onChange={(event) => handleChange('discount_percentage', event.target.value)}
                    required
                  />
                </label>
              </div>

              <div className="product-form-actions">
                <button className="portal-submit" type="submit" disabled={submitting}>
                  {submitting ? 'Saving...' : 'Save Changes'}
                </button>
                <button className="portal-secondary" type="button" onClick={handleModalClose}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </section>
  )
}

export default ReferralUsersPanel
