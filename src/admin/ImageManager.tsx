import { useEffect, useRef, useState } from 'react';
import { MAX_UPLOAD_MB, PHASES, type PhaseKey } from '../config/site';
import { formatBytes, prepareImage, validateImageFile, type PreparedImage } from '../lib/images';
import { deleteProjectImage, errorMessage, reorderImages, replaceProjectImage, signPaths, updateProjectImage, uploadProjectImage } from '../lib/projects';
import type { ProjectImage } from '../lib/types';
import { Badge, Button, Notice, inputCls } from './ui';

interface QueueItem {
  key: string;
  file: File;
  status: 'preparing' | 'ready' | 'uploading' | 'done' | 'error';
  progress: number;
  prepared?: PreparedImage;
  caption: string;
  takenOn: string;
  error?: string;
}

const PHASE_HELP: Record<PhaseKey, string> = {
  before: 'The plot or old building before work started.',
  during: 'Work in progress — foundation, structure, finishing.',
  after: 'The finished project.',
};

function fileDate(f: File): string {
  const d = new Date(f.lastModified);
  return Number.isNaN(d.getTime()) ? '' : d.toISOString().slice(0, 10);
}

export function ImageManager({
  projectId,
  images,
  coverId,
  onImagesChange,
  onSetCover,
}: {
  projectId: string;
  images: ProjectImage[];
  coverId: string | null;
  onImagesChange: (imgs: ProjectImage[]) => void;
  onSetCover: (id: string | null) => Promise<void>;
}) {
  const [phase, setPhase] = useState<PhaseKey>('during');
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [uploading, setUploading] = useState(false);
  const [notice, setNotice] = useState<{ kind: 'success' | 'error' | 'warn'; text: string } | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const replaceRef = useRef<HTMLInputElement>(null);
  const replaceTarget = useRef<ProjectImage | null>(null);
  const imagesRef = useRef(images);
  imagesRef.current = images;

  // Free preview object URLs when the queue is cleared / component unmounts.
  useEffect(
    () => () => {
      queue.forEach((q) => q.prepared && URL.revokeObjectURL(q.prepared.previewUrl));
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const group = images.filter((i) => i.phase === phase).sort((a, b) => a.sort_order - b.sort_order);
  const patchQueue = (key: string, patch: Partial<QueueItem>) => setQueue((q) => q.map((x) => (x.key === key ? { ...x, ...patch } : x)));

  const pick = async (files: FileList | null) => {
    if (!files?.length) return;
    const errors: string[] = [];
    const items: QueueItem[] = [];
    for (const file of Array.from(files)) {
      const err = validateImageFile(file);
      if (err) errors.push(err);
      else items.push({ key: crypto.randomUUID(), file, status: 'preparing', progress: 0, caption: '', takenOn: fileDate(file) });
    }
    if (errors.length) setNotice({ kind: 'error', text: errors.join(' · ') });
    setQueue((q) => [...q, ...items]);
    // Compress one at a time to keep phones responsive.
    for (const it of items) {
      try {
        const prepared = await prepareImage(it.file);
        patchQueue(it.key, { prepared, status: 'ready' });
      } catch (e) {
        patchQueue(it.key, { status: 'error', error: errorMessage(e) });
      }
    }
    if (fileRef.current) fileRef.current.value = '';
  };

  const removeFromQueue = (key: string) =>
    setQueue((q) => {
      const it = q.find((x) => x.key === key);
      if (it?.prepared) URL.revokeObjectURL(it.prepared.previewUrl);
      return q.filter((x) => x.key !== key);
    });

  const uploadAll = async () => {
    const ready = queue.filter((q) => q.status === 'ready' || (q.status === 'error' && q.prepared));
    if (!ready.length) return;
    setUploading(true);
    setNotice(null);
    let ok = 0;
    let order = Math.max(-1, ...imagesRef.current.filter((i) => i.phase === phase).map((i) => i.sort_order)) + 1;
    const added: ProjectImage[] = [];
    for (const it of ready) {
      patchQueue(it.key, { status: 'uploading', progress: 0, error: undefined });
      try {
        const p = it.prepared!;
        const img = await uploadProjectImage(
          projectId,
          { blob: p.blob, ext: p.ext },
          { phase, caption: it.caption.trim() || null, taken_on: it.takenOn || null, sort_order: order++, width: p.width, height: p.height },
          (f) => patchQueue(it.key, { progress: f }),
        );
        added.push({ ...img, url: p.previewUrl });
        patchQueue(it.key, { status: 'done', progress: 1 });
        ok++;
      } catch (e) {
        patchQueue(it.key, { status: 'error', error: errorMessage(e) });
      }
    }
    // swap local preview URLs for signed URLs
    if (added.length) {
      try {
        const urls = await signPaths(added.map((a) => a.storage_path));
        added.forEach((a) => (a.url = urls[a.storage_path] ?? a.url));
      } catch {
        /* previews still work */
      }
      onImagesChange([...imagesRef.current, ...added]);
    }
    setQueue((q) => q.filter((x) => x.status !== 'done'));
    setUploading(false);
    const failed = ready.length - ok;
    setNotice(
      failed
        ? { kind: 'error', text: `${ok} uploaded, ${failed} failed. Check the items below and press Upload again to retry.` }
        : { kind: 'success', text: `${ok} photo${ok === 1 ? '' : 's'} uploaded to “${PHASES.find((p) => p.key === phase)!.label}”.` },
    );
  };

  const saveMeta = async (img: ProjectImage, patch: Partial<Pick<ProjectImage, 'caption' | 'taken_on'>>) => {
    try {
      await updateProjectImage(img.id, patch);
      onImagesChange(imagesRef.current.map((i) => (i.id === img.id ? { ...i, ...patch } : i)));
    } catch (e) {
      setNotice({ kind: 'error', text: errorMessage(e) });
    }
  };

  const move = async (img: ProjectImage, dir: -1 | 1) => {
    const ids = group.map((g) => g.id);
    const i = ids.indexOf(img.id);
    const j = i + dir;
    if (j < 0 || j >= ids.length) return;
    [ids[i], ids[j]] = [ids[j], ids[i]];
    setBusy(img.id);
    try {
      await reorderImages(ids);
      onImagesChange(imagesRef.current.map((x) => (ids.includes(x.id) ? { ...x, sort_order: ids.indexOf(x.id) } : x)));
    } catch (e) {
      setNotice({ kind: 'error', text: errorMessage(e) });
    } finally {
      setBusy(null);
    }
  };

  const changePhase = async (img: ProjectImage, to: PhaseKey) => {
    const order = Math.max(-1, ...imagesRef.current.filter((i) => i.phase === to).map((i) => i.sort_order)) + 1;
    setBusy(img.id);
    try {
      await updateProjectImage(img.id, { phase: to, sort_order: order });
      onImagesChange(imagesRef.current.map((x) => (x.id === img.id ? { ...x, phase: to, sort_order: order } : x)));
      setNotice({ kind: 'success', text: `Photo moved to “${PHASES.find((p) => p.key === to)!.label}”.` });
    } catch (e) {
      setNotice({ kind: 'error', text: errorMessage(e) });
    } finally {
      setBusy(null);
    }
  };

  const remove = async (img: ProjectImage) => {
    if (!window.confirm('Delete this photo? This cannot be undone.')) return;
    setBusy(img.id);
    try {
      const { storageWarning } = await deleteProjectImage(img);
      onImagesChange(imagesRef.current.filter((x) => x.id !== img.id));
      setNotice(storageWarning ? { kind: 'warn', text: storageWarning } : { kind: 'success', text: 'Photo deleted.' });
    } catch (e) {
      setNotice({ kind: 'error', text: errorMessage(e) });
    } finally {
      setBusy(null);
    }
  };

  const replace = async (files: FileList | null) => {
    const img = replaceTarget.current;
    const file = files?.[0];
    if (replaceRef.current) replaceRef.current.value = '';
    if (!img || !file) return;
    const err = validateImageFile(file);
    if (err) return setNotice({ kind: 'error', text: err });
    setBusy(img.id);
    try {
      const prepared = await prepareImage(file);
      const updated = await replaceProjectImage(img, prepared);
      const urls = await signPaths([updated.storage_path]);
      URL.revokeObjectURL(prepared.previewUrl);
      onImagesChange(imagesRef.current.map((x) => (x.id === img.id ? { ...x, ...updated, url: urls[updated.storage_path] } : x)));
      setNotice({ kind: 'success', text: 'Photo replaced.' });
    } catch (e) {
      setNotice({ kind: 'error', text: errorMessage(e) });
    } finally {
      setBusy(null);
    }
  };

  const pending = queue.filter((q) => q.status === 'ready' || (q.status === 'error' && q.prepared)).length;
  const preparing = queue.some((q) => q.status === 'preparing');

  return (
    <section className="rounded-2xl border border-line bg-white p-4 sm:p-6" aria-labelledby="photos-h">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id="photos-h" className="font-head text-xl font-bold">
            Photos
          </h2>
          <p className="text-sm text-muted">
            {images.length} total · Photos are resized and converted to WebP before upload (max {MAX_UPLOAD_MB} MB each).
          </p>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-2" role="tablist" aria-label="Photo group">
        {PHASES.map((p) => {
          const n = images.filter((i) => i.phase === p.key).length;
          return (
            <button
              key={p.key}
              role="tab"
              aria-selected={phase === p.key}
              onClick={() => setPhase(p.key)}
              className={`rounded-xl border px-3 py-3 text-left transition ${phase === p.key ? 'border-ink bg-ink text-white' : 'border-line bg-white hover:border-ink'}`}
            >
              <span className="block text-sm font-semibold">{p.label}</span>
              <span className={`block text-xs ${phase === p.key ? 'text-white/70' : 'text-muted'}`}>{n} photos</span>
            </button>
          );
        })}
      </div>
      <p className="mt-2 text-xs text-muted">{PHASE_HELP[phase]}</p>

      {notice && (
        <div className="mt-4">
          <Notice kind={notice.kind} onClose={() => setNotice(null)}>
            {notice.text}
          </Notice>
        </div>
      )}

      {/* Upload */}
      <div className="mt-5 rounded-xl border-2 border-dashed border-line bg-[#fcfcfc] p-4 text-center">
        <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/heic,image/heif" multiple className="sr-only" id="photo-input" onChange={(e) => pick(e.target.files)} disabled={uploading} />
        <label htmlFor="photo-input" className="inline-flex min-h-[48px] cursor-pointer items-center justify-center gap-2 rounded-full bg-brand px-6 text-sm font-semibold text-ink hover:bg-brand-dark">
          + Add photos to “{PHASES.find((p) => p.key === phase)!.label}”
        </label>
        <p className="mt-2 text-xs text-muted">Select several photos at once from your gallery or camera.</p>
      </div>

      {queue.length > 0 && (
        <div className="mt-4 rounded-xl border border-line">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-3">
            <p className="text-sm font-semibold">
              {queue.length} selected · {pending} ready to upload
            </p>
            <div className="flex gap-2">
              <Button variant="ghost" className="min-h-[40px] px-4" onClick={() => queue.forEach((q) => q.status !== 'uploading' && removeFromQueue(q.key))} disabled={uploading}>
                Clear
              </Button>
              <Button variant="dark" className="min-h-[40px] px-4" onClick={uploadAll} disabled={uploading || preparing || !pending}>
                {uploading ? 'Uploading…' : preparing ? 'Preparing…' : `Upload ${pending} photo${pending === 1 ? '' : 's'}`}
              </Button>
            </div>
          </div>
          <ul className="divide-y divide-line">
            {queue.map((q) => (
              <li key={q.key} className="grid grid-cols-[72px_1fr] gap-3 p-3 sm:grid-cols-[96px_1fr_auto]">
                <div className="h-[72px] w-[72px] overflow-hidden rounded-lg bg-paper sm:h-24 sm:w-24">
                  {q.prepared && <img src={q.prepared.previewUrl} alt="" className="h-full w-full object-cover" />}
                </div>
                <div className="grid min-w-0 gap-2">
                  <p className="truncate text-xs text-muted">
                    {q.file.name} · {formatBytes(q.file.size)}
                    {q.prepared ? ` → ${formatBytes(q.prepared.blob.size)} ${q.prepared.ext.toUpperCase()}` : ''}
                  </p>
                  <div className="grid gap-2 sm:grid-cols-[1fr_160px]">
                    <input className={`${inputCls} py-2 text-sm`} placeholder="Caption (optional)" value={q.caption} maxLength={300} onChange={(e) => patchQueue(q.key, { caption: e.target.value })} disabled={q.status === 'uploading'} aria-label="Caption" />
                    <input className={`${inputCls} py-2 text-sm`} type="date" value={q.takenOn} onChange={(e) => patchQueue(q.key, { takenOn: e.target.value })} disabled={q.status === 'uploading'} aria-label="Photo date" />
                  </div>
                  {q.status === 'uploading' && (
                    <div className="h-2 overflow-hidden rounded-full bg-paper" role="progressbar" aria-valuenow={Math.round(q.progress * 100)} aria-valuemin={0} aria-valuemax={100}>
                      <div className="h-full bg-brand transition-all" style={{ width: `${Math.round(q.progress * 100)}%` }} />
                    </div>
                  )}
                  {q.status === 'preparing' && <p className="text-xs text-muted">Compressing…</p>}
                  {q.status === 'error' && <p className="text-xs text-red-700">{q.error}</p>}
                </div>
                <button onClick={() => removeFromQueue(q.key)} disabled={q.status === 'uploading'} className="col-span-2 justify-self-end text-sm text-muted underline-offset-4 hover:text-red-700 hover:underline sm:col-span-1 sm:self-start" aria-label={`Remove ${q.file.name}`}>
                  Remove
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Existing photos */}
      <input ref={replaceRef} type="file" accept="image/jpeg,image/png,image/webp,image/heic,image/heif" className="sr-only" onChange={(e) => replace(e.target.files)} aria-hidden="true" tabIndex={-1} />
      {group.length === 0 ? (
        <p className="mt-5 text-center text-sm text-muted">No “{PHASES.find((p) => p.key === phase)!.label}” photos yet.</p>
      ) : (
        <ul className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {group.map((img, idx) => (
            <li key={img.id} className={`overflow-hidden rounded-xl border bg-white ${coverId === img.id ? 'border-brand ring-2 ring-brand' : 'border-line'} ${busy === img.id ? 'opacity-60' : ''}`}>
              <div className="relative aspect-[4/3] bg-paper">
                {img.url && <img src={img.url} alt={img.caption ?? ''} className="h-full w-full object-cover" loading="lazy" />}
                <span className="absolute left-2 top-2 flex gap-1">
                  <Badge tone="grey">#{idx + 1}</Badge>
                  {coverId === img.id && <Badge tone="yellow">★ Cover</Badge>}
                </span>
              </div>
              <div className="grid gap-2 p-3">
                <input
                  className={`${inputCls} py-2 text-sm`}
                  defaultValue={img.caption ?? ''}
                  placeholder="Caption (optional)"
                  maxLength={300}
                  aria-label="Caption"
                  onBlur={(e) => e.target.value.trim() !== (img.caption ?? '') && saveMeta(img, { caption: e.target.value.trim() || null })}
                />
                <div className="grid grid-cols-2 gap-2">
                  <input className={`${inputCls} py-2 text-sm`} type="date" defaultValue={img.taken_on ?? ''} aria-label="Photo date" onChange={(e) => saveMeta(img, { taken_on: e.target.value || null })} />
                  <select className={`${inputCls} py-2 text-sm`} value={img.phase} aria-label="Move to group" onChange={(e) => changePhase(img, e.target.value as PhaseKey)} disabled={busy === img.id}>
                    {PHASES.map((p) => (
                      <option key={p.key} value={p.key}>
                        {p.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <button className="rounded-full border border-line px-3 py-1.5 text-xs font-semibold disabled:opacity-40" onClick={() => move(img, -1)} disabled={idx === 0 || busy === img.id} aria-label="Move earlier">
                    ← Earlier
                  </button>
                  <button className="rounded-full border border-line px-3 py-1.5 text-xs font-semibold disabled:opacity-40" onClick={() => move(img, 1)} disabled={idx === group.length - 1 || busy === img.id} aria-label="Move later">
                    Later →
                  </button>
                  <button
                    className="rounded-full border border-line px-3 py-1.5 text-xs font-semibold disabled:opacity-40"
                    onClick={async () => {
                      setBusy(img.id);
                      try {
                        await onSetCover(coverId === img.id ? null : img.id);
                      } catch (e) {
                        setNotice({ kind: 'error', text: errorMessage(e) });
                      } finally {
                        setBusy(null);
                      }
                    }}
                    disabled={busy === img.id}
                  >
                    {coverId === img.id ? 'Unset cover' : '★ Set cover'}
                  </button>
                  <button
                    className="rounded-full border border-line px-3 py-1.5 text-xs font-semibold disabled:opacity-40"
                    onClick={() => {
                      replaceTarget.current = img;
                      replaceRef.current?.click();
                    }}
                    disabled={busy === img.id}
                  >
                    Replace
                  </button>
                  <button className="rounded-full border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-700 disabled:opacity-40" onClick={() => remove(img)} disabled={busy === img.id}>
                    Delete
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
