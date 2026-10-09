import { IMAGE_BUCKET, SUPABASE_URL, requireSupabase } from './supabase';
import type { Project, ProjectImage, ProjectInput } from './types';
import type { PhaseKey } from '../config/site';

const IMAGE_COLS = 'id,project_id,storage_path,phase,caption,taken_on,sort_order,width,height,size_bytes,created_at,updated_at';
const PROJECT_COLS =
  'id,title,category,site_type,description,location,address,maps_url,site_area,built_up_area,area_unit,client_reference,start_date,completion_date,project_status,is_published,published_at,cover_image_id,sort_order,created_at,updated_at';

const PHASE_ORDER: Record<PhaseKey, number> = { before: 0, during: 1, after: 2 };

export function sortImages(images: ProjectImage[]): ProjectImage[] {
  return [...images].sort(
    (a, b) => PHASE_ORDER[a.phase] - PHASE_ORDER[b.phase] || a.sort_order - b.sort_order || a.created_at.localeCompare(b.created_at),
  );
}

/** Cover = chosen cover, else first "after" photo, else first photo. */
export function coverOf(p: Project): ProjectImage | undefined {
  const imgs = p.project_images ?? [];
  return (
    imgs.find((i) => i.id === p.cover_image_id) ??
    sortImages(imgs.filter((i) => i.phase === 'after'))[0] ??
    sortImages(imgs)[0]
  );
}

// ---------------------------------------------------------------------------
// Signed URLs (bucket is private; RLS decides who may sign which file)
// ---------------------------------------------------------------------------
const SIGN_TTL = 60 * 60; // seconds
const urlCache = new Map<string, { url: string; exp: number }>();

export async function signPaths(paths: string[]): Promise<Record<string, string>> {
  const now = Date.now();
  const out: Record<string, string> = {};
  const todo: string[] = [];
  for (const p of new Set(paths)) {
    const c = urlCache.get(p);
    if (c && c.exp - now > 5 * 60 * 1000) out[p] = c.url;
    else todo.push(p);
  }
  if (todo.length) {
    const { data, error } = await requireSupabase().storage.from(IMAGE_BUCKET).createSignedUrls(todo, SIGN_TTL);
    if (error) throw error;
    for (const d of data ?? []) {
      if (d.signedUrl && d.path) {
        out[d.path] = d.signedUrl;
        urlCache.set(d.path, { url: d.signedUrl, exp: now + SIGN_TTL * 1000 });
      }
    }
  }
  return out;
}

async function attachUrls(images: ProjectImage[]): Promise<ProjectImage[]> {
  if (!images.length) return images;
  const urls = await signPaths(images.map((i) => i.storage_path));
  return images.map((i) => ({ ...i, url: urls[i.storage_path] }));
}

// ---------------------------------------------------------------------------
// Public queries — RLS returns only published rows to visitors
// ---------------------------------------------------------------------------
export async function fetchPublishedProjects(): Promise<Project[]> {
  const sb = requireSupabase();
  const { data, error } = await sb
    .from('projects')
    .select(`${PROJECT_COLS}, project_images!project_images_project_id_fkey(${IMAGE_COLS})`)
    .eq('is_published', true)
    .order('sort_order', { ascending: true })
    .order('completion_date', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false });
  if (error) throw error;
  const projects = (data ?? []) as Project[];
  const covers = projects.map(coverOf).filter((c): c is ProjectImage => Boolean(c));
  const urls = covers.length ? await signPaths(covers.map((c) => c.storage_path)) : {};
  return projects.map((p) => ({
    ...p,
    project_images: (p.project_images ?? []).map((i) => ({ ...i, url: urls[i.storage_path] })),
  }));
}

export async function fetchProject(id: string): Promise<Project | null> {
  const sb = requireSupabase();
  const { data, error } = await sb
    .from('projects')
    .select(`${PROJECT_COLS}, project_images!project_images_project_id_fkey(${IMAGE_COLS})`)
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const p = data as Project;
  return { ...p, project_images: await attachUrls(sortImages(p.project_images ?? [])) };
}

// ---------------------------------------------------------------------------
// Admin — every call below is also enforced server-side by is_admin() RLS
// ---------------------------------------------------------------------------
export async function listAllProjects(): Promise<Project[]> {
  const { data, error } = await requireSupabase()
    .from('projects')
    .select(`${PROJECT_COLS}, project_images!project_images_project_id_fkey(${IMAGE_COLS})`)
    .order('updated_at', { ascending: false });
  if (error) throw error;
  const projects = (data ?? []) as Project[];
  const covers = projects.map(coverOf).filter((c): c is ProjectImage => Boolean(c));
  const urls = covers.length ? await signPaths(covers.map((c) => c.storage_path)) : {};
  return projects.map((p) => ({ ...p, project_images: (p.project_images ?? []).map((i) => ({ ...i, url: urls[i.storage_path] })) }));
}

export async function createProject(input: ProjectInput, publish: boolean): Promise<Project> {
  const { data, error } = await requireSupabase()
    .from('projects')
    .insert({ ...input, is_published: publish })
    .select(PROJECT_COLS)
    .single();
  if (error) throw error;
  return data as Project;
}

export async function updateProject(id: string, patch: Partial<ProjectInput> & { is_published?: boolean; cover_image_id?: string | null }): Promise<Project> {
  const { data, error } = await requireSupabase().from('projects').update(patch).eq('id', id).select(PROJECT_COLS).single();
  if (error) throw error;
  return data as Project;
}

