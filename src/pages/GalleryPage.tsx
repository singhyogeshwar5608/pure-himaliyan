import { useEffect, useState } from 'react'
import '../App.css'
import MediaGallery from '../components/MediaGallery'
import { fetchGallery } from '../lib/productApi'
import type { GalleryRecord } from '../lib/productApi'
import Header from '../components/Header'
import Footer from '../components/Footer'

function GalleryPage() {
  const [galleryItems, setGalleryItems] = useState<GalleryRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadGallery = async () => {
      setLoading(true)
      setError('')

      try {
        const items = await fetchGallery()
        setGalleryItems(items)
      } catch (requestError) {
        setGalleryItems([])
        setError(requestError instanceof Error ? requestError.message : 'Unable to load gallery images.')
      } finally {
        setLoading(false)
      }
    }

    void loadGallery()
  }, [])

  return (
    <main className="site-shell gallery-page">
      <Header />

      <section className="gallery-collection gallery-page-content">
        <div className="container">
          <p className="section-kicker">Gallery</p>
          <h1 className="section-title">Pure Himalyan Media Library</h1>

          {loading ? (
            <p className="product-empty">Loading gallery...</p>
          ) : error ? (
            <div className="portal-error">{error}</div>
          ) : galleryItems.length === 0 ? (
            <p className="product-empty">No gallery media uploaded yet.</p>
          ) : (
            <MediaGallery items={galleryItems} className="gallery-page-media-gallery" />
          )}
        </div>
      </section>

      <Footer />
    </main>
  )
}

export default GalleryPage
