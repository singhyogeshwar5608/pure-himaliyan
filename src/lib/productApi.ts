export const API_BASE_URL = ((import.meta.env.VITE_API_BASE_URL as string | undefined) || 'http://127.0.0.1:8000').replace(/\/$/, '')

export function buildApiUrl(path: string) {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  return `${API_BASE_URL}${normalizedPath}`
}

export type ProductDescriptionRecord = {
  id: number
  product_id: number
  kicker: string
  heading: string
  body: string
  image_url: string | null
  display_order: number
  created_at: string
  updated_at: string
}

export type ProductDescriptionPayload = {
  kicker: string
  heading: string
  body: string
  image_file?: File | null
  remove_image?: boolean
  display_order: number | ''
}

export type ProductRecord = {
  id: number
  name: string
  slug: string
  short_description: string | null
  video_url: string | null
  description: string | null
  price: string
  original_price: string | null
  discount: number | null
  badge: string | null
  image_url: string | null
  images: string[] | null
  affiliate_commission: string
  /** Flat ₹ shipping added to every order for this product. */
  shipping_rate?: string
  /** Extra % off subtotal (after referral) when customer pays online; not applied on COD. */
  prepaid_discount_percent?: string
  /** GST % applied on subtotal after referral at checkout. Shipping is excluded. */
  gst_percent?: string
  /** COD handling charges in ₹ — if COD is chosen, this amount is charged via Razorpay upfront. */
  cod_charges?: string
  is_active: boolean
  all_charges_included?: boolean
  comparison_data?: string | null
  comparison_display_order?: number
  descriptions?: ProductDescriptionRecord[]
  created_at: string
  updated_at: string
}

export type ReferralApplyResponse = {
  message: string
  referral_code: string
  discount_percentage: number
  commission_percent_of_price?: number
  affiliate_commission_percent?: number
  pool_share_percent?: number | null
  discount_note?: string | null
  /** Affiliate partner display name when referral owner is an affiliate. */
  affiliate_name?: string | null
}

export type AffiliateProductDiscountRow = {
  product_id: number
  name: string
  slug: string
  price: string
  affiliate_commission_percent: number
  commission_percent_of_price: number
  max_pool_share_percent: number
  configured_pool_share_percent: number | null
  implied_pool_share_percent: number
  effective_discount_percent_of_price: number
  /** @deprecated API may still send — same as commission_percent_of_price / pool UI */
  max_customer_discount_percent?: number
  configured_customer_discount_percent?: number | null
  effective_customer_discount_percent?: number
}

export type BannerImageRecord = {
  id: number
  title: string
  order: number
  image: string
  created_at?: string
  updated_at?: string
}

export type BannerImagePayload = {
  title: string
  order: number | ''
  file: File | null
}

export type ReviewRecord = {
  id: number
  product_id: number
  user_name: string
  rating: number
  comment: string
  is_approved: boolean
  created_at: string
  updated_at: string
  product?: ProductRecord
}

export type ReviewPayload = {
  product_id: number
  user_name: string
  rating: number
  comment: string
}

type MobileBannerApiPayload =
  | BannerImageRecord[]
  | {
      mobile_banners?: BannerImageRecord[]
      mobile_banner_images?: BannerImageRecord[]
      banners?: BannerImageRecord[]
      banner_images?: BannerImageRecord[]
      data?: BannerImageRecord[]
    }

export type ReferralUserRecord = {
  id: number
  user_id: number
  name: string
  email: string
  phone: string
  referral_code: string
  discount_percentage: number
  created_at: string
  updated_at: string
}

export type ReferralUserPayload = {
  name: string
  email: string
  phone: string
  referral_code: string
  discount_percentage: string
}

export type AffiliateWalletTransactionRecord = {
  id: number
  order_id: number
  amount: string
  commission_pool_amount: string
  customer_discount_amount: string
  balance_after: string
  created_at: string
}

export type ReferralOrderRecord = OrderRecord & {
  affiliate_wallet_credit?: string | null
  commission_pool_amount?: string | null
  customer_discount_pool_amount?: string | null
}

export type UserDashboardResponse = {
  user: {
    id: number
    name: string
    phone: string
    email: string
    role: 'user' | 'affiliate'
    referral_code: string | null
    discount_percentage: number | null
  }
  orders: OrderRecord[]
  stats: {
    total_orders: number
    referral_orders: number
  }
  affiliate_wallet_balance?: string
  affiliate_wallet_transactions?: AffiliateWalletTransactionRecord[]
  referral_orders?: ReferralOrderRecord[]
}

