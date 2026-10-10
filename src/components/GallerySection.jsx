export default function GallerySection() {
  const tiles = [
    { span: true },
    {},
    {},
    {},
    {},
    {}
  ]

  return (
    <section className="wrap" id="gallery">
      <div className="section-head">
        <div><h2>Gallery</h2></div>
      </div>
      <div className="gallery">
        {tiles.map((t, i) => (
          <div
            className="tile"
            key={i}
            style={{ gridRow: t.span ? 'span 2' : undefined }}
          />
        ))}
      </div>
    </section>
  )
}