/** Deletes the project (images rows cascade), then its files in Storage. */
export async function deleteProject(project: Project): Promise<{ storageWarning?: string }> {
  const sb = requireSupabase();
  const known = (project.project_images ?? []).map((i) => i.storage_path);
  const { data: listed } = await sb.storage.from(IMAGE_BUCKET).list(project.id, { limit: 1000 });
  const paths = Array.from(new Set([...known, ...(listed ?? []).map((o) => `${project.id}/${o.name}`)]));

  const { error } = await sb.from('projects').delete().eq('id', project.id);
  if (error) throw error;

  if (paths.length) {
    const { error: sErr } = await sb.storage.from(IMAGE_BUCKET).remove(paths);
    if (sErr) return { storageWarning: `Project deleted, but some photos could not be removed from storage: ${sErr.message}` };
  }
  return {};
}

// ---------------------------------------------------------------------------
// Images
// ---------------------------------------------------------------------------
/** Upload with real byte progress (XHR to the Storage REST API). */
async function uploadObject(path: string, blob: Blob, onProgress?: (fraction: number) => void): Promise<void> {
  const sb = requireSupabase();
  const { data } = await sb.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error('Your session has expired. Please sign in again.');
  const apikey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${SUPABASE_URL}/storage/v1/object/${IMAGE_BUCKET}/${path}`);
    xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    xhr.setRequestHeader('apikey', apikey);
    xhr.setRequestHeader('Content-Type', blob.type || 'application/octet-stream');
    xhr.setRequestHeader('x-upsert', 'false');
    xhr.setRequestHeader('Cache-Control', 'max-age=31536000');
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) onProgress(e.loaded / e.total);
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve();
      else {
        let msg = `Upload failed (${xhr.status})`;
        try {
          const body = JSON.parse(xhr.responseText);
          msg = body.message || body.error || msg;
        } catch {
          /* keep default */
        }
        reject(new Error(msg));
      }
    };
    xhr.onerror = () => reject(new Error('Network error during upload. Check your connection and retry.'));
    xhr.send(blob);
  });
}

export interface NewImageMeta {
  phase: PhaseKey;
  caption: string | null;
  taken_on: string | null;
  sort_order: number;
  width: number;
  height: number;
}

export async function uploadProjectImage(
  projectId: string,
  file: { blob: Blob; ext: string },
  meta: NewImageMeta,
  onProgress?: (f: number) => void,
): Promise<ProjectImage> {
  const sb = requireSupabase();
  const id = crypto.randomUUID();
  const path = `${projectId}/${id}.${file.ext}`;
  await uploadObject(path, file.blob, onProgress);
  const { data, error } = await sb
    .from('project_images')
    .insert({ id, project_id: projectId, storage_path: path, size_bytes: file.blob.size, ...meta })
    .select(IMAGE_COLS)
    .single();
  if (error) {
    await sb.storage.from(IMAGE_BUCKET).remove([path]); // don't leave an orphan
    throw error;
  }
  return data as ProjectImage;
}

export async function replaceProjectImage(
  image: ProjectImage,
  file: { blob: Blob; ext: string; width: number; height: number },
  onProgress?: (f: number) => void,
): Promise<ProjectImage> {
  const sb = requireSupabase();
  const path = `${image.project_id}/${crypto.randomUUID()}.${file.ext}`;
  await uploadObject(path, file.blob, onProgress);
  const { data, error } = await sb
    .from('project_images')
    .update({ storage_path: path, width: file.width, height: file.height, size_bytes: file.blob.size })
    .eq('id', image.id)
    .select(IMAGE_COLS)
    .single();
  if (error) {
    await sb.storage.from(IMAGE_BUCKET).remove([path]);
    throw error;
  }
  await sb.storage.from(IMAGE_BUCKET).remove([image.storage_path]);
  urlCache.delete(image.storage_path);
  return data as ProjectImage;
}

export async function updateProjectImage(id: string, patch: Partial<Pick<ProjectImage, 'phase' | 'caption' | 'taken_on' | 'sort_order'>>): Promise<void> {
  const { error } = await requireSupabase().from('project_images').update(patch).eq('id', id);
  if (error) throw error;
}

/** Persist a new order for one phase group (0, 1, 2 …). */
export async function reorderImages(ids: string[]): Promise<void> {
  const sb = requireSupabase();
  const results = await Promise.all(ids.map((id, i) => sb.from('project_images').update({ sort_order: i }).eq('id', id)));
  const failed = results.find((r) => r.error);
  if (failed?.error) throw failed.error;
}

export async function deleteProjectImage(image: ProjectImage): Promise<{ storageWarning?: string }> {
  const sb = requireSupabase();
  const { error } = await sb.from('project_images').delete().eq('id', image.id);
  if (error) throw error;
  const { error: sErr } = await sb.storage.from(IMAGE_BUCKET).remove([image.storage_path]);
  urlCache.delete(image.storage_path);
  return sErr ? { storageWarning: `Photo removed, but the file could not be deleted from storage: ${sErr.message}` } : {};
}

export function errorMessage(e: unknown): string {
  if (e instanceof Error) return e.message;
  if (e && typeof e === 'object' && 'message' in e) return String((e as { message: unknown }).message);
  return 'Something went wrong';
}
