import { useEffect, useRef, useState } from 'react'
import './GoogleTranslate.css'

type GTLang = {
  code: string
  name: string
  native: string
}

const GT_LANGUAGES: GTLang[] = [
  { code: 'hi', name: 'Hindi', native: 'हिन्दी' },
  { code: 'pa', name: 'Punjabi', native: 'ਪੰਜਾਬੀ' },
  { code: 'gu', name: 'Gujarati', native: 'ગુજરાતી' },
  { code: 'mr', name: 'Marathi', native: 'मराठी' },
  { code: 'ta', name: 'Tamil', native: 'தமிழ்' },
  { code: 'te', name: 'Telugu', native: 'తెలుగు' },
  { code: 'bn', name: 'Bengali', native: 'বাংলা' },
  { code: 'kn', name: 'Kannada', native: 'ಕನ್ನಡ' },
  { code: 'ml', name: 'Malayalam', native: 'മലയാളം' },
  { code: 'or', name: 'Odia', native: 'ଓଡ଼ିଆ' },
  { code: 'as', name: 'Assamese', native: 'অসমীয়া' },
]

const STORAGE_KEY = 'gt_lang'
const LANG_CODES = GT_LANGUAGES.map((l) => l.code).join(',')

function getCurrentLangLabel(code: string): string {
  if (code === 'en') return 'English'
  const match = GT_LANGUAGES.find((l) => l.code === code)
  return match ? match.native : 'English'
}

function setGoogtransCookie(code: string) {
  if (code === 'en') {
    document.cookie = 'googtrans=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC'
    document.cookie = 'googtrans=; path=/; domain=.; expires=Thu, 01 Jan 1970 00:00:00 UTC'
    return
  }
  document.cookie = `googtrans=/auto/${code}; path=/`
}

function GoogleTranslate() {
  const [selectedLang, setSelectedLang] = useState('en')
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLLIElement>(null)
  const inited = useRef(false)
  const hideTimer = useRef<ReturnType<typeof setInterval>>()

  const hideBanner = () => {
    const targets = '#goog-gt-tt, .goog-te-banner-frame, iframe.goog-te-banner-frame, .goog-te-spinner-pos, .goog-te-balloon-frame, .goog-te-gadget-simple, .goog-te-menu-frame'
    document.querySelectorAll<HTMLElement>(targets).forEach((el) => {
      el.style.setProperty('display', 'none', 'important')
      el.style.setProperty('visibility', 'hidden', 'important')
      el.style.setProperty('height', '0', 'important')
      el.style.setProperty('opacity', '0', 'important')
    })
    document.body.style.setProperty('top', '0', 'important')
    document.body.style.setProperty('min-height', '0', 'important')

    const topFrame = document.querySelector<HTMLElement>('iframe[src*="translate"]')
    if (topFrame) {
      topFrame.style.setProperty('display', 'none', 'important')
    }
  }

  useEffect(() => {
    hideBanner()
    hideTimer.current = setInterval(hideBanner, 100)
    const obs = new MutationObserver(() => hideBanner())
    obs.observe(document.body, { childList: true, subtree: true, attributes: true })
    return () => {
      clearInterval(hideTimer.current)
      obs.disconnect()
    }
  }, [])

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved && saved !== 'en') {
      setSelectedLang(saved)
      const check = setInterval(() => {
        const sel = document.querySelector<HTMLSelectElement>('.goog-te-combo')
        if (sel) {
          sel.value = saved
          sel.dispatchEvent(new Event('change', { bubbles: true }))
          clearInterval(check)
        }
      }, 300)
      setTimeout(() => clearInterval(check), 8000)
    }
  }, [])

  useEffect(() => {
    if (inited.current) return
    inited.current = true

    const s = document.createElement('script')
    s.src = 'https://translate.google.com/translate_a/element.js?cb=_gtInit'
    s.async = true
    document.body.appendChild(s)

    ;(window as any)._gtInit = () => {
      try {
        new (window as any).google.translate.TranslateElement(
          {
            pageLanguage: 'en',
            includedLanguages: LANG_CODES,
            layout: (window as any).google.translate
              .TranslateElement.InlineLayout.SIMPLE,
            autoDisplay: false,
          },
          'gt_element',
        )
        hideBanner()

        const style = document.createElement('style')
        style.textContent = `
          .goog-te-banner-frame, iframe.goog-te-banner-frame { display: none !important; visibility: hidden !important; height: 0 !important; opacity: 0 !important; }
          #goog-gt-tt { display: none !important; }
          .goog-te-gadget-simple { display: none !important; }
          body { top: 0 !important; min-height: 0 !important; }
          .goog-te-spinner-pos, .goog-te-balloon-frame, .goog-te-menu-frame { display: none !important; }
        `
        document.head.appendChild(style)
      } catch {
        /* init failed */
      }
    }
  }, [])

  useEffect(() => {
    const handle = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [])

  const doTranslate = (code: string) => {
    setOpen(false)
    setSelectedLang(code)

    if (code === 'en') {
      localStorage.removeItem(STORAGE_KEY)
      setGoogtransCookie('en')
      setTimeout(() => window.location.reload(), 150)
      return
    }

    localStorage.setItem(STORAGE_KEY, code)
    setGoogtransCookie(code)

    const sel = document.querySelector<HTMLSelectElement>('.goog-te-combo')
    if (sel) {
      sel.value = code
      sel.dispatchEvent(new Event('change', { bubbles: true }))
      return
    }

    setTimeout(() => window.location.reload(), 150)
  }

  return (
    <li className="nav-lang-item gt-wrap" ref={ref}>
      <button
        type="button"
        className="nav-lang-btn"
        onClick={() => setOpen((p) => !p)}
      >
        🌐 {getCurrentLangLabel(selectedLang)}
      </button>
      {open ? (
        <ul className="nav-lang-dropdown gt-dropdown">
          <li>
            <button
              type="button"
              className={`nav-lang-option ${selectedLang === 'en' ? 'active' : ''}`}
              onClick={() => doTranslate('en')}
            >
              <span className="nav-lang-option-native">English</span>
              <span className="nav-lang-option-english">English</span>
            </button>
          </li>
          {GT_LANGUAGES.map((lang) => (
            <li key={lang.code}>
              <button
                type="button"
                className={`nav-lang-option ${selectedLang === lang.code ? 'active' : ''}`}
                onClick={() => doTranslate(lang.code)}
              >
                <span className="nav-lang-option-native">{lang.native}</span>
                <span className="nav-lang-option-english">{lang.name}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      <div id="gt_element" className="gt-visual-hide" />
    </li>
  )
}

export default GoogleTranslate
