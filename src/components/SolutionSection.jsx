import { SOLUTIONS } from '../data/site.js'

export default function SolutionSection() {
  return (
    <section className="wrap" id="solution">
      <div className="section-head">
        <div><h2>Complexity is<br />a design brief.</h2></div>
        <p>We start by naming the friction, then turn it into a system people can navigate with confidence.</p>
      </div>
      <div className="problem">
        <p className="big-note">When domains work in isolation, important signals get lost in translation. Interdomain makes the invisible handoffs visible.</p>
        <div className="solution-list">
          {SOLUTIONS.map(s => (
            <div className="solution" key={s.no}>
              <div className="solution-no">{s.no}</div>
              <div>
                <h3>{s.title}</h3>
                <p>{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
