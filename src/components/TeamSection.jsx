import { useState } from 'react'
import { TEAM_MEMBERS } from '../data/site.js'

function MemberCard({ member, active, onActivate }) {
  const { memberNumber, name, domain, instagram, linkedin, image, objectPosition, zoom, originY } = member

  // Optional per-member photo framing tweaks: objectPosition, and a subtle zoom (originY = point held steady)
  const imgStyle = {
    ...(objectPosition ? { objectPosition } : {}),
    ...(zoom ? { transform: `scale(${zoom})`, transformOrigin: `center ${originY ?? 50}%` } : {})
  }

  const frontMedia = image ? (
    <>
      <img className="member-img" src={image} alt={name} style={imgStyle} />
      <div className="member-overlay"><h3>{name}</h3><p>{domain}</p></div>
    </>
  ) : (
    <div className="member-overlay"><h3>{name}</h3><p>{domain}</p></div>
  )

  return (
    <article
      className={`flip-card${active ? ' flipped' : ''}`}
      tabIndex={0}
      data-member={memberNumber}
      aria-label={`${name} — activate to flip`}
      onClick={e => {
        if (e.target.closest('.social-btn')) return
        // Single-open state for touch/keyboard; desktop hover flip is CSS-only and unaffected.
        if (!window.matchMedia('(hover: hover)').matches) onActivate(memberNumber)
      }}
      onKeyDown={e => {
        if ((e.key === 'Enter' || e.key === ' ') && !e.target.closest('.social-btn')) { e.preventDefault(); onActivate(memberNumber) }
      }}
    >
      <div className="flip-inner">
        <div className={`flip-face flip-front${image ? '' : ' fallback'}`}>{frontMedia}</div>
        <div className="flip-face flip-back">
          <div className="socials">
            {instagram && <a className="social-btn" href={instagram} target="_blank" rel="noopener" aria-label={`${name} on Instagram`}>Instagram ↗</a>}
            {linkedin && <a className="social-btn alt" href={linkedin} target="_blank" rel="noopener" aria-label={`${name} on LinkedIn`}>LinkedIn ↗</a>}
          </div>
        </div>
      </div>
    </article>
  )
}

export default function TeamSection() {
  const [activeMember, setActiveMember] = useState(null)
  const toggle = n => setActiveMember(cur => (cur === n ? null : n))

  return (
    <section className="wrap" id="team">
      <div className="section-head">
        <div><h2>The people<br />behind the map.</h2></div>
        <p>A small, cross-functional team with a shared belief: better connections make better outcomes.</p>
      </div>
      <div className="team-grid" id="teamGrid">
        {TEAM_MEMBERS.map(m => (
          <MemberCard key={m.memberNumber} member={m} active={activeMember === m.memberNumber} onActivate={toggle} />
        ))}
      </div>
    </section>
  )
}