export type GalleryMediaType = 'image' | 'video'

export type GalleryVideoProvider = 'youtube' | 'instagram' | 'facebook' | 'unknown'

export type GalleryRecord = {
  id: number
  product_id: number | null
  title: string
  media_type: GalleryMediaType
  image_path: string
  video_url: string | null
  display_order: number
  created_at: string
  updated_at: string
  product?: ProductRecord
}

type BannerApiPayload =
  | BannerImageRecord[]
  | {
      banners?: BannerImageRecord[]
      banner_images?: BannerImageRecord[]
      data?: BannerImageRecord[]
      banner_immge?: BannerImageRecord[]
    }

export type GalleryPayload = {
  product_id?: number | ''
  title: string
  display_order: number | ''
  media_type: GalleryMediaType
  file: File | null
  video_url: string
}

export type InquiryPayload = {
  name: string
  email: string
  phone: string
  address: string
  message: string
  source: string
}

export type InquiryRecord = {
  id: number
  name: string
  email: string | null
  phone: string
  address: string | null
  message: string | null
  source: string
  status: string
  created_at: string
  updated_at: string
}

export type ProductPayload = {
  name: string
  short_description: string
  video_url: string
  description: string
  price: string
  original_price: string
  discount: string
  badge: string
  image_url: string
  image_files: File[]
  affiliate_commission: string
  shipping_rate: string
  prepaid_discount_percent: string
  gst_percent: string
  cod_charges: string
  is_active: boolean
  all_charges_included: boolean
  comparison_data: string
  comparison_display_order: number | ''
  existing_images: string[]
}

export type OrderPayload = {
  product_id: number
  customer_name: string
  customer_phone: string
  customer_email: string
  referral_code: string
  address_line: string
  city: string
  state: string
  postal_code: string
  notes: string
  quantity: number
  payment_method: 'cod' | 'online'
  razorpay_order_id?: string
  razorpay_payment_id?: string
  razorpay_signature?: string
}

export type RazorpayOrderCreateResponse = {
  message: string
  razorpay_order: {
    id: string
    amount: number
    currency: string
    key: string
  }
  pricing: {
    original_price: string
    discount_percentage: number
    discount_amount: string
    subtotal_after_referral?: string
    shipping_amount?: string
    prepaid_discount_percent?: number
    prepaid_discount_amount?: string
    gst_percent?: number
    gst_amount?: string
    cod_charges?: string
    /** Amount charged via Razorpay (includes shipping, GST, minus online prepay discount). */
    final_price: string
  }
}

export type ReferralOwnerSummary = {
  id: number
  name: string
  email: string
  role: string
  phone: string
}

export type OrderRecord = {
  id: number
  product_id: number
  product_name: string
  product_slug: string | null
  /** Present on user-dashboard orders when product still exists — for thumbnails. */
  product_image_url?: string | null
  product_price: string
  referral_code: string | null
  referral_user_id?: number | null
  affiliate_wallet_credited?: boolean
  referral_owner?: ReferralOwnerSummary | null
  discount_percentage: number
  discount_amount: string
  /** Line total after referral discount (before shipping / prepaid). */
  final_price: string
  shipping_amount?: string
  prepaid_discount_amount?: string
  gst_percent?: string
  gst_amount?: string
  cod_charges?: string
  /** Payable total: final_price + shipping + gst − prepaid (online only). */
  grand_total?: string
  customer_name: string
  customer_phone: string
  customer_email: string | null
  address_line: string
  city: string
  state: string
  postal_code: string
  notes: string | null
  whatsapp_number: string
  quantity?: number
  status: string
  payment_method: 'cod' | 'online'
  payment_status: string
  razorpay_order_id: string | null
  razorpay_payment_id: string | null
  razorpay_signature: string | null
  shiprocket_order_id?: string | null
  shiprocket_shipment_id?: string | null
  shiprocket_status?: string | null
  shiprocket_response?: unknown
  created_at: string
  updated_at: string
}

export function resolveProductImageUrl(imageUrl: string | null) {
  if (!imageUrl) {
    return '/assets/logo/brand-color.webp'
  }

  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl
  }

  if (imageUrl.startsWith('/storage/')) {
    return imageUrl
  }

  if (imageUrl.startsWith('storage/')) {
    return `/${imageUrl}`
  }

  return imageUrl
}

