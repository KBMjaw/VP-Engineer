import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CATEGORIES, PROJECT_STATUSES, categoryLabel, labelOf } from '../config/site';
import { coverOf, deleteProject, errorMessage, listAllProjects, updateProject } from '../lib/projects';
import type { Project } from '../lib/types';
import { Badge, Button, Notice, Spinner, btn, inputCls } from './ui';
import { ProjectDetail } from '../components/portfolio/ProjectDetail';

function useProjects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setProjects(await listAllProjects());
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    load();
  }, [load]);
  return { projects, setProjects, loading, error, load };
}

function Thumb({ p }: { p: Project }) {
  const c = coverOf(p);
  return c?.url ? (
    <img src={c.url} alt="" className="h-full w-full object-cover" loading="lazy" />
  ) : (
    <span className="grid h-full w-full place-items-center bg-paper text-[10px] font-semibold uppercase tracking-wider text-muted">No photo</span>
  );
}

export function Dashboard() {
  const { projects, loading, error, load } = useProjects();
  const nav = useNavigate();
  const published = projects.filter((p) => p.is_published).length;
  const photos = projects.reduce((n, p) => n + (p.project_images?.length ?? 0), 0);
  const stats = [
    ['Total projects', projects.length],
    ['Published', published],
    ['Drafts', projects.length - published],
    ['Photos', photos],
  ] as const;

  return (
    <div className="grid grid-cols-1 gap-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-xs font-semibold uppercase tracking-[.14em] text-muted">Dashboard</p>
          <h1 className="mt-1 font-head text-3xl font-bold">Your projects</h1>
        </div>
        <Button variant="primary" onClick={() => nav('/admin/projects/new')}>
          + Add a project
        </Button>
      </div>

      {error && (
        <Notice kind="error">
          {error}{' '}
          <button className="font-semibold underline" onClick={load}>
            Retry
          </button>
        </Notice>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map(([k, v]) => (
          <div key={k} className="rounded-2xl border border-line bg-white p-5">
            <p className="text-sm text-muted">{k}</p>
            <p className="mt-1 font-head text-3xl font-extrabold">{loading ? '–' : v}</p>
          </div>
        ))}
      </div>

      <section className="rounded-2xl border border-line bg-white">
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <h2 className="font-head text-lg font-bold">Recently updated</h2>
          <Link to="/admin/projects" className="text-sm font-semibold underline-offset-4 hover:underline">
            All projects →
          </Link>
        </div>
        {loading ? (
          <div className="px-5">
            <Spinner />
          </div>
        ) : projects.length === 0 ? (
          <div className="px-5 py-10 text-center">
            <p className="font-semibold">No projects yet.</p>
            <p className="mt-1 text-sm text-muted">Add your first project with photos — it appears on the website as soon as you publish it.</p>
            <Link to="/admin/projects/new" className={btn('dark', 'mt-5')}>
              Add a project
            </Link>
          </div>
        ) : (
          <ul className="divide-y divide-line">
            {projects.slice(0, 6).map((p) => (
              <li key={p.id}>
                <Link to={`/admin/projects/${p.id}`} className="flex items-center gap-4 px-5 py-3.5 hover:bg-[#fafafa]">
                  <span className="h-12 w-16 flex-none overflow-hidden rounded-lg">
                    <Thumb p={p} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold">{p.title}</span>
                    <span className="block truncate text-xs text-muted">
                      {categoryLabel(p.category)} · updated {new Date(p.updated_at).toLocaleDateString('en-IN')}
                    </span>
                  </span>
                  {p.is_published ? <Badge tone="green">Published</Badge> : <Badge tone="grey">Draft</Badge>}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

export function ProjectsList() {
  const { projects, setProjects, loading, error, load } = useProjects();
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('all');
  const [vis, setVis] = useState('all');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ kind: 'success' | 'error' | 'warn'; text: string } | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return projects.filter(
      (p) =>
        (cat === 'all' || p.category === cat) &&
        (vis === 'all' || (vis === 'published') === p.is_published) &&
        (!term || [p.title, p.location, p.site_type, p.client_reference].some((v) => v?.toLowerCase().includes(term))),
    );
  }, [projects, q, cat, vis]);

  const togglePublish = async (p: Project) => {
    setBusyId(p.id);
    try {
      const updated = await updateProject(p.id, { is_published: !p.is_published });
      setProjects((list) => list.map((x) => (x.id === p.id ? { ...x, ...updated } : x)));
      setNotice({ kind: 'success', text: updated.is_published ? `“${p.title}” is now live on the website.` : `“${p.title}” was removed from the website.` });
    } catch (e) {
      setNotice({ kind: 'error', text: errorMessage(e) });
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (p: Project) => {
    if (!window.confirm(`Delete “${p.title}” and all ${p.project_images?.length ?? 0} photos? This cannot be undone.`)) return;
    setBusyId(p.id);
    try {
      const { storageWarning } = await deleteProject(p);
      setProjects((list) => list.filter((x) => x.id !== p.id));
      setNotice(storageWarning ? { kind: 'warn', text: storageWarning } : { kind: 'success', text: `“${p.title}” was deleted.` });
    } catch (e) {
      setNotice({ kind: 'error', text: errorMessage(e) });
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="grid grid-cols-1 gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="font-head text-3xl font-bold">Projects</h1>
        <Link to="/admin/projects/new" className={btn('primary')}>
          + New project
        </Link>
      </div>

      {notice && (
        <Notice kind={notice.kind} onClose={() => setNotice(null)}>
          {notice.text}
        </Notice>
      )}
      {error && (
        <Notice kind="error">
          {error}{' '}
          <button className="font-semibold underline" onClick={load}>
            Retry
          </button>
        </Notice>
      )}

      <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto]">
        <input className={inputCls} type="search" placeholder="Search title, location, reference…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search projects" />
        <select className={inputCls} value={cat} onChange={(e) => setCat(e.target.value)} aria-label="Filter by category">
          <option value="all">All categories</option>
          {CATEGORIES.map((c) => (
            <option key={c.key} value={c.key}>
              {c.label}
            </option>
          ))}
        </select>
        <select className={inputCls} value={vis} onChange={(e) => setVis(e.target.value)} aria-label="Filter by status">
          <option value="all">Published &amp; drafts</option>
          <option value="published">Published</option>
          <option value="draft">Drafts</option>
        </select>
      </div>

      {loading ? (
        <Spinner />
      ) : filtered.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-line bg-white px-5 py-10 text-center text-muted">{projects.length ? 'No projects match these filters.' : 'No projects yet.'}</p>
      ) : (
        <ul className="grid gap-3">
          {filtered.map((p) => (
            <li key={p.id} className="flex flex-col gap-4 rounded-2xl border border-line bg-white p-4 sm:flex-row sm:items-center">
              <Link to={`/admin/projects/${p.id}`} className="flex min-w-0 flex-1 items-center gap-4">
                <span className="h-16 w-24 flex-none overflow-hidden rounded-lg">
                  <Thumb p={p} />
                </span>
                <span className="min-w-0">
                  <span className="block truncate font-semibold">{p.title}</span>
                  <span className="block truncate text-sm text-muted">
                    {categoryLabel(p.category)}
                    {p.location ? ` · ${p.location}` : ''}
                  </span>
                  <span className="mt-1.5 flex flex-wrap gap-1.5">
                    {p.is_published ? <Badge tone="green">Published</Badge> : <Badge tone="grey">Draft</Badge>}
                    <Badge tone="blue">{labelOf(PROJECT_STATUSES, p.project_status)}</Badge>
                    <Badge tone="yellow">{p.project_images?.length ?? 0} photos</Badge>
                  </span>
                </span>
              </Link>
              <div className="flex flex-wrap gap-2">
                <Link to={`/admin/projects/${p.id}`} className={btn('ghost', 'min-h-[40px] px-4')}>
                  Edit
                </Link>
                <button className={btn('ghost', 'min-h-[40px] px-4')} onClick={() => setPreview(p.id)}>
                  Preview
                </button>
                <button className={btn(p.is_published ? 'subtle' : 'primary', 'min-h-[40px] px-4')} disabled={busyId === p.id} onClick={() => togglePublish(p)}>
                  {p.is_published ? 'Unpublish' : 'Publish'}
                </button>
                <button className={btn('danger', 'min-h-[40px] px-4')} disabled={busyId === p.id} onClick={() => remove(p)}>
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
      {preview && <ProjectDetail id={preview} preview onClose={() => setPreview(null)} />}
    </div>
  );
}
