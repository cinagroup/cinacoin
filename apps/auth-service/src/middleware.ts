import { NextRequest, NextResponse } from 'next/server';

const publicPaths = ['/login', '/register', '/api/auth/register', '/api/auth/login', '/api/auth/logout', '/api/auth/refresh', '/api/auth/mfa'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // 允许公开路径
  if (publicPaths.some(path => pathname.startsWith(path))) {
    return NextResponse.next();
  }
  
  // 允许静态资源
  if (pathname.startsWith('/_next') || pathname.includes('.')) {
    return NextResponse.next();
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