function normalizeGalleryMediaType(value: unknown): GalleryMediaType {
  return value === 'video' ? 'video' : 'image'
}

function normalizeGalleryRecord(record: Record<string, unknown>, index: number): GalleryRecord {
  const mediaType = normalizeGalleryMediaType(record.media_type)
  const displayOrder = (() => {
    const raw = record.display_order

    if (typeof raw === 'number' && Number.isFinite(raw)) {
      return raw
    }

    if (typeof raw === 'string') {
      const parsed = Number(raw)
      if (Number.isFinite(parsed)) {
        return parsed
      }
    }

    return index
  })()

  return {
    id: typeof record.id === 'number' ? record.id : index + 1,
    product_id: typeof record.product_id === 'number' ? record.product_id : null,
    title: typeof record.title === 'string' ? record.title : '',
    media_type: mediaType,
    image_path: typeof record.image_path === 'string' ? record.image_path : '',
    video_url: typeof record.video_url === 'string' && record.video_url.trim() !== '' ? record.video_url.trim() : null,
    display_order: displayOrder,
    created_at: typeof record.created_at === 'string' ? record.created_at : '',
    updated_at: typeof record.updated_at === 'string' ? record.updated_at : '',
    product: record.product && typeof record.product === 'object' ? (record.product as ProductRecord) : undefined,
  }
}

export function getGalleryVideoEmbedUrl(videoUrl: string | null | undefined): string | null {
  if (!videoUrl) {
    return null
  }

  try {
    const parsedUrl = new URL(videoUrl)
    const hostname = parsedUrl.hostname.toLowerCase().replace(/^www\./, '')
    const segments = parsedUrl.pathname.split('/').filter(Boolean)

    if ((hostname === 'l.instagram.com' || hostname === 'l.facebook.com') && parsedUrl.searchParams.get('u')) {
      return getGalleryVideoEmbedUrl(parsedUrl.searchParams.get('u'))
    }

    if (hostname === 'youtu.be') {
      const videoId = segments[0]
      return videoId ? `https://www.youtube.com/embed/${videoId}` : null
    }

    if (hostname === 'youtube.com' || hostname === 'm.youtube.com') {
      const videoId = parsedUrl.searchParams.get('v') || (segments[0] === 'embed' ? segments[1] : null) || (segments[0] === 'shorts' ? segments[1] : null)
      return videoId ? `https://www.youtube.com/embed/${videoId}` : null
    }

    if (hostname === 'instagram.com' || hostname === 'm.instagram.com') {
      const type = segments[0]
      const shortcode = segments[1]
      if (type && shortcode && ['reel', 'p', 'tv'].includes(type)) {
        return `https://www.instagram.com/${type}/${shortcode}/embed`
      }
      return null
    }

    if (hostname === 'facebook.com' || hostname === 'm.facebook.com' || hostname === 'fb.watch') {
      return `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(videoUrl)}&show_text=false`
    }

    return null
  } catch {
    return null
  }
}

export function getGalleryVideoProvider(videoUrl: string | null | undefined): GalleryVideoProvider {
  if (!videoUrl) {
    return 'unknown'
  }

  try {
    const parsedUrl = new URL(videoUrl)
    const hostname = parsedUrl.hostname.toLowerCase().replace(/^www\./, '')

    if ((hostname === 'l.instagram.com' || hostname === 'l.facebook.com') && parsedUrl.searchParams.get('u')) {
      return getGalleryVideoProvider(parsedUrl.searchParams.get('u'))
    }

    if (hostname === 'youtu.be' || hostname === 'youtube.com' || hostname === 'm.youtube.com') {
      return 'youtube'
    }

    if (hostname === 'instagram.com' || hostname === 'm.instagram.com') {
      return 'instagram'
    }

    if (hostname === 'facebook.com' || hostname === 'm.facebook.com' || hostname === 'fb.watch') {
      return 'facebook'
    }

    return 'unknown'
  } catch {
    return 'unknown'
  }
}

