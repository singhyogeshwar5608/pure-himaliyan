/** Read ?ref= or ?referral= from product URLs (8-digit codes from backend). */
export function parseReferralQueryParam(searchParams: URLSearchParams): string | null {
  const raw = searchParams.get('ref') ?? searchParams.get('referral')
  if (!raw) {
    return null
  }

  const digits = raw.trim().replace(/\D/g, '').slice(0, 8)
  return digits.length === 8 ? digits : null
}

export function buildProductReferralLink(origin: string, productSlug: string, referralCode: string): string {
  const base = origin.replace(/\/$/, '')
  const code = referralCode.trim().replace(/\D/g, '').slice(0, 8)
  return `${base}/products/${encodeURIComponent(productSlug)}?ref=${encodeURIComponent(code)}`
}
