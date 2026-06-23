import type { FormEvent } from 'react'
import { useEffect, useMemo, useState } from 'react'
import '../AdminPortal.css'
import { createGalleryItem, deleteGalleryItem, fetchGallery, fetchProducts, getGalleryVideoEmbedUrl } from '../lib/productApi'
import type { GalleryMediaType, GalleryPayload, GalleryRecord, ProductRecord } from '../lib/productApi'

const emptyForm: GalleryPayload = {
  product_id: '',
  title: '',
  display_order: '',
  media_type: 'image',
  file: null,
  video_url: '',
}

function GalleryManagementPanel() {
  const [galleryItems, setGalleryItems] = useState<GalleryRecord[]>([])
  const [products, setProducts] = useState<ProductRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [form, setForm] = useState<GalleryPayload>({ ...emptyForm })
  const [submitting, setSubmitting] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [formError, setFormError] = useState('')
  const [fileInputKey, setFileInputKey] = useState(0)

  const sortedGalleryItems = useMemo(() => {
    return [...galleryItems].sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0))
  }, [galleryItems])

  const videoPreviewUrl = form.media_type === 'video' ? getGalleryVideoEmbedUrl(form.video_url) : null

  const loadGallery = async () => {
    setLoading(true)
    setError('')

    try {
      const [items, productList] = await Promise.all([
        fetchGallery(),
        fetchProducts()
      ])
      setGalleryItems(items)
      setProducts(productList)
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to load gallery images.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadGallery()
  }, [])

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
      }
    }
  }, [previewUrl])

  const handleChange = <Key extends keyof GalleryPayload>(field: Key, value: GalleryPayload[Key]) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleAddClick = () => {
    setModalOpen(true)
    setForm({ ...emptyForm })
    setFormError('')
    setPreviewUrl(null)
    setFileInputKey((key) => key + 1)
  }

  const handleModalClose = () => {
    if (submitting) {
      return
    }

    setModalOpen(false)
    setForm({ ...emptyForm })
    setFormError('')
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
    }
    setPreviewUrl(null)
    setFileInputKey((key) => key + 1)
  }

  const handleFileChange = (file: File | null) => {
    if (form.media_type !== 'image') {
      return
    }

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
    }

    if (file) {
      const newPreview = URL.createObjectURL(file)
      setPreviewUrl(newPreview)
      handleChange('file', file)
      return
    }

    setPreviewUrl(null)
    handleChange('file', null)
  }

  const handleMediaTypeChange = (nextType: GalleryMediaType) => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
    }

    setPreviewUrl(null)
    setFileInputKey((key) => key + 1)
    setForm((prev) => ({
      ...prev,
      media_type: nextType,
      file: null,
      video_url: nextType === 'video' ? prev.video_url : '',
    }))
    setFormError('')
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (form.media_type === 'image' && !form.file) {
      setFormError('Please select an image to upload.')
      return
    }

    if (form.media_type === 'video' && form.video_url.trim() === '') {
      setFormError('Please enter a valid video URL.')
      return
    }

    setSubmitting(true)
    setFormError('')

    try {
      const created = await createGalleryItem({
        ...form,
        display_order: form.display_order === '' ? '' : Number(form.display_order),
      })
      setGalleryItems((current) => [created, ...current])
      setForm({ ...emptyForm })
      setPreviewUrl(null)
      setFileInputKey((key) => key + 1)
      setModalOpen(false)
    } catch (requestError) {
      setFormError(requestError instanceof Error ? requestError.message : 'Unable to upload image.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (item: GalleryRecord) => {
    const confirmed = window.confirm(`Delete ${item.media_type === 'video' ? 'video' : 'image'} "${item.title}"?`)

    if (!confirmed) {
      return
    }

    try {
      await deleteGalleryItem(item.id)
      setGalleryItems((current) => current.filter((galleryItem) => galleryItem.id !== item.id))
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to delete gallery image.')
    }
  }

  return (
    <section className="dashboard-panel dashboard-panel-wide">
      <div className="product-toolbar">
        <div>
          <h3>Gallery Management</h3>
          <p>Upload gallery images or add social video URLs for the media section on the website.</p>
        </div>
        <button className="dashboard-action" type="button" onClick={handleAddClick}>
          Add Gallery Media
        </button>
      </div>

      {error ? <div className="portal-error">{error}</div> : null}

      {loading ? (
        <p className="product-empty">Loading gallery images...</p>
      ) : sortedGalleryItems.length === 0 ? (
        <p className="product-empty">No gallery media uploaded yet.</p>
      ) : (
        <div className="product-table-wrap">
          <table className="product-table gallery-table">
            <thead>
              <tr>
                <th>Preview</th>
                <th>Title</th>
                <th>Type</th>
                <th>Display Order</th>
                <th>Uploaded</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedGalleryItems.map((item) => (
                <tr key={item.id}>
                  <td>
                    <div className="gallery-thumb-wrap">
                      {item.media_type === 'video' ? (
                        getGalleryVideoEmbedUrl(item.video_url) ? (
                          <iframe
                            src={getGalleryVideoEmbedUrl(item.video_url) || ''}
                            title={item.title || 'Gallery video preview'}
                            className="gallery-thumb-frame"
                            loading="lazy"
                            referrerPolicy="strict-origin-when-cross-origin"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                            allowFullScreen
                          />
                        ) : item.video_url ? (
                          <a className="gallery-thumb-link" href={item.video_url} target="_blank" rel="noreferrer">
                            Open Video
                          </a>
                        ) : null
                      ) : (
                        <img src={item.image_path} alt={item.title} className="gallery-thumb" loading="lazy" />
                      )}
                    </div>
                  </td>
                  <td>
                    <strong>{item.title || `Untitled ${item.media_type === 'video' ? 'Video' : 'Image'}`}</strong>
                  </td>
                  <td>{item.media_type === 'video' ? 'Video' : 'Image'}</td>
                  <td>{item.display_order ?? '-'}</td>
                  <td>{new Date(item.created_at).toLocaleDateString()}</td>
                  <td>
                    <div className="product-actions">
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
          <div className="admin-modal" onClick={(event) => event.stopPropagation()}>
            <div className="admin-modal-header">
              <h2>Add Gallery Media</h2>
              <button className="admin-modal-close" type="button" onClick={handleModalClose}>
                &times;
              </button>
            </div>

            <form className="product-form gallery-form" onSubmit={handleSubmit}>
              <div className="product-form-grid">
                <label className="portal-field">
                  <span>Associated Product (Optional)</span>
                  <select 
                    value={form.product_id} 
                    onChange={(event) => handleChange('product_id', event.target.value === '' ? '' : Number(event.target.value))}
                  >
                    <option value="">No Product (General)</option>
                    {products.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </label>

                <label className="portal-field">
                  <span>Title</span>
                  <input
                    placeholder="Enter image title"
                    value={form.title}
                    onChange={(event) => handleChange('title', event.target.value)}
                    required
                  />
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
                  <span>Media Type</span>
                  <select value={form.media_type} onChange={(event) => handleMediaTypeChange(event.target.value as GalleryMediaType)}>
                    <option value="image">Image Upload</option>
                    <option value="video">Video URL</option>
                  </select>
                </label>

                {form.media_type === 'image' ? (
                  <label className="portal-field">
                    <span>Image</span>
                    <input
                      key={fileInputKey}
                      type="file"
                      accept="image/*"
                      onChange={(event) => handleFileChange(event.target.files?.[0] ?? null)}
                      required={form.media_type === 'image'}
                    />
                    <small>Recommended size: 1600x1600 (square)</small>
                  </label>
                ) : (
                  <label className="portal-field">
                    <span>Video URL</span>
                    <input
                      type="url"
                      placeholder="Paste YouTube, Instagram, or Facebook video URL"
                      value={form.video_url}
                      onChange={(event) => handleChange('video_url', event.target.value)}
                      required={form.media_type === 'video'}
                    />
                    <small>Supported platforms: YouTube, Instagram, Facebook.</small>
                  </label>
                )}

                {form.media_type === 'image' && previewUrl ? (
                  <div className="gallery-upload-preview">
                    <span>Preview</span>
                    <img src={previewUrl} alt="Gallery preview" />
                  </div>
                ) : null}

                {form.media_type === 'video' && videoPreviewUrl ? (
                  <div className="gallery-upload-preview">
                    <span>Preview</span>
                    <iframe
                      src={videoPreviewUrl}
                      title="Gallery video preview"
                      loading="lazy"
                      referrerPolicy="strict-origin-when-cross-origin"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                    />
                  </div>
                ) : null}
              </div>

              {formError ? <div className="portal-error">{formError}</div> : null}

              <div className="product-form-actions">
                <button className="portal-submit" type="submit" disabled={submitting}>
                  {submitting ? 'Saving...' : form.media_type === 'video' ? 'Add Video' : 'Upload Image'}
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

export default GalleryManagementPanel