function buildProductFormData(payload: ProductPayload) {
  const formData = new FormData()
  const normalizedAffiliateCommission = payload.affiliate_commission.trim() === '' ? '0' : payload.affiliate_commission

  formData.append('name', payload.name)
  formData.append('short_description', payload.short_description)
  formData.append('video_url', payload.video_url)
  formData.append('description', payload.description)
  formData.append('price', payload.price)
  formData.append('original_price', payload.original_price)
  formData.append('discount', payload.discount)
  formData.append('badge', payload.badge)
  formData.append('image_url', payload.image_url)
  formData.append('affiliate_commission', normalizedAffiliateCommission)
  formData.append('shipping_rate', payload.shipping_rate.trim() === '' ? '0' : payload.shipping_rate)
  formData.append('prepaid_discount_percent', payload.prepaid_discount_percent.trim() === '' ? '0' : payload.prepaid_discount_percent)
  formData.append('gst_percent', payload.gst_percent.trim() === '' ? '0' : payload.gst_percent)
  formData.append('cod_charges', payload.cod_charges.trim() === '' ? '0' : payload.cod_charges)
  formData.append('is_active', payload.is_active ? '1' : '0')
  formData.append('all_charges_included', payload.all_charges_included ? '1' : '0')
  formData.append('comparison_data', payload.comparison_data)
  formData.append('comparison_display_order', String(payload.comparison_display_order === '' ? 999 : payload.comparison_display_order))

  payload.existing_images.forEach((image) => {
    formData.append('existing_images[]', image)
  })

  payload.image_files.forEach((file) => {
    formData.append('image_files[]', file)
  })

  if (payload.image_files.length > 0) {
    formData.delete('image_url')
  }

  return formData
}

async function parseJson<T>(response: Response): Promise<T> {
  const contentType = response.headers.get('content-type') || ''

  if (!contentType.includes('application/json')) {
    const text = await response.text()

    if (!response.ok) {
      throw new Error(text.includes('<!doctype') || text.includes('<html') ? 'Server returned a non-JSON error response.' : text || 'Request failed.')
    }

    throw new Error('Server returned an unexpected non-JSON response.')
  }

  const data = (await response.json()) as T & { message?: string }

  if (!response.ok) {
    const validationErrors = (() => {
      const errors = (data as { errors?: Record<string, string[] | string> }).errors
      if (!errors || typeof errors !== 'object') {
        return null
      }

      const firstErrorField = Object.keys(errors)[0]
      const fieldErrors = firstErrorField ? errors[firstErrorField] : null

      if (Array.isArray(fieldErrors) && fieldErrors.length > 0) {
        return fieldErrors[0]
      }

      if (typeof fieldErrors === 'string' && fieldErrors.trim() !== '') {
        return fieldErrors
      }

      return null
    })()

    throw new Error(validationErrors || data.message || 'Request failed.')
  }

  return data
}

export async function fetchProducts(): Promise<ProductRecord[]> {
  const response = await fetch(buildApiUrl('/api/products'), {
    headers: {
      Accept: 'application/json',
    },
  })
  const data = await parseJson<{ products: ProductRecord[] }>(response)
  return data.products
}

export async function fetchProduct(product: string): Promise<ProductRecord> {
  const response = await fetch(buildApiUrl(`/api/products/${product}`), {
    headers: {
      Accept: 'application/json',
    },
  })
  const data = await parseJson<{ product: ProductRecord }>(response)
  return data.product
}

export async function fetchProductDescriptions(productId: number): Promise<ProductDescriptionRecord[]> {
  const response = await fetch(buildApiUrl(`/api/products/${productId}/descriptions`), {
    headers: { Accept: 'application/json' },
  })
  const data = await parseJson<{ descriptions: ProductDescriptionRecord[] }>(response)
  return data.descriptions
}

export async function createProductDescription(productId: number, payload: ProductDescriptionPayload): Promise<ProductDescriptionRecord> {
  const formData = new FormData()
  formData.append('kicker', payload.kicker || 'Description')
  formData.append('heading', payload.heading)
  formData.append('body', payload.body)
  formData.append('display_order', String(payload.display_order === '' ? 0 : payload.display_order))
  if (payload.image_file) {
    formData.append('image', payload.image_file)
  }

  const response = await fetch(buildApiUrl(`/api/products/${productId}/descriptions`), {
    method: 'POST',
    headers: { Accept: 'application/json' },
    body: formData,
  })
  const data = await parseJson<{ description: ProductDescriptionRecord }>(response)
  return data.description
}

