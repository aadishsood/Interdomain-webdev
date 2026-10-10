import { useState } from 'react'
import { TEAM_MEMBERS } from '../data/site.js'

const InstagramIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
  </svg>
)

const LinkedInIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M20.45 20.45h-3.55v-5.57c0-1.33-.03-3.04-1.85-3.04-1.86 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12zM7.12 20.45H3.56V9h3.56v11.45z" />
  </svg>
)

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
            {instagram && <a className="social-btn icon" href={instagram} target="_blank" rel="noopener" aria-label={`${name} on Instagram`} title="Instagram"><InstagramIcon /></a>}
            {linkedin && <a className="social-btn icon alt" href={linkedin} target="_blank" rel="noopener" aria-label={`${name} on LinkedIn`} title="LinkedIn"><LinkedInIcon /></a>}
          </div>
        </div>
      </div>
    </article>
  )
}

export default function TeamSection() {
  const [activeMember, setActiveMember] = useState(null)
  const toggle = n => setActiveMember(cur => (cur === n ? null : n))

  // Only show members with actual names (filter out placeholders)
  const realMembers = TEAM_MEMBERS.filter(m => !m.name.startsWith('Team Member'))

  return (
    <section className="wrap" id="team">
      <div className="section-head">
        <div><h2>The team<br />behind PAPR.</h2></div>
      </div>
      <div className="team-grid" id="teamGrid">
        {realMembers.map(m => (
          <MemberCard key={m.memberNumber} member={m} active={activeMember === m.memberNumber} onActivate={toggle} />
        ))}
      </div>
    </section>
  )
}
