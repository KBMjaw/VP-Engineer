/**
 * Browser end-to-end test of the owner workflow, against a LOCAL Supabase
 * stack and the Vite dev server (see docs/TESTING.md).
 *
 *   BASE_URL=http://localhost:5173 node tests/e2e/ui.mjs
 *
 * Covers: public rendering, responsive nav, login errors, non-admin denial,
 * create draft, multi-photo upload into Before/During/After, cover, reorder,
 * draft privacy, publish → visible, gallery, replace, delete photo,
 * unpublish → hidden, delete project.
 */
import { chromium } from 'playwright';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const BASE = process.env.BASE_URL ?? 'http://localhost:5173';
const ADMIN = [process.env.ADMIN_EMAIL ?? 'admin@vp.test', process.env.ADMIN_PASSWORD ?? 'AdminPass-2026'];
const USER = [process.env.USER_EMAIL ?? 'visitor@vp.test', process.env.USER_PASSWORD ?? 'VisitorPass-2026'];
const SHOTS = process.env.SHOTS_DIR;
const FIX = path.join(path.dirname(fileURLToPath(import.meta.url)), 'fixtures');
const fx = (n) => path.join(FIX, n);
const TITLE = `E2E Test Residence ${Date.now().toString(36)}`;

let pass = 0;
let fail = 0;
const check = (name, ok, detail = '') => {
  ok ? pass++ : fail++;
  console.log(`${ok ? '  ✓' : '  ✗'} ${name}${!ok && detail ? ` — ${detail}` : ''}`);
};
const shot = async (page, name) => SHOTS && page.screenshot({ path: path.join(SHOTS, `${name}.png`), fullPage: false });

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const errors = [];
function watch(page, label) {
  page.on('pageerror', (e) => errors.push(`${label} pageerror: ${e.message}`));
  page.on('console', (m) => m.type() === 'error' && errors.push(`${label} console: ${m.text()}`));
  page.on('response', (r) => r.status() >= 400 && errors.push(`${label} HTTP ${r.status()} ${r.request().method()} ${r.url()}`));
}

async function publicCards(page) {
  await page.goto(`${BASE}/?t=${Date.now()}#projects`, { waitUntil: "networkidle" });
  await page.locator('#projects').scrollIntoViewIfNeeded();
  await page.waitForFunction(() => !document.querySelector('[aria-label="Loading projects"]'));
  return page.locator('.proj__title').allTextContents();
}

async function uploadTo(page, phase, files) {
  await page.getByRole('tab', { name: new RegExp(`^${phase}`) }).click();
  await page.locator('#photo-input').setInputFiles(files.map(fx));
  const btn = page.getByRole('button', { name: /^Upload \d+ photo/ });
  await btn.waitFor({ state: 'visible' });
  await page.waitForFunction(() => !/Preparing/.test(document.body.innerText), null, { timeout: 30000 });
  await page.getByRole('button', { name: /^Upload \d+ photo/ }).click();
  await page.getByText(/photos? uploaded to/).waitFor({ timeout: 30000 });
}

