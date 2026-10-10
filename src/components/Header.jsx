import { useState, useEffect, useRef } from 'react'
import { NAV_LINKS } from '../data/site.js'

export default function Header({ theme, onToggleTheme }) {
  const [open, setOpen] = useState(false)
  const headerRef = useRef(null)

  // Close the mobile menu when resizing up to desktop (matches original matchMedia listener).
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 821px)')
    const onChange = e => { if (e.matches) setOpen(false) }
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  const close = () => setOpen(false)
  const dark = theme === 'dark'

  return (
    <header className={open ? 'nav-open' : ''} ref={headerRef}>
      <div className="wrap nav">
        <a className="brand" href="#home">PAPRDOM</a>
        <nav id="navMenu">
          {NAV_LINKS.map(l => <a key={l.href} href={l.href} onClick={close}>{l.label}</a>)}
          <button className="theme" type="button" onClick={onToggleTheme} aria-label={dark ? 'Switch to light theme' : 'Switch to dark theme'}>
            <span className="theme-dot"></span>
            <span>{dark ? 'Light mode' : 'Dark mode'}</span>
          </button>
        </nav>
        <button
          className="hamburger"
          type="button"
          aria-expanded={open}
          aria-controls="navMenu"
          aria-label={open ? 'Close menu' : 'Open menu'}
          onClick={() => setOpen(o => !o)}
        >
          <span></span><span></span><span></span>
        </button>
      </div>
    </header>
  )
}
