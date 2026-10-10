import { COMPONENTS } from '../data/site.js'

export default function ComponentsSection() {
  return (
    <section className="wrap" id="components">
      <div className="section-head">
        <div><h2>Inside the<br />system.</h2></div>
        <p>Every module of PAPR, from seeing to gripping, works as one connected pipeline.</p>
      </div>
      <div className="components-grid">
        {COMPONENTS.map(c => (
          <article className="person" key={c.no}>
            <div className="avatar">{c.no}</div>
            <div>
              <h3>{c.title}</h3>
              <p>{c.desc}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