try {
  // ------------------------------------------------------------------ public
  console.log('\nPublic site');
  const visitorCtx = await browser.newContext({ viewport: { width: 1366, height: 860 } });
  const pub = await visitorCtx.newPage();
  watch(pub, 'public');
  await pub.goto(BASE, { waitUntil: 'networkidle' });
  check('home page renders the banner', await pub.locator('.hero__banner img').evaluate((i) => i.complete && i.naturalWidth > 0));
  check('navbar has the five sections', (await pub.locator('.nav__links a[data-nav]').allTextContents()).join('|') === 'Home|About|Services|Our Projects|Contact');
  check('footer credit links to Cube Corpsol', (await pub.locator('.credit a').getAttribute('href')) === 'https://cubecorpsol.com');
  check('journey has 13 stages', (await pub.locator('.rail__steps li').count()) === 13);
  check('no horizontal overflow (desktop)', await pub.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  const before = await publicCards(pub);
  check('portfolio shows empty state or cards (no fake data)', before.length > 0 || (await pub.locator('.proj-state').count()) === 1);

  const mobileCtx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const mob = await mobileCtx.newPage();
  watch(mob, 'mobile');
  await mob.goto(BASE, { waitUntil: 'networkidle' });
  await mob.getByRole('button', { name: 'Open menu' }).click();
  await mob.waitForTimeout(450);
  check('mobile menu opens', await mob.locator('.nav__links').isVisible());
  await mob.locator('.nav__links a', { hasText: 'Our Projects' }).click();
  await mob.waitForTimeout(900);
  check('mobile menu closes after navigation', !(await mob.evaluate(() => document.body.classList.contains('menu-open'))));
  check('no horizontal overflow (mobile)', await mob.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  await shot(mob, 'mobile-home');

  // ------------------------------------------------------------------ auth
  console.log('\nAdmin authentication');
  const adminCtx = await browser.newContext({ viewport: { width: 412, height: 915 }, isMobile: true, hasTouch: true });
  const adm = await adminCtx.newPage();
  watch(adm, 'admin');
  adm.on('dialog', (d) => d.accept());
  await adm.goto(`${BASE}/admin`, { waitUntil: 'networkidle' });
  check('unauthenticated /admin redirects to login', adm.url().endsWith('/admin/login'));
  await adm.fill('#email', ADMIN[0]);
  await adm.fill('#password', 'wrong-password');
  const errMark = errors.length;
  await adm.getByRole('button', { name: 'Sign in' }).click();
  check('wrong password shows a clear error', await adm.getByText('Incorrect email or password.').waitFor({ timeout: 8000 }).then(() => true, () => false));
  errors.splice(errMark); // the 400 from the deliberate wrong password is expected

  await adm.fill('#email', USER[0]);
  await adm.fill('#password', USER[1]);
  await adm.getByRole('button', { name: 'Sign in' }).click();
  await adm.getByText('Access denied').waitFor({ timeout: 10000 });
  check('signed-in non-admin is denied', await adm.getByText('is not an administrator').isVisible());
  await adm.getByRole('button', { name: 'Sign out' }).click();
  await adm.waitForURL(/\/admin\/login/);

  await adm.fill('#email', ADMIN[0]);
  await adm.fill('#password', ADMIN[1]);
  await adm.getByRole('button', { name: 'Sign in' }).click();
  await adm.getByRole('heading', { name: 'Your projects' }).waitFor({ timeout: 10000 });
  check('admin reaches dashboard', true);
  await adm.waitForTimeout(600);
  check('dashboard fits a phone screen', await adm.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  await shot(adm, 'admin-dashboard');

  // ------------------------------------------------------------------ create
  console.log('\nProject management');
  await adm.getByRole('link', { name: '+ New project' }).first().click();
  await adm.getByRole('button', { name: 'Save as draft' }).click();
  check('validation blocks an empty title', await adm.getByText('Project title is required').isVisible());
  await adm.fill('#title', TITLE);
  await adm.selectOption('#category', 'residential');
  await adm.fill('#site_type', 'Independent house');
  await adm.fill('#location', 'Test Location, Erode');
  await adm.fill('#site_area', '2400');
  await adm.fill('#description', 'Automated test project — not real company data.');
  await adm.fill('#maps_url', 'not a link');
  await adm.getByRole('button', { name: 'Save as draft' }).click();
  check('invalid maps link rejected', await adm.getByText('Paste a full link starting with https://').isVisible());
  await adm.fill('#maps_url', '');
  await adm.getByRole('radio', { name: 'In Progress' }).click();
  await adm.getByRole('button', { name: 'Save as draft' }).click();
  await adm.getByText('Project saved. Now add photos below.').waitFor({ timeout: 10000 });
  const projectUrl = adm.url();
  check('draft created', /\/admin\/projects\/[0-9a-f-]{36}$/.test(projectUrl));

  // ------------------------------------------------------------------ photos
  console.log('\nPhotos');
  await uploadTo(adm, 'Before', ['test-before.jpg']);
  await uploadTo(adm, 'During', ['test-during-1.jpg', 'test-during-2.jpg']);
  check('multi-select upload added 2 photos to During', (await adm.locator('ul.mt-5 > li').count()) === 2);
  await shot(adm, 'admin-photos');
  check('editor fits a phone screen', await adm.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  await uploadTo(adm, 'After', ['test-after.jpg']);
  await adm.getByRole('button', { name: '★ Set cover' }).first().click();
  await adm.getByText('★ Cover').waitFor();
  check('cover image set', true);

  await adm.getByRole('tab', { name: /^During/ }).click();
  const firstCaption = adm.locator('ul.mt-5 > li').first().getByLabel('Caption');
  await firstCaption.fill('Column casting');
  await firstCaption.blur();
  await adm.waitForTimeout(500);
  await adm.locator('ul.mt-5 > li').nth(1).getByRole('button', { name: 'Move earlier' }).click();
  await adm.waitForTimeout(800);
  check('reorder moves the captioned photo to #2', (await adm.locator('ul.mt-5 > li').nth(1).getByLabel('Caption').inputValue()) === 'Column casting');

  // ------------------------------------------------------------------ privacy
  console.log('\nPublishing');
  let cards = await publicCards(pub);
  check('draft is NOT on the public site', !cards.includes(TITLE));

  await adm.getByRole('button', { name: 'Publish', exact: true }).click();
  await adm.getByText('Published — the project is now live').waitFor({ timeout: 10000 });
  cards = await publicCards(pub);
  check('published project appears on the public site (no redeploy)', cards.includes(TITLE));
  const cardImgOk = await pub.locator('.proj', { hasText: TITLE }).locator('img').evaluate((i) => new Promise((r) => (i.complete ? r(i.naturalWidth > 0) : (i.onload = () => r(true), i.onerror = () => r(false)))));
  check('project card shows its cover photo', cardImgOk);
  await pub.locator('.proj', { hasText: TITLE }).locator('.proj__hit').click();
  await pub.getByRole('heading', { name: TITLE }).waitFor();
  check('details URL is shareable (?project=…)', /[?&]project=[0-9a-f-]{36}/.test(pub.url()));
  await pub.locator('section[aria-labelledby="pd-gallery"]').waitFor({ timeout: 10000 });
  const groups = await pub.locator('section[aria-labelledby="pd-gallery"] p.font-mono').allTextContents();
  check('gallery shows Before / During / After groups', groups.length === 3 && /Before/.test(groups[0]) && /During/.test(groups[1]) && /After/.test(groups[2]), JSON.stringify(groups));
  await pub.waitForTimeout(800);
  const imgsOk = await pub.locator('[role=dialog] figure img').evaluateAll((els) => els.every((i) => i.naturalWidth > 0));
  check('all gallery photos load', imgsOk);
  check('photo caption is shown', await pub.getByText('Column casting').first().isVisible());
  await shot(pub, 'public-detail');
  await pub.locator('[role=dialog] figure button').first().click();
  check('lightbox opens', await pub.getByRole('dialog', { name: 'Photo viewer' }).isVisible());
  await pub.keyboard.press('Escape');
  await pub.keyboard.press('Escape');

  // ------------------------------------------------------------------ edit images
  console.log('\nReplace & delete photos');
  await adm.getByRole('tab', { name: /^During/ }).click();
  const [chooser] = await Promise.all([adm.waitForEvent('filechooser'), adm.locator('ul.mt-5 > li').first().getByRole('button', { name: 'Replace' }).click()]);
  await chooser.setFiles(fx('test-replace.jpg'));
  await adm.getByText('Photo replaced.').waitFor({ timeout: 30000 });
  check('photo replaced', true);
  await adm.getByRole('tab', { name: /^Before/ }).click();
  await adm.locator('ul.mt-5 > li').first().getByRole('button', { name: 'Delete' }).click();
  await adm.getByText('Photo deleted.').waitFor({ timeout: 10000 });
  check('photo deleted', (await adm.getByRole('tab', { name: /^Before/ }).textContent()).includes('0 photos'));

  // ------------------------------------------------------------------ unpublish & delete
  await adm.getByRole('button', { name: 'Unpublish' }).click();
  await adm.getByText('Unpublished — the project is hidden').waitFor({ timeout: 10000 });
  cards = await publicCards(pub);
  check('unpublished project disappears from the public site', !cards.includes(TITLE));

  await adm.getByRole('button', { name: 'Delete', exact: true }).last().click();
  await adm.waitForURL(/\/admin\/projects$/, { timeout: 15000 });
  await adm.waitForTimeout(800);
  check('project deleted', !(await adm.getByText(TITLE).count()));

  await adm.getByRole('button', { name: 'Sign out' }).click();
  await adm.waitForURL(/\/admin\/login/);
  check('logout returns to login', true);

  const real = errors.filter((e) => !/favicon|ERR_BLOCKED_BY_CLIENT|fonts\.g/.test(e));
  check('no console errors', real.length === 0, real.join('\n'));
} catch (e) {
  fail++;
  console.error('  ✗ crashed:', e.message);
} finally {
  await browser.close();
  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
}
