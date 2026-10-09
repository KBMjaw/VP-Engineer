/**
 * Database + Storage security tests (Row Level Security & storage policies).
 *
 * Runs against a LOCAL Supabase stack (`npx supabase start`), never production.
 * Requires two pre-created users (see docs/TESTING.md):
 *   ADMIN_EMAIL / ADMIN_PASSWORD   — listed in public.admin_users
 *   USER_EMAIL  / USER_PASSWORD    — a signed-in user who is NOT an admin
 *
 *   SUPABASE_URL=http://127.0.0.1:54321 SUPABASE_ANON_KEY=... node tests/e2e/security.mjs
 */
import { createClient } from '@supabase/supabase-js';

const URL = process.env.SUPABASE_URL ?? 'http://127.0.0.1:54321';
const KEY = process.env.SUPABASE_ANON_KEY;
const ADMIN = [process.env.ADMIN_EMAIL ?? 'admin@vp.test', process.env.ADMIN_PASSWORD ?? 'AdminPass-2026'];
const USER = [process.env.USER_EMAIL ?? 'visitor@vp.test', process.env.USER_PASSWORD ?? 'VisitorPass-2026'];
if (!KEY) throw new Error('Set SUPABASE_ANON_KEY');
if (!/127\.0\.0\.1|localhost/.test(URL) && process.env.ALLOW_REMOTE !== '1') throw new Error('Refusing to run against a non-local Supabase. Set ALLOW_REMOTE=1 to override.');

const mk = () => createClient(URL, KEY, { auth: { persistSession: false, autoRefreshToken: false } });
const anon = mk();
const user = mk();
const admin = mk();

let pass = 0;
let fail = 0;
function check(name, ok, detail = '') {
  if (ok) pass++;
  else fail++;
  console.log(`${ok ? '  ✓' : '  ✗'} ${name}${!ok && detail ? ` — ${detail}` : ''}`);
}
const png = () => {
  // 1×1 PNG
  const b64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
  return new Blob([Buffer.from(b64, 'base64')], { type: 'image/png' });
};

