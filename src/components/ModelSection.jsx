import { useState, useEffect, useRef } from 'react'
import PaprRobot3D from './PaprRobot3D.jsx'

export default function ModelSection({ theme = 'light' }) {
  const sectionRef = useRef(null)
  const [scrollProgress, setScrollProgress] = useState(0)

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
          <span className="papr-sub-badge">3-D KINEMATIC SIMULATION</span>
          <h2>Pick & Place Robot (PAPR)</h2>
        </div>
        <p style={{ maxWidth: 520 }}>
          Interactive 3-D mechanical model. Scroll to trace the kinematic pick-and-place sequence, or orbit in 360° to inspect the structural linkages and servo drives.
        </p>
      </div>

      {/* 3D Scrolled Animation Component */}
      <PaprRobot3D theme={theme} externalScrollProgress={scrollProgress} />

      {/* Engineering Specs & Mechanical Breakdown Cards */}
      <div className="papr-specs-grid">
        <div className="papr-spec-card">
          <div className="card-icon">⚙</div>
          <h4>Kinematic Positioning</h4>
          <p>
            The mechanical system of the Pick and Place Robot (PAPR) provides the functionality to identify, grasp, lift, and transfer objects from given acquisition locations to assigned sorting points.
          </p>
          <div className="spec-pill">Degrees of Freedom: 4-DOF + 1 Gripper</div>
        </div>

        <div className="papr-spec-card">
          <div className="card-icon">⚡</div>
          <h4>Dual-Motor Actuation</h4>
          <p>
            The mechanism utilizes <strong>MG996R</strong> high-torque metal-gear servos (up to 11 kg·cm) for base rotation, shoulder pitch, and elbow linkage, and <strong>MG90S</strong> micro-servos for wrist orientation and gripper drive.
          </p>
          <div className="spec-pill">Torque: MG90S & MG996R Servos</div>
        </div>

        <div className="papr-spec-card">
          <div className="card-icon">🗜</div>
          <h4>Claw-Type Gripper Mechanism</h4>
          <p>
            Engineered with parallel articulated linkages and high-friction contact jaws, providing compliant grasping across diverse geometric workpiece shapes and weights.
          </p>
          <div className="spec-pill">Mechanism: Parallel Linkage Claw</div>
        </div>

        <div className="papr-spec-card">
          <div className="card-icon">🏗</div>
          <h4>Rigid Base & Linkages</h4>
          <p>
            Features a dual-tier structural aluminum base providing rock-solid stability, precision motor bracket mounts, and rigid extruded arm channel sections minimizing flex under dynamic loads.
          </p>
          <div className="spec-pill">Structure: Anodized Alloy & Steel</div>
        </div>
      </div>
    </section>
  )
}
