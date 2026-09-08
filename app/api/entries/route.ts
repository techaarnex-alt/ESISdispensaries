import { cleanText, db, json, safeTests, sessionBranch } from '@/lib/server/lab';

export async function POST(request: Request) {
  const branch = await sessionBranch(request);
  if (!branch) return json({ error: 'Sign in required.' }, 401);
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  const patient = cleanText(body?.patient, 100);
  const ipNumber = cleanText(body?.ipNumber, 60);
  const age = cleanText(body?.age, 3) || '—';
  const sex = ['Male', 'Female', 'Other'].includes(cleanText(body?.sex, 20)) ? cleanText(body?.sex, 20) : '—';
  const relationship = cleanText(body?.relationship, 40) || 'Self';
  const tests = safeTests(body?.tests);
  if (!patient || !ipNumber || !tests.length) return json({ error: 'Patient name, IP number, and at least one test are required.' }, 400);
  const now = Date.now();
  const reportNumber = `${branch.reportPrefix}-${now.toString().slice(-6)}`;
  const patientId = `IP-${Math.floor(100000 + Math.random() * 899999)}`;
  await db().prepare('INSERT INTO lab_entries (report_number, location_id, patient, patient_id, ip_number, age, sex, relationship, tests_json, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').bind(reportNumber, branch.id, patient, patientId, ipNumber, age, sex, relationship, JSON.stringify(tests), 'Collected', now).run();
  return json({ entry: { id: reportNumber, patient, patientId, ip: ipNumber, age, sex, relationship, tests, status: 'Collected', date: new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(now)) } }, 201);
}
