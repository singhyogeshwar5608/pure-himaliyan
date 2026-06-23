import { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { getUser } from '../lib/userAuth'
import { languages, getLanguageLabel } from '../lib/languageNames'
// import GoogleTranslate from './GoogleTranslate.tsx'

function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [langOpen, setLangOpen] = useState(false)
  const { t, i18n } = useTranslation()
  const sessionUser = getUser()
  const langRef = useRef<HTMLLIElement>(null)

  const closeMobileMenu = () => setMobileMenuOpen(false)

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (langRef.current && !langRef.current.contains(e.target as Node)) {
        setLangOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <header className="header">
      <nav className="navbar">
        <Link className="logo" to="/" onClick={() => { closeMobileMenu(); window.scrollTo({ top: 0, behavior: 'smooth' }) }}>
          <img src="/assets/logo/logo1.jpeg" alt="Pure Himalyan Logo" id="site-logo" />
        </Link>

        <button className={`hamburger ${mobileMenuOpen ? 'active' : ''}`} onClick={() => setMobileMenuOpen((prev) => !prev)}>
          <span />
          <span />
          <span />
        </button>

        <ul className={`nav-menu ${mobileMenuOpen ? 'active' : ''}`}>
          <li>
            <Link to="/" className="nav-link" onClick={() => { closeMobileMenu(); window.scrollTo({ top: 0, behavior: 'smooth' }) }}>
              {t('nav.home')}
            </Link>
          </li>
          <li>
            <Link to="/products" className="nav-link" onClick={closeMobileMenu}>
              {t('nav.products')}
            </Link>
          </li>
          <li>
            <Link to="/gallery" className="nav-link" onClick={closeMobileMenu}>
              {t('nav.gallery')}
            </Link>
          </li>
          <li>
            <Link to="/blog" className="nav-link" onClick={closeMobileMenu}>
              Blog
            </Link>
          </li>
          <li>
            <a href="#contact" className="nav-link" onClick={closeMobileMenu}>{t('nav.contact')}</a>
          </li>
          <li>
            {sessionUser ? (
              <Link to="/user/dashboard" className="nav-link" onClick={closeMobileMenu}>
                👤 {t('nav.dashboard')}
              </Link>
            ) : (
              <Link to="/user/login" className="nav-link" onClick={closeMobileMenu}>
                👤 {t('nav.login')}
              </Link>
            )}
          </li>
          <li className="nav-lang-item" ref={langRef}>
            <button type="button" className="nav-lang-btn" onClick={() => setLangOpen((prev) => !prev)}>
              🌐 {getLanguageLabel(i18n.language)}
            </button>
            {langOpen ? (
              <ul className="nav-lang-dropdown">
                {languages.map((lang) => (
                  <li key={lang.code}>
                    <button
                      type="button"
                      className={`nav-lang-option ${i18n.language === lang.code ? 'active' : ''}`}
                      onClick={() => { i18n.changeLanguage(lang.code); setLangOpen(false); closeMobileMenu() }}
                    >
                      <span className="nav-lang-option-native">{lang.native}</span>
                      <span className="nav-lang-option-english">{lang.english}</span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </li>
          {/* <GoogleTranslate /> */}
        </ul>
      </nav>
    </header>
  )
}

export default Header
