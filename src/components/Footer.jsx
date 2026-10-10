export default function Footer() {
  const links = [
    { href: '#home', label: 'Home' },
    { href: '#model', label: '3D Model' },
    { href: '#components', label: 'Components' },
    { href: '#solution', label: 'Problem & Solution' },
    { href: '#team', label: 'Team' },
    { href: '#gallery', label: 'Gallery' }
  ]

  return (
    <footer className="wrap">
      <div className="footer-grid">
        <div>
          <h3 className="footer-brand">PAPRDOM</h3>
          <p className="footer-desc">PAPRDOM is an automated pick and place robotic system that identifies, classifies, and sorts objects using computer vision, embedded control, and multi-axis kinematics.</p>
        </div>
        <nav className="footer-links" aria-label="Footer quick navigation">
          {links.map(l => (
            <a key={l.href} href={l.href}>{l.label}</a>
          ))}
        </nav>
      </div>
      <div className="footer-bottom">© 2026. All rights reserved.</div>
    </footer>
  )
}
