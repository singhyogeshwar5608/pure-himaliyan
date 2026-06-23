import '../App.css'
import '../App.css'
import Header from '../components/Header'
import Footer from '../components/Footer'

function TermsPage() {
  const policyHighlights = [
    {
      title: 'Pre-paid & COD safeguarded',
      description: 'Orders move forward only after full payment or confirmed token advance for COD shipments.',
    },
    {
      title: 'No preference-based returns',
      description: 'Change-of-mind or cosmetic dissatisfaction requests are politely declined to prevent misuse.',
    },
    {
      title: 'Unboxing proof required',
      description: 'A single-take unboxing video is mandatory for damage or wrong-product assessments.',
    },
    {
      title: '48-hour escalation window',
      description: 'Report eligible issues within 48 hours of delivery for the fastest possible resolution.',
    },
  ]

  const policySections = [
    {
      id: 'order-confirmation',
      badge: 'Orders',
      title: 'Order Confirmation & Payment',
      lead: 'How we validate every Pure Himalyan order before dispatch.',
      points: [
        'Pre-paid Orders: Confirmed immediately after full payment clears.',
        'COD (Cash on Delivery): Operates on a partial advance system. A non-refundable token amount (decided by the Company) must be paid in advance to confirm the order. Remaining balance is payable on delivery.',
        'No Processing without Payment: Orders are not processed or dispatched until the applicable pre-paid amount or COD token amount is received.',
      ],
    },
    {
      id: 'no-preference-returns',
      badge: 'Returns',
      title: 'No Returns Based on Preference',
      lead: 'Ayurvedic food supplements are manufactured in controlled batches – preference-based returns aren’t possible.',
      paragraphs: [
        'Our Ayurvedic supplements do not involve variables like size, colour, or fit. Once confirmed and dispatched, returns based on change of mind, courier delays, or dissatisfaction with the product’s appearance are strictly rejected.',
      ],
    },
    {
      id: 'unboxing-proof',
      badge: 'Evidence',
      title: 'Mandatory Unboxing Video for Claims',
      lead: 'To keep the process transparent, every claim must be backed by a single continuous video.',
      points: [
        'The video must be clear, high-resolution, and uncut.',
        'Start recording from the intact courier seal/label and continue until all items are removed from the box.',
        'Claims without a valid uncut unboxing video will be rejected.',
      ],
    },
    {
      id: 'return-window',
      badge: 'Timeline',
      title: 'Return Application Window',
      lead: 'Verified damage or wrong-product deliveries must be escalated quickly so that we can help.',
      paragraphs: [
        'Only wrong-product or verified-damage cases are eligible for return. Submit the request within 48 hours of the delivery timestamp; requests beyond this window are not entertained.',
      ],
    },
    {
      id: 'failed-delivery',
      badge: 'Logistics',
      title: 'Failed Delivery & RTO (Return to Origin)',
      lead: 'Logistics costs are real. To keep pricing fair for genuine customers we enforce a zero-tolerance policy on negligence.',
      points: [
        'Funds are forfeited if the shipment returns because the customer was unavailable, refused delivery, provided an incorrect address, or was unreachable.',
        'The forfeited pre-paid amount or COD token covers courier handling, packaging, and administrative charges.',
        'No carry-forward: forfeited amounts cannot be used for future purchases.',
      ],
    },
    {
      id: 'refund-process',
      badge: 'Refunds',
      title: 'Refund Process',
      lead: 'Once a claim is approved, funds are released swiftly with total transparency.',
      points: [
        'Approved refunds (after verification) are processed to the original payment source within 7–10 business days.',
        'Shipping charges and COD token amounts are non-refundable in all scenarios.',
      ],
    },
    {
      id: 'legal-jurisdiction',
      badge: 'Legal',
      title: 'Legal Jurisdiction',
      lead: 'All dispute resolutions are anchored to our home jurisdiction in Haryana, India.',
      paragraphs: [
        'All disputes are subject to the exclusive jurisdiction of the Courts at Jind, Haryana, India.',
      ],
    },
  ]

  const supportCards = [
    {
      icon: '📧',
      title: 'Email our resolutions desk',
      description: 'Share your order ID, payment proof, and supporting media for a documented response within 24 hours.',
      action: 'Send an email',
      href: 'mailto:info@purehimalyan.com',
    },
    {
      icon: '📞',
      title: 'Talk to customer care',
      description: 'Available 9am – 8pm IST for shipment status, COD confirmations, and real-time escalations.',
      action: 'Call +91 9817665567',
      href: 'tel:+919817665567',
    },
    {
      icon: '💬',
      title: 'Raise a WhatsApp ticket',
      description: 'Tap through to chat, share your unboxing video, and receive guided next steps from the team.',
      action: 'Open WhatsApp',
      href: 'https://wa.me/919817665567',
    },
  ]

  return (
    <main className="site-shell legal-page">
      <Header />

      <section className="legal-hero legal-hero-modern">
        <div className="container legal-hero-content">
          <div className="legal-hero-meta">
            <span className="legal-pill">Updated · March 2026</span>
            <span className="legal-pill secondary">Applies to all India deliveries</span>
          </div>
          <h1>Return, Refund &amp; Cancellation Policy</h1>
          <p>
            Clear guardrails that protect genuine customers, streamline fulfilment, and maintain the purity of every Pure Himalyan shipment.
          </p>
          <div className="legal-hero-tags">
            <span>Secure COD workflow</span>
            <span>Video-backed verification</span>
            <span>Fair resolution timelines</span>
          </div>
          <div className="legal-hero-actions">
            <a className="legal-hero-button" href="#support">Need help with an order?</a>
            <a className="legal-hero-link" href="/privacy">Read privacy policy →</a>
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

      <section className="legal-body" aria-labelledby="policy-outline">
        <div className="container legal-layout">
          <aside className="legal-toc-card">
            <h2 id="policy-outline">Policy outline</h2>
            <p className="legal-toc-description">Jump directly to the section that matches your query.</p>
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
              <p><strong>Last updated:</strong> March 23, 2026</p>
              <p className="legal-small">Policy stewarded by Rasvigyan Ayurvedic Food Supplement (Pure Himalyan).</p>
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

      <section className="legal-support" id="support">
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

export default TermsPage
