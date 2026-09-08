import { cleanText, db, json, sessionBranch } from '@/lib/server/lab';

type TestRow = { id: number; name: string; category: string; rate_paise: number; reference_range: string; active: number };

function integerRate(value: unknown) {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= 5_000_000 ? value : null;
}

function testPayload(row: TestRow) {
  return { id: row.id, name: row.name, category: row.category, ratePaise: row.rate_paise, referenceRange: row.reference_range, active: Boolean(row.active) };
}

function bodyFields(body: Record<string, unknown> | null) {
  const name = cleanText(body?.name, 80);
  const category = cleanText(body?.category, 40) || 'General laboratory';
  const referenceRange = cleanText(body?.referenceRange, 160);
  const ratePaise = integerRate(body?.ratePaise);
  return { name, category, referenceRange, ratePaise };
}

export async function GET(request: Request) {
  const branch = await sessionBranch(request);
  if (!branch) return json({ error: 'Sign in required.' }, 401);
  const result = await db().prepare('SELECT id, name, category, rate_paise, reference_range, active FROM lab_tests WHERE location_id = ? AND active = 1 ORDER BY category, name').bind(branch.id).all<TestRow>();
  return json({ tests: (result.results || []).map(testPayload) });
}

export async function POST(request: Request) {
  const branch = await sessionBranch(request);
  if (!branch) return json({ error: 'Sign in required.' }, 401);
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  const { name, category, referenceRange, ratePaise } = bodyFields(body);
  if (!name || ratePaise === null) return json({ error: 'A test name and a valid rate are required.' }, 400);
  try {
    const created = await db().prepare('INSERT INTO lab_tests (location_id, name, category, rate_paise, reference_range, active, created_at) VALUES (?, ?, ?, ?, ?, 1, ?)').bind(branch.id, name, category, ratePaise, referenceRange, Date.now()).run();
    const row = await db().prepare('SELECT id, name, category, rate_paise, reference_range, active FROM lab_tests WHERE id = ? AND location_id = ?').bind(Number(created.meta.last_row_id), branch.id).first<TestRow>();
    if (!row) return json({ error: 'Unable to save this test.' }, 500);
    return json({ test: testPayload(row) }, 201);
  } catch (error) {
    if (String(error).toLowerCase().includes('unique')) return json({ error: 'A test with this name already exists at this location.' }, 409);
    return json({ error: 'Unable to save this test.' }, 500);
  }
}

export async function PATCH(request: Request) {
  const branch = await sessionBranch(request);
  if (!branch) return json({ error: 'Sign in required.' }, 401);
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  const id = Number(body?.id);
  const { name, category, referenceRange, ratePaise } = bodyFields(body);
  if (!Number.isInteger(id) || id < 1 || !name || ratePaise === null) return json({ error: 'A test name and a valid rate are required.' }, 400);
  try {
    const updated = await db().prepare('UPDATE lab_tests SET name = ?, category = ?, rate_paise = ?, reference_range = ? WHERE id = ? AND location_id = ?').bind(name, category, ratePaise, referenceRange, id, branch.id).run();
    if (!updated.meta.changes) return json({ error: 'This test was not found at your location.' }, 404);
    const row = await db().prepare('SELECT id, name, category, rate_paise, reference_range, active FROM lab_tests WHERE id = ? AND location_id = ?').bind(id, branch.id).first<TestRow>();
    return row ? json({ test: testPayload(row) }) : json({ error: 'Unable to read this test.' }, 500);
  } catch (error) {
    if (String(error).toLowerCase().includes('unique')) return json({ error: 'A test with this name already exists at this location.' }, 409);
    return json({ error: 'Unable to update this test.' }, 500);
  }
}
