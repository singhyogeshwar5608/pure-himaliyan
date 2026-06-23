import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import '../App.css'
import { SEO, ProductStructuredData, BreadcrumbStructuredData } from '../components/SEO'
import OrderModal from '../components/OrderModal'
import { ProductMaharasayanStoriesSection } from '../components/ProductDetailSocialProof'
import { createOrder, createRazorpayOrder, fetchProduct, getGalleryVideoEmbedUrl, resolveProductImageUrl, verifyRazorpayPayment, reviewApi } from '../lib/productApi'
import type { OrderPayload, ProductDescriptionRecord, ProductRecord, ReviewRecord, ReviewPayload } from '../lib/productApi'
import { footerHighlights } from '../data/marketingContent'
import { parseReferralQueryParam } from '../lib/referralLink'
import Header from '../components/Header'
import { getUser } from '../lib/userAuth'


function ProductDetailPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const { slug = '' } = useParams()
  const [searchParams] = useSearchParams()
  const urlReferralCode = useMemo(() => parseReferralQueryParam(searchParams), [searchParams])
  const [product, setProduct] = useState<ProductRecord | null>(null)
  const [selectedImage, setSelectedImage] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false)
  const [isOrderSubmitting, setIsOrderSubmitting] = useState(false)
  const [isShortDescriptionExpanded, setIsShortDescriptionExpanded] = useState(false)
  const [highlightPreviewSrc, setHighlightPreviewSrc] = useState<string | null>(null)
  const [reviews, setReviews] = useState<ReviewRecord[]>([])
  const [isReviewSubmitting, setIsReviewSubmitting] = useState(false)
  
  const reviewStats = useMemo(() => {
    const productId = product?.id || 0;
    // Consistent base count between 800-900 based on productId
    const baseCount = productId ? (800 + (productId * 17) % 101) : 0;
    // Consistent base rating between 4.5-4.9 based on productId
    const baseRating = productId ? (4.5 + (productId * 3) % 5 / 10) : 0;

    const actualTotal = reviews.length;
    const actualSum = reviews.reduce((acc, r) => acc + r.rating, 0);

    const total = baseCount + actualTotal;
    
    if (!productId) {
      return {
        average: 0,
        total: 0,
        breakdown: [5, 4, 3, 2, 1].map(s => ({ stars: s, count: 0, percentage: 0 }))
      };
    }

    const average = total > 0 ? (baseRating * baseCount + actualSum) / total : 0;

    const counts = [0, 0, 0, 0, 0]; // Index 0 for 1 star, ..., Index 4 for 5 star
    
    // Distribute baseCount: ~85% to 5 stars, ~12% to 4 stars, rest to 3 stars
    const base5 = Math.floor(baseCount * 0.85);
    const base4 = Math.floor(baseCount * 0.12);
    const base3 = baseCount - base5 - base4;
    
    counts[4] = base5;
    counts[3] = base4;
    counts[2] = base3;

    reviews.forEach(r => {
      if (r.rating >= 1 && r.rating <= 5) {
        counts[r.rating - 1]++;
      }
    });

    const breakdown = counts.map((count, index) => ({
      stars: index + 1,
      count,
      percentage: Math.round((count / total) * 100),
    })).reverse(); // Show 5 star first

    return { average, total, breakdown };
  }, [reviews, product?.id]);

  const [reviewForm, setReviewForm] = useState<ReviewPayload>({
    product_id: 0,
    user_name: '',
    rating: 5,
    comment: '',
  })

  useEffect(() => {
    const load = async () => {
      try {
        const item = await fetchProduct(slug)
        console.log("Product fetched:", item)
        setProduct(item)
        setReviewForm(prev => ({ ...prev, product_id: item.id }))
        
        console.log("Fetching reviews for ID:", item.id)
        const productReviews = await reviewApi.fetchProductReviews(item.id)
        console.log("Fetched reviews:", productReviews)
        setReviews(productReviews)
      } catch (err) {
        console.error("Fetch error:", err)
        setError('Product details load nahi ho paye. Please try again later.')
      } finally {
        setLoading(false)
      }
    }

    void load()
  }, [slug])

  useEffect(() => {
    if (!isOrderModalOpen) {
      return
    }
    if (!getUser()) {
      setIsOrderModalOpen(false)
      navigate('/user/login', {
        replace: true,
        state: { redirectAfterAuth: `${location.pathname}${location.search}` },
      })
    }
  }, [isOrderModalOpen, navigate, location.pathname, location.search])

  const productImages = useMemo(() => {
    if (!product) {
      return []
    }

    const orderedImages = [product.image_url, ...(product.images || [])].filter(
      (image, index, array): image is string => Boolean(image) && array.indexOf(image) === index,
    )

    return orderedImages.map((image) => resolveProductImageUrl(image))
  }, [product])

  useEffect(() => {
    setSelectedImage(productImages[0] || '')
  }, [productImages])

  useEffect(() => {
    const isMobile = window.innerWidth < 768
    if (!isMobile || productImages.length < 2) return

    const interval = setInterval(() => {
      setSelectedImage((prev) => {
        const currentIndex = productImages.findIndex((img) => img === prev)
        const nextIndex = currentIndex >= productImages.length - 1 ? 0 : currentIndex + 1
        return productImages[nextIndex]
      })
    }, 2500)

    return () => clearInterval(interval)
  }, [productImages])

  useEffect(() => {
    setIsShortDescriptionExpanded(false)
  }, [product?.id])

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

  const showShortDescriptionToggle = useMemo(() => {
    const text = product?.short_description?.trim() || ''
    if (!text) {
      return false
    }

    const nonEmptyLines = text.split(/\r?\n/).filter((line) => line.trim() !== '').length
    return nonEmptyLines > 5 || text.length > 220
  }, [product?.short_description])

  const selectedIndex = productImages.findIndex((image) => image === selectedImage)

  const dynamicDescriptions: ProductDescriptionRecord[] = product?.descriptions || []

  type MergedSection = {
    type: 'description' | 'comparison'
    display_order: number
    data: ProductDescriptionRecord | { comparison_data: string }
  }

  const mergedSections = useMemo(() => {
    const sections: MergedSection[] = dynamicDescriptions.map((d) => ({
      type: 'description' as const,
      display_order: d.display_order,
      data: d,
    }))

    if (product?.comparison_data) {
      sections.push({
        type: 'comparison' as const,
        display_order: product.comparison_display_order ?? 999,
        data: { comparison_data: product.comparison_data },
      })
    }

    return sections.sort((a, b) => a.display_order - b.display_order)
  }, [dynamicDescriptions, product?.comparison_data, product?.comparison_display_order])
  const normalizedProductVideoUrl = (product?.video_url || '').trim()
  const productVideoEmbedUrl = useMemo(
    () => getGalleryVideoEmbedUrl(normalizedProductVideoUrl),
    [normalizedProductVideoUrl],
  )
  const isDirectVideoFile = useMemo(
    () => /\.(mp4|webm|ogg)(\?.*)?$/i.test(normalizedProductVideoUrl),
    [normalizedProductVideoUrl],
  )
  const tradeIconUrls = useMemo(
    () =>
      [6, 3, 4, 2, 1].map(
        (iconNumber) => new URL(`../assets/trade/${iconNumber}.png`, import.meta.url).href,
      ),
    [],
  )

  const fallbackDescriptionPoints = (product?.description || 'शुद्ध हिमालयन पोषण और प्राकृतिक शक्ति का प्रीमियम मिश्रण।')
    .split(/\r?\n|•|\u2022|\|/)
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => ({
      html: item.replace(/^##\s*/, '').trim(),
      isHeading: /^##\s*/.test(item),
    }))

  const parseBodyPoints = (body: string) =>
    body
      .split(/\r?\n|•|\u2022|\|/)
      .map((item) => item.trim())
      .filter(Boolean)
      .map((item) => ({
        html: item.replace(/^##\s*/, '').trim(),
        isHeading: /^##\s*/.test(item),
      }))

  const handleSelectPrev = () => {
    if (productImages.length === 0) {
      return
    }

    const nextIndex = selectedIndex <= 0 ? productImages.length - 1 : selectedIndex - 1
    setSelectedImage(productImages[nextIndex])
  }

  const handleSelectNext = () => {
    if (productImages.length === 0) {
      return
    }

    const nextIndex = selectedIndex >= productImages.length - 1 ? 0 : selectedIndex + 1
    setSelectedImage(productImages[nextIndex])
  }

  const redirectToLoginForOrder = () => {
    navigate('/user/login', {
      replace: true,
      state: { redirectAfterAuth: `${location.pathname}${location.search}` },
    })
  }

  const openOrderFlow = () => {
    if (!getUser()) {
      redirectToLoginForOrder()
      return
    }
    setIsOrderModalOpen(true)
  }

  const ensureRazorpaySdk = async () => {
    const win = window as Window & { Razorpay?: new (options: Record<string, unknown>) => { open: () => void } }

    if (win.Razorpay) {
      return true
    }

    await new Promise<void>((resolve, reject) => {
      const script = document.createElement('script')
      script.src = 'https://checkout.razorpay.com/v1/checkout.js'
      script.async = true
      script.onload = () => resolve()
      script.onerror = () => reject(new Error('Razorpay SDK load failed.'))
      document.body.appendChild(script)
    })

    return Boolean(win.Razorpay)
  }

  const handleOrderSubmit = async (payload: OrderPayload) => {
    if (!getUser()) {
      setIsOrderModalOpen(false)
      redirectToLoginForOrder()
      return
    }

    setIsOrderSubmitting(true)

    try {
      const finalizedPayload = { ...payload }
      const codCharges = Math.round(Number(product?.cod_charges || 0))

      // Trigger Razorpay if:
      // 1. Payment method is 'online' (full payment)
      // 2. Payment method is 'cod' and there are COD handling charges to collect
      if (payload.payment_method === 'online' || (payload.payment_method === 'cod' && codCharges > 0)) {
        const sdkReady = await ensureRazorpaySdk()
        if (!sdkReady) {
          throw new Error('Razorpay SDK load nahi hua. Please try again.')
        }

        const razorpayOrder = await createRazorpayOrder({
          product_id: payload.product_id,
          referral_code: payload.referral_code,
          quantity: payload.quantity,
          payment_method: payload.payment_method,
        })

        const win = window as Window & { Razorpay?: new (options: Record<string, unknown>) => { open: () => void } }

        const paymentResult = await new Promise<{
          razorpay_payment_id: string
          razorpay_order_id: string
          razorpay_signature: string
        }>((resolve, reject) => {
          if (!win.Razorpay) {
            reject(new Error('Razorpay SDK unavailable.'))
            return
          }

          const razorpay = new win.Razorpay({
            key: razorpayOrder.razorpay_order.key,
            amount: razorpayOrder.razorpay_order.amount,
            currency: razorpayOrder.razorpay_order.currency,
            name: 'Pure Himalyan',
            description: product?.name || 'Product Order',
            order_id: razorpayOrder.razorpay_order.id,
            prefill: {
              name: payload.customer_name,
              email: payload.customer_email,
              contact: payload.customer_phone,
            },
            theme: {
              color: '#b37c2c',
            },
            handler: (response: {
              razorpay_payment_id: string
              razorpay_order_id: string
              razorpay_signature: string
            }) => resolve(response),
            modal: {
              ondismiss: () => reject(new Error('Payment cancelled.')),
            },
          })

          razorpay.open()
        })

        await verifyRazorpayPayment(paymentResult)
        finalizedPayload.razorpay_order_id = paymentResult.razorpay_order_id
        finalizedPayload.razorpay_payment_id = paymentResult.razorpay_payment_id
        finalizedPayload.razorpay_signature = paymentResult.razorpay_signature
      }

      await createOrder(finalizedPayload)
      setIsOrderModalOpen(false)
      window.alert('Order created successfully.')
    } finally {
      setIsOrderSubmitting(false)
    }
  }

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!getUser()) {
      navigate('/user/login', {
        state: { redirectAfterAuth: `${location.pathname}${location.search}` },
      })
      return
    }

    if (!reviewForm.user_name || !reviewForm.comment) {
      window.alert('Please fill all fields')
      return
    }

    setIsReviewSubmitting(true)
    try {
      await reviewApi.submitReview(reviewForm)
      window.alert('Review submitted successfully!')
      setReviewForm({
        product_id: product?.id || 0,
        user_name: '',
        rating: 5,
        comment: '',
      })
    } catch (err) {
      window.alert(err instanceof Error ? err.message : 'Review submit nahi ho paya')
    } finally {
      setIsReviewSubmitting(false)
    }
  }

  return (
    <main className="site-shell gallery-page product-detail-page-shell">
      {product ? (
        <>
          <SEO
            title={product.name}
            description={product.short_description || product.description || `Buy ${product.name} — Premium Himalayan Shilajit at best price. Lab-tested, high potency.`}
            canonical={`https://purehimalyan.com/products/${product.slug}`}
            ogImage={resolveProductImageUrl(product.image_url)}
            ogType="product"
          />
          <ProductStructuredData
            name={product.name}
            description={product.short_description || product.description || product.name}
            image={resolveProductImageUrl(product.image_url)}
            price={Number(product.price)}
            url={`https://purehimalyan.com/products/${product.slug}`}
            reviewAverage={reviewStats?.average}
            reviewCount={reviewStats?.total}
          />
          <BreadcrumbStructuredData
            items={[
              { name: 'Home', url: 'https://purehimalyan.com/' },
              { name: 'Products', url: 'https://purehimalyan.com/products' },
              { name: product.name, url: `https://purehimalyan.com/products/${product.slug}` },
            ]}
          />
        </>
      ) : null}
      <Header />

      <div className="product-detail-breadcrumb-wrap">
        <div className="container">
          <nav className="product-detail-breadcrumb" aria-label="Breadcrumb">
            <Link to="/">{t('productDetail.breadcrumbHome')}</Link>
            <span>/</span>
            <Link to="/products">{t('productDetail.breadcrumbProducts')}</Link>
            <span>/</span>
            <strong>{product?.name || 'Product detail'}</strong>
          </nav>
        </div>
      </div>

      <section className="gallery-collection gallery-page-content product-detail-page">
        <div className="container">
          {loading ? (
            <p className="section-subtext">{t('productDetail.loading')}</p>
          ) : error || !product ? (
            <div className="product-detail-empty">
              <h1 className="section-title">{t('productDetail.notFound')}</h1>
              <p className="section-subtext">{error || t('productDetail.unavailable')}</p>
              <div className="section-actions">
                <Link to="/products" className="section-link-button">
                  {t('productDetail.backToProducts')}
                </Link>
              </div>
            </div>
          ) : (
            <>
              <div className="product-detail-layout">
              <div className="product-detail-gallery">
                <div className="product-detail-main-image-wrap">
                  {productImages.length > 1 ? (
                    <>
                      <button type="button" className="product-detail-nav-arrow left" onClick={handleSelectPrev} aria-label="Previous image">
                        ‹
                      </button>
                      <button type="button" className="product-detail-nav-arrow right" onClick={handleSelectNext} aria-label="Next image">
                        ›
                      </button>
                    </>
                  ) : null}
                  <img
                    src={selectedImage || resolveProductImageUrl(product.image_url)}
                    alt={product.name}
                    className="product-detail-main-image"
                  />
                </div>

                {productImages.length > 0 ? (
                  <div className="product-detail-thumb-strip">
                    {productImages.map((imageUrl, index) => (
                      <button
                        key={`${imageUrl}-${index}`}
                        type="button"
                        className={`product-detail-thumb-button ${selectedImage === imageUrl ? 'active' : ''}`}
                        onClick={() => setSelectedImage(imageUrl)}
                      >
                        <img src={imageUrl} alt={`${product.name} ${index + 1}`} className="product-detail-thumb-image" />
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>

              <div className="product-detail-info">
                <h1>{product.name}</h1>
                {reviewStats ? (
                  <p className="product-rating-summary">
                    <span className="product-rating-stars">
                      {'★'.repeat(Math.round(reviewStats.average))}{'☆'.repeat(5 - Math.round(reviewStats.average))}
                    </span>{' '}
                    {reviewStats.average.toFixed(1)} / 5 ({reviewStats.total} reviews)
                  </p>
                ) : null}
                {product.short_description ? (
                  <div className="product-short-description-wrap">
                    <p
                      className={`product-short-description ${isShortDescriptionExpanded ? 'expanded' : 'clamped'}`}
                    >
                      {product.short_description}
                    </p>
                    {showShortDescriptionToggle ? (
                      <button
                        type="button"
                        className="product-short-description-toggle"
                        onClick={() => setIsShortDescriptionExpanded((prev) => !prev)}
                      >
                        {isShortDescriptionExpanded ? t('productDetail.seeLess') : t('productDetail.seeMore')}
                      </button>
                    ) : null}
                  </div>
                ) : null}
                <div className="product-detail-price-row">
                  {product.original_price ? (
                    <div className="product-detail-price-mrp">
                      <span>{t('productDetail.mrp')}</span>
                      <strong>₹{product.original_price}</strong>
                    </div>
                  ) : null}
                  <div className="product-detail-price-card current">
                    <span>{t('productDetail.price')}</span>
                    <strong>₹{product.price}</strong>
                  </div>
                  {product.all_charges_included ? (
                    <div className="all-charges-label-list">
                      {t('productDetail.gstShipping').split('|').map((item, i) => (
                        <span key={i} className="all-charges-label-item">
                          <span className="tick">✓</span>
                          {item.trim()}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </div>
                <div className="product-trade-icons" aria-label="Trade and trust icons">
                  {tradeIconUrls.map((iconUrl, index) => (
                    <img
                      key={iconUrl}
                      src={iconUrl}
                      alt={`Trade icon ${index + 1}`}
                      className="product-trade-icon"
                      loading="lazy"
                    />
                  ))}
                </div>
                {!product.is_active ? <span className="product-status-badge inactive">{t('productDetail.inactive')}</span> : null}
                <div className="product-detail-actions">
                  {urlReferralCode ? (
                    <p className="section-subtext" style={{ marginBottom: '0.75rem', maxWidth: '36rem' }}>
                      Affiliate referral link active — checkout par code <strong>{urlReferralCode}</strong> auto-apply hoga.
                    </p>
                  ) : null}
                  <button className="order-button" type="button" onClick={openOrderFlow}>
                    {t('productDetail.orderNow')}
                  </button>
                  <Link to="/products" className="section-link-button">
                    {t('productDetail.backToProducts')}
                  </Link>
                </div>
                {normalizedProductVideoUrl ? (
                  <div className="product-detail-inline-video-wrap">
                    {isDirectVideoFile ? (
                      <video className="product-detail-inline-video" controls playsInline preload="metadata">
                        <source src={normalizedProductVideoUrl} />
                        Your browser does not support the video tag.
                      </video>
                    ) : productVideoEmbedUrl ? (
                      <iframe
                        className="product-detail-inline-video"
                        src={productVideoEmbedUrl}
                        title={`${product.name} video`}
                        loading="lazy"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        allowFullScreen
                      />
                    ) : (
                      <a className="section-link-button" href={normalizedProductVideoUrl} target="_blank" rel="noreferrer">
                        {t('productDetail.watchVideo')}
                      </a>
                    )}
                  </div>
                ) : null}
              </div>
              </div>
              <div className="product-detail-lower-section">
                {mergedSections.length > 0 ? (
                  mergedSections.map((section, idx) => {
                    if (section.type === 'description') {
                      const desc = section.data as ProductDescriptionRecord
                      const points = parseBodyPoints(desc.body)
                      return (
                        <div key={desc.id} className="product-detail-description-card">
                          <p className="section-kicker">{desc.kicker || t('productDetail.description')}</p>
                          <h2>{desc.heading}</h2>
                          <div className="product-detail-description-split">
                            <ul className="product-detail-description product-detail-description-large product-detail-description-list">
                              {points.map((point, pidx) => (
                                <li key={`${point.html}-${pidx}`} className={point.isHeading ? 'product-detail-description-heading' : ''}>
                                  <span dangerouslySetInnerHTML={{ __html: point.html }} />
                                </li>
                              ))}
                            </ul>
                            {desc.image_url ? (
                              <div className="product-detail-description-image-wrap">
                                <img
                                  src={resolveProductImageUrl(desc.image_url)}
                                  alt={desc.heading}
                                  className="product-detail-description-image"
                                  loading="lazy"
                                />
                              </div>
                            ) : null}
                          </div>
                        </div>
                      )
                    }

                    if (section.type === 'comparison') {
                      const { comparison_data } = section.data as { comparison_data: string }
                      let parsed: { columns?: string[]; rows?: { label: string; values: string[] }[] } = {}
                      try {
                        parsed = JSON.parse(comparison_data)
                      } catch { /* ignore */ }
                      if (parsed.columns && parsed.columns.length > 0 && parsed.rows && parsed.rows.length > 0) {
                        return (
                          <div key={`comparison-${idx}`} className="product-detail-description-card">
                            <h2 style={{ marginTop: 0 }}>Compare</h2>
                            <div style={{ overflowX: 'auto' }}>
                              <table className="comparison-table">
                                <thead>
                                  <tr>
                                    {parsed.columns.map((col, ci) => (
                                      <th key={ci}>{col || `Column ${ci + 1}`}</th>
                                    ))}
                                  </tr>
                                </thead>
                                <tbody>
                                  {parsed.rows.map((row, ri) => (
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
                        )
                      }
                    }

                    return null
                  })
                ) : (
                  <div className="product-detail-description-card">
                    <p className="section-kicker">{t('productDetail.description')}</p>
                    <h2>{t('productDetail.productOverview')}</h2>
                    <ul className="product-detail-description product-detail-description-large product-detail-description-list">
                      {fallbackDescriptionPoints.map((point, index) => (
                        <li key={`${point.html}-${index}`} className={point.isHeading ? 'product-detail-description-heading' : ''}>
                          <span dangerouslySetInnerHTML={{ __html: point.html }} />
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {product.id === 4 ? (
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
              ) : null}

              <ProductMaharasayanStoriesSection productId={product.id} reviews={reviews} />

              <section className="product-reviews-section">
                <div className="container">
                  <div className="reviews-layout">
                    <div className="reviews-list-column">
                      <h3 className="section-title">{t('productDetail.customerReviews')}</h3>
                      
                      {reviewStats && (
                        <div className="review-summary-box">
                          <div className="review-summary-header">
                            <div className="average-rating-display">
                              <span className="stars-row">
                                {'★'.repeat(Math.round(reviewStats.average))}{'☆'.repeat(5 - Math.round(reviewStats.average))}
                              </span>
                              <span className="rating-text">{t('productDetail.outOf5', { rating: reviewStats.average.toFixed(1) })}</span>
                            </div>
                          </div>
                          
                          <div className="rating-breakdown">
                            {reviewStats.breakdown.map((item) => (
                              <div key={item.stars} className="breakdown-row">
                                <span className="breakdown-label">{t('productDetail.star', { count: item.stars })}</span>
                                <div className="breakdown-bar-container">
                                  <div 
                                    className="breakdown-bar-fill" 
                                    style={{ width: `${item.percentage}%` }}
                                  />
                                </div>
                                <span className="breakdown-percentage">{item.percentage}%</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="review-form-column">
                      <h3 className="section-title">{t('productDetail.leaveReview')}</h3>
                      <form onSubmit={handleReviewSubmit} className="review-form">
                        <div className="form-group">
                          <label htmlFor="user_name">{t('productDetail.yourName')}</label>
                          <input
                            type="text"
                            id="user_name"
                            value={reviewForm.user_name}
                            onChange={(e) => setReviewForm({ ...reviewForm, user_name: e.target.value })}
                            placeholder={t('productDetail.enterName')}
                            required
                          />
                        </div>
                        <div className="form-group">
                          <label>{t('productDetail.rating')}</label>
                          <div className="star-rating-input">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <button
                                key={star}
                                type="button"
                                className={`star-button ${star <= reviewForm.rating ? 'active' : ''}`}
                                onClick={() => setReviewForm({ ...reviewForm, rating: star })}
                                aria-label={t('productDetail.rateStars', { count: star })}
                              >
                                ★
                              </button>
                            ))}
                          </div>
                        </div>
                        <div className="form-group">
                          <label htmlFor="comment">{t('productDetail.yourReview')}</label>
                          <textarea
                            id="comment"
                            value={reviewForm.comment}
                            onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                            placeholder={t('productDetail.shareExperience')}
                            rows={4}
                            required
                          />
                        </div>
                        <button type="submit" className="submit-review-button" disabled={isReviewSubmitting}>
                          {isReviewSubmitting ? t('common.loading') : t('productDetail.submitReview')}
                        </button>
                      </form>
                    </div>
                  </div>
                </div>
              </section>
            </>
          )}
        </div>
      </section>
      <OrderModal
        isOpen={isOrderModalOpen}
        isSubmitting={isOrderSubmitting}
        product={product}
        urlReferralCode={urlReferralCode}
        onClose={() => setIsOrderModalOpen(false)}
        onSubmit={handleOrderSubmit}
      />

      {!loading && !error && product ? (
        <button
          type="button"
          className="order-button sticky-order-now-button"
          onClick={openOrderFlow}
          aria-label="Order now"
        >
          {t('productDetail.orderNow')}
        </button>
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

export default ProductDetailPage
