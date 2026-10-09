import { useState, type FormEvent } from 'react';
import { Icon, ServiceIcon } from '../Icons';
import { SITE } from '../../config/site';

export function Hero() {
  return (
    <section className="hero" id="home" aria-label={SITE.name}>
      <div className="hero__banner">
        <img
          src="/img/vp-engineers-banner.webp"
          srcSet="/img/vp-engineers-banner-960.webp 960w, /img/vp-engineers-banner.webp 1672w"
          sizes="100vw"
          width={1672}
          height={941}
          // @ts-expect-error fetchpriority is valid HTML but not yet in React 18 types
          fetchpriority="high"
          decoding="async"
          alt={`${SITE.name} — ${SITE.tagline}. ${SITE.proprietor} in front of buildings under construction. Founded in ${SITE.founded}, ${SITE.experienceYears}+ years of experience, ${SITE.location}.`}
        />
      </div>
      <div className="hero__cta container">
        <div className="hero__cta-copy">
          <h1 className="hero__title">
            Planning to Build Your <span className="hl">Dream Space?</span>
          </h1>
          <ul className="hero__facts" aria-label="Company facts">
            <li>
              <Icon name="cal" />
              Since {SITE.founded}
            </li>
            <li>
              <Icon name="medal" />
              {SITE.experienceYears}+ Years of Experience
            </li>
            <li>
              <Icon name="pin" />
              {SITE.location}
            </li>
          </ul>
        </div>
        <div className="hero__cta-btns">
          <a className="btn btn--dark" href="#contact">
            Talk to {SITE.name} <Icon name="arrow" className="ico ico--arrow" />
          </a>
          <a className="btn btn--wa" href={SITE.whatsapp} target="_blank" rel="noopener noreferrer">
            <Icon name="wa" /> WhatsApp Us
          </a>
        </div>
      </div>
    </section>
  );
}

