import { SOLUTIONS } from '../data/site.js'

export default function SolutionSection() {
  return (
    <section className="wrap" id="solution">
      <div className="section-head">
        <div>
          <h2>Autonomous Sorting System</h2>
        </div>
      </div>

      <div className="problem">
        <div>
          <p className="big-note">
            Automating material handling requires closing the loop between sensory input and physical actuation. PAPRDOM integrates computer vision with analytical kinematics to achieve autonomous object sorting.
          </p>

          <div className="software-flow-card">
            <span className="diag-caption">Fig 16. Representation of How the Code Works in PAPR</span>
            <img
              src="/assets/components/software_workflow.jpg"
              alt="PAPR Software Division Workflow from Technical Documentation"
              className="software-flow-img"
            />
          </div>
        </div>

        <div className="solution-list">
          {SOLUTIONS.map((s, idx) => (
            <div className="solution-card" key={s.title}>
              <h3>{s.title}</h3>
              <p>{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