async function main() {
  for (const [c, [e, p]] of [
    [admin, ADMIN],
    [user, USER],
  ]) {
    const { error } = await c.auth.signInWithPassword({ email: e, password: p });
    if (error) throw new Error(`Sign-in failed for ${e}: ${error.message}`);
  }

  console.log('\nAuthorization');
  {
    const { data: a } = await admin.rpc('is_admin');
    const { data: u } = await user.rpc('is_admin');
    const { data: n } = await anon.rpc('is_admin');
    check('admin user is admin', a === true);
    check('signed-in non-admin is NOT admin', u === false);
    check('anonymous visitor is NOT admin', n === false);
    const { error } = await user.from('admin_users').insert({ user_id: (await user.auth.getUser()).data.user.id });
    check('non-admin cannot add themselves to admin_users', !!error, error?.message);
    const { data: rows } = await user.from('admin_users').select('*');
    check('non-admin cannot list admin_users', (rows ?? []).length === 0);
    const { data: orph, error: oErr } = await anon.rpc('orphaned_project_images');
    check('anonymous cannot call orphan report', !!oErr || (orph ?? []).length === 0);
  }

  console.log('\nProjects');
  const draft = { title: 'SECURITY TEST draft', category: 'residential', project_status: 'in_progress' };
  {
    const { error: e1 } = await anon.from('projects').insert(draft);
    check('anonymous cannot create a project', !!e1);
    const { error: e2 } = await user.from('projects').insert(draft);
    check('signed-in non-admin cannot create a project', !!e2);
  }
  const { data: proj, error: cErr } = await admin.from('projects').insert(draft).select().single();
  check('admin can create a draft project', !cErr && proj?.is_published === false, cErr?.message);
  const id = proj.id;
  {
    const { data } = await anon.from('projects').select('id').eq('id', id);
    check('draft is hidden from anonymous visitors', (data ?? []).length === 0);
    const { data: d2 } = await user.from('projects').select('id').eq('id', id);
    check('draft is hidden from non-admin users', (d2 ?? []).length === 0);
    const { data: d3 } = await user.from('projects').update({ title: 'hacked' }).eq('id', id).select();
    check('non-admin cannot edit a project', (d3 ?? []).length === 0);
    const { data: d4 } = await user.from('projects').delete().eq('id', id).select();
    check('non-admin cannot delete a project', (d4 ?? []).length === 0);
    const { error: e5 } = await admin.from('projects').update({ maps_url: 'javascript:alert(1)' }).eq('id', id);
    check('maps_url must be https', !!e5);
  }

  console.log('\nImages & storage');
  const imgId = crypto.randomUUID();
  const path = `${id}/${imgId}.png`;
  {
    const { error: u1 } = await anon.storage.from('project-images').upload(`${id}/${crypto.randomUUID()}.png`, png());
    check('anonymous cannot upload', !!u1);
    const { error: u2 } = await user.storage.from('project-images').upload(`${id}/${crypto.randomUUID()}.png`, png());
    check('non-admin cannot upload', !!u2);
    const { error: u3 } = await admin.storage.from('project-images').upload(path, png(), { contentType: 'image/png' });
    check('admin can upload', !u3, u3?.message);
    const { error: bad } = await admin.storage.from('project-images').upload(`${id}/${crypto.randomUUID()}.txt`, new Blob(['x'], { type: 'text/plain' }));
    check('bucket rejects non-image files', !!bad);
    const { error: rowErr } = await admin
      .from('project_images')
      .insert({ id: imgId, project_id: id, storage_path: path, phase: 'before', sort_order: 0 });
    check('admin can save image metadata', !rowErr, rowErr?.message);
    const { error: wrongFolder } = await admin
      .from('project_images')
      .insert({ project_id: id, storage_path: `${crypto.randomUUID()}/${crypto.randomUUID()}.png` });
    check('image path must live in the project folder', !!wrongFolder);
    const { error: uRow } = await user.from('project_images').insert({ project_id: id, storage_path: `${id}/${crypto.randomUUID()}.png` });
    check('non-admin cannot add image metadata', !!uRow);

    const { data: s1 } = await anon.storage.from('project-images').createSignedUrl(path, 60);
    check('anonymous cannot get a URL for a draft image', !s1?.signedUrl);
    const { data: s1b } = await user.storage.from('project-images').createSignedUrl(path, 60);
    check('non-admin cannot get a URL for a draft image', !s1b?.signedUrl);
    const { data: im1 } = await anon.from('project_images').select('id').eq('project_id', id);
    check('draft image metadata hidden from anonymous', (im1 ?? []).length === 0);
    const { data: rm } = await user.storage.from('project-images').remove([path]);
    check('non-admin cannot delete stored files', (rm ?? []).length === 0);
    const { error: covErr } = await admin.from('projects').update({ cover_image_id: imgId }).eq('id', id);
    check('admin can set cover image', !covErr, covErr?.message);
  }

  console.log('\nPublish / unpublish');
  {
    const { data: pub } = await admin.from('projects').update({ is_published: true }).eq('id', id).select().single();
    check('publish sets published_at', !!pub?.published_at);
    const { data } = await anon.from('projects').select('id, project_images!project_images_project_id_fkey(id)').eq('id', id);
    check('published project visible to anonymous', data?.length === 1 && data[0].project_images.length === 1);
    const { data: s2 } = await anon.storage.from('project-images').createSignedUrl(path, 60);
    check('anonymous can get a URL for a published image', !!s2?.signedUrl);
    if (s2?.signedUrl) {
      const r = await fetch(s2.signedUrl);
      check('signed URL serves the image', r.ok && (r.headers.get('content-type') ?? '').startsWith('image/'));
    }
    const { data: s3 } = await anon.storage.from('project-images').list(id);
    check('anonymous cannot list the bucket folder of… only published files', (s3 ?? []).every((o) => `${id}/${o.name}` === path));
    await admin.from('projects').update({ is_published: false }).eq('id', id);
    const { data: d2 } = await anon.from('projects').select('id').eq('id', id);
    check('unpublished project hidden again', (d2 ?? []).length === 0);
    const { data: s4 } = await anon.storage.from('project-images').createSignedUrl(path, 60);
    check('unpublished images no longer signable by anonymous', !s4?.signedUrl);
  }

  console.log('\nDeletion');
  {
    await admin.from('projects').delete().eq('id', id);
    const { data: rows } = await admin.from('project_images').select('id').eq('project_id', id);
    check('deleting a project removes its image rows (cascade)', (rows ?? []).length === 0);
    const { data: orph } = await admin.rpc('orphaned_project_images');
    check('orphan report finds the stored file', (orph ?? []).some((o) => o.name === path));
    await admin.storage.from('project-images').remove([path]);
    const { data: orph2 } = await admin.rpc('orphaned_project_images');
    check('file removed from storage', !(orph2 ?? []).some((o) => o.name === path));
  }

  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
