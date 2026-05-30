/**
 * POST /api/auth/logout — Clear session
 */
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const SESSION_COOKIE = 'cinacoin-session';
const NONCE_COOKIE = 'cinacoin-nonce';

export async function POST() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
  cookieStore.delete(NONCE_COOKIE);
  return NextResponse.json({ ok: true });
}
