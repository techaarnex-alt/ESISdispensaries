import { cleanText, db, json, sessionBranch } from '@/lib/server/lab';

export async function POST(request: Request) {
  const branch = await sessionBranch(request);
  if (!branch) return json({ error: 'Sign in required.' }, 401);
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  const reviewerName = cleanText(body?.reviewerName, 60) || 'Anonymous visitor';
  const message = cleanText(body?.message, 500);
  const rating = Number(body?.rating);
  if (!message || !Number.isInteger(rating) || rating < 1 || rating > 5) return json({ error: 'Choose a rating and write a review.' }, 400);
  const now = Date.now();
  const result = await db().prepare('INSERT INTO customer_reviews (location_id, rating, reviewer_name, message, created_at) VALUES (?, ?, ?, ?, ?)').bind(branch.id, rating, reviewerName, message, now).run();
  return json({ review: { id: Number(result.meta.last_row_id), rating, reviewerName, message, date: new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(now)) } }, 201);
}
