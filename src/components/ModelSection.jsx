import { useState, useEffect, useRef } from 'react'
import PaprRobot3D from './PaprRobot3D.jsx'

export default function ModelSection({ theme = 'light' }) {
  const sectionRef = useRef(null)
  const [scrollProgress, setScrollProgress] = useState(0)
  const [showEquations, setShowEquations] = useState(false)

  // Scroll-linked animation driver
  useEffect(() => {
    const handleScroll = () => {
      if (!sectionRef.current) return
      const rect = sectionRef.current.getBoundingClientRect()
      const windowHeight = window.innerHeight

      const start = windowHeight * 0.75
      const end = -rect.height * 0.35
      const distance = start - end
      const current = start - rect.top
      const p = Math.max(0, Math.min(1, current / distance))
      setScrollProgress(p)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <section className="wrap" id="model" ref={sectionRef}>
      <div className="section-head">
        <div>
          <h2>3-D Robotic Arm Model</h2>
        </div>
      </div>

      {/* 3D Simulation Component */}
      <PaprRobot3D theme={theme} externalScrollProgress={scrollProgress} />

      {/* Verified Mechanical Specifications Grid */}
      <div className="papr-specs-grid">
        <div className="papr-spec-card">
          <div className="card-icon">⚙</div>
          <h4>Actuator Assignments</h4>
          <p>
            Documented schematic connections: <strong>RKI 1 (BASE)</strong> for yaw rotation, <strong>RKI 2 (SHOULDER)</strong> for pitch, <strong>RKI 3 (ELBOW)</strong> for arm reach, and <strong>RKI 4 (WRIST)</strong> for orientation.
          </p>
          <div className="spec-pill">Actuation: MG996R & MG90S</div>
        </div>

        <div className="papr-spec-card">
          <div className="card-icon">📐</div>
          <h4>Fabrication Materials</h4>
          <p>
            Constructed with <strong>26 mm × 26 mm aluminium channels</strong> for the arm links, <strong>2 mm & 4 mm metal sheets</strong> for brackets, and <strong>two wooden plates (300 mm × 300 mm × 10 mm)</strong> as the base.
          </p>
          <div className="spec-pill">Base: 300 mm × 300 mm × 10 mm (2 pcs)</div>
        </div>

        <div className="papr-spec-card">
          <div className="card-icon">🗜</div>
          <h4>Gripping Mechanism</h4>
          <p>
            Features a claw-type pincer mechanism driven by an MG90S servo motor. Symmetrical linkages and high-friction contact pads provide secure grip of objects for sorting.
          </p>
          <div className="spec-pill">Gripper: Pincer Claw Linkage</div>
        </div>

        <div className="papr-spec-card">
          <div className="card-icon">⚡</div>
          <h4>Power & Control</h4>
          <p>
            Powered by a <strong>3S battery pack</strong> with <strong>LM2596 buck converters</strong>, <strong>10 A fuse</strong>, emergency cutoff switch, and controlled by an <strong>ESP32 DevKit V1</strong>.
          </p>
          <div className="spec-pill">Controller: ESP32 DevKit V1</div>
        </div>
      </div>

      {/* Kinematic Calculations Accordion / Technical Panel */}
      <div className="papr-math-panel">
        <div className="papr-math-header" onClick={() => setShowEquations(!showEquations)} role="button" tabIndex={0}>
          <div>
            <h4>Kinematic Calculations & Equations</h4>
            <span className="papr-math-sub">Documented 3-link planar manipulator equations (Section 4.4 of technical documentation)</span>
          </div>
          <button type="button" className="papr-toggle-btn">
            {showEquations ? 'Collapse Equations ▲' : 'View Kinematic Equations ▼'}
          </button>
        </div>

        {showEquations && (
          <div className="papr-math-content">
            <div className="papr-math-diagrams">
              <div className="math-diag-card">
                <span className="diag-caption">Fig 15. Representation of Angles</span>
                <img src="/assets/components/kinematic_angles.jpg" alt="PAPR Representation of Angles from PDF" className="math-img" />
              </div>
              <div className="math-diag-card">
                <span className="diag-caption">Fig 2. Reachable Workspace</span>
                <img src="/assets/components/workspace_reach.jpg" alt="PAPR Reachable Workspace from PDF" className="math-img" />
              </div>
            </div>

            <div className="papr-equation-columns">
              {/* Forward Kinematics */}
              <div className="papr-eq-box">
                <h5>Forward Kinematics</h5>
                <p>Relates joint angles (θ₁, θ₂, θ₃) to end-effector position (x₃, y₃) and orientation (φ):</p>
                <div className="math-block">
                  <div className="math-row">x₃ = l₁·cos(θ₁) + l₂·cos(θ₁ + θ₂) + l₃·cos(φ)</div>
                  <div className="math-row">y₃ = l₁·sin(θ₁) + l₂·sin(θ₁ + θ₂) + l₃·sin(φ)</div>
                  <div className="math-row">φ = θ₁ + θ₂ + θ₃</div>
                </div>
                <span className="math-note">Where l₁, l₂, l₃ are link lengths (mm), and (x₃, y₃) is end-effector position.</span>
              </div>

              {/* Inverse Kinematics */}
              <div className="papr-eq-box">
                <h5>Inverse Kinematics</h5>
                <p>Calculates required joint angles from target position (x₃, y₃) and desired orientation φ:</p>
                <div className="math-block">
                  <div className="math-row">x₂ = x₃ − l₃·cos(φ)</div>
                  <div className="math-row">y₂ = y₃ − l₃·sin(φ)</div>
                  <div className="math-row">cos(θ₂) = (x₂² + y₂² − l₁² − l₂²) / (2·l₁·l₂)</div>
                  <div className="math-row">θ₂ = cos⁻¹(cos(θ₂)), &nbsp; with −1 ≤ cos(θ₂) ≤ 1</div>
                  <div className="math-row">θ₁ = tan⁻¹(y₂ / x₂) − tan⁻¹((l₂·sin(θ₂)) / (l₁ + l₂·cos(θ₂)))</div>
                  <div className="math-row">θ₃ = φ − (θ₁ + θ₂)</div>
                </div>
                <span className="math-note">Determines unique joint solution within robot reachable envelope.</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