export async function updateProductDescription(productId: number, descriptionId: number, payload: ProductDescriptionPayload): Promise<ProductDescriptionRecord> {
  const formData = new FormData()
  formData.append('kicker', payload.kicker || 'Description')
  formData.append('heading', payload.heading)
  formData.append('body', payload.body)
  formData.append('display_order', String(payload.display_order === '' ? 0 : payload.display_order))
  if (payload.remove_image) {
    formData.append('remove_image', '1')
  }
  if (payload.image_file) {
    formData.append('image', payload.image_file)
  }

  const response = await fetch(buildApiUrl(`/api/products/${productId}/descriptions/${descriptionId}`), {
    method: 'POST',
    headers: { Accept: 'application/json' },
    body: (() => {
      formData.append('_method', 'PUT')
      return formData
    })(),
  })
  const data = await parseJson<{ description: ProductDescriptionRecord }>(response)
  return data.description
}

export async function deleteProductDescription(productId: number, descriptionId: number): Promise<void> {
  const response = await fetch(buildApiUrl(`/api/products/${productId}/descriptions/${descriptionId}`), {
    method: 'DELETE',
    headers: { Accept: 'application/json' },
  })
  await parseJson<{ message: string }>(response)
}

export async function createProduct(payload: ProductPayload): Promise<ProductRecord> {
  const response = await fetch(buildApiUrl('/api/products'), {
    method: 'POST',
    headers: {
      Accept: 'application/json',
    },
    body: buildProductFormData(payload),
  })

  const data = await parseJson<{ product: ProductRecord }>(response)
  return data.product
}

export async function updateProduct(id: number, payload: ProductPayload): Promise<ProductRecord> {
  const response = await fetch(buildApiUrl(`/api/products/${id}`), {
    method: 'POST',
    headers: {
      Accept: 'application/json',
    },
    body: (() => {
      const formData = buildProductFormData(payload)
      formData.append('_method', 'PUT')
      return formData
    })(),
  })

  const data = await parseJson<{ product: ProductRecord }>(response)
  return data.product
}

export async function deleteProduct(id: number): Promise<void> {
  const response = await fetch(buildApiUrl(`/api/products/${id}`), {
    method: 'DELETE',
    headers: {
      Accept: 'application/json',
    },
  })

  await parseJson<{ message: string }>(response)
}

export async function createOrder(payload: OrderPayload): Promise<{ order: OrderRecord; message: string }> {
  const response = await fetch(buildApiUrl('/api/orders'), {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  return parseJson<{ order: OrderRecord; message: string }>(response)
}

export async function createRazorpayOrder(payload: Pick<OrderPayload, 'product_id' | 'referral_code' | 'quantity' | 'payment_method'>): Promise<RazorpayOrderCreateResponse> {
  const response = await fetch(buildApiUrl('/api/payments/razorpay/order'), {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  return parseJson<RazorpayOrderCreateResponse>(response)
}

export async function verifyRazorpayPayment(payload: {
  razorpay_order_id: string
  razorpay_payment_id: string
  razorpay_signature: string
}): Promise<{ message: string; verified: boolean }> {
  const response = await fetch(buildApiUrl('/api/payments/razorpay/verify'), {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  return parseJson<{ message: string; verified: boolean }>(response)
}

export async function applyReferralCode(referralCode: string, productId?: number): Promise<ReferralApplyResponse> {
  const response = await fetch(buildApiUrl('/api/referral-code/apply'), {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      referral_code: referralCode,
      ...(productId != null ? { product_id: productId } : {}),
    }),
  })

  return parseJson<ReferralApplyResponse>(response)
}

export async function fetchAffiliateProductDiscounts(userId: number): Promise<{
  items: AffiliateProductDiscountRow[]
  referral_code: string
}> {
  const response = await fetch(buildApiUrl(`/api/affiliate/${userId}/product-discounts`), {
    headers: { Accept: 'application/json' },
  })

  return parseJson<{ items: AffiliateProductDiscountRow[]; referral_code: string }>(response)
}

export async function saveAffiliateProductCustomerDiscount(
  userId: number,
  productId: number,
  customerDiscountPercentage: number,
): Promise<{ message: string }> {
  const response = await fetch(buildApiUrl(`/api/affiliate/${userId}/product-discounts/${productId}`), {
    method: 'PUT',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ customer_discount_percentage: customerDiscountPercentage }),
  })

  return parseJson<{ message: string }>(response)
}

export async function fetchReferralUsers(): Promise<ReferralUserRecord[]> {
  const response = await fetch(buildApiUrl('/api/referral-users'), {
    headers: {
      Accept: 'application/json',
    },
  })

  const data = await parseJson<{ referral_users: ReferralUserRecord[] }>(response)
  return data.referral_users
}

export async function updateReferralUser(id: number, payload: ReferralUserPayload): Promise<ReferralUserRecord> {
  const response = await fetch(buildApiUrl(`/api/referral-users/${id}`), {
    method: 'PUT',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      ...payload,
      discount_percentage: Number(payload.discount_percentage),
    }),
  })

  const data = await parseJson<{ referral_user: ReferralUserRecord }>(response)
  return data.referral_user
}

