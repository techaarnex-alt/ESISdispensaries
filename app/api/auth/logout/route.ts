import { db, json } from '@/lib/server/lab';

export async function POST(request: Request) {
  const token = request.headers.get('cookie')?.split(';').map((item) => item.trim()).find((item) => item.startsWith('esis_lab_session='))?.slice('esis_lab_session='.length);
  if (token) await db().prepare('DELETE FROM lab_sessions WHERE token = ?').bind(token).run();
  return json({ ok: true }, 200, { 'set-cookie': 'esis_lab_session=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0' });
}
