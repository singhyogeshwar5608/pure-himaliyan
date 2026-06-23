import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import '../App.css'
import Header from '../components/Header'
import Footer from '../components/Footer'
import { SEO } from '../components/SEO'
import { fetchBlogSections, buildApiUrl } from '../lib/productApi'
import type { BlogSectionRecord } from '../lib/productApi'

const parseBodyPoints = (body: string) =>
  body
    .split(/\r?\n|•|\u2022/)
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => ({
      html: item.replace(/^##\s*/, '').trim(),
      isHeading: /^##\s*/.test(item),
    }))

function BlogPage() {
  const [sections, setSections] = useState<BlogSectionRecord[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const items = await fetchBlogSections()
        setSections(items)
      } catch {
        setSections([])
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [])

  const sortedContent = useMemo(
    () => [...sections].sort((a, b) => a.display_order - b.display_order),
    [sections],
  )

  return (
    <main className="site-shell">
      <SEO title="Blog" description="Read about the benefits, usage, and science behind Pure Himalyan Shilajit — your guide to natural wellness and vitality." canonical="https://purehimalyan.com/blog" />
      <Header />

      <section className="gallery-collection gallery-page-content product-detail-page" style={{ paddingTop: '7rem' }}>
        <div className="container">
          <div style={{ marginBottom: '1.5rem' }}>
            <Link to="/" style={{ color: '#8b4513', textDecoration: 'none', fontWeight: 600 }}>Home</Link>
            <span style={{ color: '#64748b', margin: '0 0.5rem' }}>/</span>
            <strong style={{ color: '#111827' }}>Blog</strong>
          </div>

          <div className="product-detail-lower-section">
            {loading ? (
              <p className="section-subtext">Loading...</p>
            ) : sortedContent.length === 0 ? (
              <p className="section-subtext">No blog content yet.</p>
            ) : (
              sortedContent.map((item) => {
                if (item.type === 'description') {
                  const points = parseBodyPoints(item.body || '')
                  return (
                    <div key={item.id} className="product-detail-description-card">
                      {item.kicker ? <p className="section-kicker">{item.kicker}</p> : null}
                      {item.heading ? <h2>{item.heading}</h2> : null}
                      <div className="product-detail-description-split">
                        <ul className="product-detail-description product-detail-description-large product-detail-description-list">
                          {points.map((point, idx) => (
                            <li key={`${point.html}-${idx}`} className={point.isHeading ? 'product-detail-description-heading' : ''}>
                              <span dangerouslySetInnerHTML={{ __html: point.html }} />
                            </li>
                          ))}
                        </ul>
                        {item.image_url ? (
                          <div className="product-detail-description-image-wrap">
                            <img
                              src={buildApiUrl(item.image_url)}
                              alt={item.heading || ''}
                              className="product-detail-description-image"
                              loading="lazy"
                            />
                          </div>
                        ) : null}
                      </div>
                    </div>
                  )
                }

                if (item.type === 'comparison' && item.comparison_data) {
                  let parsed: { columns?: string[]; rows?: { label: string; values: string[] }[] } = {}
                  try {
                    parsed = JSON.parse(item.comparison_data)
                  } catch { /* ignore */ }

                  if (parsed.columns && parsed.columns.length > 0 && parsed.rows && parsed.rows.length > 0) {
                    return (
                      <div key={item.id} className="product-detail-description-card">
                        {item.kicker ? <p className="section-kicker">{item.kicker}</p> : null}
                        {item.heading ? <h2>{item.heading}</h2> : null}
                        <div className="product-detail-comparison" style={{ margin: '0' }}>
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
                      </div>
                    )
                  }
                }

                return null
              })
            )}
          </div>
        </div>
      </section>

      <Footer />
    </main>
  )
}

export default BlogPage
