import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Leaf } from 'lucide-react'
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

const emojiRegex = /[\u{1F000}-\u{1FFFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u

function extractEmoji(text: string): string | null {
  const match = text.match(emojiRegex)
  return match ? match[0] : null
}

function renderSubIcon(subIcon: string, parentKicker: string | null) {
  const kickerEmoji = !subIcon && parentKicker ? extractEmoji(parentKicker) : null
  const rawIcon = subIcon || kickerEmoji

  if (!rawIcon) return null

  const normalized = rawIcon.replace(/^['"]|['"]$/g, '').trim().toLowerCase()

  if (normalized === 'leaf') {
    return <Leaf className="blog-nested-icon blog-nested-icon-leaf" size={22} />
  }

  return <span className="blog-nested-icon">{rawIcon}</span>
}

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

      <section className="gallery-collection gallery-page-content product-detail-page blog-page-layout">
        <div className="container">
          <div className="blog-breadcrumb">
            <Link to="/" className="blog-breadcrumb-link">Home</Link>
            <span className="blog-breadcrumb-sep">/</span>
            <strong className="blog-breadcrumb-current">Blog</strong>
          </div>

          <div className="blog-sections">
            {loading ? (
              <p className="section-subtext">Loading...</p>
            ) : sortedContent.length === 0 ? (
              <p className="section-subtext">No blog content yet.</p>
            ) : (
              sortedContent.map((item) => {
                if (item.type === 'description') {
                  const points = parseBodyPoints(item.body || '')
                  return (
                    <div key={item.id} className="product-detail-description-card blog-card">
                      {item.kicker ? <p className="section-kicker blog-kicker">{item.kicker}</p> : null}
                      {item.heading ? <h2 className="blog-heading">{item.heading}</h2> : null}
                      <div className="product-detail-description-split">
                        <ul className="product-detail-description product-detail-description-large product-detail-description-list blog-description-list">
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
                      <div key={item.id} className="product-detail-description-card blog-card">
                        {item.kicker ? <p className="section-kicker blog-kicker">{item.kicker}</p> : null}
                        {item.heading ? <h2 className="blog-heading">{item.heading}</h2> : null}
                        <div className="product-detail-comparison blog-comparison">
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

                if (item.type === 'nested' && Array.isArray(item.sub_sections) && item.sub_sections.length > 0) {
                  return (
                    <div key={item.id} className="product-detail-description-card blog-card blog-nested-card">
                      {item.kicker ? <p className="section-kicker blog-kicker">{item.kicker}</p> : null}
                      {item.heading ? <h2 className="blog-heading">{item.heading}</h2> : null}
                      <div className="blog-nested-items">
                        {item.sub_sections.map((sub, idx) => (
                          <div key={idx} className="blog-nested-item">
                            <div className="blog-nested-item-header">
                              {renderSubIcon(sub.icon, item.kicker)}
                              {sub.heading ? <h3 className="blog-nested-item-heading">{sub.heading}</h3> : null}
                            </div>
                            {sub.description ? (
                              <p className="blog-nested-description">{sub.description}</p>
                            ) : null}
                            {sub.sources && sub.sources.length > 0 ? (
                              <div className="blog-nested-sources">
                                <span className="blog-nested-sources-label">Research Sources</span>
                                <ol className="blog-nested-sources-list">
                                  {sub.sources.map((src, si) => (
                                    <li key={si}>
                                      {src.url ? (
                                        <a href={src.url} target="_blank" rel="noopener noreferrer">{src.title || src.url}</a>
                                      ) : (
                                        src.title
                                      )}
                                    </li>
                                  ))}
                                </ol>
                              </div>
                            ) : null}
                          </div>
                        ))}
                      </div>
                    </div>
                  )
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
