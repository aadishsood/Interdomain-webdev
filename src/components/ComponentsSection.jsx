import { COMPONENTS } from '../data/site.js'

export default function ComponentsSection() {
  return (
    <section className="wrap" id="components">
      <div className="section-head">
        <div>
          <h2>System Components</h2>
        </div>
      </div>

      <div className="components-grid">
        {COMPONENTS.map(c => (
          <article className="component-card" key={c.id}>
            <div className="component-img-box">
              <img
                src={c.image}
                alt={`${c.title} — ${c.spec}`}
                className="component-img"
                loading="lazy"
              />
            </div>
            <div className="component-content">
              <span className="component-category">{c.category}</span>
              <h3 className="component-title">{c.title}</h3>
              <div className="component-spec-pill">{c.spec}</div>
              <p className="component-desc">{c.desc}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
