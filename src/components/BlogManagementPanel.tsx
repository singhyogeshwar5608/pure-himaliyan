import type { FormEvent } from 'react'
import { useEffect, useMemo, useState } from 'react'
import '../AdminPortal.css'
import { fetchBlogSections, createBlogSection, updateBlogSection, deleteBlogSection, buildApiUrl } from '../lib/productApi'
import type { BlogSectionPayload, BlogSectionRecord } from '../lib/productApi'

type SectionForm = {
  type: 'description' | 'comparison'
  display_order: number | ''
  kicker: string
  heading: string
  body: string
  compColumns: string[]
  compRows: { label: string; values: string[] }[]
}

const emptyForm: SectionForm = {
  type: 'description',
  display_order: '',
  kicker: '',
  heading: '',
  body: '',
  compColumns: ['Feature', 'Product A', 'Product B'],
  compRows: [],
}

function BlogManagementPanel() {
  const [sections, setSections] = useState<BlogSectionRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [form, setForm] = useState<SectionForm>({ ...emptyForm })
  const [submitting, setSubmitting] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [formError, setFormError] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null)
  const [removeExistingImage, setRemoveExistingImage] = useState(false)
  const [fileInputKey, setFileInputKey] = useState(0)

  const sortedSections = useMemo(() => {
    return [...sections].sort((a, b) => a.display_order - b.display_order)
  }, [sections])

  const loadSections = async () => {
    setLoading(true)
    setError('')

    try {
      const items = await fetchBlogSections()
      setSections(items)
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to load blog sections.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadSections()
  }, [])

  useEffect(() => {
    return () => {
      if (imagePreview) URL.revokeObjectURL(imagePreview)
    }
  }, [imagePreview])

  const handleChange = <Key extends keyof SectionForm>(field: Key, value: SectionForm[Key]) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const resetForm = () => {
    setForm({ ...emptyForm })
    setFormError('')
    setEditingId(null)
    setImageFile(null)
    if (imagePreview) URL.revokeObjectURL(imagePreview)
    setImagePreview(null)
    setExistingImageUrl(null)
    setRemoveExistingImage(false)
    setFileInputKey((key) => key + 1)
  }

  const handleAddClick = () => {
    resetForm()
    setModalOpen(true)
  }

  const handleEditClick = (item: BlogSectionRecord) => {
    let compColumns = ['Feature', 'Product A', 'Product B']
    let compRows: { label: string; values: string[] }[] = []

    if (item.comparison_data) {
      try {
        const parsed = JSON.parse(item.comparison_data)
        if (Array.isArray(parsed.columns)) compColumns = parsed.columns
        if (Array.isArray(parsed.rows)) compRows = parsed.rows
      } catch { /* ignore */ }
    }

    setForm({
      type: item.type,
      display_order: item.display_order,
      kicker: item.kicker || '',
      heading: item.heading || '',
      body: item.body || '',
      compColumns,
      compRows,
    })
    setEditingId(item.id)
    setFormError('')
    setImageFile(null)
    setImagePreview(null)
    setExistingImageUrl(item.image_url)
    setRemoveExistingImage(false)
    setFileInputKey((key) => key + 1)
    setModalOpen(true)
  }

  const handleModalClose = () => {
    if (submitting) return
    setModalOpen(false)
    resetForm()
  }

  const handleFileChange = (file: File | null) => {
    if (imagePreview) URL.revokeObjectURL(imagePreview)

    if (file) {
      setImageFile(file)
      setImagePreview(URL.createObjectURL(file))
      setRemoveExistingImage(false)
      return
    }

    setImageFile(null)
    setImagePreview(null)
  }

  const handleRemoveImage = () => {
    if (imagePreview) URL.revokeObjectURL(imagePreview)
    setImageFile(null)
    setImagePreview(null)
    if (existingImageUrl) {
      setRemoveExistingImage(true)
    }
  }

  const handleCompColumnChange = (index: number, value: string) => {
    const next = [...form.compColumns]
    next[index] = value
    handleChange('compColumns', next)
  }

  const addCompColumn = () => {
    handleChange('compColumns', [...form.compColumns, ''])
    handleChange('compRows', form.compRows.map((r) => ({ ...r, values: [...r.values, ''] })))
  }

  const removeCompColumn = (index: number) => {
    if (form.compColumns.length <= 1) return
    const nextCols = form.compColumns.filter((_, i) => i !== index)
    const nextRows = form.compRows.map((r) => ({ ...r, values: r.values.filter((_, i) => i !== index) }))
    handleChange('compColumns', nextCols)
    handleChange('compRows', nextRows)
  }

  const handleCompRowLabelChange = (index: number, value: string) => {
    const next = [...form.compRows]
    next[index] = { ...next[index], label: value }
    handleChange('compRows', next)
  }

  const handleCompRowValueChange = (rowIndex: number, colIndex: number, value: string) => {
    const next = [...form.compRows]
    next[rowIndex] = { ...next[rowIndex], values: [...next[rowIndex].values] }
    next[rowIndex].values[colIndex] = value
    handleChange('compRows', next)
  }

  const addCompRow = () => {
    handleChange('compRows', [
      ...form.compRows,
      { label: '', values: form.compColumns.slice(1).map(() => '') },
    ])
  }

  const removeCompRow = (index: number) => {
    handleChange('compRows', form.compRows.filter((_, i) => i !== index))
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!form.heading && form.type === 'description') {
      setFormError('Heading is required for description sections.')
      return
    }

    if (form.type === 'comparison' && form.compRows.length === 0) {
      setFormError('Add at least one row to the comparison table.')
      return
    }

    setSubmitting(true)
    setFormError('')

    try {
      const comparisonJson = form.type === 'comparison'
        ? JSON.stringify({ columns: form.compColumns, rows: form.compRows })
        : ''

      const payload: BlogSectionPayload = {
        type: form.type,
        display_order: form.display_order === '' ? 0 : form.display_order,
        kicker: form.kicker,
        heading: form.heading,
        body: form.body,
        comparison_data: comparisonJson,
        image: imageFile || undefined,
        remove_image: removeExistingImage || undefined,
      }

      if (editingId !== null) {
        const updated = await updateBlogSection(editingId, payload)
        setSections((current) => current.map((s) => (s.id === editingId ? updated : s)))
      } else {
        const created = await createBlogSection(payload)
        setSections((current) => [created, ...current])
      }

      setModalOpen(false)
      resetForm()
    } catch (requestError) {
      setFormError(requestError instanceof Error ? requestError.message : 'Unable to save blog section.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (item: BlogSectionRecord) => {
    const confirmed = window.confirm(`Delete blog section "${item.heading || item.type}"?`)
    if (!confirmed) return

    try {
      await deleteBlogSection(item.id)
      setSections((current) => current.filter((s) => s.id !== item.id))
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to delete blog section.')
    }
  }

  return (
    <section className="dashboard-panel dashboard-panel-wide">
      <div className="product-toolbar">
        <div>
          <h3>Blog Management</h3>
          <p>Manage blog page sections — description blocks and comparison tables, ordered by display order.</p>
        </div>
        <button className="dashboard-action" type="button" onClick={handleAddClick}>
          Add Section
        </button>
      </div>

      {error ? <div className="portal-error">{error}</div> : null}

      {loading ? (
        <p className="product-empty">Loading blog sections...</p>
      ) : sortedSections.length === 0 ? (
        <p className="product-empty">No blog sections yet.</p>
      ) : (
        <div className="product-table-wrap">
          <table className="product-table">
            <thead>
              <tr>
                <th>Order</th>
                <th>Type</th>
                <th>Kicker</th>
                <th>Heading</th>
                <th>Image</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedSections.map((item) => (
                <tr key={item.id}>
                  <td>{item.display_order}</td>
                  <td>
                    <span style={{ textTransform: 'capitalize', fontWeight: 600 }}>
                      {item.type}
                    </span>
                  </td>
                  <td>{item.kicker || '-'}</td>
                  <td><strong>{item.heading || '(comparison table)'}</strong></td>
                  <td>{item.image_url ? '✓' : '-'}</td>
                  <td>{item.created_at ? new Date(item.created_at).toLocaleDateString() : '-'}</td>
                  <td>
                    <div className="product-actions">
                      <button className="product-action-button edit" type="button" onClick={() => handleEditClick(item)}>
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

      {modalOpen ? (
        <div className="admin-modal-backdrop" onClick={handleModalClose}>
          <div className="admin-modal admin-modal-wide" onClick={(event) => event.stopPropagation()}>
            <div className="admin-modal-header">
              <h2>{editingId !== null ? 'Edit Blog Section' : 'Add Blog Section'}</h2>
              <button className="admin-modal-close" type="button" onClick={handleModalClose}>&times;</button>
            </div>

            <form className="product-form" onSubmit={handleSubmit}>
              <div className="product-form-grid">
                <label className="portal-field">
                  <span>Type</span>
                  <select
                    value={form.type}
                    onChange={(event) => handleChange('type', event.target.value as 'description' | 'comparison')}
                  >
                    <option value="description">Description</option>
                    <option value="comparison">Comparison Table</option>
                  </select>
                </label>

                <label className="portal-field">
                  <span>Display Order</span>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={form.display_order === '' ? '' : String(form.display_order)}
                    onChange={(event) => handleChange('display_order', event.target.value === '' ? '' : Number(event.target.value))}
                  />
                </label>

                <label className="portal-field">
                  <span>Kicker</span>
                  <input
                    placeholder="e.g. Introduction, Benefits"
                    value={form.kicker}
                    onChange={(event) => handleChange('kicker', event.target.value)}
                  />
                </label>

                {form.type === 'description' ? (
                  <>
                    <label className="portal-field portal-field-full">
                      <span>Heading</span>
                      <input
                        placeholder="Section heading"
                        value={form.heading}
                        onChange={(event) => handleChange('heading', event.target.value)}
                      />
                    </label>

                    <label className="portal-field portal-field-full">
                      <span>Body</span>
                      <textarea
                        rows={8}
                        placeholder="Use ## for headings. Each line becomes a bullet point."
                        value={form.body}
                        onChange={(event) => handleChange('body', event.target.value)}
                      />
                      <small>Lines starting with ## become bold headings. Other lines become bullet points. Use &lt;a href=&quot;https://example.com&quot; target=&quot;_blank&quot; title=&quot;Tooltip text&quot; rel=&quot;noopener noreferrer&quot;&gt;link text&lt;/a&gt; for clickable links. The title attribute shows a tooltip on hover.</small>
                    </label>

                    <div className="portal-field portal-field-full">
                      <span>Image</span>
                      <input
                        key={fileInputKey}
                        type="file"
                        accept="image/*"
                        onChange={(event) => handleFileChange(event.target.files?.[0] ?? null)}
                      />
                      <small>Optional image to display alongside the description.</small>

                      {imagePreview ? (
                        <div className="gallery-upload-preview" style={{ marginTop: '0.5rem' }}>
                          <img src={imagePreview} alt="Preview" style={{ maxWidth: '200px', maxHeight: '150px', borderRadius: '8px' }} />
                          <button type="button" className="portal-btn portal-btn-sm portal-btn-danger" onClick={handleRemoveImage} style={{ marginTop: '0.25rem' }}>
                            Remove
                          </button>
                        </div>
                      ) : existingImageUrl && !removeExistingImage ? (
                        <div className="gallery-upload-preview" style={{ marginTop: '0.5rem' }}>
                          <img src={buildApiUrl(existingImageUrl)} alt="Current" style={{ maxWidth: '200px', maxHeight: '150px', borderRadius: '8px' }} />
                          <button type="button" className="portal-btn portal-btn-sm portal-btn-danger" onClick={handleRemoveImage} style={{ marginTop: '0.25rem' }}>
                            Remove
                          </button>
                        </div>
                      ) : removeExistingImage ? (
                        <p style={{ color: '#dc2626', fontSize: '0.85rem', marginTop: '0.25rem' }}>Image will be removed on save.</p>
                      ) : null}
                    </div>
                  </>
                ) : (
                  <>
                    <label className="portal-field portal-field-full">
                      <span>Heading</span>
                      <input
                        placeholder="Optional heading above the table"
                        value={form.heading}
                        onChange={(event) => handleChange('heading', event.target.value)}
                      />
                    </label>

                    <div className="portal-field portal-field-full">
                      <span>Comparison Columns</span>
                      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.4rem' }}>
                        {form.compColumns.map((col, ci) => (
                          <div key={ci} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            <input
                              style={{ width: '120px' }}
                              placeholder={`Column ${ci + 1}`}
                              value={col}
                              onChange={(event) => handleCompColumnChange(ci, event.target.value)}
                            />
                            {form.compColumns.length > 1 ? (
                              <button type="button" className="portal-btn portal-btn-sm portal-btn-danger" onClick={() => removeCompColumn(ci)} style={{ padding: '2px 8px', fontSize: '0.75rem' }}>&times;</button>
                            ) : null}
                          </div>
                        ))}
                        <button type="button" className="portal-btn portal-btn-sm" onClick={addCompColumn}>+ Add Column</button>
                      </div>
                    </div>

                    <div className="portal-field portal-field-full">
                      <span>Comparison Rows</span>
                      {form.compRows.length === 0 ? (
                        <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>No rows yet. Click below to add one.</p>
                      ) : (
                        form.compRows.map((row, ri) => (
                          <div key={ri} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', padding: '0.5rem', marginBottom: '0.4rem', border: '1px solid #e2e8f0', borderRadius: '8px', background: '#f8fafc' }}>
                            <input
                              style={{ width: '140px' }}
                              placeholder="Row label"
                              value={row.label}
                              onChange={(event) => handleCompRowLabelChange(ri, event.target.value)}
                            />
                            {row.values.map((val, vi) => (
                              <input
                                key={vi}
                                style={{ width: '120px' }}
                                placeholder={form.compColumns[vi + 1] || `Value ${vi + 1}`}
                                value={val}
                                onChange={(event) => handleCompRowValueChange(ri, vi, event.target.value)}
                              />
                            ))}
                            <button type="button" className="portal-btn portal-btn-sm portal-btn-danger" onClick={() => removeCompRow(ri)} style={{ padding: '2px 8px', fontSize: '0.75rem' }}>&times;</button>
                          </div>
                        ))
                      )}
                      <button type="button" className="portal-btn portal-btn-sm" onClick={addCompRow}>+ Add Row</button>
                    </div>

                    {form.compRows.length > 0 ? (
                      <div className="portal-field portal-field-full">
                        <span>Preview</span>
                        <div style={{ overflowX: 'auto' }}>
                          <table className="comparison-table" style={{ fontSize: '0.82rem' }}>
                            <thead>
                              <tr>
                                {form.compColumns.map((col, ci) => (
                                  <th key={ci}>{col || `Column ${ci + 1}`}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {form.compRows.map((row, ri) => (
                                <tr key={ri}>
                                  <td className="comparison-table-label">{row.label}</td>
                                  {row.values.map((val, vi) => (
                                    <td key={vi}>{val}</td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ) : null}
                  </>
                )}
              </div>

              {formError ? <div className="portal-error">{formError}</div> : null}

              <div className="product-form-actions">
                <button className="portal-submit" type="submit" disabled={submitting}>
                  {submitting ? 'Saving...' : editingId !== null ? 'Update Section' : 'Create Section'}
                </button>
                <button className="portal-secondary" type="button" onClick={handleModalClose} disabled={submitting}>
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

export default BlogManagementPanel
