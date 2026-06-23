import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import '../AdminPortal.css'
import {
  createProductDescription,
  deleteProductDescription,
  fetchProductDescriptions,
  resolveProductImageUrl,
  updateProductDescription,
} from '../lib/productApi'
import type {
  ProductDescriptionPayload,
  ProductDescriptionRecord,
  ProductPayload,
  ProductRecord,
} from '../lib/productApi'

type Props = {
  initialProduct?: ProductRecord | null
  isOpen: boolean
  isSubmitting: boolean
  title: string
  onClose: () => void
  onSubmit: (payload: ProductPayload) => Promise<void>
}

const emptyForm: ProductPayload = {
  name: '',
  short_description: '',
  video_url: '',
  description: '',
  price: '',
  original_price: '',
  discount: '',
  badge: '',
  image_url: '',
  image_files: [],
  affiliate_commission: '',
  shipping_rate: '',
  prepaid_discount_percent: '',
  gst_percent: '',
  cod_charges: '',
  is_active: true,
  all_charges_included: false,
  comparison_data: '',
  comparison_display_order: '',
  existing_images: [],
}

const emptyDescForm: ProductDescriptionPayload = { kicker: 'Description', heading: '', body: '', image_file: null, remove_image: false, display_order: '' }

function ProductModal({ initialProduct, isOpen, isSubmitting, title, onClose, onSubmit }: Props) {
  const [form, setForm] = useState<ProductPayload>(emptyForm)
  const [error, setError] = useState('')
  const [descriptions, setDescriptions] = useState<ProductDescriptionRecord[]>([])
  const [descForm, setDescForm] = useState<ProductDescriptionPayload>(emptyDescForm)
  const [editingDescId, setEditingDescId] = useState<number | null>(null)
  const [descSubmitting, setDescSubmitting] = useState(false)
  const [descError, setDescError] = useState('')
  const [compColumns, setCompColumns] = useState<string[]>(['Feature', 'Product'])
  const [compRows, setCompRows] = useState<{ label: string; values: string[] }[]>([])

  useEffect(() => {
    if (!initialProduct) {
      setForm(emptyForm)
      setCompColumns(['Feature', 'Product'])
      setCompRows([])
      return
    }

    const images = initialProduct.images ? [...initialProduct.images] : []
    const normalizedImages = Array.from(new Set([initialProduct.image_url, ...images].filter((value): value is string => Boolean(value))))

    let parsedCols = ['Feature', 'Product']
    let parsedRows: { label: string; values: string[] }[] = []

    if (initialProduct.comparison_data) {
      try {
        const parsed = JSON.parse(initialProduct.comparison_data)
        if (Array.isArray(parsed.columns)) parsedCols = parsed.columns
        if (Array.isArray(parsed.rows)) parsedRows = parsed.rows
      } catch { /* ignore invalid JSON */ }
    }

    setCompColumns(parsedCols)
    setCompRows(parsedRows)

    setForm({
      name: initialProduct.name,
      short_description: initialProduct.short_description || '',
      video_url: initialProduct.video_url || '',
      description: initialProduct.description || '',
      price: initialProduct.price || '',
      original_price: initialProduct.original_price || '',
      discount: initialProduct.discount?.toString() || '',
      badge: initialProduct.badge || '',
      image_url: initialProduct.image_url || '',
      image_files: [],
      affiliate_commission: initialProduct.affiliate_commission || '',
      shipping_rate: initialProduct.shipping_rate ?? '',
      prepaid_discount_percent: initialProduct.prepaid_discount_percent ?? '',
      gst_percent: initialProduct.gst_percent ?? '',
      cod_charges: initialProduct.cod_charges ?? '',
      is_active: initialProduct.is_active,
      all_charges_included: initialProduct.all_charges_included ?? false,
      comparison_data: initialProduct.comparison_data || '',
      comparison_display_order: initialProduct.comparison_display_order ?? '',
      existing_images: normalizedImages,
    })
  }, [initialProduct])

  useEffect(() => {
    if (!isOpen) {
      setError('')
      setDescriptions([])
      setDescForm(emptyDescForm)
      setEditingDescId(null)
      setDescError('')
      setCompColumns(['Feature', 'Product'])
      setCompRows([])
      return
    }

    if (initialProduct?.id) {
      void loadDescriptions(initialProduct.id)
    }
  }, [isOpen, initialProduct])

  const loadDescriptions = async (productId: number) => {
    try {
      const items = await fetchProductDescriptions(productId)
      setDescriptions(items)
    } catch {
      /* ignore */
    }
  }

  const handleDescChange = (field: keyof ProductDescriptionPayload, value: string) => {
    setDescForm((prev) => ({
      ...prev,
      [field]: field === 'display_order' ? (value === '' ? '' : Number(value)) : value,
    }))
  }

  const handleDescImageChange = (file: File | null) => {
    setDescForm((prev) => ({
      ...prev,
      image_file: file,
      remove_image: false,
    }))
  }

  const editingDesc = editingDescId !== null ? descriptions.find((d) => d.id === editingDescId) : null

  const handleDescSubmit = async () => {
    if (!initialProduct?.id) return
    if (!descForm.heading.trim() || !descForm.body.trim()) {
      setDescError('Heading aur Body dono required hain.')
      return
    }

    setDescSubmitting(true)
    setDescError('')

    try {
      if (editingDescId !== null) {
        const updated = await updateProductDescription(initialProduct.id, editingDescId, descForm)
        setDescriptions((prev) => prev.map((d) => (d.id === editingDescId ? updated : d)))
        setEditingDescId(null)
      } else {
        const created = await createProductDescription(initialProduct.id, descForm)
        setDescriptions((prev) => [...prev, created])
      }
      setDescForm(emptyDescForm)
    } catch (err) {
      setDescError(err instanceof Error ? err.message : 'Save failed.')
    } finally {
      setDescSubmitting(false)
    }
  }

  const handleDescDelete = async (id: number) => {
    if (!initialProduct?.id) return
    try {
      await deleteProductDescription(initialProduct.id, id)
      setDescriptions((prev) => prev.filter((d) => d.id !== id))
      if (editingDescId === id) {
        setEditingDescId(null)
        setDescForm(emptyDescForm)
      }
    } catch (err) {
      setDescError(err instanceof Error ? err.message : 'Delete failed.')
    }
  }

  if (!isOpen) {
    return null
  }

  const handleChange = (field: keyof ProductPayload, value: string | boolean | File[]) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')

    try {
      const comparisonJson = JSON.stringify({ columns: compColumns, rows: compRows })
      const payload = { ...form, comparison_data: comparisonJson }
      await onSubmit(payload)
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to save product.')
    }
  }

  const handleSelectMainImage = (imageUrl: string) => {
    setForm((prev) => ({
      ...prev,
      image_url: imageUrl,
    }))
  }

  const handleDeleteExistingImage = (imageUrl: string) => {
    setForm((prev) => {
      const updatedImages = prev.existing_images.filter((image) => image !== imageUrl)
      const nextMainImage = prev.image_url === imageUrl ? (updatedImages[0] ?? '') : prev.image_url

      return {
        ...prev,
        existing_images: updatedImages,
        image_url: nextMainImage,
      }
    })
  }

  return (
    <div className="admin-modal-backdrop" onClick={onClose}>
      <div className="admin-modal" onClick={(event) => event.stopPropagation()}>
        <div className="admin-modal-header">
          <h2>{title}</h2>
          <button className="admin-modal-close" type="button" onClick={onClose}>&times;</button>
        </div>

        {error ? <div className="portal-error">{error}</div> : null}

        <form className="product-form" onSubmit={handleSubmit}>
          <div className="product-form-grid">
            <label className="portal-field">
              <span>Product Name</span>
              <input value={form.name} onChange={(event) => handleChange('name', event.target.value)} required />
            </label>

            <label className="portal-field">
              <span>Price</span>
              <input value={form.price} onChange={(event) => handleChange('price', event.target.value)} required />
            </label>

            <label className="portal-field">
              <span>Original Price</span>
              <input value={form.original_price} onChange={(event) => handleChange('original_price', event.target.value)} />
            </label>

            <label className="portal-field">
              <span>Discount</span>
              <input value={form.discount} onChange={(event) => handleChange('discount', event.target.value)} />
            </label>

            <label className="portal-field">
              <span>Badge</span>
              <input value={form.badge} onChange={(event) => handleChange('badge', event.target.value)} />
            </label>

            <label className="portal-field">
              <span>Product Images</span>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={(event) => handleChange('image_files', Array.from(event.target.files || []))}
              />
              <small>Max 10MB per image</small>
            </label>

            <label className="portal-field">
              <span>Affiliate Commission</span>
              <input value={form.affiliate_commission} onChange={(event) => handleChange('affiliate_commission', event.target.value)} />
            </label>

            <label className="portal-field">
              <span>Shipping rate (₹)</span>
              <input
                inputMode="decimal"
                value={form.shipping_rate}
                onChange={(event) => handleChange('shipping_rate', event.target.value)}
                placeholder="0"
              />
              <small>Har order par yeh shipping total mein judegi (COD aur online dono).</small>
            </label>

            <label className="portal-field">
              <span>Online payment discount (%)</span>
              <input
                inputMode="decimal"
                value={form.prepaid_discount_percent}
                onChange={(event) => handleChange('prepaid_discount_percent', event.target.value)}
                placeholder="0"
              />
              <small>
                Referral ke baad jo item subtotal banta hai us par % — sirf &quot;Online Payment&quot; par (max 100%).
              </small>
            </label>

            <label className="portal-field">
              <span>GST charges (%)</span>
              <input
                inputMode="decimal"
                value={form.gst_percent}
                onChange={(event) => handleChange('gst_percent', event.target.value)}
                placeholder="0"
              />
              <small>
                Checkout par offer ke baad subtotal par yeh % GST add hoga (Shipping excluded); 0 rakhen agar GST na lage.
              </small>
            </label>

            <label className="portal-field">
              <span>COD handling charges (₹)</span>
              <input
                inputMode="decimal"
                value={form.cod_charges}
                onChange={(event) => handleChange('cod_charges', event.target.value)}
                placeholder="0"
              />
              <small>
                Agar customer COD payment method choose karta hai, toh yeh ₹ amount usse Razorpay ke through advance mein pay karni hogi.
              </small>
            </label>

            <label className="portal-field product-form-toggle">
              <input type="checkbox" checked={form.is_active} onChange={(event) => handleChange('is_active', event.target.checked)} />
              <span>Active</span>
            </label>

            <label className="portal-field product-form-toggle">
              <input type="checkbox" checked={form.all_charges_included} onChange={(event) => handleChange('all_charges_included', event.target.checked)} />
              <span>All charges included</span>
            </label>
          </div>

          <label className="portal-field">
            <span>Short Description (Product heading ke niche)</span>
            <textarea
              value={form.short_description}
              onChange={(event) => handleChange('short_description', event.target.value)}
              rows={3}
              placeholder="Ye text product detail page me product name ke niche dikhaya jayega."
            />
          </label>

          <label className="portal-field">
            <span>Product Video URL</span>
            <input
              type="url"
              value={form.video_url}
              onChange={(event) => handleChange('video_url', event.target.value)}
              placeholder="YouTube ya direct video URL"
            />
          </label>

          <label className="portal-field">
            <span>Description</span>
            <textarea value={form.description} onChange={(event) => handleChange('description', event.target.value)} rows={4} />
          </label>

          <div className="portal-panel">
            <h3 className="portal-panel-title">Comparison Table</h3>
            <p style={{ margin: '0 0 1rem', color: '#64748b', fontSize: '0.88rem' }}>
              Ek comparison table banayein. Har row ka ek heading (label) hoga. Admin jitne chahe utne columns aur rows add/remove kar sakta hai.
            </p>

            <label className="portal-field" style={{ marginBottom: '0.75rem' }}>
              <span>Display Order</span>
              <input
                type="number"
                min="0"
                placeholder="999"
                value={form.comparison_display_order === '' ? '' : String(form.comparison_display_order)}
                onChange={(event) => handleChange('comparison_display_order', (event.target.value === '' ? '' : Number(event.target.value)) as unknown as string)}
                style={{ width: '120px' }}
              />
              <small>Is order mein description sections ke beech mein table dikhega.</small>
            </label>

            <div className="portal-field" style={{ marginBottom: '0.75rem' }}>
              <label>Column Headers</label>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.4rem' }}>
                {compColumns.map((col, ci) => (
                  <div key={ci} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <input
                      type="text"
                      value={col}
                      onChange={(e) => {
                        const updated = [...compColumns]
                        updated[ci] = e.target.value
                        setCompColumns(updated)
                      }}
                      style={{ width: '120px' }}
                      placeholder={`Column ${ci + 1}`}
                    />
                    {compColumns.length > 1 ? (
                      <button
                        type="button"
                        className="portal-btn portal-btn-sm portal-btn-danger"
                        onClick={() => {
                          const updated = compColumns.filter((_, i) => i !== ci)
                          setCompColumns(updated)
                          setCompRows((prev) => prev.map((r) => ({ ...r, values: r.values.filter((_, i) => i !== ci) })))
                        }}
                        style={{ padding: '2px 8px', fontSize: '0.75rem' }}
                      >
                        ×
                      </button>
                    ) : null}
                  </div>
                ))}
                <button
                  type="button"
                  className="portal-btn portal-btn-sm"
                  onClick={() => setCompColumns((prev) => [...prev, ''])}
                >
                  + Add Column
                </button>
              </div>
            </div>

            <div style={{ marginBottom: '0.75rem' }}>
              <label style={{ fontWeight: 600, fontSize: '0.88rem', display: 'block', marginBottom: '0.4rem' }}>Rows</label>
              {compRows.map((row, ri) => (
                <div
                  key={ri}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    flexWrap: 'wrap',
                    padding: '0.5rem',
                    marginBottom: '0.4rem',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    background: '#f8fafc',
                  }}
                >
                  <input
                    type="text"
                    value={row.label}
                    onChange={(e) => {
                      const updated = [...compRows]
                      updated[ri] = { ...updated[ri], label: e.target.value }
                      setCompRows(updated)
                    }}
                    style={{ width: '140px' }}
                    placeholder="Row label"
                  />
                  {row.values.map((val, vi) => (
                    <input
                      key={vi}
                      type="text"
                      value={val}
                      onChange={(e) => {
                        const updated = [...compRows]
                        updated[ri] = { ...updated[ri], values: [...updated[ri].values] }
                        updated[ri].values[vi] = e.target.value
                        setCompRows(updated)
                      }}
                      style={{ width: '120px' }}
                      placeholder={`Value ${vi + 1}`}
                    />
                  ))}
                  <button
                    type="button"
                    className="portal-btn portal-btn-sm portal-btn-danger"
                    onClick={() => setCompRows((prev) => prev.filter((_, i) => i !== ri))}
                    style={{ padding: '2px 8px', fontSize: '0.75rem' }}
                  >
                    ×
                  </button>
                </div>
              ))}
              <button
                type="button"
                className="portal-btn portal-btn-sm"
                onClick={() => setCompRows((prev) => [...prev, { label: '', values: compColumns.slice(1).map(() => '') }])}
              >
                + Add Row
              </button>
            </div>

            {compRows.length > 0 ? (
              <div style={{ overflowX: 'auto', marginTop: '1rem' }}>
                <table className="comparison-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                  <thead>
                    <tr>
                      {compColumns.map((col, ci) => (
                        <th key={ci} style={{ border: '1px solid #e2e8f0', padding: '0.5rem 0.75rem', background: '#f1f5f9', textAlign: 'left' }}>
                          {col || `Column ${ci + 1}`}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {compRows.map((row, ri) => (
                      <tr key={ri}>
                        <td style={{ border: '1px solid #e2e8f0', padding: '0.5rem 0.75rem', fontWeight: 700 }}>{row.label}</td>
                        {row.values.map((val, vi) => (
                          <td key={vi} style={{ border: '1px solid #e2e8f0', padding: '0.5rem 0.75rem' }}>{val}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null}
          </div>

          {form.existing_images.length ? (
            <div className="product-image-preview-grid">
              {form.existing_images.map((imageUrl, index) => (
                <div className="product-image-preview" key={`${imageUrl}-${index}`}>
                  <span>{`Image ${index + 1}`}</span>
                  <div className="product-image-preview-thumb">
                    <img src={resolveProductImageUrl(imageUrl)} alt={`Product ${index + 1}`} />
                    <button className="product-image-delete-button" type="button" onClick={() => handleDeleteExistingImage(imageUrl)} aria-label="Delete image">
                      ×
                    </button>
                  </div>
                  <button
                    className={`portal-secondary product-image-main-toggle ${form.image_url === imageUrl ? 'active' : ''}`}
                    type="button"
                    onClick={() => handleSelectMainImage(imageUrl)}
                  >
                    {form.image_url === imageUrl ? 'Main Image Selected' : 'Set as Main Image'}
                  </button>
                </div>
              ))}
            </div>
          ) : form.image_url ? (
            <div className="product-image-preview">
              <span>Current Image</span>
              <img src={resolveProductImageUrl(form.image_url)} alt="Current product" />
            </div>
          ) : null}

          <div className="product-form-actions">
            <button className="portal-submit" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save Product'}
            </button>
            <button className="portal-secondary" type="button" onClick={onClose}>Cancel</button>
          </div>
        </form>

        {initialProduct?.id ? (
          <div className="portal-panel">
            <h3 className="portal-panel-title">Description Sections</h3>
            <p style={{ margin: '0 0 1rem', color: '#64748b', fontSize: '0.88rem' }}>
              Har section ka apna heading aur body hoga. Body mein har line ek bullet point banega. <code>## Heading</code> se bold heading banegi.
            </p>

            {descError ? <div className="portal-error">{descError}</div> : null}

            <div className="portal-form-grid">
              <div className="portal-field">
                <label>Kicker Label</label>
                <input type="text" value={descForm.kicker} onChange={(e) => handleDescChange('kicker', e.target.value)} placeholder="e.g. Description" />
              </div>
              <div className="portal-field">
                <label>Section Heading *</label>
                <input type="text" value={descForm.heading} onChange={(e) => handleDescChange('heading', e.target.value)} placeholder="e.g. Product Overview" />
              </div>
              <div className="portal-field">
                <label>Display Order</label>
                <input type="number" value={descForm.display_order} onChange={(e) => handleDescChange('display_order', e.target.value)} placeholder="0" min={0} />
              </div>
              <div className="portal-field portal-field-full">
                <label>Body *</label>
                <textarea rows={4} value={descForm.body} onChange={(e) => handleDescChange('body', e.target.value)} placeholder={"Line 1\nLine 2\n## Bold Heading\nLine 3"} />
              </div>
              <div className="portal-field portal-field-full">
                <label>Description Image (optional)</label>
                <input type="file" accept="image/*" onChange={(e) => handleDescImageChange(e.target.files?.[0] ?? null)} />
                <small>Recommended: square/portrait, max 10MB</small>
              </div>
              {editingDesc?.image_url ? (
                <div className="portal-field portal-field-full">
                  <label>Current Description Image</label>
                  <div className="product-image-preview" style={{ marginTop: 6 }}>
                    <img src={resolveProductImageUrl(editingDesc.image_url)} alt="Description" style={{ maxWidth: 260, borderRadius: 12 }} />
                  </div>
                  <div className="portal-actions-row" style={{ marginTop: 10 }}>
                    <button
                      type="button"
                      className="portal-btn portal-btn-sm portal-btn-danger"
                      onClick={() => setDescForm((prev) => ({ ...prev, image_file: null, remove_image: true }))}
                    >
                      Remove image
                    </button>
                    {descForm.remove_image ? <span style={{ color: '#b91c1c', fontSize: '0.88rem' }}>Image will be removed on update.</span> : null}
                  </div>
                </div>
              ) : null}
              <div className="portal-field portal-field-full portal-actions-row">
                <button type="button" className="portal-btn portal-btn-primary" disabled={descSubmitting} onClick={handleDescSubmit}>
                  {descSubmitting ? 'Saving...' : editingDescId !== null ? 'Update Section' : 'Add Section'}
                </button>
                {editingDescId !== null ? (
                  <button type="button" className="portal-btn" onClick={() => { setEditingDescId(null); setDescForm(emptyDescForm) }}>Cancel</button>
                ) : null}
              </div>
            </div>

            {descriptions.length > 0 ? (
              <div className="desc-section-list">
                {[...descriptions].sort((a, b) => a.display_order - b.display_order).map((desc) => (
                  <div key={desc.id} className="desc-section-item">
                    <div className="desc-section-item-header">
                      <strong>{desc.heading}</strong>
                      <span style={{ color: '#94a3b8', fontSize: '0.82rem' }}>Order: {desc.display_order}</span>
                    </div>
                    <p className="desc-section-item-body">{desc.body.length > 120 ? `${desc.body.slice(0, 120)}…` : desc.body}</p>
                    <div className="portal-actions-row">
                      <button
                        type="button"
                        className="portal-btn portal-btn-sm"
                        onClick={() => {
                          setEditingDescId(desc.id)
                          setDescForm({ kicker: desc.kicker, heading: desc.heading, body: desc.body, image_file: null, remove_image: false, display_order: desc.display_order })
                        }}
                      >
                        Edit
                      </button>
                      <button type="button" className="portal-btn portal-btn-sm portal-btn-danger" onClick={() => handleDescDelete(desc.id)}>Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  )
}

export default ProductModal
