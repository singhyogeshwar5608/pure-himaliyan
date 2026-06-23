import type { FormEvent } from 'react'
import { useEffect, useMemo, useState } from 'react'
import '../AdminPortal.css'
import { createMobileBannerImage, deleteMobileBannerImage, fetchMobileBannerImages } from '../lib/productApi'
import type { BannerImagePayload, BannerImageRecord } from '../lib/productApi'

const emptyForm: BannerImagePayload = {
  title: '',
  order: '',
  file: null,
}

function MobileBannerManagementPanel() {
  const [bannerItems, setBannerItems] = useState<BannerImageRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [form, setForm] = useState<BannerImagePayload>({ ...emptyForm })
  const [submitting, setSubmitting] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [formError, setFormError] = useState('')
  const [fileInputKey, setFileInputKey] = useState(0)

  const sortedBannerItems = useMemo(() => {
    return [...bannerItems].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
  }, [bannerItems])

  const loadBannerItems = async () => {
    setLoading(true)
    setError('')

    try {
      const items = await fetchMobileBannerImages()
      setBannerItems(items)
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to load mobile banner images.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadBannerItems()
  }, [])

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
      }
    }
  }, [previewUrl])

  const handleChange = <Key extends keyof BannerImagePayload>(field: Key, value: BannerImagePayload[Key]) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const resetFormState = () => {
    setForm({ ...emptyForm })
    setFormError('')
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
    }
    setPreviewUrl(null)
    setFileInputKey((key) => key + 1)
  }

  const handleAddClick = () => {
    setModalOpen(true)
    resetFormState()
  }

  const handleModalClose = () => {
    if (submitting) {
      return
    }

    setModalOpen(false)
    resetFormState()
  }

  const handleFileChange = (file: File | null) => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
    }

    if (file) {
      const nextPreview = URL.createObjectURL(file)
      setPreviewUrl(nextPreview)
      handleChange('file', file)
      return
    }

    setPreviewUrl(null)
    handleChange('file', null)
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!form.file) {
      setFormError('Please select an image to upload.')
      return
    }

    setSubmitting(true)
    setFormError('')

    try {
      const created = await createMobileBannerImage({
        ...form,
        order: form.order === '' ? '' : Number(form.order),
      })
      setBannerItems((current) => [created, ...current])
      setModalOpen(false)
      resetFormState()
    } catch (requestError) {
      setFormError(requestError instanceof Error ? requestError.message : 'Unable to upload mobile banner image.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (item: BannerImageRecord) => {
    const confirmed = window.confirm(`Delete mobile banner image "${item.title}"?`)

    if (!confirmed) {
      return
    }

    try {
      await deleteMobileBannerImage(item.id)
      setBannerItems((current) => current.filter((bannerItem) => bannerItem.id !== item.id))
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to delete mobile banner image.')
    }
  }

  return (
    <section className="dashboard-panel dashboard-panel-wide">
      <div className="product-toolbar">
        <div>
          <h3>Mobile Banner Management</h3>
          <p>Upload hero banner images for the mobile home page slider and control their display order.</p>
        </div>
        <button className="dashboard-action" type="button" onClick={handleAddClick}>
          Add Mobile Banner Image
        </button>
      </div>

      {error ? <div className="portal-error">{error}</div> : null}

      {loading ? (
        <p className="product-empty">Loading mobile banner images...</p>
      ) : sortedBannerItems.length === 0 ? (
        <p className="product-empty">No mobile banner images uploaded yet.</p>
      ) : (
        <div className="product-table-wrap">
          <table className="product-table gallery-table">
            <thead>
              <tr>
                <th>Preview</th>
                <th>Title</th>
                <th>Order</th>
                <th>Uploaded</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedBannerItems.map((item) => (
                <tr key={item.id}>
                  <td>
                    <div className="gallery-thumb-wrap">
                      <img src={item.image} alt={item.title} className="gallery-thumb" loading="lazy" />
                    </div>
                  </td>
                  <td>
                    <strong>{item.title || 'Untitled Banner'}</strong>
                  </td>
                  <td>{item.order ?? '-'}</td>
                  <td>{item.created_at ? new Date(item.created_at).toLocaleDateString() : '-'}</td>
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
              <h2>Upload Mobile Banner Image</h2>
              <button className="admin-modal-close" type="button" onClick={handleModalClose}>
                &times;
              </button>
            </div>

            <form className="product-form gallery-form" onSubmit={handleSubmit}>
              <div className="product-form-grid">
                <label className="portal-field">
                  <span>Title</span>
                  <input
                    placeholder="Enter banner title"
                    value={form.title}
                    onChange={(event) => handleChange('title', event.target.value)}
                    required
                  />
                </label>

                <label className="portal-field">
                  <span>Order</span>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={form.order === '' ? '' : String(form.order)}
                    onChange={(event) => handleChange('order', event.target.value === '' ? '' : Number(event.target.value))}
                  />
                </label>

                <label className="portal-field">
                  <span>Image</span>
                  <input
                    key={fileInputKey}
                    type="file"
                    accept="image/*"
                    onChange={(event) => handleFileChange(event.target.files?.[0] ?? null)}
                    required
                  />
                  <small>Recommended mobile hero image size: 1080x1350 or similar portrait banner.</small>
                </label>

                {previewUrl ? (
                  <div className="gallery-upload-preview">
                    <span>Preview</span>
                    <img src={previewUrl} alt="Mobile banner preview" />
                  </div>
                ) : null}
              </div>

              {formError ? <div className="portal-error">{formError}</div> : null}

              <div className="product-form-actions">
                <button className="portal-submit" type="submit" disabled={submitting}>
                  {submitting ? 'Uploading...' : 'Upload Banner'}
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

export default MobileBannerManagementPanel

