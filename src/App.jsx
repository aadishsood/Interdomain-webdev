import { useEffect, useState } from 'react'
import Header from './components/Header.jsx'
import MoltenBackground from './components/MoltenBackground.jsx'
import Hero from './components/Hero.jsx'
import ModelSection from './components/ModelSection.jsx'
import ComponentsSection from './components/ComponentsSection.jsx'
import SolutionSection from './components/SolutionSection.jsx'
import TeamSection from './components/TeamSection.jsx'
import GallerySection from './components/GallerySection.jsx'
import Footer from './components/Footer.jsx'

export default function App() {
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('interdomain-theme')
    return saved === 'dark' || saved === 'light' ? saved : null
  })

  useEffect(() => {
    if (theme) document.documentElement.dataset.theme = theme
  }, [theme])

  const toggleTheme = () => {
    const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'
    document.documentElement.dataset.theme = next
    localStorage.setItem('interdomain-theme', next)
    setTheme(next)
  }

  return (
    <>
      <MoltenBackground theme={theme} />
      <Header theme={theme} onToggleTheme={toggleTheme} />
      <main>
        <Hero />
        <ModelSection theme={theme} />
        <ComponentsSection />
        <SolutionSection />
        <TeamSection />
        <GallerySection />
      </main>
      <Footer />
    </>
  )
}
