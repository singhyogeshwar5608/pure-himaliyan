import { useEffect, useState, useMemo } from 'react'
import {
  fetchProductDescriptions,
  createProductDescription,
  updateProductDescription,
  deleteProductDescription,
} from '../lib/productApi'
import type { ProductDescriptionRecord, ProductDescriptionPayload } from '../lib/productApi'

type Props = {
  productId: number
  productName: string
}

const emptyForm: ProductDescriptionPayload = { kicker: 'Description', heading: '', body: '', display_order: '' }

function ProductDescriptionPanel({ productId, productName }: Props) {
  const [descriptions, setDescriptions] = useState<ProductDescriptionRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [form, setForm] = useState<ProductDescriptionPayload>(emptyForm)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null)

  const sorted = useMemo(
    () => [...descriptions].sort((a, b) => a.display_order - b.display_order),
    [descriptions],
  )

  const loadDescriptions = async () => {
    setLoading(true)
    setError('')

    try {
      const items = await fetchProductDescriptions(productId)
      setDescriptions(items)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load descriptions.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadDescriptions()
  }, [productId])

  const handleChange = (field: keyof ProductDescriptionPayload, value: string) => {
    setForm((prev) => ({
      ...prev,
      [field]: field === 'display_order' ? (value === '' ? '' : Number(value)) : value,
    }))
  }

  const handleSubmit = async () => {
    if (!form.heading.trim() || !form.body.trim()) {
      setError('Heading aur Body dono required hain.')
      return
    }

    setSubmitting(true)
    setError('')

    try {
      if (editingId !== null) {
        const updated = await updateProductDescription(productId, editingId, form)
        setDescriptions((prev) => prev.map((d) => (d.id === editingId ? updated : d)))
        setEditingId(null)
      } else {
        const created = await createProductDescription(productId, form)
        setDescriptions((prev) => [...prev, created])
      }

      setForm(emptyForm)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed.')
    } finally {
      setSubmitting(false)
    }
  }

  const startEdit = (desc: ProductDescriptionRecord) => {
    setEditingId(desc.id)
    setForm({ kicker: desc.kicker, heading: desc.heading, body: desc.body, display_order: desc.display_order })
    setDeleteConfirmId(null)
  }

  const cancelEdit = () => {
    setEditingId(null)
    setForm(emptyForm)
  }

  const handleDelete = async (id: number) => {
    try {
      await deleteProductDescription(productId, id)
      setDescriptions((prev) => prev.filter((d) => d.id !== id))
      setDeleteConfirmId(null)

      if (editingId === id) {
        setEditingId(null)
        setForm(emptyForm)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed.')
    }
  }

  return (
    <div className="portal-panel">
      <h3 className="portal-panel-title">Description Sections — {productName}</h3>

      {error ? <div className="portal-error">{error}</div> : null}

      <div className="portal-form-grid">
        <div className="portal-field">
          <label>Kicker Label</label>
          <input type="text" value={form.kicker} onChange={(e) => handleChange('kicker', e.target.value)} placeholder="e.g. Description" />
        </div>
        <div className="portal-field">
          <label>Heading *</label>
          <input type="text" value={form.heading} onChange={(e) => handleChange('heading', e.target.value)} placeholder="e.g. Product Overview" />
        </div>
        <div className="portal-field">
          <label>Display Order</label>
          <input type="number" value={form.display_order} onChange={(e) => handleChange('display_order', e.target.value)} placeholder="0" min={0} />
        </div>
        <div className="portal-field portal-field-full">
          <label>Body *</label>
          <textarea rows={5} value={form.body} onChange={(e) => handleChange('body', e.target.value)} placeholder="Description content — har line ek bullet point banega" />
        </div>
        <div className="portal-field portal-field-full portal-actions-row">
          <button type="button" className="portal-btn portal-btn-primary" disabled={submitting} onClick={handleSubmit}>
            {submitting ? 'Saving...' : editingId !== null ? 'Update Section' : 'Add Section'}
          </button>
          {editingId !== null ? (
            <button type="button" className="portal-btn" onClick={cancelEdit}>
              Cancel
            </button>
          ) : null}
        </div>
      </div>

      {loading ? (
        <p className="portal-loading">Loading descriptions...</p>
      ) : sorted.length === 0 ? (
        <p className="portal-empty">No description sections yet. Add one above.</p>
      ) : (
        <table className="portal-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Heading</th>
              <th>Body (preview)</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((desc) => (
              <tr key={desc.id}>
                <td>{desc.display_order}</td>
                <td><strong>{desc.heading}</strong></td>
                <td style={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {desc.body.length > 80 ? `${desc.body.slice(0, 80)}…` : desc.body}
                </td>
                <td>
                  <div className="portal-actions-row">
                    <button type="button" className="portal-btn portal-btn-sm" onClick={() => startEdit(desc)}>
                      Edit
                    </button>
                    {deleteConfirmId === desc.id ? (
                      <>
                        <button type="button" className="portal-btn portal-btn-sm portal-btn-danger" onClick={() => handleDelete(desc.id)}>
                          Confirm
                        </button>
                        <button type="button" className="portal-btn portal-btn-sm" onClick={() => setDeleteConfirmId(null)}>
                          Cancel
                        </button>
                      </>
                    ) : (
                      <button type="button" className="portal-btn portal-btn-sm portal-btn-danger" onClick={() => setDeleteConfirmId(desc.id)}>
                        Delete
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}

export default ProductDescriptionPanel
