import '../App.css'
import '../App.css'
import Header from '../components/Header'
import Footer from '../components/Footer'

function PrivacyPolicyPage() {
  const policyHighlights = [
    {
      title: 'Transparent data handling',
      description: 'We only collect information required to process orders, support, and improve Pure Himalyan experiences.',
    },
    {
      title: 'Purpose-driven retention',
      description: 'Data is kept only as long as required for compliance, support, or legal obligations.',
    },
    {
      title: 'Opt-out ready',
      description: 'You can withdraw marketing consent at any time via email or the unsubscribe links we provide.',
    },
    {
      title: 'Secure infrastructure',
      description: 'Payment, hosting, and analytics partners are vetted for robust security protections.',
    },
  ]

  const policySections = [
    {
      id: 'information-we-collect',
      badge: 'Collection',
      title: 'Information We Collect',
      lead: 'Essential details we record when you interact with Pure Himalyan platforms.',
      points: [
        'Personal Information: Name, age, gender, and contact details (email, phone, address).',
        'Transaction Data: Payment details and products purchased.',
        'Technical Data: IP address, browser type, device, and app usage statistics.',
      ],
    },
    {
      id: 'medical-disclaimer',
      badge: 'Usage',
      title: 'Medical Disclaimer & Product Use',
      lead: 'Our formulations support holistic wellness but are not medicinal substitutes.',
      points: [
        'Holistic Support: Supplements enhance energy, vitality, and immunity but are not medical cures.',
        'Individual Results: Benefits vary by person; no absolute guarantees are made.',
        'Expert Guidance: Consult an Ayurvedic doctor or healthcare provider for personalised usage.',
      ],
    },
    {
      id: 'how-we-use',
      badge: 'Purpose',
      title: 'How We Use Your Information',
      lead: 'We are explicit about why data is collected and how it supports your experience.',
      paragraphs: [
        'Collected data is used to process orders, provide customer support, and share Pure Himalyan updates. You may opt out of marketing communications at any time.',
      ],
    },
    {
      id: 'data-security',
      badge: 'Security',
      title: 'Data Security & Third Parties',
      lead: 'Only rigorously evaluated partners handle your data on our behalf.',
      paragraphs: [
        'We apply industry-standard safeguards and share only necessary data with trusted service providers (payment gateways, courier partners) required to fulfil orders. We never sell your personal information.',
      ],
    },
    {
      id: 'cookies',
      badge: 'Cookies',
      title: 'Cookies',
      lead: 'Small files, big convenience. Learn how cookies support your journey.',
      paragraphs: [
        'Our website uses cookies to improve user experience. Disabling cookies through your browser may impact site functionality.',
      ],
    },
    {
      id: 'governing-law',
      badge: 'Legal',
      title: 'Governing Law & Jurisdiction',
      lead: 'Disputes default to our registered jurisdiction in Haryana, India.',
      paragraphs: [
        'All matters relating to the website, mobile app, and product purchases are governed by the laws of India. The Courts at Jind, Haryana have exclusive jurisdiction.',
      ],
    },
    {
      id: 'policy-changes',
      badge: 'Updates',
      title: 'Changes to This Policy',
      lead: 'We will inform you whenever significant updates occur.',
      paragraphs: [
        'We may update this policy from time to time. Any changes will be posted with an updated effective date. Continued use of our services after changes indicates acceptance.',
      ],
    },
    {
      id: 'contact-info',
      badge: 'Support',
      title: 'Contact Information',
      lead: 'Reach the team managing privacy, data requests, and policy clarifications.',
      points: [
        'Company Name: Rasvigyan Ayurvedic Food Supplement',
        'Brand Name: Pure Himalyan',
        'Registered Office: 858/15, Saini Basti, Safidon Road, Jind City (Haryana) 126102',
        'Email: info@purehimalyan.com / rasvigyan@gmail.com',
        'Phone: +91 9817665567',
        'Website: http://purehimalyan.com',
      ],
    },
  ]

  const supportCards = [
    {
      icon: '🛡️',
      title: 'Request your data file',
      description: 'Email us with the subject line “Data Request” and receive a compiled report within 15 working days.',
      action: 'Contact privacy desk',
      href: 'mailto:info@purehimalyan.com?subject=Pure%20Himalyan%20Data%20Request',
    },
    {
      icon: '✏️',
      title: 'Update or correct details',
      description: 'Share your order ID and the changes required. We will update records once ownership is verified.',
      action: 'Submit update request',
      href: 'mailto:info@purehimalyan.com?subject=Pure%20Himalyan%20Profile%20Update',
    },
    {
      icon: '🔐',
      title: 'Withdraw marketing consent',
      description: 'Opt out from newsletters and special offers while continuing to receive transaction essentials.',
      action: 'Unsubscribe via email',
      href: 'mailto:info@purehimalyan.com?subject=Pure%20Himalyan%20Unsubscribe',
    },
  ]

  return (
    <main className="site-shell legal-page">
      <Header />

      <section className="legal-hero legal-hero-modern">
        <div className="container legal-hero-content">
          <div className="legal-hero-meta">
            <span className="legal-pill">Updated · August 2025</span>
            <span className="legal-pill secondary">Applies to website &amp; mobile app</span>
          </div>
          <h1>Pure Himalyan Privacy Policy</h1>
          <p>
            We respect your personal data, secure every transaction, and stay transparent about how information flows through our systems.
          </p>
          <div className="legal-hero-tags">
            <span>Pan-India compliance</span>
            <span>User-first data controls</span>
            <span>Trusted service partners</span>
          </div>
          <div className="legal-hero-actions">
            <a className="legal-hero-button" href="#data-requests">Request data access</a>
            <a className="legal-hero-link" href="/terms">View return policy →</a>
          </div>
        </div>
      </section>

      <section className="legal-overview">
        <div className="container legal-overview-grid">
          {policyHighlights.map((item) => (
            <article key={item.title} className="legal-highlight-card">
              <h3>{item.title}</h3>
              <p>{item.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="legal-body" aria-labelledby="privacy-outline">
        <div className="container legal-layout">
          <aside className="legal-toc-card">
            <h2 id="privacy-outline">Policy outline</h2>
            <p className="legal-toc-description">Everything we do with your data, mapped section by section.</p>
            <ul>
              {policySections.map((section) => (
                <li key={section.id}>
                  <a href={`#${section.id}`}>
                    {section.title}
                  </a>
                  <span>{section.lead}</span>
                </li>
              ))}
            </ul>
            <div className="legal-toc-footer">
              <p><strong>Last updated:</strong> August 23, 2025</p>
              <p className="legal-small">Policy owned by Rasvigyan Ayurvedic Food Supplement (Pure Himalyan).</p>
            </div>
          </aside>

          <div className="legal-section-stack">
            {policySections.map((section) => (
              <section key={section.id} id={section.id} className="legal-section-block">
                <span className="legal-section-badge">{section.badge}</span>
                <h2>{section.title}</h2>
                <p className="legal-section-lead">{section.lead}</p>
                {section.paragraphs?.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
                {section.points ? (
                  <ul>
                    {section.points.map((point) => (
                      <li key={point}>{point}</li>
                    ))}
                  </ul>
                ) : null}
              </section>
            ))}
          </div>
        </div>
      </section>

      <section className="legal-support" id="data-requests">
        <div className="container legal-support-grid">
          {supportCards.map((card) => (
            <article key={card.title} className="legal-support-card">
              <div className="legal-support-icon" aria-hidden="true">{card.icon}</div>
              <div className="legal-support-content">
                <h3>{card.title}</h3>
                <p>{card.description}</p>
              </div>
              <a className="legal-support-action" href={card.href}>
                {card.action}
              </a>
            </article>
          ))}
        </div>
      </section>

      <Footer />
    </main>
  )
}

export default PrivacyPolicyPage
