/**
 * Admin Session API
 * DELETE /api/admin/session - Logout admin
 */

import type { Env } from '../../../src/lib/db';
import { clearAdminCookie } from '../../../src/lib/auth';

interface PagesContext {
  request: Request;
  env: Env;
  params: Record<string, string>;
}

export async function onRequestDelete(context: PagesContext): Promise<Response> {
  const headers = new Headers({
    'Content-Type': 'application/json',
    'Set-Cookie': clearAdminCookie(),
  });

  return new Response(JSON.stringify({ success: true }), { headers });
}
