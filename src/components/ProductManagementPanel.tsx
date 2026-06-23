import { useEffect, useMemo, useState } from 'react'
import '../AdminPortal.css'
import ProductModal from './ProductModal'
import {
  createProduct,
  deleteProduct,
  fetchProducts,
  resolveProductImageUrl,
  updateProduct,
} from '../lib/productApi'
import type { ProductPayload, ProductRecord } from '../lib/productApi'

type Props = {
  allowDelete: boolean
  allowEdit: boolean
  title: string
  description: string
}

function ProductManagementPanel({ allowDelete, allowEdit, title, description }: Props) {
  const [products, setProducts] = useState<ProductRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<ProductRecord | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const modalTitle = useMemo(
    () => (editingProduct ? 'Edit Product' : 'Add Product'),
    [editingProduct],
  )

  const loadProducts = async () => {
    setLoading(true)
    setError('')

    try {
      const items = await fetchProducts()
      setProducts(items)
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to load products.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadProducts()
  }, [])

  const handleAddClick = () => {
    setEditingProduct(null)
    setModalOpen(true)
  }

  const handleEditClick = (product: ProductRecord) => {
    setEditingProduct(product)
    setModalOpen(true)
  }

  const handleModalClose = () => {
    if (submitting) {
      return
    }

    setModalOpen(false)
    setEditingProduct(null)
  }

  const handleSave = async (payload: ProductPayload) => {
    setSubmitting(true)

    try {
      if (editingProduct) {
        const updated = await updateProduct(editingProduct.id, payload)
        setProducts((current) => current.map((product) => (product.id === updated.id ? updated : product)))
        setModalOpen(false)
        setEditingProduct(null)
      } else {
        const created = await createProduct(payload)
        setProducts((current) => [created, ...current])
        setEditingProduct(created)
      }
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (product: ProductRecord) => {
    const confirmed = window.confirm(`Delete ${product.name}?`)

    if (!confirmed) {
      return
    }

    try {
      await deleteProduct(product.id)
      setProducts((current) => current.filter((item) => item.id !== product.id))
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to delete product.')
    }
  }

  return (
    <section className="dashboard-panel dashboard-panel-wide">
      <div className="product-toolbar">
        <div>
          <h3>{title}</h3>
          <p>{description}</p>
        </div>
        <button className="dashboard-action" type="button" onClick={handleAddClick}>Add Product</button>
      </div>

      {error ? <div className="portal-error">{error}</div> : null}

      {loading ? (
        <p className="product-empty">Loading products...</p>
      ) : products.length === 0 ? (
        <p className="product-empty">No products found yet.</p>
      ) : (
        <div className="product-table-wrap">
          <table className="product-table">
            <thead>
              <tr>
                <th>Image</th>
                <th>Name</th>
                <th>Price</th>
                <th>Badge</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id}>
                  <td>
                    <div className="product-thumb-wrap">
                      <img
                        src={resolveProductImageUrl(product.images?.[0] || product.image_url)}
                        alt={product.name}
                        className="product-thumb"
                      />
                    </div>
                  </td>
                  <td>
                    <strong>{product.name}</strong>
                    <div>{product.slug}</div>
                  </td>
                  <td>₹{product.price}</td>
                  <td>{product.badge || '-'}</td>
                  <td>{product.is_active ? 'Active' : 'Inactive'}</td>
                  <td>
                    <div className="product-actions">
                      {allowEdit ? (
                        <button className="product-action-button" type="button" onClick={() => handleEditClick(product)}>
                          Edit
                        </button>
                      ) : null}
                      {allowDelete ? (
                        <button className="product-action-button delete" type="button" onClick={() => handleDelete(product)}>
                          Delete
                        </button>
                      ) : null}
                      {!allowEdit && !allowDelete ? <span>View Only</span> : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ProductModal
        initialProduct={editingProduct}
        isOpen={modalOpen}
        isSubmitting={submitting}
        title={modalTitle}
        onClose={handleModalClose}
        onSubmit={handleSave}
      />
    </section>
  )
}

export default ProductManagementPanel
