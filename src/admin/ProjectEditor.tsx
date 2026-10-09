import { useEffect, useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { AREA_UNITS, CATEGORIES, PROJECT_STATUSES, type AreaUnitKey, type CategoryKey, type ProjectStatusKey } from '../config/site';
import { createProject, deleteProject, errorMessage, fetchProject, updateProject } from '../lib/projects';
import type { Project, ProjectImage, ProjectInput } from '../lib/types';
import { Badge, Button, Field, Notice, Spinner, inputCls } from './ui';
import { ImageManager } from './ImageManager';
import { ProjectDetail } from '../components/portfolio/ProjectDetail';

interface FormState {
  title: string;
  category: CategoryKey | '';
  site_type: string;
  description: string;
  location: string;
  address: string;
  maps_url: string;
  site_area: string;
  built_up_area: string;
  area_unit: AreaUnitKey;
  client_reference: string;
  start_date: string;
  completion_date: string;
  project_status: ProjectStatusKey;
}

const EMPTY: FormState = {
  title: '',
  category: '',
  site_type: '',
  description: '',
  location: '',
  address: '',
  maps_url: '',
  site_area: '',
  built_up_area: '',
  area_unit: 'sq_ft',
  client_reference: '',
  start_date: '',
  completion_date: '',
  project_status: 'planning',
};

function toForm(p: Project): FormState {
  return {
    title: p.title,
    category: p.category,
    site_type: p.site_type ?? '',
    description: p.description ?? '',
    location: p.location ?? '',
    address: p.address ?? '',
    maps_url: p.maps_url ?? '',
    site_area: p.site_area?.toString() ?? '',
    built_up_area: p.built_up_area?.toString() ?? '',
    area_unit: p.area_unit,
    client_reference: p.client_reference ?? '',
    start_date: p.start_date ?? '',
    completion_date: p.completion_date ?? '',
    project_status: p.project_status,
  };
}

/** Validates the form; returns field errors and the cleaned payload. */
export function validateForm(f: FormState): { errors: Partial<Record<keyof FormState, string>>; input?: ProjectInput } {
  const errors: Partial<Record<keyof FormState, string>> = {};
  const opt = (s: string) => (s.trim() ? s.trim() : null);
  const num = (s: string, key: keyof FormState) => {
    if (!s.trim()) return null;
    const n = Number(s.replace(/,/g, ''));
    if (!Number.isFinite(n) || n <= 0) errors[key] = 'Enter a positive number';
    return n;
  };
  if (!f.title.trim()) errors.title = 'Project title is required';
  if (!f.category) errors.category = 'Choose a category';
  if (f.maps_url.trim() && !/^https:\/\/\S+$/i.test(f.maps_url.trim())) errors.maps_url = 'Paste a full link starting with https://';
  const site_area = num(f.site_area, 'site_area');
  const built_up_area = num(f.built_up_area, 'built_up_area');
  if (f.start_date && f.completion_date && f.completion_date < f.start_date) errors.completion_date = 'Completion date is before the start date';
  if (Object.keys(errors).length) return { errors };
  return {
    errors,
    input: {
      title: f.title.trim(),
      category: f.category as CategoryKey,
      site_type: opt(f.site_type),
      description: opt(f.description),
      location: opt(f.location),
      address: opt(f.address),
      maps_url: opt(f.maps_url),
      site_area,
      built_up_area,
      area_unit: f.area_unit,
      client_reference: opt(f.client_reference),
      start_date: f.start_date || null,
      completion_date: f.completion_date || null,
      project_status: f.project_status,
    },
  };
}

export function ProjectEditor() {
  const { id } = useParams();
  const isNew = !id;
  const nav = useNavigate();
  const loc = useLocation();
  const [project, setProject] = useState<Project | null>(null);
  const [images, setImages] = useState<ProjectImage[]>([]);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [saved, setSaved] = useState<FormState>(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [state, setState] = useState<'loading' | 'ready' | 'missing' | 'error'>(isNew ? 'ready' : 'loading');
  const [loadErr, setLoadErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<{ kind: 'success' | 'error' | 'warn' | 'info'; text: string } | null>(
    (loc.state as { created?: boolean } | null)?.created ? { kind: 'success', text: 'Project saved. Now add photos below.' } : null,
  );
  const [preview, setPreview] = useState(false);
  const dirty = JSON.stringify(form) !== JSON.stringify(saved);

  const load = async () => {
    if (!id) return;
    setState('loading');
    try {
      const p = await fetchProject(id);
      if (!p) return setState('missing');
      setProject(p);
      setImages(p.project_images ?? []);
      setForm(toForm(p));
      setSaved(toForm(p));
      setState('ready');
    } catch (e) {
      setLoadErr(errorMessage(e));
      setState('error');
    }
  };

  useEffect(() => {
    if (isNew) {
      setProject(null);
      setImages([]);
      setForm(EMPTY);
      setSaved(EMPTY);
      setState('ready');
    } else load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => {
      if (dirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => {
    setForm((f) => ({ ...f, [k]: v }));
    if (errors[k]) setErrors((e) => ({ ...e, [k]: undefined }));
  };

  /** publish: true = publish, false = unpublish/draft, undefined = keep current. */
  const save = async (publish?: boolean) => {
    const { errors: errs, input } = validateForm(form);
    setErrors(errs);
    if (!input) {
      setNotice({ kind: 'error', text: 'Please fix the highlighted fields.' });
      return;
    }
    if (publish && images.length === 0 && !isNew && !window.confirm('This project has no photos yet. Publish anyway?')) return;
    setBusy(true);
    setNotice(null);
    try {
      if (isNew) {
        const p = await createProject(input, publish === true);
        setSaved(form);
        nav(`/admin/projects/${p.id}`, { replace: true, state: { created: true } });
        return;
      }
      const updated = await updateProject(id!, { ...input, ...(publish === undefined ? {} : { is_published: publish }) });
      setProject((p) => (p ? { ...p, ...updated } : updated));
      setSaved(form);
      setNotice({
        kind: 'success',
        text:
          publish === true
            ? 'Published — the project is now live on the website.'
            : publish === false
              ? 'Unpublished — the project is hidden from the website.'
              : 'Changes saved.' + (updated.is_published ? ' The website shows them immediately.' : ''),
      });
    } catch (e) {
      setNotice({ kind: 'error', text: errorMessage(e) });
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!project) return;
    if (!window.confirm(`Delete “${project.title}” and all ${images.length} photos? This cannot be undone.`)) return;
    setBusy(true);
    try {
      const { storageWarning } = await deleteProject({ ...project, project_images: images });
      setSaved(form);
      nav('/admin/projects', { replace: true });
      if (storageWarning) window.alert(storageWarning);
    } catch (e) {
      setNotice({ kind: 'error', text: errorMessage(e) });
      setBusy(false);
    }
  };

  const setCover = async (imageId: string | null) => {
    const updated = await updateProject(id!, { cover_image_id: imageId });
    setProject((p) => (p ? { ...p, ...updated } : updated));
  };

  if (state === 'loading') return <Spinner label="Loading project" />;
  if (state === 'missing') return <Notice kind="warn">This project no longer exists. <Link to="/admin/projects" className="underline">Back to projects</Link></Notice>;
  if (state === 'error')
    return (
      <Notice kind="error">
        {loadErr}{' '}
        <button className="font-semibold underline" onClick={load}>
          Retry
        </button>
      </Notice>
    );

  const err = (k: keyof FormState) => (errors[k] ? <p className="text-xs font-semibold text-red-700">{errors[k]}</p> : null);
  const cls = (k: keyof FormState) => `${inputCls}${errors[k] ? ' border-red-400' : ''}`;

  return (
    <div className="grid grid-cols-1 gap-6 pb-28">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <Link to="/admin/projects" className="text-sm text-muted hover:text-ink">
            ← All projects
          </Link>
          <h1 className="mt-1 truncate font-head text-2xl font-bold sm:text-3xl">{isNew ? 'New project' : project?.title}</h1>
        </div>
        {!isNew && project && (
          <div className="flex items-center gap-2">
            {project.is_published ? <Badge tone="green">Published</Badge> : <Badge tone="grey">Draft</Badge>}
            <Button variant="ghost" className="min-h-[40px] px-4" onClick={() => setPreview(true)}>
              Preview
            </Button>
          </div>
        )}
      </div>

      {notice && (
        <Notice kind={notice.kind} onClose={() => setNotice(null)}>
          {notice.text}
        </Notice>
      )}

      <form
        className="grid grid-cols-1 gap-6"
        onSubmit={(e: FormEvent) => {
          e.preventDefault();
          save();
        }}
        noValidate
      >
        <section className="grid gap-5 rounded-2xl border border-line bg-white p-4 sm:p-6">
          <h2 className="font-head text-xl font-bold">Project details</h2>
          <Field label="Project title" required htmlFor="title">
            <input id="title" className={cls('title')} value={form.title} maxLength={160} onChange={(e) => set('title', e.target.value)} placeholder="e.g. G+1 Residence, Perundurai" />
            {err('title')}
          </Field>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Category" required htmlFor="category">
              <select id="category" className={cls('category')} value={form.category} onChange={(e) => set('category', e.target.value as CategoryKey)}>
                <option value="">Choose…</option>
                {CATEGORIES.map((c) => (
                  <option key={c.key} value={c.key}>
                    {c.label}
                  </option>
                ))}
              </select>
              {err('category')}
            </Field>
            <Field label="Site type" htmlFor="site_type" hint="e.g. Independent house, Warehouse, Office building">
              <input id="site_type" className={inputCls} value={form.site_type} maxLength={120} onChange={(e) => set('site_type', e.target.value)} />
            </Field>
          </div>
          <Field label="Project status" required htmlFor="pstatus">
            <div id="pstatus" className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Project status">
              {PROJECT_STATUSES.map((s) => (
                <button
                  type="button"
                  key={s.key}
                  role="radio"
                  aria-checked={form.project_status === s.key}
                  onClick={() => set('project_status', s.key)}
                  className={`min-h-[44px] rounded-xl border px-2 text-sm font-semibold ${form.project_status === s.key ? 'border-ink bg-ink text-white' : 'border-line bg-white'}`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </Field>
          <Field label="Description" htmlFor="description">
            <textarea id="description" className={`${inputCls} min-h-[140px]`} value={form.description} maxLength={5000} onChange={(e) => set('description', e.target.value)} placeholder="Scope of work, structure, special features…" />
          </Field>
        </section>

        <section className="grid gap-5 rounded-2xl border border-line bg-white p-4 sm:p-6">
          <h2 className="font-head text-xl font-bold">Site</h2>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Location (shown on card)" htmlFor="location" hint="e.g. Perundurai, Erode">
              <input id="location" className={inputCls} value={form.location} maxLength={160} onChange={(e) => set('location', e.target.value)} />
            </Field>
            <Field label="Google Maps link" htmlFor="maps_url">
              <input id="maps_url" type="url" inputMode="url" className={cls('maps_url')} value={form.maps_url} onChange={(e) => set('maps_url', e.target.value)} placeholder="https://maps.app.goo.gl/…" />
              {err('maps_url')}
            </Field>
          </div>
          <Field label="Site address" htmlFor="address">
            <textarea id="address" className={`${inputCls} min-h-[80px]`} value={form.address} maxLength={400} onChange={(e) => set('address', e.target.value)} />
          </Field>
          <div className="grid gap-5 sm:grid-cols-3">
            <Field label="Site area" htmlFor="site_area">
              <input id="site_area" inputMode="decimal" className={cls('site_area')} value={form.site_area} onChange={(e) => set('site_area', e.target.value)} />
              {err('site_area')}
            </Field>
            <Field label="Built-up area" htmlFor="built_up_area">
              <input id="built_up_area" inputMode="decimal" className={cls('built_up_area')} value={form.built_up_area} onChange={(e) => set('built_up_area', e.target.value)} />
              {err('built_up_area')}
            </Field>
            <Field label="Area unit" required htmlFor="area_unit">
              <select id="area_unit" className={inputCls} value={form.area_unit} onChange={(e) => set('area_unit', e.target.value as AreaUnitKey)}>
                {AREA_UNITS.map((u) => (
                  <option key={u.key} value={u.key}>
                    {u.label}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          <div className="grid gap-5 sm:grid-cols-3">
            <Field label="Client / project reference" htmlFor="client_reference" hint="Only shown if filled in.">
              <input id="client_reference" className={inputCls} value={form.client_reference} maxLength={160} onChange={(e) => set('client_reference', e.target.value)} />
            </Field>
            <Field label="Start date" htmlFor="start_date">
              <input id="start_date" type="date" className={inputCls} value={form.start_date} onChange={(e) => set('start_date', e.target.value)} />
            </Field>
            <Field label="Completion date" htmlFor="completion_date">
              <input id="completion_date" type="date" className={cls('completion_date')} value={form.completion_date} onChange={(e) => set('completion_date', e.target.value)} />
              {err('completion_date')}
            </Field>
          </div>
        </section>

        {/* Sticky action bar — thumb-reachable on phones */}
        <div className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-white/95 px-4 py-3 backdrop-blur">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-2">
            <span className="mr-auto hidden text-sm text-muted sm:inline">{dirty ? 'Unsaved changes' : isNew ? '' : 'All changes saved'}</span>
            {isNew ? (
              <>
                <Button type="button" variant="ghost" disabled={busy} onClick={() => save(false)} className="flex-1 sm:flex-none">
                  Save as draft
                </Button>
                <Button type="button" variant="primary" disabled={busy} onClick={() => save(true)} className="flex-1 sm:flex-none">
                  Save &amp; publish
                </Button>
              </>
            ) : (
              <>
                <Button type="button" variant="danger" disabled={busy} onClick={remove} className="px-4">
                  Delete
                </Button>
                <Button type="submit" variant="dark" disabled={busy || !dirty} className="flex-1 sm:flex-none">
                  {busy ? 'Saving…' : 'Save changes'}
                </Button>
                {project?.is_published ? (
                  <Button type="button" variant="ghost" disabled={busy} onClick={() => save(false)} className="flex-1 sm:flex-none">
                    Unpublish
                  </Button>
                ) : (
                  <Button type="button" variant="primary" disabled={busy} onClick={() => save(true)} className="flex-1 sm:flex-none">
                    Publish
                  </Button>
                )}
              </>
            )}
          </div>
        </div>
      </form>

      {isNew ? (
        <Notice kind="info">Save the project first (as a draft is fine) — you can then add Before, During and After photos.</Notice>
      ) : (
        <ImageManager projectId={id!} images={images} coverId={project?.cover_image_id ?? null} onImagesChange={setImages} onSetCover={setCover} />
      )}

      {preview && project && <ProjectDetail id={project.id} preview onClose={() => setPreview(false)} />}
    </div>
  );
}
