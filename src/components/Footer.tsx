import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { getUser } from '../lib/userAuth'

function Footer() {
  const { t } = useTranslation()
  const sessionUser = getUser()

  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        <div>
          <h4>{t('footer.quickLinks')}</h4>
          <ul>
            <li>
              <Link to="/" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>{t('footer.home')}</Link>
            </li>
            <li><a href="#products">{t('footer.products')}</a></li>
            <li><Link to="/products">{t('footer.shopAll')}</Link></li>
            <li><Link to="/gallery">{t('footer.gallery')}</Link></li>
            <li><Link to="/blog">Blog</Link></li>
          </ul>
        </div>
        <div>
          <h4>{t('footer.legal')}</h4>
          <ul>
            <li>
              <Link to="/privacy">{t('footer.privacy')}</Link>
            </li>
            <li>
              <Link to="/terms">{t('footer.terms')}</Link>
            </li>
          </ul>
        </div>
        <div>
          <h4>{t('footer.contact')}</h4>
          <p>📞 +91 9817665567</p>
          <p>📧 info@purehimalyan.com</p>
          <p>📍 Pure Himalyan, India</p>
        </div>
        <div>
          <h4>{t('footer.partnerPortals')}</h4>
          <div className="portal-links">
            <Link to="/affiliate/login">{t('footer.affiliatePortal')}</Link>
            {sessionUser ? (
              <Link to="/user/dashboard">{t('footer.myDashboard')}</Link>
            ) : (
              <Link to="/user/login">{t('footer.userPortal')}</Link>
            )}
            <Link to="/admin/login">{t('footer.adminPanel')}</Link>
          </div>
        </div>
      </div>
      <div className="footer-bottom">{t('footer.copyright')}</div>
    </footer>
  )
}

export default Footer
