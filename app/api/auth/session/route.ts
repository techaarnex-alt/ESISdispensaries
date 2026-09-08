import { json, publicBranch, sessionBranch } from '@/lib/server/lab';

export async function GET(request: Request) {
  const branch = await sessionBranch(request);
  return branch ? json({ branch: publicBranch(branch) }) : json({ error: 'Sign in required.' }, 401);
}
