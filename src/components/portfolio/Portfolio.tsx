import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Icon, ServiceIcon } from '../Icons';
import { CATEGORIES, SITE, categoryLabel, type CategoryKey } from '../../config/site';
import { coverOf, errorMessage, fetchPublishedProjects } from '../../lib/projects';
import { supabaseConfigured } from '../../lib/supabase';
import type { Project } from '../../lib/types';
import { ProjectDetail } from './ProjectDetail';
import { useReveal } from '../../hooks/useReveal';

type LoadState = 'loading' | 'ready' | 'error';

export function Portfolio() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [state, setState] = useState<LoadState>('loading');
  const [err, setErr] = useState('');
  const [filter, setFilter] = useState<CategoryKey | 'all'>('all');
  const [params, setParams] = useSearchParams();
  const openId = params.get('project');

  const load = useCallback(async (quiet = false) => {
    if (!supabaseConfigured) {
      setState('ready');
      return;
    }
    if (!quiet) setState('loading');
    try {
      setProjects(await fetchPublishedProjects());
      setState('ready');
    } catch (e) {
      setErr(errorMessage(e));
      if (!quiet) setState('error');
    }
  }, []);

  useEffect(() => {
    load();
    // Refresh when the visitor returns to the tab, so newly published work shows up.
    const onVisible = () => document.visibilityState === 'visible' && load(true);
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [load]);

  useReveal([projects, state, filter]);

  const visible = filter === 'all' ? projects : projects.filter((p) => p.category === filter);
  const counts = Object.fromEntries(CATEGORIES.map((c) => [c.key, projects.filter((p) => p.category === c.key).length]));

  const open = (id: string) => setParams((p) => (p.set('project', id), p), { replace: false });
  const close = () => setParams((p) => (p.delete('project'), p), { replace: false });

  return (
    <section className="projects section" id="projects" aria-labelledby="projectsTitle">
      <div className="container">
        <div className="section-head section-head--row reveal">
          <div>
            <p className="eyebrow">
              <span className="eyebrow__line" />
              Portfolio
            </p>
            <h2 id="projectsTitle" className="h2">
              Our Projects
            </h2>
          </div>
          {state === 'ready' && projects.length > 0 && (
            <div className="filters" role="tablist" aria-label="Filter projects by category">
              <button role="tab" aria-selected={filter === 'all'} className={`filter${filter === 'all' ? ' is-active' : ''}`} onClick={() => setFilter('all')}>
                All <span className="filter__count">{projects.length}</span>
              </button>
              {CATEGORIES.map((c) => (
                <button key={c.key} role="tab" aria-selected={filter === c.key} className={`filter${filter === c.key ? ' is-active' : ''}`} onClick={() => setFilter(c.key)} disabled={!counts[c.key]}>
                  {c.label} <span className="filter__count">{counts[c.key]}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {state === 'loading' && (
          <div className="proj-grid" aria-busy="true" aria-label="Loading projects">
            {[0, 1, 2].map((i) => (
              <div key={i} className="proj proj--skeleton" />
            ))}
          </div>
        )}

        {state === 'error' && (
          <div className="proj-state" role="alert">
            <p className="proj-state__title">We couldn’t load our projects right now.</p>
            <p className="proj-state__text">{err || 'Please check your connection.'}</p>
            <button className="btn btn--dark" onClick={() => load()}>
              <Icon name="retry" /> Try again
            </button>
          </div>
        )}

        {state === 'ready' && projects.length === 0 && (
          <div className="proj-state reveal">
            <div className="proj-state__icons" aria-hidden="true">
              {CATEGORIES.map((c) => (
                <ServiceIcon key={c.key} kind={c.key} className="svc__ico" />
              ))}
            </div>
            <p className="proj-state__title">Our project gallery is being updated.</p>
            <p className="proj-state__text">
              Photos of our residential, commercial, industrial, structural and renovation work will appear here soon. To discuss our completed work, please{' '}
              <a href="#contact">get in touch</a>.
            </p>
            <a className="btn btn--wa" href={SITE.whatsapp} target="_blank" rel="noopener noreferrer">
              <Icon name="wa" /> Ask on WhatsApp
            </a>
          </div>
        )}

        {state === 'ready' && visible.length > 0 && (
          <div className="proj-grid">
            {visible.map((p) => {
              const cover = coverOf(p);
              return (
                <article key={p.id} className="proj reveal">
                  <button className="proj__hit" onClick={() => open(p.id)} aria-label={`View project: ${p.title}`}>
                    <figure className="proj__media">
                      {cover?.url ? (
                        <img src={cover.url} alt="" loading="lazy" decoding="async" />
                      ) : (
                        <span className="proj__media--bp">
                          <ServiceIcon kind={p.category} className="svc__ico" />
                        </span>
                      )}
                    </figure>
                    <div className="proj__overlay">
                      <span className="proj__cat">{categoryLabel(p.category)}</span>
                      <h3 className="proj__title">{p.title}</h3>
                      {p.location && (
                        <p className="proj__meta">
                          <Icon name="pin" /> {p.location}
                        </p>
                      )}
                    </div>
                    <span className="proj__view" aria-hidden="true">
                      View project <Icon name="arrow" />
                    </span>
                  </button>
                </article>
              );
            })}
          </div>
        )}
      </div>
      {openId && <ProjectDetail id={openId} onClose={close} />}
    </section>
  );
}
