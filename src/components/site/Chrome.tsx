import { useEffect, useState } from 'react';
import { Icon } from '../Icons';
import { SITE } from '../../config/site';

const LINKS = [
  { href: '#home', label: 'Home' },
  { href: '#about', label: 'About' },
  { href: '#services', label: 'Services' },
  { href: '#projects', label: 'Our Projects' },
  { href: '#contact', label: 'Contact' },
];

export function Brand({ footer = false }: { footer?: boolean }) {
  return (
    <a href="#home" className={`brand${footer ? ' brand--footer' : ''}`} aria-label={`${SITE.name} — home`}>
      <picture>
        <source srcSet="/img/vp-logo-96.webp" type="image/webp" />
        <img src="/img/vp-logo-96.png" width={105} height={96} alt={`${SITE.name} logo`} className="brand__logo" />
      </picture>
      <span className="brand__text">
        <span className="brand__name">{SITE.name}</span>
        <span className="brand__tag">{SITE.tagline}</span>
      </span>
    </a>
  );
}

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);

  useEffect(() => {
    let ticking = false;
    const update = () => {
      ticking = false;
      setScrolled(window.scrollY > 24);
      const mid = window.innerHeight * 0.35;
      let current = 0;
      LINKS.forEach((l, i) => {
        const el = document.querySelector(l.href);
        if (el && el.getBoundingClientRect().top <= mid) current = i;
      });
      setActive(current);
    };
    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    document.body.classList.toggle('menu-open', open);
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    const onResize = () => window.innerWidth > 1080 && setOpen(false);
    window.addEventListener('keydown', onKey);
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('resize', onResize);
    };
  }, [open]);

  return (
    <header className={`nav${scrolled ? ' is-scrolled' : ''}`}>
      <div className="nav__inner container">
        <Brand />
        <nav className="nav__links" id="navLinks" aria-label="Primary" onClick={(e) => (e.target as HTMLElement).closest('a') && setOpen(false)}>
          {LINKS.map((l, i) => (
            <a key={l.href} href={l.href} data-nav className={i === active ? 'is-active' : undefined} aria-current={i === active ? 'true' : undefined}>
              {l.label}
            </a>
          ))}
          <a className="btn btn--wa nav__wa-mobile" href={SITE.whatsapp} target="_blank" rel="noopener noreferrer">
            <Icon name="wa" /> WhatsApp Enquiry
          </a>
        </nav>
        <div className="nav__actions">
          <a className="nav__phone" href={`tel:${SITE.phoneE164}`}>
            <Icon name="phone" />
            <span>{SITE.phoneDisplay}</span>
          </a>
          <a className="btn btn--wa btn--sm" href={SITE.whatsapp} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp enquiry">
            <Icon name="wa" />
            <span>WhatsApp Enquiry</span>
          </a>
          <button
            className="nav__toggle"
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
            aria-controls="navLinks"
            onClick={() => setOpen((o) => !o)}
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </div>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="footer">
      <div className="container footer__grid">
        <div className="footer__brand">
          <Brand footer />
          <p className="footer__meta">
            Founded {SITE.founded} · {SITE.experienceYears}+ Years Experience
            <br />
            {SITE.location}, {SITE.country}
          </p>
        </div>
        <nav className="footer__links" aria-label="Footer">
          <p className="footer__h">Quick Links</p>
          {LINKS.map((l) => (
            <a key={l.href} href={l.href}>
              {l.label}
            </a>
          ))}
        </nav>
        <div className="footer__contact">
          <p className="footer__h">Get in Touch</p>
          <a href={`tel:${SITE.phoneE164}`}>
            <Icon name="phone" />
            {SITE.phoneDisplay}
          </a>
          <a href={SITE.whatsapp} target="_blank" rel="noopener noreferrer">
            <Icon name="wa" />
            WhatsApp
          </a>
          <a href={`mailto:${SITE.email}`}>
            <Icon name="mail" />
            {SITE.email}
          </a>
        </div>
      </div>
      <div className="container footer__bottom">
        <p>
          © {new Date().getFullYear()} {SITE.name}. All Rights Reserved.
        </p>
        <p className="credit">
          Developed by{' '}
          <a href={SITE.developer.url} target="_blank" rel="noopener noreferrer">
            {SITE.developer.name}
          </a>
        </p>
      </div>
    </footer>
  );
}

export function FloatingWhatsApp() {
  return (
    <a className="fab-wa" href={SITE.whatsapp} target="_blank" rel="noopener noreferrer" aria-label={`Chat with ${SITE.name} on WhatsApp`}>
      <Icon name="wa" />
      <span>Chat with us</span>
    </a>
  );
}
