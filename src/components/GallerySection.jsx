import { GALLERY_TILES } from '../data/site.js'

export default function GallerySection() {
  return (
    <section className="wrap" id="gallery">
      <div className="section-head">
        <div><h2>Fragments of<br />the process.</h2></div>
        <p>Field notes, visual experiments, and the in-between moments that shaped the final system.</p>
      </div>
      <div className="gallery">
        {GALLERY_TILES.map(t => (
          <div className="tile" key={t}><span>{t}</span></div>
        ))}
      </div>
    </section>
  )
}
