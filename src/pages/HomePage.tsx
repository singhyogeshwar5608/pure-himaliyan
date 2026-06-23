import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import '../App.css'
import { SEO } from '../components/SEO'
import Header from '../components/Header'
import Footer from '../components/Footer'
import MediaGallery from '../components/MediaGallery'
import { createInquiry, fetchBannerImages, fetchGallery, fetchMobileBannerImages, fetchProducts, resolveProductImageUrl } from '../lib/productApi'
import type { GalleryRecord, InquiryPayload, ProductRecord } from '../lib/productApi'
import { footerHighlights } from '../data/marketingContent'

const emptyContactForm = {
  name: '',
  email: '',
  phone: '',
  message: '',
}

const emptyInquiryForm = {
  name: '',
  phone: '',
  email: '',
  address: '',
  message: '',
}

function HomePage() {
  const { t } = useTranslation()
  const [currentSlide, setCurrentSlide] = useState(0)
  const [galleryStartIndex, setGalleryStartIndex] = useState(0)
  const [viewportWidth, setViewportWidth] = useState(() => window.innerWidth)
  const [isMobileView, setIsMobileView] = useState(() => window.innerWidth <= 768)
  const [inquiryOpen, setInquiryOpen] = useState(false)
  const [highlightPreviewSrc, setHighlightPreviewSrc] = useState<string | null>(null)
  const [contactForm, setContactForm] = useState(emptyContactForm)
  const [modalInquiryForm, setModalInquiryForm] = useState(emptyInquiryForm)
  const [contactSubmitting, setContactSubmitting] = useState(false)
  const [modalSubmitting, setModalSubmitting] = useState(false)
  const [contactFeedback, setContactFeedback] = useState('')
  const [modalFeedback, setModalFeedback] = useState('')
  const [products, setProducts] = useState<ProductRecord[]>([])
  const [productsLoading, setProductsLoading] = useState(true)
  const [galleryItems, setGalleryItems] = useState<GalleryRecord[]>([])
  const [galleryLoading, setGalleryLoading] = useState(true)
  const [desktopBannerSlides, setDesktopBannerSlides] = useState<string[]>([])
  const [mobileBannerSlides, setMobileBannerSlides] = useState<string[]>([])

  const activeProducts = useMemo(
    () =>
      products
        .filter((product) => product.is_active)
        .sort((a, b) => {
          if (a.id === 4 && b.id !== 4) {
            return -1
          }

          if (b.id === 4 && a.id !== 4) {
            return 1
          }

          return 0
        }),
    [products],
  )

  const homeGalleryVisibleCount = useMemo(() => {
    if (viewportWidth >= 1024) {
      return 4
    }

    if (viewportWidth >= 768) {
      return 2
    }

    return 1
  }, [viewportWidth])

  const visibleHomeGalleryItems = useMemo(() => {
    if (galleryItems.length <= homeGalleryVisibleCount) {
      return galleryItems
    }

    return Array.from({ length: homeGalleryVisibleCount }, (_, index) => galleryItems[(galleryStartIndex + index) % galleryItems.length])
  }, [galleryItems, galleryStartIndex, homeGalleryVisibleCount])

  const showGalleryControls = galleryItems.length > homeGalleryVisibleCount

  const activeBannerSlides = isMobileView ? mobileBannerSlides : desktopBannerSlides

  useEffect(() => {
    const handleResize = () => {
      setViewportWidth(window.innerWidth)
      setIsMobileView(window.innerWidth <= 768)
    }

    window.addEventListener('resize', handleResize)

    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    if (activeBannerSlides.length <= 1) {
      return
    }

    const interval = window.setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % activeBannerSlides.length)
    }, 5000)

    return () => window.clearInterval(interval)
  }, [activeBannerSlides.length])

  useEffect(() => {
    setCurrentSlide(0)
  }, [isMobileView])

  useEffect(() => {
    setGalleryStartIndex(0)
  }, [homeGalleryVisibleCount])

  useEffect(() => {
    const loadDesktopBannerImages = async () => {
      try {
        const records = await fetchBannerImages()
        const resolved = records
          .map((item) => resolveProductImageUrl(item.image))
          .filter((src): src is string => Boolean(src))

        setDesktopBannerSlides(resolved)
        setCurrentSlide(0)
      } catch (error) {
        console.warn('Failed to load banner images', error)
        setDesktopBannerSlides([])
      }
    }

    void loadDesktopBannerImages()
  }, [])

  useEffect(() => {
    const loadMobileBannerImages = async () => {
      try {
        const records = await fetchMobileBannerImages()
        const resolved = records
          .map((item) => resolveProductImageUrl(item.image))
          .filter((src): src is string => Boolean(src))

        setMobileBannerSlides(resolved)
        setCurrentSlide(0)
      } catch (error) {
        console.warn('Failed to load mobile banner images', error)
        setMobileBannerSlides([])
      }
    }

    void loadMobileBannerImages()
  }, [])

  useEffect(() => {
    document.body.style.overflow = inquiryOpen ? 'hidden' : 'auto'

    if (!inquiryOpen) {
      setModalFeedback('')
      setModalInquiryForm(emptyInquiryForm)
    }

    return () => {
      document.body.style.overflow = 'auto'
    }
  }, [inquiryOpen])

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
      document.body.style.overflow = inquiryOpen ? 'hidden' : 'auto'
    }
  }, [highlightPreviewSrc, inquiryOpen])

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const items = await fetchProducts()
        setProducts(items)
      } catch {
        setProducts([])
      } finally {
        setProductsLoading(false)
      }
    }

    void loadProducts()
  }, [])

  useEffect(() => {
    const loadGallery = async () => {
      setGalleryLoading(true)

      try {
        const items = await fetchGallery()
        setGalleryItems(items)
        setGalleryStartIndex(0)
      } catch {
        setGalleryItems([])
        setGalleryStartIndex(0)
      } finally {
        setGalleryLoading(false)
      }
    }

    void loadGallery()
  }, [])

  const goToSlide = (index: number) => {
    setCurrentSlide(index)
  }

  const navigateSlide = (direction: number) => {
    if (activeBannerSlides.length === 0) {
      return
    }
    setCurrentSlide((prev) => (prev + direction + activeBannerSlides.length) % activeBannerSlides.length)
  }

  const navigateGallery = (direction: number) => {
    if (galleryItems.length <= homeGalleryVisibleCount) {
      return
    }

    setGalleryStartIndex((prev) => (prev + direction * homeGalleryVisibleCount + galleryItems.length) % galleryItems.length)
  }

  const submitInquiry = async (payload: InquiryPayload) => {
    await createInquiry(payload)
  }

  const handleContactChange = (field: keyof typeof emptyContactForm, value: string) => {
    setContactForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleModalInquiryChange = (field: keyof typeof emptyInquiryForm, value: string) => {
    setModalInquiryForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleContactSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setContactSubmitting(true)
    setContactFeedback('')

    try {
      await submitInquiry({
        name: contactForm.name,
        email: contactForm.email,
        phone: contactForm.phone,
        address: '',
        message: contactForm.message,
        source: 'homepage-contact',
      })
      setContactForm(emptyContactForm)
      setContactFeedback(t('contact.success'))
    } catch (error) {
      setContactFeedback(error instanceof Error ? error.message : 'Inquiry submit nahi ho payi.')
    } finally {
      setContactSubmitting(false)
    }
  }



  const handleModalInquirySubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setModalSubmitting(true)
    setModalFeedback('')

    try {
      await submitInquiry({
        name: modalInquiryForm.name,
        email: modalInquiryForm.email,
        phone: modalInquiryForm.phone,
        address: modalInquiryForm.address,
        message: modalInquiryForm.message,
        source: 'homepage-modal',
      })
      setModalFeedback(t('contact.success'))
      setModalInquiryForm(emptyInquiryForm)
      window.setTimeout(() => setInquiryOpen(false), 600)
    } catch (error) {
      setModalFeedback(error instanceof Error ? error.message : 'Inquiry submit nahi ho payi.')
    } finally {
      setModalSubmitting(false)
    }
  }

  return (
    <main className="site-shell home-page">
      <SEO title="Premium Himalayan Shilajit Resin" description="Discover Pure Himalyan Shilajit – lab-tested, high potency Himalayan resin crafted for energy, stamina, immunity, and holistic wellness." canonical="https://purehimalyan.com/" ogImage="https://purehimalyan.com/assets/logo/brand%20png.webp" />
      <Header />

      <section id="home" className="hero-section">
        <div className="banner-slider">
          {activeBannerSlides.map((slide, index) => (
            <div key={`${slide}-${index}`} className={`slide ${index === currentSlide ? 'active' : ''}`}>
              <img src={slide} alt="Pure Himalyan banner" />
            </div>
          ))}

          {activeBannerSlides.length > 1 ? (
            <>
              <div className="slider-dots">
                {activeBannerSlides.map((_, index) => (
                  <button
                    key={index}
                    className={`dot ${index === currentSlide ? 'active' : ''}`}
                    onClick={() => goToSlide(index)}
                    aria-label={`Go to slide ${index + 1}`}
                  />
                ))}
              </div>

              <button className="slider-prev" onClick={() => navigateSlide(-1)}>&#10094;</button>
              <button className="slider-next" onClick={() => navigateSlide(1)}>&#10095;</button>
            </>
          ) : null}

          <div className="hero-overlay" />
        </div>
      </section>

      <section className="footer-highlight-section">
        <div className="container">
          <div className="footer-highlight-heading">
            <p>{t('productDetail.trustedBy')}</p>
            <h3>{t('productDetail.healthPros')}</h3>
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

      <section id="products" className="products-section">
        <div className="container">
          <h2 className="section-title">{t('products.title')}</h2>
          {productsLoading ? (
            <p className="section-subtext">{t('products.loading')}</p>
          ) : activeProducts.length === 0 ? (
            <p className="section-subtext">{t('products.empty')}</p>
          ) : (
            <>
              <div className="product-grid catalog-product-grid">
                {activeProducts.map((product) => (
                  <article className="product-card" key={product.id}>
                    <Link to={`/products/${product.slug}`} className="product-card-link">
                      <div className="product-image-wrapper product-gradient-bg">
                        <img
                          src={resolveProductImageUrl(product.image_url || product.images?.[0] || null)}
                          alt={product.name}
                          className="product-image-cover"
                        />
                      </div>
                      <div className="product-card-body">
                        <h3>{product.name}</h3>
                        <p>{product.description || 'शुद्ध हिमालयन पोषण और प्राकृतिक शक्ति का प्रीमियम मिश्रण।'}</p>
                        <p className="product-short-description clamped">
                          {(product.short_description || '').trim() || 'शुद्ध हिमालयन पोषण और प्राकृतिक शक्ति का प्रीमियम मिश्रण।'}
                        </p>
                        <div className="product-footer">
                          <div className="product-price-stack">
                            {product.original_price ? <span className="product-card-mrp">{t('products.mrp', { price: product.original_price })}</span> : null}
                            <strong>₹{product.price}</strong>
                            {product.all_charges_included ? (
                              <div className="all-charges-label-list">
                                {t('products.gstShipping').split('|').map((item, i) => (
                                  <span key={i} className="all-charges-label-item">
                                    <span className="tick">✓</span>
                                    {item.trim()}
                                  </span>
                                ))}
                              </div>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    </Link>
                  </article>
                ))}
              </div>
            </>
          )}
        </div>
      </section>

      <section id="gallery" className="gallery-section">
        <div className="container">
          <div className="home-gallery-header">
            <div>
              <h2 className="section-title">{t('gallery.title')}</h2>
              <p className="section-subtext">{t('gallery.subtitle')}</p>
            </div>
          </div>

          {galleryLoading ? (
            <p className="product-empty">{t('gallery.loading')}</p>
          ) : galleryItems.length === 0 ? (
            <p className="product-empty">{t('gallery.empty')}</p>
          ) : (
            <div className="home-gallery-carousel-shell">
              {showGalleryControls ? (
                <button
                  className="gallery-carousel-button gallery-carousel-button-prev"
                  type="button"
                  onClick={() => navigateGallery(-1)}
                  aria-label="Previous gallery items"
                >
                  ←
                </button>
              ) : null}

              <MediaGallery items={visibleHomeGalleryItems} className="home-media-gallery home-media-gallery-carousel" />

              {showGalleryControls ? (
                <button
                  className="gallery-carousel-button gallery-carousel-button-next"
                  type="button"
                  onClick={() => navigateGallery(1)}
                  aria-label="Next gallery items"
                >
                  →
                </button>
              ) : null}
            </div>
          )}
        </div>
      </section>

      <section id="contact" className="contact-section">
        <div className="container">
          <h2 className="section-title">{t('contact.title')}</h2>
          <div className="contact-content">
            <div className="contact-form-block">
              <h3>{t('contact.inquiries')}</h3>
              {contactFeedback ? <div className={contactFeedback === t('contact.success') ? 'portal-success' : 'portal-error'}>{contactFeedback}</div> : null}
              <form className="contact-form-grid" onSubmit={handleContactSubmit}>
                <input type="text" placeholder={t('contact.name')} value={contactForm.name} onChange={(event) => handleContactChange('name', event.target.value)} required />
                <input type="email" placeholder={t('contact.email')} value={contactForm.email} onChange={(event) => handleContactChange('email', event.target.value)} />
                <input type="tel" placeholder={t('contact.phone')} value={contactForm.phone} onChange={(event) => handleContactChange('phone', event.target.value)} required />
                <textarea rows={5} placeholder={t('contact.message')} value={contactForm.message} onChange={(event) => handleContactChange('message', event.target.value)} />
                <button type="submit" className="submit-button" disabled={contactSubmitting}>{contactSubmitting ? t('contact.submitting') : t('contact.submit')}</button>
              </form>
            </div>
            <div className="contact-info">
              <div className="contact-item">
                <h4>{t('contact.phoneLabel')}</h4>
                <p>+91 9817665567</p>
              </div>
              <div className="contact-item">
                <h4>{t('contact.emailLabel')}</h4>
                <p><a href="mailto:info@purehimalyan.com">info@purehimalyan.com</a></p>
              </div>
              <div className="contact-item">
                <h4>{t('contact.addressLabel')}</h4>
                <p>Pure Himalyan, India</p>
              </div>
            </div>
          </div>
        </div>
      </section>


      <Footer />

      {inquiryOpen ? (
        <div className="modal" onClick={() => setInquiryOpen(false)}>
          <div className="modal-content" onClick={(event) => event.stopPropagation()}>
            <button className="close-button" onClick={() => setInquiryOpen(false)}>&times;</button>
            <h2>{t('inquiry.title')}</h2>
            <p className="modal-copy">{t('inquiry.subtitle')}</p>
            {modalFeedback ? <div className={modalFeedback === t('contact.success') ? 'portal-success' : 'portal-error'}>{modalFeedback}</div> : null}
            <form className="modal-form" onSubmit={handleModalInquirySubmit}>
              <label>
                <span>{t('inquiry.name')}</span>
                <input type="text" placeholder={t('inquiry.namePlaceholder')} value={modalInquiryForm.name} onChange={(event) => handleModalInquiryChange('name', event.target.value)} required />
              </label>
              <label>
                <span>{t('inquiry.phone')}</span>
                <input type="tel" placeholder={t('inquiry.phonePlaceholder')} value={modalInquiryForm.phone} onChange={(event) => handleModalInquiryChange('phone', event.target.value)} required />
              </label>
              <label>
                <span>{t('inquiry.email')}</span>
                <input type="email" placeholder={t('inquiry.emailPlaceholder')} value={modalInquiryForm.email} onChange={(event) => handleModalInquiryChange('email', event.target.value)} />
              </label>
              <label>
                <span>{t('inquiry.address')}</span>
                <textarea rows={2} placeholder={t('inquiry.addressPlaceholder')} value={modalInquiryForm.address} onChange={(event) => handleModalInquiryChange('address', event.target.value)} />
              </label>
              <label>
                <span>{t('inquiry.message')}</span>
                <textarea rows={3} placeholder={t('inquiry.messagePlaceholder')} value={modalInquiryForm.message} onChange={(event) => handleModalInquiryChange('message', event.target.value)} />
              </label>
              <div className="modal-actions">
                <button type="submit" className="modal-submit" disabled={modalSubmitting}>{modalSubmitting ? t('inquiry.submitting') : t('inquiry.submit')}</button>
                <button type="button" className="modal-cancel" onClick={() => setInquiryOpen(false)}>{t('inquiry.cancel')}</button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

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
    </main>
  )
}

export default HomePage
