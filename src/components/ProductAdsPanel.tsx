import { useState } from 'react'
import { buildProductReferralLink } from '../lib/referralLink'
import { resolveProductImageUrl } from '../lib/productApi'
import type { GalleryRecord } from '../lib/productApi'

type Props = {
  gallery: GalleryRecord[]
  referralCode: string
}

function ProductAdsPanel({ gallery, referralCode }: Props) {
  const [copiedId, setCopiedId] = useState<number | null>(null)

  // Show all images and videos from gallery
  const ads = gallery.filter(item => 
    item.media_type === 'image' || (item.media_type === 'video' && item.video_url)
  )

  const handleShare = async (item: GalleryRecord) => {
    const product = item.product
    if (!product) {
      window.alert('This media is not associated with any product. Please link it from the Admin Panel to share it with your referral link.')
      return
    }

    const productLink = buildProductReferralLink(window.location.origin, product.slug, referralCode)
    const mediaInfo = item.media_type === 'video' ? `\n\nWatch Video: ${item.video_url}` : ''
    const shareText = `Check out this amazing product: ${product.name}\n\nBuy Here: ${productLink}${mediaInfo}`

    try {
      if (navigator.share) {
        const shareData: ShareData = { title: product.name, text: shareText }

        if (item.media_type === 'image' && item.image_path) {
          try {
            const imageUrl = resolveProductImageUrl(item.image_path)
            const response = await fetch(imageUrl)
            const blob = await response.blob()
            const file = new File([blob], `${item.title || 'product'}.jpg`, { type: blob.type })
            shareData.files = [file]
          } catch { /* image share not supported, share without image */ }
        }

        await navigator.share(shareData)
      } else {
        const clipboardText = item.media_type === 'image' && item.image_path
          ? `${shareText}\n\nImage: ${resolveProductImageUrl(item.image_path)}`
          : shareText
        await navigator.clipboard.writeText(clipboardText)
        setCopiedId(item.id)
        setTimeout(() => setCopiedId(null), 2000)
        window.alert('Share text copied to clipboard!')
      }
    } catch (err) {
      console.error('Share failed', err)
    }
  }

  return (
    <div className="admin-management-panel">
      <div className="panel-header">
        <h2>Product Ads & Media Sharing</h2>
        <p className="section-subtext">Share these images and videos with your referral link.</p>
      </div>

      <div className="gallery-admin-grid">
        {ads.length === 0 ? (
          <p>No product-specific media available in gallery.</p>
        ) : (
          ads.map((item) => {
            const associatedProduct = item.product
            
            return (
              <div key={item.id} className="gallery-admin-card">
                <div className="gallery-admin-image" style={{ paddingTop: '56.25%', position: 'relative', overflow: 'hidden' }}>
                  {item.media_type === 'video' ? (
                    item.video_url && (
                      <iframe
                        src={`https://www.youtube.com/embed/${item.video_url.split('v=')[1]?.split('&')[0] || item.video_url.split('/').pop()}`}
                        title={item.title}
                        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 0 }}
                      />
                    )
                  ) : (
                    <img 
                      src={item.image_path} 
                      alt={item.title} 
                      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} 
                    />
                  )}
                </div>
                <div className="gallery-admin-meta">
                  <h4>{item.title}</h4>
                  <p style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '4px' }}>
                    {associatedProduct ? (
                      <>Product: <strong>{associatedProduct.name}</strong></>
                    ) : (
                      <span style={{ color: '#ef4444' }}>⚠️ No product linked</span>
                    )}
                  </p>
                  
                  <button
                    className="portal-submit"
                    style={{ 
                      marginTop: '12px', 
                      width: '100%',
                      opacity: associatedProduct ? 1 : 0.6,
                      cursor: associatedProduct ? 'pointer' : 'not-allowed'
                    }}
                    onClick={() => handleShare(item)}
                  >
                    {copiedId === item.id ? '✅ Copied!' : '📤 Share Ad'}
                  </button>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

export default ProductAdsPanel
