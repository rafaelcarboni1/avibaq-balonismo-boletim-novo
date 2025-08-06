import { useEffect } from 'react';
import { useRouter } from 'next/router';

export function useRouterDebug() {
  const router = useRouter();

  useEffect(() => {
    const handleRouteChangeStart = (url: string) => {
      console.log('[Router Debug] Iniciando navegação para:', url);
      console.log('[Router Debug] Rota atual:', router.pathname);
    };

    const handleRouteChangeComplete = (url: string) => {
      console.log('[Router Debug] Navegação concluída para:', url);
      console.log('[Router Debug] Nova rota:', router.pathname);
    };

    const handleRouteChangeError = (err: any, url: string) => {
      console.error('[Router Debug] Erro na navegação para:', url, err);
    };

    // Registrar event listeners
    router.events.on('routeChangeStart', handleRouteChangeStart);
    router.events.on('routeChangeComplete', handleRouteChangeComplete);
    router.events.on('routeChangeError', handleRouteChangeError);

    // Cleanup
    return () => {
      router.events.off('routeChangeStart', handleRouteChangeStart);
      router.events.off('routeChangeComplete', handleRouteChangeComplete);
      router.events.off('routeChangeError', handleRouteChangeError);
    };
  }, [router]);

  return router;
}