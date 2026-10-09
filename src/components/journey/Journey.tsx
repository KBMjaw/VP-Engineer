import { useEffect, useMemo, useRef, useState } from 'react';
import { buildScene, INTERIOR_FROM, STAGE_COUNT } from './scene.js';
import { Icon } from '../Icons';
import { SITE } from '../../config/site';

interface Stage {
  label: string;
  num: string;
  title: string;
  text?: string;
  points?: string[];
  steps?: { label: string; s: number; t: number }[];
  tamil?: string;
}

const STAGES: Stage[] = [
  { label: 'Plot', num: 'Empty Plot & Site Assessment', title: 'Every great building begins with an idea.', text: 'We start on your plot — walking the site, studying the surroundings and understanding what you want to build.', points: ['Site Visit', 'Soil & Access Check', 'Consultation'] },
  { label: 'Planning', num: 'Planning & Drawings', title: 'From idea to blueprint.', text: 'Plans, sections and structural drawings are prepared so that every engineering decision is made on paper first.', points: ['Architectural Plan', 'Structural Design', 'Estimation'] },
  { label: 'Survey', num: 'Surveying & Ground Marking', title: 'Precision begins from the ground.', text: 'The site is surveyed and the drawing is transferred to the ground — centre lines, grid and footing positions marked and checked.', points: ['Survey', 'Centre Lines', 'Lime Marking'] },
  { label: 'Excavation', num: 'Excavation & Earthwork', title: 'Strong structures start below the ground.', text: 'Foundation pits are excavated to the designed depth, with machinery and workers following safe site practice.', points: ['Excavation', 'Foundation Pits', 'Site Safety'], tamil: 'குழி வெட்டுதல்' },
  { label: 'Foundation', num: 'Foundation', title: 'Strength starts from within.', text: 'Layer by layer, the foundation is built to carry everything that will stand above it.', steps: [{ label: 'PCC', s: 4, t: 0 }, { label: 'Reinforcement', s: 4, t: 0.2 }, { label: 'Footing', s: 4, t: 0.4 }, { label: 'Concrete', s: 4, t: 0.6 }, { label: 'Plinth Beam', s: 4, t: 0.85 }] },
  { label: 'Frame', num: 'Columns, Beams & Framework', title: 'Watch the structure take shape.', text: 'Reinforced concrete columns rise and beams tie them together into a rigid structural frame.', steps: [{ label: 'Columns', s: 5, t: 0 }, { label: 'Beams & Slab', s: 5, t: 0.3 }, { label: 'Upper Columns', s: 5, t: 0.55 }] },
  { label: 'Brickwork', num: 'Brickwork & Walls', title: 'Walls that define every space.', text: 'Brick and block walls fill the frame, with lintels over every door and window opening.', points: ['Brick Masonry', 'Lintels', 'Openings'] },
  { label: 'Roof', num: 'Slab & Roofing', title: 'Every level built with precision.', text: 'Slab reinforcement is laid and checked before the concrete pour completes the roof.', points: ['Slab Reinforcement', 'Concrete Pour', 'Parapet'] },
  { label: 'Services', num: 'Electrical & Plumbing', title: 'Designed for comfort. Built for everyday life.', text: 'Conduits, switch points and water lines are planned and laid before the walls are finished.', points: ['Electrical Conduits', 'Switch Boxes', 'Water Lines', 'Drainage'] },
  { label: 'Plaster', num: 'Plastering & Flooring', title: 'Details make the difference.', text: 'Walls are plastered smooth and floors are tiled — the building starts to look finished.', points: ['Plastering', 'Putty', 'Floor Tiles'] },
  { label: 'Interiors', num: 'Painting, Kitchen & Interiors', title: 'A house begins to feel like home.', text: 'Painting, a modular kitchen, wardrobes, furniture, lighting and curtains bring the inside to life.', points: ['Painting', 'Modular Kitchen', 'Wardrobe', 'Lighting'] },
  { label: 'Home', num: 'Completed Home', title: 'Your vision. Our engineering. One beautiful result.', points: ['Elevation', 'Landscaping', 'Compound Wall', 'Exterior Lighting'] },
  { label: 'Keys', num: 'Key Handover & Housewarming', title: 'From an empty plot to a lifetime of memories.' },
];