export async function deleteReferralUser(id: number): Promise<void> {
  const response = await fetch(buildApiUrl(`/api/referral-users/${id}`), {
    method: 'DELETE',
    headers: {
      Accept: 'application/json',
    },
  })

  await parseJson<{ message: string }>(response)
}

export async function fetchUserDashboard(userId: number): Promise<UserDashboardResponse> {
  const response = await fetch(buildApiUrl(`/api/user-dashboard/${userId}`), {
    headers: {
      Accept: 'application/json',
    },
  })

  return parseJson<UserDashboardResponse>(response)
}

export async function fetchGallery(): Promise<GalleryRecord[]> {
  const response = await fetch(buildApiUrl('/api/gallery'), {
    headers: {
      Accept: 'application/json',
    },
  })

  const data = await parseJson<{ galleries: Array<Record<string, unknown>> }>(response)
  return data.galleries
    .map((item, index) => normalizeGalleryRecord(item, index))
    .sort((a, b) => a.display_order - b.display_order)
}

function normalizeBannerRecords(payload: BannerApiPayload): BannerImageRecord[] {
  const recordsSource = Array.isArray(payload)
    ? payload
    : payload.banner_images || payload.banners || payload.banner_immge || payload.data || []

  if (!Array.isArray(recordsSource)) {
    return []
  }

  const normalized: BannerImageRecord[] = []

  recordsSource.forEach((item, index) => {
    if (!item || typeof item !== 'object') {
      return
    }

    const record = item as Record<string, unknown>
    const image = typeof record.image === 'string' ? record.image.trim() : ''

    if (!image) {
      return
    }

    const orderValue = (() => {
      const raw = record.order

      if (typeof raw === 'number' && Number.isFinite(raw)) {
        return raw
      }

      if (typeof raw === 'string') {
        const parsed = Number(raw)
        if (Number.isFinite(parsed)) {
          return parsed
        }
      }

      return index
    })()

    normalized.push({
      id: typeof record.id === 'number' ? record.id : index + 1,
      title: typeof record.title === 'string' ? record.title : '',
      order: orderValue,
      image,
      created_at: typeof record.created_at === 'string' ? record.created_at : undefined,
      updated_at: typeof record.updated_at === 'string' ? record.updated_at : undefined,
    })
  })

  return normalized.sort((a, b) => a.order - b.order)
}

export async function fetchBannerImages(): Promise<BannerImageRecord[]> {
  const response = await fetch(buildApiUrl('/api/banner-images'), {
    headers: {
      Accept: 'application/json',
    },
  })

  const data = await parseJson<BannerApiPayload>(response)
  return normalizeBannerRecords(data)
}

export async function createBannerImage(payload: BannerImagePayload): Promise<BannerImageRecord> {
  if (!payload.file) {
    throw new Error('Please select an image to upload.')
  }

  const formData = new FormData()
  formData.append('title', payload.title)

  if (payload.order !== '' && payload.order !== null && Number.isFinite(Number(payload.order))) {
    formData.append('order', String(payload.order))
  }

  formData.append('image', payload.file)

  const response = await fetch(buildApiUrl('/api/banner-images'), {
    method: 'POST',
    headers: {
      Accept: 'application/json',
    },
    body: formData,
  })

  const data = await parseJson<{ banner_image: BannerImageRecord }>(response)
  return data.banner_image
}

export async function deleteBannerImage(id: number): Promise<void> {
  const response = await fetch(buildApiUrl(`/api/banner-images/${id}`), {
    method: 'DELETE',
    headers: {
      Accept: 'application/json',
    },
  })

  await parseJson<{ message: string }>(response)
}

function normalizeMobileBannerRecords(payload: MobileBannerApiPayload): BannerImageRecord[] {
  const recordsSource = Array.isArray(payload)
    ? payload
    : payload.mobile_banner_images || payload.mobile_banners || payload.banner_images || payload.banners || payload.data || []

  return normalizeBannerRecords(recordsSource as BannerApiPayload)
}

