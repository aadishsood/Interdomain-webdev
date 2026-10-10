import { NAV_LINKS } from '../data/site.js'

export default function Footer() {
  return (
    <footer className="wrap">
      <div className="footer-grid">
        <div>
          <h3 className="footer-brand">PAPRDOM</h3>
          <p className="footer-desc">PAPRDOM is a pick and place robotic system that identifies, classifies, and sorts objects using computer vision — turning complex automation into clear, connected experiences.</p>
        </div>
        <nav className="footer-links" aria-label="Footer navigation">
          {NAV_LINKS.map(l => <a key={l.href} href={l.href}>{l.label.replace('Problem & solution', 'Problem & Solution').replace('3-D model', '3D Model')}</a>)}
        </nav>
      </div>
      <div className="footer-bottom">© 2026. All rights reserved.</div>
    </footer>
  )
}
