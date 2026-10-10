export default function ModelSection() {
  return (
    <section className="wrap" id="model">
      <div className="section-head"><p style={{ maxWidth: 460 }}>Rotate your perspective. The core is the same, but every domain reveals a different edge of the story.</p></div>
      <div className="model-shell">
        <div className="model-card">
          <div className="wire"></div>
          <div className="wire"></div>
          <div className="wire"></div>
          <div className="model-core"></div>
        </div>
        <div className="model-copy">
          <h3>The PAPRDOM core</h3>
          <p>A conceptual 3-D model of the relationships our project maps: shared context at the centre, with distinct disciplines orbiting around it.</p>
          <div className="stat"><span>Dimensions</span><b>3 × 3 × 3</b></div>
          <div className="stat"><span>Connected nodes</span><b>08 active</b></div>
          <div className="stat"><span>View mode</span><b>Exploratory</b></div>
          <a className="button" href="#gallery" style={{ marginTop: 22 }}>See visual studies <span>↘</span></a>
        </div>
      </div>
    </section>
  )
}