export function Journey() {
  const trackRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<SVGSVGElement>(null);
  const fillRef = useRef<HTMLSpanElement>(null);
  const [stage, setStage] = useState(0);
  const sceneMarkup = useMemo(() => buildScene(), []);
  const reduceMotion = useMemo(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches, []);

  useEffect(() => {
    const track = trackRef.current;
    const svg = sceneRef.current;
    if (!track || !svg) return;
    svg.innerHTML = sceneMarkup;

    // Phones: crop the drawing to the building so it reads larger.
    const mq = window.matchMedia('(max-width: 700px)');
    const fit = () => svg.setAttribute('viewBox', mq.matches ? '130 10 740 630' : '0 0 1000 640');
    fit();
    mq.addEventListener('change', fit);

    const layers = Array.from(track.querySelectorAll<HTMLElement | SVGElement>('[data-s]')).map((el) => {
      const u = el.getAttribute('data-u');
      return { el, at: parseFloat(el.getAttribute('data-s')!) + parseFloat(el.getAttribute('data-t') || '0'), u: u === null ? Infinity : parseFloat(u), on: false };
    });
    const ext = svg.querySelector('#sceneExt');

    let last = -1;
    let ticking = false;
    const update = () => {
      ticking = false;
      const r = track.getBoundingClientRect();
      const len = Math.max(1, track.offsetHeight - window.innerHeight);
      const k = Math.min(1, Math.max(0, -r.top / len));
      const p = Math.min(STAGE_COUNT - 0.001, k * STAGE_COUNT);
      for (const L of layers) {
        const on = p >= L.at && p < L.u;
        if (on !== L.on) {
          L.on = on;
          L.el.classList.toggle('on', on);
        }
      }
      ext?.classList.toggle('is-hidden', p >= INTERIOR_FROM && p < 11);
      if (fillRef.current) fillRef.current.style.transform = `scaleX(${k})`;
      const s = Math.floor(p);
      if (s !== last) {
        last = s;
        setStage(s);
      }
    };
    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      mq.removeEventListener('change', fit);
    };
  }, [sceneMarkup]);

  const goTo = (i: number) => {
    const track = trackRef.current;
    if (!track) return;
    const top = track.getBoundingClientRect().top + window.scrollY;
    const len = track.offsetHeight - window.innerHeight;
    window.scrollTo({ top: top + len * ((i + 0.62) / STAGE_COUNT), behavior: reduceMotion ? 'auto' : 'smooth' });
  };

  const num = String(stage + 1).padStart(2, '0');

  return (
    <section className="journey" id="process" aria-labelledby="journeyTitle">
      <div className="journey__intro container">
        <p className="eyebrow eyebrow--center">
          <span className="eyebrow__line" />
          Our Process
          <span className="eyebrow__line" />
        </p>
        <h2 id="journeyTitle" className="h2 h2--xl">
          From Ground to Home
        </h2>
        <p className="lead lead--center">
          Every structure has a story.
          <br />
          Here’s how we build yours.
        </p>
        <p className="journey__hint" aria-hidden="true">
          <span className="mouse" />
          Scroll to build
        </p>
      </div>

      <div className="journey__track" ref={trackRef} style={{ ['--stages' as string]: STAGE_COUNT }}>
        <div className="journey__sticky">
          <div className="journey__rail">
            <div className="rail__bar">
              <span className="rail__fill" ref={fillRef} />
            </div>
            <ol className="rail__steps">
              {STAGES.map((s, i) => (
                <li key={s.label} className={i < stage ? 'is-done' : i === stage ? 'is-current' : undefined}>
                  <button type="button" onClick={() => goTo(i)} aria-label={`Go to stage ${i + 1}: ${s.num}`}>
                    <span className="rail__dot" />
                    <span className="rail__label">{s.label}</span>
                  </button>
                </li>
              ))}
            </ol>
            <div className="rail__mobile" aria-live="polite">
              <span>{num}</span>/{STAGE_COUNT} · <span>{STAGES[stage].label}</span>
            </div>
          </div>

          <div className="journey__stage">
            <div className="journey__copy">
              {STAGES.map((s, i) => (
                <article key={s.label} className={`jcopy${i === stage ? ' is-active' : ''}${i === STAGES.length - 1 ? ' jcopy--final' : ''}`} aria-hidden={i !== stage}>
                  <p className="jcopy__num">
                    Stage {String(i + 1).padStart(2, '0')} — {s.num}
                    {s.tamil && (
                      <span className="ta" lang="ta">
                        {s.tamil}
                      </span>
                    )}
                  </p>
                  <h3 className="jcopy__title">{s.title}</h3>
                  {s.text && <p className="jcopy__text">{s.text}</p>}
                  {s.points && (
                    <ul className="jcopy__pts">
                      {s.points.map((p) => (
                        <li key={p} className={/water|drain/i.test(p) ? 'pt-water' : undefined}>
                          {p}
                        </li>
                      ))}
                    </ul>
                  )}
                  {s.steps && (
                    <ol className="jsteps">
                      {s.steps.map((st) => (
                        <li key={st.label} className="jx" data-s={st.s} data-t={st.t}>
                          {st.label}
                        </li>
                      ))}
                    </ol>
                  )}
                  {i === STAGES.length - 1 && (
                    <>
                      <p className="jcopy__final">
                        Your Dream. <span className="hl">Our Engineering.</span>
                      </p>
                      <p className="jcopy__sign">
                        <strong>{SITE.name}</strong>
                        <span>{SITE.proprietor}, M.E.</span>
                      </p>
                      <a className="btn btn--dark" href="#contact" tabIndex={i === stage ? 0 : -1}>
                        Start Your Journey <Icon name="arrow" className="ico ico--arrow" />
                      </a>
                    </>
                  )}
                </article>
              ))}
            </div>

            <div className="journey__sheet">
              <div className="sheet__frame">
                <svg
                  ref={sceneRef}
                  className="scene"
                  viewBox="0 0 1000 640"
                  preserveAspectRatio="xMidYMid meet"
                  role="img"
                  aria-label={`Illustration of a house being built, stage ${stage + 1} of ${STAGE_COUNT}: ${STAGES[stage].num}`}
                />
              </div>
              <div className="sheet__titleblock" aria-hidden="true">
                <span>
                  <b>{SITE.name.toUpperCase()}</b>
                </span>
                <span>
                  DRG <b>{num}</b>/{STAGE_COUNT}
                </span>
                <span>
                  STAGE <b>{STAGES[stage].label.toUpperCase()}</b>
                </span>
                <span className="tb-hide-sm">
                  SCALE <b>NTS</b>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
