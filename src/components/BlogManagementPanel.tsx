import type { FormEvent } from 'react'
import { useEffect, useMemo, useState } from 'react'
import '../AdminPortal.css'
import { fetchBlogSections, createBlogSection, updateBlogSection, deleteBlogSection, buildApiUrl } from '../lib/productApi'
import type { BlogSectionPayload, BlogSectionRecord, SubSectionItem, SubSectionSource } from '../lib/productApi'

type SectionForm = {
  type: 'description' | 'comparison' | 'nested'
  display_order: number | ''
  kicker: string
  heading: string
  body: string
  compColumns: string[]
  compRows: { label: string; values: string[] }[]
  subSections: SubSectionItem[]
}

const emptySubSection: SubSectionItem = {
  icon: '',
  heading: '',
  description: '',
  sources: [],
}

const emptyForm: SectionForm = {
  type: 'description',
  display_order: '',
  kicker: '',
  heading: '',
  body: '',
  compColumns: ['Feature', 'Product A', 'Product B'],
  compRows: [],
  subSections: [],
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

    const subSections: SubSectionItem[] = Array.isArray(item.sub_sections) ? item.sub_sections : []

    setForm({
      type: item.type,
      display_order: item.display_order,
      kicker: item.kicker || '',
      heading: item.heading || '',
      body: item.body || '',
      compColumns,
      compRows,
      subSections,
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

  const handleSubSectionChange = (index: number, field: keyof SubSectionItem, value: string) => {
    const next = [...form.subSections]
    next[index] = { ...next[index], [field]: value }
    handleChange('subSections', next)
  }

  const addSubSection = () => {
    handleChange('subSections', [...form.subSections, { ...emptySubSection }])
  }

  const removeSubSection = (index: number) => {
    handleChange('subSections', form.subSections.filter((_, i) => i !== index))
  }

  const moveSubSection = (index: number, direction: -1 | 1) => {
    const target = index + direction
    if (target < 0 || target >= form.subSections.length) return
    const next = [...form.subSections]
    const temp = next[index]
    next[index] = next[target]
    next[target] = temp
    handleChange('subSections', next)
  }

  const handleSourceChange = (subIndex: number, sourceIndex: number, field: keyof SubSectionSource, value: string) => {
    const next = [...form.subSections]
    next[subIndex] = { ...next[subIndex], sources: [...next[subIndex].sources] }
    next[subIndex].sources[sourceIndex] = { ...next[subIndex].sources[sourceIndex], [field]: value }
    handleChange('subSections', next)
  }

  const addSource = (subIndex: number) => {
    const next = [...form.subSections]
    next[subIndex] = { ...next[subIndex], sources: [...next[subIndex].sources, { title: '', url: '' }] }
    handleChange('subSections', next)
  }

  const removeSource = (subIndex: number, sourceIndex: number) => {
    const next = [...form.subSections]
    next[subIndex] = { ...next[subIndex], sources: next[subIndex].sources.filter((_, i) => i !== sourceIndex) }
    handleChange('subSections', next)
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

    if (form.type === 'nested' && form.subSections.length === 0) {
      setFormError('Add at least one sub-section.')
      return
    }

    setSubmitting(true)
    setFormError('')

    try {
      const comparisonJson = form.type === 'comparison'
        ? JSON.stringify({ columns: form.compColumns, rows: form.compRows })
        : ''

      const subSectionsJson = form.type === 'nested'
        ? JSON.stringify(form.subSections)
        : ''

      const payload: BlogSectionPayload = {
        type: form.type,
        display_order: form.display_order === '' ? 0 : form.display_order,
        kicker: form.kicker,
        heading: form.heading,
        body: form.body,
        comparison_data: comparisonJson,
        sub_sections: subSectionsJson || undefined,
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
          <p>Manage blog page sections — description blocks, comparison tables, and nested sub-section groups.</p>
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
                <th>Items</th>
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
                  <td>{item.sub_sections ? `${item.sub_sections.length} subs` : '-'}</td>
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
                    onChange={(event) => handleChange('type', event.target.value as 'description' | 'comparison' | 'nested')}
                  >
                    <option value="description">Description</option>
                    <option value="comparison">Comparison Table</option>
                    <option value="nested">Nested Sub-Sections</option>
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
                ) : form.type === 'comparison' ? (
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
                ) : (
                  <>
                    <label className="portal-field portal-field-full">
                      <span>Parent Heading</span>
                      <input
                        placeholder="e.g. Research Section"
                        value={form.heading}
                        onChange={(event) => handleChange('heading', event.target.value)}
                      />
                      <small>This is the main heading for the group of sub-sections.</small>
                    </label>

                    <div className="portal-field portal-field-full">
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                        <span>Sub-Sections</span>
                        <button type="button" className="portal-btn portal-btn-sm" onClick={addSubSection}>+ Add Sub Section</button>
                      </div>

                      {form.subSections.length === 0 ? (
                        <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>No sub-sections yet. Click "Add Sub Section" to begin.</p>
                      ) : (
                        form.subSections.map((sub, si) => (
                          <div key={si} style={{ marginBottom: '1rem', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '0.75rem', background: '#f8fafc' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                              <strong style={{ fontSize: '0.9rem', color: '#334155' }}>Sub-Section #{si + 1}</strong>
                              <div style={{ display: 'flex', gap: '0.25rem' }}>
                                <button type="button" className="portal-btn portal-btn-sm" onClick={() => moveSubSection(si, -1)} disabled={si === 0} style={{ padding: '2px 8px' }}>↑</button>
                                <button type="button" className="portal-btn portal-btn-sm" onClick={() => moveSubSection(si, 1)} disabled={si === form.subSections.length - 1} style={{ padding: '2px 8px' }}>↓</button>
                                <button type="button" className="portal-btn portal-btn-sm portal-btn-danger" onClick={() => removeSubSection(si)} style={{ padding: '2px 8px' }}>&times;</button>
                              </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '0.5rem', marginBottom: '0.5rem' }}>
                              <label style={{ fontSize: '0.8rem', color: '#64748b', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                                Icon/Emoji
                                <input
                                  placeholder="🌿"
                                  value={sub.icon}
                                  onChange={(event) => handleSubSectionChange(si, 'icon', event.target.value)}
                                  style={{ fontSize: '1.1rem' }}
                                />
                              </label>
                              <label style={{ fontSize: '0.8rem', color: '#64748b', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                                Heading
                                <input
                                  placeholder="Healthy Aging"
                                  value={sub.heading}
                                  onChange={(event) => handleSubSectionChange(si, 'heading', event.target.value)}
                                />
                              </label>
                            </div>

                            <label style={{ fontSize: '0.8rem', color: '#64748b', display: 'flex', flexDirection: 'column', gap: '0.2rem', marginBottom: '0.5rem' }}>
                              Description
                              <textarea
                                rows={3}
                                placeholder="Description text for this sub-section..."
                                value={sub.description}
                                onChange={(event) => handleSubSectionChange(si, 'description', event.target.value)}
                              />
                            </label>

                            <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '0.5rem' }}>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                                <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>Research Sources</span>
                                <button type="button" className="portal-btn portal-btn-sm" onClick={() => addSource(si)}>+ Add Source</button>
                              </div>
                              {sub.sources.length === 0 ? (
                                <p style={{ color: '#94a3b8', fontSize: '0.8rem' }}>No sources yet.</p>
                              ) : (
                                sub.sources.map((src, si2) => (
                                  <div key={si2} style={{ display: 'flex', gap: '0.25rem', alignItems: 'center', marginBottom: '0.3rem' }}>
                                    <input
                                      style={{ width: '140px', fontSize: '0.8rem' }}
                                      placeholder="Source title"
                                      value={src.title}
                                      onChange={(event) => handleSourceChange(si, si2, 'title', event.target.value)}
                                    />
                                    <input
                                      style={{ flex: 1, fontSize: '0.8rem' }}
                                      placeholder="https://..."
                                      value={src.url}
                                      onChange={(event) => handleSourceChange(si, si2, 'url', event.target.value)}
                                    />
                                    <button type="button" className="portal-btn portal-btn-sm portal-btn-danger" onClick={() => removeSource(si, si2)} style={{ padding: '2px 8px', fontSize: '0.75rem' }}>&times;</button>
                                  </div>
                                ))
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
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