export async function fetchMobileBannerImages(): Promise<BannerImageRecord[]> {
  const response = await fetch(buildApiUrl('/api/mobile-banner-images'), {
    headers: {
      Accept: 'application/json',
    },
  })

  const data = await parseJson<MobileBannerApiPayload>(response)
  return normalizeMobileBannerRecords(data)
}

export async function createMobileBannerImage(payload: BannerImagePayload): Promise<BannerImageRecord> {
  if (!payload.file) {
    throw new Error('Please select an image to upload.')
  }

  const formData = new FormData()
  formData.append('title', payload.title)

  if (payload.order !== '' && payload.order !== null && Number.isFinite(Number(payload.order))) {
    formData.append('order', String(payload.order))
  }

  formData.append('image', payload.file)

  const response = await fetch(buildApiUrl('/api/mobile-banner-images'), {
    method: 'POST',
    headers: {
      Accept: 'application/json',
    },
    body: formData,
  })

  const data = await parseJson<{ mobile_banner_image?: BannerImageRecord; banner_image?: BannerImageRecord }>(response)
  const record = data.mobile_banner_image || data.banner_image
  if (!record) {
    throw new Error('Server did not return a created banner record.')
  }
  return record
}

export async function deleteMobileBannerImage(id: number): Promise<void> {
  const response = await fetch(buildApiUrl(`/api/mobile-banner-images/${id}`), {
    method: 'DELETE',
    headers: {
      Accept: 'application/json',
    },
  })

  await parseJson<{ message: string }>(response)
}

export async function createGalleryItem(payload: GalleryPayload): Promise<GalleryRecord> {
  if (payload.media_type === 'image' && !payload.file) {
    throw new Error('Please select an image to upload.')
  }

  if (payload.media_type === 'video' && payload.video_url.trim() === '') {
    throw new Error('Please enter a valid video URL.')
  }

  const formData = new FormData()
  formData.append('title', payload.title)
  formData.append('media_type', payload.media_type)

  if (payload.product_id !== '' && payload.product_id !== undefined) {
    formData.append('product_id', String(payload.product_id))
  }

  if (payload.display_order !== '' && payload.display_order !== null && Number.isFinite(Number(payload.display_order))) {
    formData.append('display_order', String(payload.display_order))
  }

  if (payload.media_type === 'video') {
    formData.append('video_url', payload.video_url.trim())
  } else if (payload.file) {
    formData.append('image', payload.file)
  }

  const response = await fetch(buildApiUrl('/api/gallery'), {
    method: 'POST',
    headers: {
      Accept: 'application/json',
    },
    body: formData,
  })

  const data = await parseJson<{ gallery: Record<string, unknown> }>(response)
  return normalizeGalleryRecord(data.gallery, 0)
}

export async function deleteGalleryItem(id: number): Promise<void> {
  const response = await fetch(buildApiUrl(`/api/gallery/${id}`), {
    method: 'DELETE',
    headers: {
      Accept: 'application/json',
    },
  })

  await parseJson<{ message: string }>(response)
}

