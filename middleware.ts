import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Rotas que precisam de autenticação
const protectedRoutes = ['/piloto', '/agencia', '/admin'];

// Rotas de login por tipo de usuário
const loginRoutes = {
  '/piloto': '/piloto/login',
  '/agencia': '/agencia/login',
  '/admin': '/admin/login'
};

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Por enquanto, desabilitar middleware para permitir que as páginas
  // façam suas próprias verificações de autenticação
  // TODO: Implementar verificação correta de cookies do Supabase
  
  // Logs desabilitados temporariamente para evitar reload infinito
  // console.log('[Middleware] Pathname:', pathname);
  // console.log('[Middleware] Cookies:', request.cookies.getAll().map(c => c.name));
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/piloto/:path*',
    '/agencia/:path*', 
    '/admin/:path*'
  ]
};