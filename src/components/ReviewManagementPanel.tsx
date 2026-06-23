import { useEffect, useState } from 'react'
import { fetchProducts, reviewApi, type ProductRecord, type ReviewRecord } from '../lib/productApi'

function ReviewManagementPanel() {
  const [reviews, setReviews] = useState<ReviewRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [products, setProducts] = useState<ProductRecord[]>([])
  const [addForm, setAddForm] = useState({
    product_id: '',
    user_name: '',
    rating: 5,
    comment: '',
  })
  const [isAddSubmitting, setIsAddSubmitting] = useState(false)

  const loadReviews = async () => {
    try {
      setLoading(true)
      const data = await reviewApi.fetchAdminReviews()
      setReviews(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Reviews load nahi ho paye')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadReviews()
  }, [])

  const openAddModal = async () => {
    try {
      const allProducts = await fetchProducts()
      setProducts(allProducts)
    } catch {
      setProducts([])
    }
    setAddForm({ product_id: '', user_name: '', rating: 5, comment: '' })
    setShowAddModal(true)
  }

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!addForm.product_id || !addForm.user_name || !addForm.comment) {
      window.alert('Please fill all fields')
      return
    }

    setIsAddSubmitting(true)
    try {
      const created = await reviewApi.submitReview({
        product_id: Number(addForm.product_id),
        user_name: addForm.user_name,
        rating: addForm.rating,
        comment: addForm.comment,
      })
      await reviewApi.updateReviewStatus(created.id, true)
      await loadReviews()
      setShowAddModal(false)
    } catch (err) {
      window.alert(err instanceof Error ? err.message : 'Review add nahi ho paya')
    } finally {
      setIsAddSubmitting(false)
    }
  }

  const handleToggleStatus = async (review: ReviewRecord) => {
    try {
      await reviewApi.updateReviewStatus(review.id, !review.is_approved)
      await loadReviews()
    } catch (err) {
      window.alert(err instanceof Error ? err.message : 'Status update failed')
    }
  }

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this review?')) {
      return
    }

    try {
      await reviewApi.deleteReview(id)
      await loadReviews()
    } catch (err) {
      window.alert(err instanceof Error ? err.message : 'Delete failed')
    }
  }

  if (loading) return <div className="admin-panel-loading">Loading reviews...</div>
  if (error) return <div className="admin-panel-error">{error}</div>

  return (
    <div className="admin-management-panel reviews-management">
      <div className="panel-header">
        <h2>Review Management</h2>
        <div className="panel-actions">
          <button className="add-button" onClick={() => void openAddModal()}>
            + Add Review
          </button>
          <button className="refresh-button" onClick={() => void loadReviews()}>
            Refresh
          </button>
        </div>
      </div>

      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Product</th>
              <th>Customer</th>
              <th>Rating</th>
              <th>Comment</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {reviews.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center">No reviews found.</td>
              </tr>
            ) : (
              reviews.map((review) => (
                <tr key={review.id}>
                  <td>{review.id}</td>
                  <td>{review.product?.name || 'Unknown Product'}</td>
                  <td>{review.user_name}</td>
                  <td>
                    <span className="rating-stars">
                      {'★'.repeat(review.rating)}
                    </span>
                  </td>
                  <td>
                    <div className="comment-preview" title={review.comment}>
                      {review.comment}
                    </div>
                  </td>
                  <td>
                    <span className={`status-badge ${review.is_approved ? 'approved' : 'pending'}`}>
                      {review.is_approved ? 'Approved' : 'Pending'}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button
                        className={`action-btn ${review.is_approved ? 'hide-btn' : 'approve-btn'}`}
                        onClick={() => void handleToggleStatus(review)}
                      >
                        {review.is_approved ? 'Hide' : 'Approve'}
                      </button>
                      <button
                        className="action-btn delete-btn"
                        onClick={() => void handleDelete(review.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showAddModal ? (
        <div className="admin-modal-backdrop" onClick={() => setShowAddModal(false)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h2>Add Review</h2>
              <button className="admin-modal-close" onClick={() => setShowAddModal(false)}>
                &times;
              </button>
            </div>
            <form onSubmit={handleAddSubmit} className="admin-review-form">
              <div className="form-group">
                <label htmlFor="add-review-product">Product</label>
                <select
                  id="add-review-product"
                  value={addForm.product_id}
                  onChange={(e) => setAddForm({ ...addForm, product_id: e.target.value })}
                  required
                >
                  <option value="">-- Select Product --</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="add-review-name">Customer Name</label>
                <input
                  type="text"
                  id="add-review-name"
                  value={addForm.user_name}
                  onChange={(e) => setAddForm({ ...addForm, user_name: e.target.value })}
                  placeholder="Enter customer name"
                  required
                />
              </div>
              <div className="form-group">
                <label>Rating</label>
                <div className="star-rating-input">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      className={`star-button ${star <= addForm.rating ? 'active' : ''}`}
                      onClick={() => setAddForm({ ...addForm, rating: star })}
                      aria-label={`Rate ${star} stars`}
                    >
                      ★
                    </button>
                  ))}
                </div>
              </div>
              <div className="form-group">
                <label htmlFor="add-review-comment">Review</label>
                <textarea
                  id="add-review-comment"
                  value={addForm.comment}
                  onChange={(e) => setAddForm({ ...addForm, comment: e.target.value })}
                  placeholder="Write review"
                  rows={4}
                  required
                />
              </div>
              <div className="admin-modal-actions">
                <button type="submit" className="admin-submit-btn" disabled={isAddSubmitting}>
                  {isAddSubmitting ? 'Adding...' : 'Add Review'}
                </button>
                <button
                  type="button"
                  className="admin-cancel-btn"
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  )
}

export default ReviewManagementPanel
