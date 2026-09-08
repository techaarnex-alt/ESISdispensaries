import { env } from 'cloudflare:workers';

export type Branch = {
  id: string;
  short: string;
  name: string;
  user: string;
  password: string;
  reportPrefix: string;
};

export const BRANCHES: Branch[] = [
  { id: 'sarojini', short: 'SN', name: 'ESI Dispensary Sarojani Nagar, Lucknow', user: 'sarojini', password: 'ESI@2026', reportPrefix: 'LKO-SN' },
  { id: 'aishbagh', short: 'AB', name: 'ESI Dispensary Aishbagh, Lucknow', user: 'aishbagh', password: 'ESI@2026', reportPrefix: 'LKO-AB' },
  { id: 'golaganj', short: 'GG', name: 'ESI Dispensary Golaganj (KGMU), Lucknow', user: 'golaganj', password: 'ESI@2026', reportPrefix: 'LKO-GG' },
  { id: 'sandeela', short: 'SD', name: 'ESI Dispensary Sandeela, Hardoi', user: 'sandeela', password: 'ESI@2026', reportPrefix: 'HRD-SD' },
  { id: 'sitapur', short: 'ST', name: 'ESI Dispensary Sitapur', user: 'sitapur', password: 'ESI@2026', reportPrefix: 'STP-ST' },
  { id: 'barabanki', short: 'BB', name: 'ESI Dispensary Barabanki', user: 'barabanki', password: 'ESI@2026', reportPrefix: 'BBK-BB' },
  { id: 'raebareli', short: 'RB', name: 'ESI Dispensary Raebareli', user: 'raebareli', password: 'ESI@2026', reportPrefix: 'RBL-RB' },
];

type Runtime = { DB: D1Database };
type SessionRow = { location_id: string; expires_at: number };

export const db = () => (env as unknown as Runtime).DB;
export const publicBranch = (branch: Branch) => ({ id: branch.id, short: branch.short, name: branch.name, user: branch.user });
export const branchById = (id: string) => BRANCHES.find((branch) => branch.id === id);

function cookieValue(request: Request, name: string) {
  const encoded = request.headers.get('cookie')?.split(';').map((item) => item.trim()).find((item) => item.startsWith(`${name}=`))?.slice(name.length + 1);
  return encoded ? decodeURIComponent(encoded) : null;
}

export async function sessionBranch(request: Request) {
  const token = cookieValue(request, 'esis_lab_session');
  if (!token) return null;
  const session = await db().prepare('SELECT location_id, expires_at FROM lab_sessions WHERE token = ?').bind(token).first<SessionRow>();
  if (!session || session.expires_at <= Date.now()) {
    if (session) await db().prepare('DELETE FROM lab_sessions WHERE token = ?').bind(token).run();
    return null;
  }
  return branchById(session.location_id) ?? null;
}

export function json(data: unknown, status = 200, headers?: HeadersInit) {
  return new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json; charset=utf-8', ...headers } });
}

export function cleanText(value: unknown, limit: number) {
  return typeof value === 'string' ? value.trim().slice(0, limit) : '';
}

export function safeTests(value: unknown) {
  const allowed = new Set(['CBC', 'ESR', 'Peripheral Smear', 'Blood Sugar', 'LFT', 'RFT', 'Lipid Profile', 'HbA1c', 'Thyroid Profile', 'Serum Sodium', 'Serum Potassium', 'Urine Routine', 'Stool Routine']);
  if (!Array.isArray(value)) return [];
  return value.filter((test): test is string => typeof test === 'string' && allowed.has(test)).slice(0, 8);
}
