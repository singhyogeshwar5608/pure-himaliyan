import { memo, useMemo } from 'react'
import { getGalleryVideoEmbedUrl, getGalleryVideoProvider } from '../lib/productApi'
import type { GalleryRecord } from '../lib/productApi'

type MediaGalleryProps = {
  items: GalleryRecord[]
  maxItems?: number
  className?: string
}

type MediaGalleryCardProps = {
  item: GalleryRecord
  index: number
}

const MediaGalleryCard = memo(function MediaGalleryCard({ item, index }: MediaGalleryCardProps) {
  const title = item.title.trim() || `Gallery media ${index + 1}`
  const isVideo = item.media_type === 'video'
  const embedUrl = isVideo ? getGalleryVideoEmbedUrl(item.video_url) : null
  const videoProvider = isVideo ? getGalleryVideoProvider(item.video_url) : 'unknown'

  return (
    <article className="media-gallery-card">
      <div className={`media-gallery-card__frame ${isVideo ? `media-gallery-card__frame--video media-gallery-card__frame--${videoProvider}` : 'media-gallery-card__frame--image'}`}>
        {isVideo ? (
          embedUrl ? (
            <iframe
              src={embedUrl}
              title={title}
              className={`media-gallery-card__embed media-gallery-card__embed--${videoProvider}`}
              loading="lazy"
              scrolling="no"
              referrerPolicy="strict-origin-when-cross-origin"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          ) : item.video_url ? (
            <a className="media-gallery-card__fallback" href={item.video_url} target="_blank" rel="noreferrer">
              Open Video
            </a>
          ) : null
        ) : (
          <img src={item.image_path} alt={title} className="media-gallery-card__image" loading="lazy" decoding="async" />
        )}
      </div>
    </article>
  )
})

const MediaGallery = memo(function MediaGallery({ items, maxItems, className = '' }: MediaGalleryProps) {
  const visibleItems = useMemo(() => {
    if (typeof maxItems === 'number') {
      return items.slice(0, maxItems)
    }

    return items
  }, [items, maxItems])

  const galleryClassName = useMemo(() => ['media-gallery', className].filter(Boolean).join(' '), [className])

  return (
    <div className={galleryClassName}>
      {visibleItems.map((item, index) => (
        <MediaGalleryCard key={item.id} item={item} index={index} />
      ))}
    </div>
  )
})

export default MediaGallery
