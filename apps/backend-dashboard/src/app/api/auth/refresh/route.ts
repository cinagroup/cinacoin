/**
 * POST /api/auth/refresh — Extend session by another 24h
 */
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const SESSION_COOKIE = 'cinacoin-session';
const SESSION_TTL = 24 * 60 * 60; // 24 hours

export async function POST() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(SESSION_COOKIE);

    if (!sessionCookie) {
      return NextResponse.json({ error: 'No session' }, { status: 401 });
    }

    const session = JSON.parse(atob(sessionCookie.value));

    if (session.expiresAt < Math.floor(Date.now() / 1000)) {
      cookieStore.delete(SESSION_COOKIE);
      return NextResponse.json({ error: 'Session expired' }, { status: 401 });
    }

    const newExpiry = Math.floor(Date.now() / 1000) + SESSION_TTL;
    session.expiresAt = newExpiry;

    const newToken = btoa(JSON.stringify(session));

    cookieStore.set(SESSION_COOKIE, newToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: SESSION_TTL,
    });

    return NextResponse.json({
      expiresAt: new Date(newExpiry * 1000).toISOString(),
    });
  } catch {
    return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
  }
}