export function Intro() {
  return (
    <section className="intro section" aria-labelledby="introTitle">
      <div className="container intro__grid">
        <div className="intro__copy reveal">
          <p className="eyebrow">
            <span className="eyebrow__line" />
            {SITE.name}
          </p>
          <h2 id="introTitle" className="h2">
            Engineering Every Step.
            <br />
            <span className="muted-ink">Building Every Dream.</span>
          </h2>
          <p className="lead">Professional civil and structural engineering solutions backed by experience, technical expertise and practical site knowledge.</p>
        </div>
        <div className="stats reveal">
          <div className="stat">
            <Icon name="cal" className="stat__ico" />
            <div className="stat__num">
              <span data-count={SITE.founded} data-from="2000">
                {SITE.founded}
              </span>
            </div>
            <div className="stat__label">Founded</div>
          </div>
          <div className="stat">
            <Icon name="medal" className="stat__ico" />
            <div className="stat__num">
              <span data-count={SITE.experienceYears}>{SITE.experienceYears}</span>
              <span className="plus">+</span>
            </div>
            <div className="stat__label">Years Experience</div>
          </div>
          <div className="stat">
            <Icon name="pin" className="stat__ico" />
            <div className="stat__num stat__num--text">Erode</div>
            <div className="stat__label">Tamil Nadu</div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function About() {
  return (
    <section className="about section" id="about" aria-labelledby="aboutTitle">
      <div className="container about__grid">
        <div className="about__media reveal">
          <svg className="about__blueprint" viewBox="0 0 520 620" aria-hidden="true">
            <defs>
              <pattern id="bpGrid" width="20" height="20" patternUnits="userSpaceOnUse">
                <path d="M20 0H0V20" fill="none" stroke="#e6e9ee" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width="520" height="620" fill="url(#bpGrid)" />
            <g className="bp-lines" fill="none" stroke="#111" strokeWidth="1" strokeLinecap="round">
              <path pathLength={1} d="M30 40V590" />
              <path pathLength={1} d="M490 40V590" />
              <path pathLength={1} d="M20 70H500" />
              <path pathLength={1} d="M20 560H500" />
              <path pathLength={1} d="M60 40v14M460 40v14M60 47H460" stroke="#888" />
              <path pathLength={1} d="M505 120v360M498 120h14M498 480h14" stroke="#888" />
            </g>
            <g className="bp-lines bp-lines--y" fill="none" stroke="#FFD400" strokeWidth="2.5" strokeLinecap="round">
              <path pathLength={1} d="M20 590 L80 590 L80 610" />
              <path pathLength={1} d="M500 30 L440 30 L440 10" />
            </g>
            <text x="260" y="36" textAnchor="middle" className="bp-text">
              STRUCTURAL ENGINEER
            </text>
            <text x="514" y="304" className="bp-text" transform="rotate(90 514 304)" textAnchor="middle">
              M.E. STRUCTURAL
            </text>
          </svg>
          <figure className="about__photo">
            <img src="/img/tamil-selvan.webp" width={448} height={560} loading="lazy" decoding="async" alt={`${SITE.proprietor}, ${SITE.proprietorTitle}, Proprietor of ${SITE.name}`} />
          </figure>
          <div className="about__badge">
            <span className="about__badge-num">{SITE.experienceYears}+</span>
            <span className="about__badge-label">
              Years of
              <br />
              Experience
            </span>
          </div>
        </div>

        <div className="about__copy reveal">
          <p className="eyebrow">
            <span className="eyebrow__line" />
            About the Proprietor
          </p>
          <h2 id="aboutTitle" className="h2">
            {SITE.proprietor}
          </h2>
          <p className="about__role">
            {SITE.proprietorTitle} &nbsp;·&nbsp; Proprietor — {SITE.name}
          </p>
          <p className="body-lg">
            A civil and structural engineer with more than {SITE.experienceYears} years of construction experience. Since founding {SITE.name} in {SITE.founded}, he has
            approached every project the same way: understand the site, design the structure properly, and stay involved on site until the work is done right.
          </p>
          <p className="body-lg" style={{ marginTop: 14 }}>
            His structural engineering training shapes how each building is planned — from foundation design to the final finish — with a steady focus on safety,
            honest estimates and quality workmanship.
          </p>
          <ol className="quals" aria-label="Qualifications">
            {SITE.qualifications.map((q, i) => (
              <li key={q.level} className={`qual${i === SITE.qualifications.length - 1 ? ' qual--top' : ''}`}>
                <span className="qual__dot" />
                <span className="qual__level">{q.level}</span>
                <span className="qual__name">{q.name}</span>
              </li>
            ))}
          </ol>
          <div className="about__meta">
            <div>
              <span className="meta__k">Experience</span>
              <span className="meta__v">{SITE.experienceYears}+ Years</span>
            </div>
            <div>
              <span className="meta__k">Established</span>
              <span className="meta__v">{SITE.founded}</span>
            </div>
            <div>
              <span className="meta__k">Based in</span>
              <span className="meta__v">{SITE.location}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

const SERVICES = [
  { kind: 'residential', title: 'Residential Construction', text: 'Individual homes and villas planned around your family, your plot and your budget — structurally sound and built to last.' },
  { kind: 'commercial', title: 'Commercial Construction', text: 'Shops, offices and commercial buildings engineered for durability, efficient use of space and smooth day-to-day operation.' },
  { kind: 'industrial', title: 'Industrial Construction', text: 'Industrial sheds, warehouses and factory structures designed for heavy loads, wide spans and practical workflows.' },
  { kind: 'structural', title: 'Structural Engineering & Works', text: 'Structural design and execution of foundations, columns, beams and slabs — the part of a building you rely on every day.' },
  { kind: 'renovation', title: 'Repair & Renovation', text: 'Assessment and repair of existing structures, cracks and leaks, and renovation that gives older buildings a new life.' },
  { kind: 'estimation', title: 'Estimation & Billing', text: 'Detailed quantity estimates, cost planning and transparent billing so you know exactly where your money goes.' },
];

export function Services() {
  return (
    <section className="services section" id="services" aria-labelledby="servicesTitle">
      <div className="container">
        <div className="section-head reveal">
          <p className="eyebrow">
            <span className="eyebrow__line" />
            What We Do
          </p>
          <h2 id="servicesTitle" className="h2">
            Our Expertise
          </h2>
          <p className="lead">Engineering-led construction services — planned carefully, executed with precision.</p>
        </div>
        <div className="svc-grid">
          {SERVICES.map((s, i) => (
            <article key={s.kind} className="svc reveal">
              <span className="svc__num">{String(i + 1).padStart(2, '0')}</span>
              <ServiceIcon kind={s.kind} />
              <h3 className="svc__title">{s.title}</h3>
              <p className="svc__text">{s.text}</p>
              <span className="svc__more" aria-hidden="true">
                <Icon name="arrow" />
              </span>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

const WHY = [
  ['12+ Years of Experience', 'More than a decade of design and site work across project types.'],
  ['Qualified Structural Engineer', 'M.E. in Structural Engineering — safety and strength by design.'],
  ['Civil Engineering Background', 'Diploma and B.E. in Civil Engineering behind every decision.'],
  ['Practical Site Experience', 'Engineering that understands how work actually happens on site.'],
  ['End-to-End Support', 'From the first site visit through to finishing and handover.'],
  ['Quality-Focused Approach', 'Materials, workmanship and details checked at every stage.'],
];

export function Why() {
  return (
    <section className="why section" aria-labelledby="whyTitle">
      <div className="container why__grid">
        <div className="why__lead reveal">
          <p className="eyebrow">
            <span className="eyebrow__line" />
            Trust
          </p>
          <h2 id="whyTitle" className="h2">
            Why Choose
            <br />
            {SITE.name}?
          </h2>
          <div className="why__big">
            <span className="why__big-num">
              <span data-count={SITE.experienceYears}>{SITE.experienceYears}</span>+
            </span>
            <span className="why__big-label">
              Years of civil &amp; structural
              <br />
              engineering experience
            </span>
          </div>
        </div>
        <ul className="why__list">
          {WHY.map(([h, p]) => (
            <li key={h} className="why__item reveal">
              <Icon name="check" className="why__ico" />
              <div>
                <h3>{h}</h3>
                <p>{p}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

const PROJECT_TYPES = ['Residential Construction', 'Commercial Construction', 'Industrial Construction', 'Structural Engineering & Works', 'Repair & Renovation', 'Estimation & Billing'];

export function Contact() {
  const [name, setName] = useState('');
  const [type, setType] = useState(PROJECT_TYPES[0]);
  const [msg, setMsg] = useState('');
  const [invalid, setInvalid] = useState(false);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setInvalid(true);
      document.getElementById('enq-name')?.focus();
      return;
    }
    setInvalid(false);
    const text = `Hello ${SITE.name},\n\nName: ${name.trim()}\nProject type: ${type}${msg.trim() ? `\nDetails: ${msg.trim()}` : ''}\n\n(Sent from the ${SITE.name} website)`;
    window.open(`${SITE.whatsapp}?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer');
  };

  return (
    <section className="contact" id="contact" aria-labelledby="contactTitle">
      <div className="container contact__grid">
        <div className="contact__copy reveal">
          <p className="eyebrow eyebrow--dark">
            <span className="eyebrow__line" />
            Contact
          </p>
          <h2 id="contactTitle" className="h2 h2--light">
            Let’s Build Something <span className="hl-y">Great.</span>
          </h2>
          <p className="lead lead--light">
            Have a construction or structural requirement?
            <br />
            Let’s discuss your project.
          </p>
          <div className="contact__btns">
            <a className="btn btn--yellow" href={SITE.whatsapp} target="_blank" rel="noopener noreferrer">
              <Icon name="wa" /> WhatsApp Us
            </a>
            <a className="btn btn--ghost-light" href={`tel:${SITE.phoneE164}`}>
              <Icon name="phone" /> Call Now
            </a>
            <a className="btn btn--ghost-light" href={`mailto:${SITE.email}?subject=${encodeURIComponent(`Project enquiry - ${SITE.name}`)}`}>
              <Icon name="mail" /> Send Email
            </a>
          </div>
        </div>

        <div className="contact__card reveal">
          <div className="contact__person">
            <img src="/img/tamil-selvan.webp" width={448} height={560} loading="lazy" decoding="async" alt="" />
            <div>
              <p className="contact__name">{SITE.proprietor}, M.E.</p>
              <p className="contact__role">Proprietor — {SITE.name}</p>
            </div>
          </div>
          <ul className="contact__list">
            <li>
              <Icon name="pin" />
              {SITE.mapUrl ? (
                <a href={SITE.mapUrl} target="_blank" rel="noopener noreferrer">
                  {SITE.location}, {SITE.country}
                </a>
              ) : (
                <span>
                  {SITE.location}, {SITE.country}
                </span>
              )}
            </li>
            <li>
              <Icon name="phone" />
              <a href={`tel:${SITE.phoneE164}`}>{SITE.phoneDisplay}</a>
            </li>
            <li>
              <Icon name="wa" />
              <a href={SITE.whatsapp} target="_blank" rel="noopener noreferrer">
                WhatsApp {SITE.phoneDisplay}
              </a>
            </li>
            <li>
              <Icon name="mail" />
              <a href={`mailto:${SITE.email}`}>{SITE.email}</a>
            </li>
          </ul>

          <form className="enquiry" onSubmit={submit} noValidate>
            <p className="enquiry__title">Quick enquiry via WhatsApp</p>
            <div className="enquiry__row">
              <label>
                <span>Your name</span>
                <input id="enq-name" value={name} onChange={(e) => setName(e.target.value)} type="text" autoComplete="name" required aria-invalid={invalid || undefined} />
              </label>
              <label>
                <span>Project type</span>
                <select value={type} onChange={(e) => setType(e.target.value)}>
                  {PROJECT_TYPES.map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </select>
              </label>
            </div>
            <label>
              <span>Message</span>
              <textarea rows={3} value={msg} onChange={(e) => setMsg(e.target.value)} placeholder="Plot location, size, requirements…" />
            </label>
            {invalid && (
              <p className="text-sm text-red-600" role="alert">
                Please enter your name.
              </p>
            )}
            <button className="btn btn--yellow btn--block" type="submit">
              <Icon name="wa" /> Send on WhatsApp
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
