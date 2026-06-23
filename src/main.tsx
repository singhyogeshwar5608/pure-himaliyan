import { StrictMode, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'
import './index.css'
import './i18n'
import { OrganizationStructuredData } from './components/SEO'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HelmetProvider>
      <Suspense fallback={<div className="i18n-loading">Loading...</div>}>
        <BrowserRouter>
          <OrganizationStructuredData />
          <App />
        </BrowserRouter>
      </Suspense>
    </HelmetProvider>
  </StrictMode>,
)
