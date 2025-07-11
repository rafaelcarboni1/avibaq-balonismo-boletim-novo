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
  
  // Verificar se é uma rota protegida
  const isProtectedRoute = protectedRoutes.some(route => 
    pathname.startsWith(route) && !pathname.includes('/login')
  );
  
  if (!isProtectedRoute) {
    return NextResponse.next();
  }
  
  // Verificar se existe token de autenticação
  const token = request.cookies.get('sb-access-token')?.value;
  
  if (!token) {
    // Redirecionar para login específico baseado na rota
    for (const [routePrefix, loginPath] of Object.entries(loginRoutes)) {
      if (pathname.startsWith(routePrefix)) {
        return NextResponse.redirect(new URL(loginPath, request.url));
      }
    }
    
    // Fallback para home se não encontrar rota específica
    return NextResponse.redirect(new URL('/', request.url));
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/piloto/:path*',
    '/agencia/:path*', 
    '/admin/:path*'
  ]
};