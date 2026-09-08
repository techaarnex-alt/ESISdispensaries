import { cleanText, db, json, sessionBranch } from '@/lib/server/lab';

type TestRow = { id: number; name: string; rate_paise: number };
type SubmittedTest = { testId?: unknown; ratePaise?: unknown };
type IpSequenceRow = { last_number: number };

function validRate(value: unknown, fallback: number) {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= 5_000_000 ? value : fallback;
}

async function nextIpNumber(locationId: string, locationShort: string) {
  const sequence = await db().prepare(`
    INSERT INTO ip_sequences (location_id, last_number)
    VALUES (?, 1)
    ON CONFLICT(location_id) DO UPDATE SET last_number = ip_sequences.last_number + 1
    RETURNING last_number
  `).bind(locationId).first<IpSequenceRow>();
  if (!sequence) throw new Error('Unable to allocate an IP number.');
  return `IP-${locationShort}-${String(sequence.last_number).padStart(6, '0')}`;
}

export async function POST(request: Request) {
  const branch = await sessionBranch(request);
  if (!branch) return json({ error: 'Sign in required.' }, 401);
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  const patient = cleanText(body?.patient, 100);
  const age = cleanText(body?.age, 3) || '—';
  const sex = ['Male', 'Female', 'Other'].includes(cleanText(body?.sex, 20)) ? cleanText(body?.sex, 20) : '—';
  const relationship = cleanText(body?.relationship, 40) || 'Self';
  const ipHolderName = cleanText(body?.ipHolderName, 100);
  const submittedTests = Array.isArray(body?.tests) ? body.tests.slice(0, 12) : [];
  if (!patient || !submittedTests.length) return json({ error: 'Patient name and at least one test are required.' }, 400);
  const available = await db().prepare('SELECT id, name, rate_paise FROM lab_tests WHERE location_id = ? AND active = 1 ORDER BY name').bind(branch.id).all<TestRow>();
  const byId = new Map((available.results || []).map((test) => [test.id, test]));
  const byName = new Map((available.results || []).map((test) => [test.name, test]));
  const selected = submittedTests.map((item) => {
    const selection = typeof item === 'string' ? byName.get(item) : byId.get(Number((item as SubmittedTest)?.testId));
    if (!selection) return null;
    return { ...selection, ratePaise: validRate(typeof item === 'string' ? undefined : (item as SubmittedTest).ratePaise, selection.rate_paise) };
  }).filter((test): test is TestRow & { ratePaise: number } => Boolean(test));
  const distinct = selected.filter((test, index, values) => values.findIndex((candidate) => candidate.id === test.id) === index);
  if (!distinct.length) return json({ error: 'Choose tests from this location’s active test catalogue.' }, 400);
  const now = Date.now();
  const reportNumber = `${branch.reportPrefix}-${now.toString().slice(-6)}${Math.floor(Math.random() * 90 + 10)}`;
  const ipNumber = await nextIpNumber(branch.id, branch.short);
  const patientId = `IP-${Math.floor(100000 + Math.random() * 899999)}`;
  const created = await db().prepare('INSERT INTO lab_entries (report_number, location_id, patient, patient_id, ip_number, age, sex, relationship, ip_holder_name, tests_json, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').bind(reportNumber, branch.id, patient, patientId, ipNumber, age, sex, relationship, ipHolderName, JSON.stringify(distinct.map((test) => test.name)), 'Collected', now).run();
  const recordId = Number(created.meta.last_row_id);
  if (!recordId) return json({ error: 'Unable to allocate this test entry.' }, 500);
  await db().batch(distinct.map((test) => db().prepare('INSERT INTO lab_entry_tests (entry_id, test_id, test_name, rate_paise, result_value, result_note, result_status, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').bind(recordId, test.id, test.name, test.ratePaise, '', '', 'Pending', now)));
  return json({ entry: { recordId, id: reportNumber, patient, patientId, ip: ipNumber, age, sex, relationship, ipHolderName, tests: distinct.map((test) => test.name), status: 'Collected', date: new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(now)) } }, 201);
}
