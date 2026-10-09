import { useCallback, useEffect, useRef, useState } from 'react';
import { Icon } from '../Icons';
import { AREA_UNITS, PHASES, PROJECT_STATUSES, categoryLabel, labelOf, type PhaseKey } from '../../config/site';
import { errorMessage, fetchProject } from '../../lib/projects';
import type { Project, ProjectImage } from '../../lib/types';

function fmtDate(d: string | null) {
  if (!d) return '';
  return new Date(`${d}T00:00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}
function fmtArea(n: number | null, unit: string) {
  if (n == null) return '';
  return `${Number(n).toLocaleString('en-IN')} ${labelOf(AREA_UNITS, unit)}`;
}

function Lightbox({ images, index, onClose, onIndex }: { images: ProjectImage[]; index: number; onClose: () => void; onIndex: (i: number) => void }) {
  const img = images[index];
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      } else if (e.key === 'ArrowRight') onIndex((index + 1) % images.length);
      else if (e.key === 'ArrowLeft') onIndex((index - 1 + images.length) % images.length);
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [index, images.length, onClose, onIndex]);
  if (!img) return null;
  return (
    <div className="fixed inset-0 z-[220] flex flex-col bg-black/95 text-white" role="dialog" aria-modal="true" aria-label="Photo viewer">
      <div className="flex items-center justify-between px-4 py-3 text-sm">
        <span className="font-mono text-white/70">
          {index + 1} / {images.length} · {labelOf(PHASES, img.phase)}
        </span>
        <button className="grid h-11 w-11 place-items-center rounded-full bg-white/10 hover:bg-white/20" onClick={onClose} aria-label="Close photo viewer">
          <Icon name="close" className="h-5 w-5" />
        </button>
      </div>
      <div className="relative flex min-h-0 flex-1 items-center justify-center px-2">
        {images.length > 1 && (
          <button className="absolute left-2 z-10 grid h-12 w-12 place-items-center rounded-full bg-white/10 hover:bg-white/20" onClick={() => onIndex((index - 1 + images.length) % images.length)} aria-label="Previous photo">
            <Icon name="chev" className="h-6 w-6 rotate-180" />
          </button>
        )}
        <img src={img.url} alt={img.caption || 'Project photo'} className="max-h-full max-w-full object-contain" />
        {images.length > 1 && (
          <button className="absolute right-2 z-10 grid h-12 w-12 place-items-center rounded-full bg-white/10 hover:bg-white/20" onClick={() => onIndex((index + 1) % images.length)} aria-label="Next photo">
            <Icon name="chev" className="h-6 w-6" />
          </button>
        )}
      </div>
      {(img.caption || img.taken_on) && (
        <p className="px-4 py-4 text-center text-sm text-white/80">
          {img.caption}
          {img.caption && img.taken_on ? ' · ' : ''}
          {fmtDate(img.taken_on)}
        </p>
      )}
    </div>
  );
}

/** Full-screen project view. Pass `project` to show preloaded data, or `id` to fetch. */
export function ProjectDetail({ id, onClose, preview = false }: { id: string; onClose: () => void; preview?: boolean }) {
  const [project, setProject] = useState<Project | null>(null);
  const [state, setState] = useState<'loading' | 'ready' | 'missing' | 'error'>('loading');
  const [err, setErr] = useState('');
  const [phase, setPhase] = useState<PhaseKey | 'all'>('all');
  const [lightbox, setLightbox] = useState<number | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  const load = useCallback(async () => {
    setState('loading');
    try {
      const p = await fetchProject(id);
      if (!p) return setState('missing');
      setProject(p);
      setState('ready');
    } catch (e) {
      setErr(errorMessage(e));
      setState('error');
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onCloseRef.current();
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
      prev?.focus?.();
    };
  }, []);

  const images = project?.project_images ?? [];
  const phasesPresent = PHASES.filter((p) => images.some((i) => i.phase === p.key));
  const shown = phase === 'all' ? images : images.filter((i) => i.phase === phase);
  const cover = images.find((i) => i.id === project?.cover_image_id) ?? images.find((i) => i.phase === 'after') ?? images[0];

  const facts: [string, string][] = project
    ? (
        [
          ['Category', categoryLabel(project.category)],
          ['Site type', project.site_type ?? ''],
          ['Location', project.location ?? ''],
          ['Status', labelOf(PROJECT_STATUSES, project.project_status)],
          ['Site area', fmtArea(project.site_area, project.area_unit)],
          ['Built-up area', fmtArea(project.built_up_area, project.area_unit)],
          ['Started', fmtDate(project.start_date)],
          ['Completed', fmtDate(project.completion_date)],
          ['Client / reference', project.client_reference ?? ''],
        ] as [string, string][]
      ).filter(([, v]) => v)
    : [];

  return (
    <div className="fixed inset-0 z-[200] overflow-y-auto bg-white" role="dialog" aria-modal="true" aria-labelledby="pd-title">
      <div className="sticky top-0 z-10 border-b border-line bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
          <p className="truncate font-mono text-xs font-semibold uppercase tracking-[.14em] text-muted">
            {preview ? 'Preview · ' : ''}
            {project ? categoryLabel(project.category) : 'Project'}
          </p>
          <button ref={closeRef} onClick={onClose} className="inline-flex h-11 items-center gap-2 rounded-full border border-line px-4 text-sm font-semibold hover:border-ink" aria-label="Close project">
            <Icon name="close" className="h-4 w-4" /> Close
          </button>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 pb-20 pt-8 sm:px-6">
        {state === 'loading' && (
          <div className="animate-pulse space-y-4" aria-busy="true" aria-label="Loading project">
            <div className="h-10 w-2/3 rounded bg-paper" />
            <div className="aspect-[16/9] w-full rounded-xl2 bg-paper" />
          </div>
        )}
        {state === 'missing' && (
          <div className="py-24 text-center">
            <h2 className="font-head text-2xl font-bold">Project not available</h2>
            <p className="mt-2 text-muted">This project may have been unpublished or removed.</p>
          </div>
        )}
        {state === 'error' && (
          <div className="py-24 text-center" role="alert">
            <h2 className="font-head text-2xl font-bold">Couldn’t load this project</h2>
            <p className="mt-2 text-muted">{err}</p>
            <button onClick={load} className="btn btn--dark mt-6">
              <Icon name="retry" /> Try again
            </button>
          </div>
        )}
        {state === 'ready' && project && (
          <>
            {preview && !project.is_published && (
              <p className="mb-5 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">This project is a draft — visitors can’t see it until you publish it.</p>
            )}
            <h2 id="pd-title" className="font-head text-3xl font-bold tracking-tight sm:text-5xl">
              {project.title}
            </h2>
            {project.location && (
              <p className="mt-3 flex items-center gap-2 text-muted">
                <Icon name="pin" className="h-4 w-4" />
                {project.location}
              </p>
            )}

            {cover?.url && (
              <button className="mt-8 block w-full overflow-hidden rounded-xl2 bg-paper" onClick={() => setLightbox(images.indexOf(cover))} aria-label="Open cover photo">
                <img src={cover.url} alt={cover.caption || project.title} className="aspect-[16/9] w-full object-cover" />
              </button>
            )}

            <div className="mt-10 grid gap-10 lg:grid-cols-[1.4fr_1fr]">
              <div>
                {project.description ? (
                  <div className="whitespace-pre-line text-[17px] leading-relaxed text-ink-soft">{project.description}</div>
                ) : (
                  <p className="text-muted">More details about this project are available on request.</p>
                )}
                {project.address && <p className="mt-6 text-sm text-muted">{project.address}</p>}
                {project.maps_url && (
                  <a href={project.maps_url} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex items-center gap-2 border-b-2 border-brand font-semibold">
                    <Icon name="pin" className="h-4 w-4" /> View on Google Maps
                  </a>
                )}
              </div>
              {facts.length > 0 && (
                <dl className="divide-y divide-line rounded-xl2 border border-line">
                  {facts.map(([k, v]) => (
                    <div key={k} className="flex justify-between gap-4 px-5 py-3.5 text-sm">
                      <dt className="text-muted">{k}</dt>
                      <dd className="text-right font-semibold">{v}</dd>
                    </div>
                  ))}
                </dl>
              )}
            </div>

            {images.length > 0 && (
              <section className="mt-14" aria-labelledby="pd-gallery">
                <div className="flex flex-wrap items-end justify-between gap-4">
                  <h3 id="pd-gallery" className="font-head text-2xl font-bold">
                    Photo Gallery
                  </h3>
                  {phasesPresent.length > 1 && (
                    <div className="flex flex-wrap gap-2" role="tablist" aria-label="Filter photos by stage">
                      {[{ key: 'all' as const, label: 'All' }, ...phasesPresent].map((p) => (
                        <button key={p.key} role="tab" aria-selected={phase === p.key} onClick={() => setPhase(p.key)} className={`filter ${phase === p.key ? 'is-active' : ''}`}>
                          {p.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                {(phase === 'all' ? phasesPresent : PHASES.filter((p) => p.key === phase)).map((ph) => {
                  const group = shown.filter((i) => i.phase === ph.key);
                  if (!group.length) return null;
                  return (
                    <div key={ph.key} className="mt-8">
                      <p className="mb-3 font-mono text-xs font-semibold uppercase tracking-[.14em] text-muted">
                        {ph.label} {ph.key === 'during' ? 'construction' : ph.key === 'before' ? 'construction' : 'completion'} · {group.length}
                      </p>
                      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                        {group.map((img) => (
                          <figure key={img.id} className="group m-0">
                            <button className="block w-full overflow-hidden rounded-lg bg-paper" onClick={() => setLightbox(images.indexOf(img))} aria-label={`Open photo${img.caption ? `: ${img.caption}` : ''}`}>
                              {img.url ? (
                                <img src={img.url} alt={img.caption || `${project.title} — ${ph.label.toLowerCase()} photo`} loading="lazy" decoding="async" className="aspect-[4/3] w-full object-cover transition duration-500 group-hover:scale-105" />
                              ) : (
                                <span className="block aspect-[4/3]" />
                              )}
                            </button>
                            {(img.caption || img.taken_on) && (
                              <figcaption className="mt-1.5 text-xs text-muted">
                                {img.caption}
                                {img.caption && img.taken_on ? ' · ' : ''}
                                {fmtDate(img.taken_on)}
                              </figcaption>
                            )}
                          </figure>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </section>
            )}
          </>
        )}
      </div>
      {lightbox !== null && <Lightbox images={images} index={lightbox} onIndex={setLightbox} onClose={() => setLightbox(null)} />}
    </div>
  );
}
