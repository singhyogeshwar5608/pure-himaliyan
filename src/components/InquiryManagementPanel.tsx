import { useEffect, useMemo, useState } from 'react'
import '../AdminPortal.css'
import { fetchInquiries } from '../lib/productApi'
import type { InquiryRecord } from '../lib/productApi'

function InquiryManagementPanel() {
  const [inquiries, setInquiries] = useState<InquiryRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedDate, setSelectedDate] = useState('')

  useEffect(() => {
    const loadInquiries = async () => {
      setLoading(true)
      setError('')

      try {
        const items = await fetchInquiries()
        setInquiries(items)
      } catch (requestError) {
        setError(requestError instanceof Error ? requestError.message : 'Unable to load inquiries.')
      } finally {
        setLoading(false)
      }
    }

    void loadInquiries()
  }, [])

  const filteredInquiries = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase()

    return inquiries.filter((inquiry) => {
      const matchesQuery =
        normalizedQuery === '' ||
        inquiry.name.toLowerCase().includes(normalizedQuery) ||
        inquiry.phone.toLowerCase().includes(normalizedQuery) ||
        (inquiry.email || '').toLowerCase().includes(normalizedQuery) ||
        (inquiry.message || '').toLowerCase().includes(normalizedQuery)

      const inquiryDate = new Date(inquiry.created_at).toISOString().slice(0, 10)
      const matchesDate = selectedDate === '' || inquiryDate === selectedDate

      return matchesQuery && matchesDate
    })
  }, [inquiries, searchQuery, selectedDate])

  return (
    <section className="dashboard-panel dashboard-panel-wide">
      <div className="product-toolbar">
        <div>
          <h3>Inquiry Management</h3>
        </div>
      </div>

      <div className="inquiry-filters">
        <input
          className="inquiry-filter-input"
          type="search"
          placeholder="Search by name, phone, email, message"
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
        <p className="product-empty">Loading inquiries...</p>
      ) : filteredInquiries.length === 0 ? (
        <p className="product-empty">No inquiries found yet.</p>
      ) : (
        <div className="product-table-wrap">
          <table className="product-table inquiry-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Phone</th>
                <th>Email</th>
                <th>Message</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {filteredInquiries.map((inquiry) => (
                <tr key={inquiry.id}>
                  <td><strong>{inquiry.name}</strong></td>
                  <td>{inquiry.phone}</td>
                  <td>{inquiry.email || '-'}</td>
                  <td>{inquiry.message || '-'}</td>
                  <td>{new Date(inquiry.created_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}

export default InquiryManagementPanel
