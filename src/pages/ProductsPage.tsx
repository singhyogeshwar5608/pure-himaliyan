import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { fetchProducts, resolveProductImageUrl, type ProductRecord } from '../lib/productApi'
import '../App.css'
import { SEO } from '../components/SEO'
import Header from '../components/Header'
import Footer from '../components/Footer'

function ProductsPage() {
  const { t } = useTranslation()
  const [products, setProducts] = useState<ProductRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        const items = await fetchProducts()
        setProducts(items)
      } catch {
        setError('Currently unable to load products. Please try again later.')
      } finally {
        setLoading(false)
      }
    }

    void load()
  }, [])

  const activeProducts = products
    .filter((product) => product.is_active)
    .sort((a, b) => {
      if (a.id === 4 && b.id !== 4) {
        return -1
      }

      if (b.id === 4 && a.id !== 4) {
        return 1
      }

      return 0
    })

  return (
    <main className="site-shell gallery-page products-page-shell">
      <SEO title="Products" description="Browse our range of premium Himalayan Shilajit resin — lab-tested, high potency, and sustainably sourced for wellness." canonical="https://purehimalyan.com/products" />
      <Header />

      <section className="gallery-collection gallery-page-content">
        <div className="container">
          <p className="section-kicker">{t('nav.products')}</p>
          <h1 className="section-title">Pure Himalyan Catalog</h1>

          {loading ? (
            <p className="section-subtext">{t('products.loading')}</p>
          ) : error ? (
            <p className="section-subtext">{error}</p>
          ) : activeProducts.length === 0 ? (
            <p className="section-subtext">{t('products.empty')}</p>
          ) : (
            <div className="product-grid catalog-product-grid">
              {activeProducts.map((product) => (
                <article className="product-card" key={product.id}>
                  <Link to={`/products/${product.slug}`} className="product-card-link">
                    <div className="product-image-wrapper product-gradient-bg">
                      <img src={resolveProductImageUrl(product.image_url || product.images?.[0] || null)} alt={product.name} className="product-image-cover" />
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
          )}
        </div>
      </section>

      <Footer />
    </main>
  )
}

export default ProductsPage
