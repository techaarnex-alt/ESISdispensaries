import { branchById, cleanText, db, json, sessionBranch } from '@/lib/server/lab';

type EntryRow = { id: number; report_number: string; patient: string; registration_number: string; ip_number: string; age: string; sex: string; relationship: string; ip_holder_name: string; transferred_from_location_id: string | null; status: string; created_at: number };
type ResultRow = { id: number; test_name: string; result_value: string; result_note: string; result_status: string };
const resultStatuses = new Set(['Pending', 'In progress', 'Completed']);

function resultPayload(row: ResultRow) {
  return { id: row.id, testName: row.test_name, resultValue: row.result_value, resultNote: row.result_note, resultStatus: row.result_status };
}

export async function GET(request: Request) {
  const branch = await sessionBranch(request);
  if (!branch) return json({ error: 'Sign in required.' }, 401);
  const entryId = Number(new URL(request.url).searchParams.get('entryId'));
  if (!Number.isInteger(entryId) || entryId < 1) return json({ error: 'Choose a valid test entry.' }, 400);
  const entry = await db().prepare('SELECT id, report_number, patient, registration_number, ip_number, age, sex, relationship, ip_holder_name, transferred_from_location_id, status, created_at FROM lab_entries WHERE id = ? AND location_id = ?').bind(entryId, branch.id).first<EntryRow>();
  if (!entry) return json({ error: 'This test entry is not available at your location.' }, 404);
  const rows = await db().prepare('SELECT id, test_name, result_value, result_note, result_status FROM lab_entry_tests WHERE entry_id = ? ORDER BY id').bind(entry.id).all<ResultRow>();
  return json({ entry: { recordId: entry.id, id: entry.report_number, patient: entry.patient, registrationNumber: entry.registration_number, ip: entry.ip_number, age: entry.age, sex: entry.sex, relationship: entry.relationship, ipHolderName: entry.ip_holder_name, transferredFrom: entry.transferred_from_location_id ? branchById(entry.transferred_from_location_id)?.name || '' : '', status: entry.status, date: new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(entry.created_at)) }, results: (rows.results || []).map(resultPayload) });
}

export async function PATCH(request: Request) {
  const branch = await sessionBranch(request);
  if (!branch) return json({ error: 'Sign in required.' }, 401);
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  const entryId = Number(body?.entryId);
  const changes = Array.isArray(body?.results) ? body.results.slice(0, 12) : [];
  if (!Number.isInteger(entryId) || entryId < 1 || !changes.length) return json({ error: 'Choose a test entry and enter at least one result.' }, 400);
  const entry = await db().prepare('SELECT id FROM lab_entries WHERE id = ? AND location_id = ?').bind(entryId, branch.id).first<{ id: number }>();
  if (!entry) return json({ error: 'This test entry is not available at your location.' }, 404);
  const existing = await db().prepare('SELECT id FROM lab_entry_tests WHERE entry_id = ?').bind(entry.id).all<{ id: number }>();
  const allowed = new Set((existing.results || []).map((row) => row.id));
  const updates = changes.map((change) => {
    const item = change as Record<string, unknown>;
    const id = Number(item.id);
    const status = cleanText(item.resultStatus, 20);
    if (!Number.isInteger(id) || !allowed.has(id) || !resultStatuses.has(status)) return null;
    return { id, resultValue: cleanText(item.resultValue, 120), resultNote: cleanText(item.resultNote, 240), status };
  }).filter((change): change is { id: number; resultValue: string; resultNote: string; status: string } => Boolean(change));
  if (!updates.length) return json({ error: 'The submitted results were not valid for this entry.' }, 400);
  const now = Date.now();
  await db().batch(updates.map((change) => db().prepare('UPDATE lab_entry_tests SET result_value = ?, result_note = ?, result_status = ?, updated_at = ? WHERE id = ? AND entry_id = ?').bind(change.resultValue, change.resultNote, change.status, now, change.id, entry.id)));
  const allResults = await db().prepare('SELECT result_status FROM lab_entry_tests WHERE entry_id = ?').bind(entry.id).all<{ result_status: string }>();
  const statuses = (allResults.results || []).map((row) => row.result_status);
  const overall = statuses.length && statuses.every((status) => status === 'Completed') ? 'Completed' : statuses.some((status) => status === 'In progress' || status === 'Completed') ? 'In progress' : 'Collected';
  await db().prepare('UPDATE lab_entries SET status = ? WHERE id = ? AND location_id = ?').bind(overall, entry.id, branch.id).run();
  const latest = await db().prepare('SELECT id, test_name, result_value, result_note, result_status FROM lab_entry_tests WHERE entry_id = ? ORDER BY id').bind(entry.id).all<ResultRow>();
  return json({ status: overall, results: (latest.results || []).map(resultPayload) });
}
