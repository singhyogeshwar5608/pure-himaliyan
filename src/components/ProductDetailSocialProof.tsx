import { useEffect, useState } from 'react'
import { footerHighlights } from '../data/marketingContent'
import { reviewApi, type ReviewRecord } from '../lib/productApi'

export function ProductTrustedExpertsMarquee() {
  const [highlightPreviewSrc, setHighlightPreviewSrc] = useState<string | null>(null)

  useEffect(() => {
    if (!highlightPreviewSrc) {
      return
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setHighlightPreviewSrc(null)
      }
    }

    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'auto'
    }
  }, [highlightPreviewSrc])

  return (
    <>
      <section className="footer-highlight-section" aria-label="Trusted experts highlights">
        <div className="container">
          <div className="footer-highlight-heading">
            <p>Trusted by doctors & wellness experts</p>
            <h3>Health Professionals view on "Pure Himalyan Products"</h3>
          </div>
          <div className="footer-highlight-marquee">
            <div className="footer-highlight-track">
              {[...footerHighlights, ...footerHighlights].map((item, index) => (
                <button
                  type="button"
                  className="footer-highlight-card footer-highlight-card-button"
                  key={`${item.src}-${index}`}
                  onClick={() => setHighlightPreviewSrc(item.src)}
                  aria-label={`Preview ${item.alt}`}
                >
                  <img src={item.src} alt={item.alt} />
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {highlightPreviewSrc ? (
        <div className="modal" onClick={() => setHighlightPreviewSrc(null)} role="dialog" aria-modal="true">
          <div className="modal-content image-preview-modal-content" onClick={(event) => event.stopPropagation()}>
            <button className="close-button" onClick={() => setHighlightPreviewSrc(null)} aria-label="Close image preview">
              &times;
            </button>
            <img className="image-preview-modal-image" src={highlightPreviewSrc} alt="Preview" />
          </div>
        </div>
      ) : null}
    </>
  )
}

export function ProductMaharasayanStoriesSection({ productId, reviews: initialReviews }: { productId?: number, reviews?: ReviewRecord[] }) {
  const [reviews, setReviews] = useState<ReviewRecord[]>(initialReviews || [])

  useEffect(() => {
    if (initialReviews) {
      setReviews(initialReviews)
      return
    }

    if (productId) {
      const loadReviews = async () => {
        try {
          const data = await reviewApi.fetchProductReviews(productId)
          setReviews(data)
        } catch (err) {
          console.error('Failed to load reviews for stories section', err)
        }
      }
      void loadReviews()
    }
  }, [productId, initialReviews])

  return (
    <section className="testimonials-section" aria-label="Customer stories">
      <div className="container">
        <h2 className="section-title">सिर्फ़ हमारा 'दावा' नहीं – ये है 'महारसायन'</h2>
        <p className="testimonials-intro">
          हज़ारो लोग मिनरल गैप को भरके अपनी खोई हुई ऊर्जा, ओज और शक्ति वापस पा चुके हैं। ये हैं कुछ असली कहानियाँ:
        </p>
        <div className="testimonials-grid">
          {reviews.map((review) => (
            <article className="testimonial-card" key={review.id}>
              <div className="stars">
                {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
              </div>
              <h4>{review.user_name}</h4>
              <p className="customer-info">Verified Buyer</p>
              <p className="testimonial-text">“{review.comment}”</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