export async function createInquiry(payload: InquiryPayload): Promise<InquiryRecord> {
  const response = await fetch(buildApiUrl('/api/inquiries'), {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  const data = await parseJson<{ inquiry: InquiryRecord }>(response)
  return data.inquiry
}

export async function fetchInquiries(): Promise<InquiryRecord[]> {
  const response = await fetch(buildApiUrl('/api/inquiries'), {
    headers: {
      Accept: 'application/json',
    },
  })

  const data = await parseJson<{ inquiries: InquiryRecord[] }>(response)
  return data.inquiries
}

export async function fetchOrders(): Promise<OrderRecord[]> {
  const response = await fetch(buildApiUrl('/api/orders'), {
    headers: {
      Accept: 'application/json',
    },
  })

  const data = await parseJson<{ orders: OrderRecord[] }>(response)
  return data.orders
}

export async function updateOrderStatus(
  orderId: number,
  payload: { status: string; payment_status?: string },
): Promise<OrderRecord> {
  const response = await fetch(buildApiUrl(`/api/admin/orders/${orderId}/status`), {
    method: 'PUT',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  const data = await parseJson<{ order: OrderRecord }>(response)
  return data.order
}

export const reviewApi = {
  async fetchProductReviews(productId: number): Promise<ReviewRecord[]> {
    const response = await fetch(buildApiUrl(`/api/products/${productId}/reviews`), {
      headers: { Accept: 'application/json' },
    })
    return parseJson<ReviewRecord[]>(response)
  },

  async submitReview(payload: ReviewPayload): Promise<ReviewRecord> {
    const response = await fetch(buildApiUrl('/api/reviews'), {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })
    return parseJson<ReviewRecord>(response)
  },

  async fetchAdminReviews(): Promise<ReviewRecord[]> {
    const response = await fetch(buildApiUrl('/api/admin/reviews'), {
      headers: { Accept: 'application/json' },
    })
    return parseJson<ReviewRecord[]>(response)
  },

  async updateReviewStatus(id: number, isApproved: boolean): Promise<ReviewRecord> {
    const response = await fetch(buildApiUrl(`/api/admin/reviews/${id}/status`), {
      method: 'PUT',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ is_approved: isApproved }),
    })
    return parseJson<ReviewRecord>(response)
  },

  async deleteReview(id: number): Promise<void> {
    const response = await fetch(buildApiUrl(`/api/admin/reviews/${id}`), {
      method: 'DELETE',
      headers: { Accept: 'application/json' },
    })
    await parseJson<{ message: string }>(response)
  },
}

export type SubSectionSource = {
  title: string
  url: string
}

export type SubSectionItem = {
  icon: string
  heading: string
  description: string
  sources: SubSectionSource[]
}

export type BlogSectionRecord = {
  id: number
  type: 'description' | 'comparison' | 'nested'
  display_order: number
  kicker: string | null
  heading: string | null
  body: string | null
  image_url: string | null
  comparison_data: string | null
  sub_sections: SubSectionItem[] | null
  created_at: string
  updated_at: string
}

export type BlogSectionPayload = {
  type: 'description' | 'comparison' | 'nested'
  display_order: number | ''
  kicker: string
  heading: string
  body: string
  comparison_data: string
  sub_sections?: string
  image?: File | null
  remove_image?: boolean
}

function buildBlogSectionFormData(payload: BlogSectionPayload): FormData {
  const fd = new FormData()
  fd.append('type', payload.type)
  fd.append('display_order', String(payload.display_order === '' ? 0 : payload.display_order))
  fd.append('kicker', payload.kicker)
  fd.append('heading', payload.heading)
  fd.append('body', payload.body)
  fd.append('comparison_data', payload.comparison_data)
  if (payload.sub_sections) {
    fd.append('sub_sections', payload.sub_sections)
  }
  if (payload.image) {
    fd.append('image', payload.image)
  }
  if (payload.remove_image) {
    fd.append('remove_image', '1')
  }
  return fd
}

export async function fetchBlogSections(): Promise<BlogSectionRecord[]> {
  const response = await fetch(buildApiUrl('/api/blog-sections'), {
    headers: { Accept: 'application/json' },
  })
  const data = await parseJson<{ sections: BlogSectionRecord[] }>(response)
  return data.sections
}

export async function createBlogSection(payload: BlogSectionPayload): Promise<BlogSectionRecord> {
  const response = await fetch(buildApiUrl('/api/blog-sections'), {
    method: 'POST',
    body: buildBlogSectionFormData(payload),
  })
  const data = await parseJson<{ section: BlogSectionRecord }>(response)
  return data.section
}

export async function updateBlogSection(id: number, payload: Partial<BlogSectionPayload>): Promise<BlogSectionRecord> {
  const fd = new FormData()
  fd.append('_method', 'PUT')

  if (payload.type !== undefined) fd.append('type', payload.type)
  if (payload.display_order !== undefined) fd.append('display_order', String(payload.display_order === '' ? 0 : payload.display_order))
  if (payload.kicker !== undefined) fd.append('kicker', payload.kicker)
  if (payload.heading !== undefined) fd.append('heading', payload.heading)
  if (payload.body !== undefined) fd.append('body', payload.body)
  if (payload.comparison_data !== undefined) fd.append('comparison_data', payload.comparison_data)
  if (payload.sub_sections !== undefined) fd.append('sub_sections', payload.sub_sections)
  if (payload.image) fd.append('image', payload.image)
  if (payload.remove_image) fd.append('remove_image', '1')

  const response = await fetch(buildApiUrl(`/api/blog-sections/${id}`), {
    method: 'POST',
    body: fd,
  })
  const data = await parseJson<{ section: BlogSectionRecord }>(response)
  return data.section
}

export async function deleteBlogSection(id: number): Promise<void> {
  const response = await fetch(buildApiUrl(`/api/blog-sections/${id}`), {
    method: 'DELETE',
    headers: { Accept: 'application/json' },
  })
  await parseJson<{ message: string }>(response)
}
