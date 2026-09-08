import { db, json, publicBranch, sessionBranch } from '@/lib/server/lab';

type EntryRow = { report_number: string; patient: string; patient_id: string; ip_number: string; age: string; sex: string; relationship: string; tests_json: string; status: 'Completed' | 'In progress' | 'Collected'; created_at: number };
type ReviewRow = { id: number; rating: number; reviewer_name: string; message: string; created_at: number };

export async function GET(request: Request) {
  const branch = await sessionBranch(request);
  if (!branch) return json({ error: 'Sign in required.' }, 401);
  const [entryResult, reviewResult] = await db().batch([
    db().prepare('SELECT report_number, patient, patient_id, ip_number, age, sex, relationship, tests_json, status, created_at FROM lab_entries WHERE location_id = ? ORDER BY created_at DESC LIMIT 100').bind(branch.id),
    db().prepare('SELECT id, rating, reviewer_name, message, created_at FROM customer_reviews WHERE location_id = ? ORDER BY created_at DESC LIMIT 50').bind(branch.id),
  ]);
  const entries = (entryResult.results as unknown as EntryRow[]).map((entry) => ({ id: entry.report_number, patient: entry.patient, patientId: entry.patient_id, ip: entry.ip_number, age: entry.age, sex: entry.sex, relationship: entry.relationship, tests: JSON.parse(entry.tests_json) as string[], status: entry.status, date: new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(entry.created_at)) }));
  const reviews = (reviewResult.results as unknown as ReviewRow[]).map((review) => ({ id: review.id, rating: review.rating, reviewerName: review.reviewer_name, message: review.message, date: new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(review.created_at)) }));
  return json({ branch: publicBranch(branch), entries, reviews });
}
