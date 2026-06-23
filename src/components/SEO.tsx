import { Helmet } from 'react-helmet-async'

const SITE_NAME = 'Pure Himalyan'
const SITE_URL = 'https://purehimalyan.com'
const DEFAULT_OG_IMAGE = 'https://purehimalyan.com/assets/logo/brand%20png.webp'

interface SEOProps {
  title: string
  description: string
  canonical?: string
  ogImage?: string
  ogType?: string
  noIndex?: boolean
  jsonLd?: Record<string, unknown>
}

export function SEO({ title, description, canonical, ogImage, ogType = 'website', noIndex, jsonLd }: SEOProps) {
  const fullTitle = `${title} | ${SITE_NAME}`
  const canonicalUrl = canonical || `${SITE_URL}/`
  const image = ogImage || DEFAULT_OG_IMAGE

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonicalUrl} />
      {noIndex ? <meta name="robots" content="noindex, nofollow" /> : <meta name="robots" content="index, follow" />}

      <meta property="og:type" content={ogType} />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:image" content={image} />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />

      {jsonLd ? (
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      ) : null}
    </Helmet>
  )
}

function OrganizationStructuredData() {
  const orgData = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Pure Himalyan',
    url: SITE_URL,
    logo: DEFAULT_OG_IMAGE,
    description: 'Premium Himalayan Shilajit Resin — lab-tested, high potency Himalayan resin crafted for energy, stamina, immunity, and holistic wellness.',
    sameAs: [
      'https://www.instagram.com/purehimalyan/',
      'https://www.facebook.com/purehimalyan',
    ],
  }

  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(orgData)}</script>
    </Helmet>
  )
}

interface ProductStructuredDataProps {
  name: string
  description: string
  image: string
  sku?: string
  brand?: string
  price: number
  currency?: string
  availability?: 'InStock' | 'OutOfStock'
  reviewAverage?: number
  reviewCount?: number
  url: string
}

function ProductStructuredData({
  name,
  description,
  image,
  sku,
  brand = 'Pure Himalyan',
  price,
  currency = 'INR',
  availability = 'InStock',
  reviewAverage,
  reviewCount,
  url,
}: ProductStructuredDataProps) {
  const productData: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name,
    description,
    image,
    sku: sku || name,
    brand: {
      '@type': 'Brand',
      name: brand,
    },
    offers: {
      '@type': 'Offer',
      price,
      priceCurrency: currency,
      availability: `https://schema.org/${availability}`,
      url,
    },
  }

  if (reviewAverage && reviewCount) {
    productData.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: reviewAverage,
      reviewCount,
    }
  }

  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(productData)}</script>
    </Helmet>
  )
}

interface BreadcrumbStructuredDataProps {
  items: { name: string; url: string }[]
}

function BreadcrumbStructuredData({ items }: BreadcrumbStructuredDataProps) {
  const breadcrumbData = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  }

  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(breadcrumbData)}</script>
    </Helmet>
  )
}

export { OrganizationStructuredData, ProductStructuredData, BreadcrumbStructuredData }
export { SITE_NAME, SITE_URL, DEFAULT_OG_IMAGE }
