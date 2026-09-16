import { cleanText, db, json, referralSourceById, sessionBranch } from '@/lib/server/lab';

type TestRow = { id: number; name: string; reference_range: string };
type SubmittedTest = { testId?: unknown };
type RegistrationSequenceRow = { last_number: number };

async function nextRegistrationNumber(locationId: string, locationShort: string) {
  const sequence = await db().prepare(`
    INSERT INTO registration_sequences (location_id, last_number)
    VALUES (?, 1)
    ON CONFLICT(location_id) DO UPDATE SET last_number = registration_sequences.last_number + 1
    RETURNING last_number
  `).bind(locationId).first<RegistrationSequenceRow>();
  if (!sequence) throw new Error('Unable to allocate a registration number.');
  return `REG-${locationShort}-${String(sequence.last_number).padStart(6, '0')}`;
}

export async function POST(request: Request) {
  const branch = await sessionBranch(request);
  if (!branch) return json({ error: 'Sign in required.' }, 401);
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  const patient = cleanText(body?.patient, 100);
  const ipNumber = cleanText(body?.ip, 60);
  const age = cleanText(body?.age, 40) || '—';
  const sex = ['Male', 'Female', 'Other'].includes(cleanText(body?.sex, 20)) ? cleanText(body?.sex, 20) : '—';
  const relationship = cleanText(body?.relationship, 40) || 'Self';
  const ipHolderName = cleanText(body?.ipHolderName, 100);
  const transferredFromLocationId = cleanText(body?.transferredFromLocationId, 40);
  const transferredFrom = transferredFromLocationId ? referralSourceById(transferredFromLocationId) : undefined;
  if (transferredFromLocationId && !transferredFrom) return json({ error: 'Choose a valid referred-from dispensary.' }, 400);
  const submittedTests = Array.isArray(body?.tests) ? body.tests.slice(0, 12) : [];
  if (!patient || !ipNumber || !submittedTests.length) return json({ error: 'Patient name, IP number, and at least one test are required.' }, 400);
  const available = await db().prepare('SELECT id, name, reference_range FROM lab_tests WHERE location_id = ? AND active = 1 ORDER BY name').bind(branch.id).all<TestRow>();
  const byId = new Map((available.results || []).map((test) => [test.id, test]));
  const byName = new Map((available.results || []).map((test) => [test.name, test]));
  const selected = submittedTests.map((item) => {
    const selection = typeof item === 'string' ? byName.get(item) : byId.get(Number((item as SubmittedTest)?.testId));
    return selection || null;
  }).filter((test): test is TestRow => Boolean(test));
  const distinct = selected.filter((test, index, values) => values.findIndex((candidate) => candidate.id === test.id) === index);
  if (!distinct.length) return json({ error: 'Choose tests from this location’s active test catalogue.' }, 400);
  const now = Date.now();
  const reportNumber = `${branch.reportPrefix}-${now.toString().slice(-6)}${Math.floor(Math.random() * 90 + 10)}`;
  const registrationNumber = await nextRegistrationNumber(branch.id, branch.short);
  const created = await db().prepare('INSERT INTO lab_entries (report_number, location_id, patient, registration_number, ip_number, age, sex, relationship, ip_holder_name, transferred_from_location_id, tests_json, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').bind(reportNumber, branch.id, patient, registrationNumber, ipNumber, age, sex, relationship, ipHolderName, transferredFrom?.id || null, JSON.stringify(distinct.map((test) => test.name)), now).run();
  const recordId = Number(created.meta.last_row_id);
  if (!recordId) return json({ error: 'Unable to allocate this test entry.' }, 500);
  await db().batch(distinct.map((test) => db().prepare('INSERT INTO lab_entry_tests (entry_id, test_id, test_name, result_value, reference_range, result_note, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)').bind(recordId, test.id, test.name, '', test.reference_range, '', now)));
  return json({ entry: { recordId, id: reportNumber, patient, registrationNumber, ip: ipNumber, age, sex, relationship, ipHolderName, transferredFrom: transferredFrom?.name || '', tests: distinct.map((test) => test.name), date: new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(now)) } }, 201);
}
