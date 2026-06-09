/**
 * Health check endpoint
 */
import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    service: 'auth-service',
    timestamp: new Date().toISOString(),
  });
}
