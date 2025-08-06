// SCRIPT DE DEBUG PARA EXECUTAR NO CONSOLE DO NAVEGADOR
// Execute este código no console da página do checklist

console.log('=== DEBUG DO ESTADO ATUAL DO USUÁRIO ===');

// 1. Verificar se há hook useUser global
if (window.React) {
  console.log('✅ React disponível');
} else {
  console.log('❌ React não disponível');
}

// 2. Capturar informações do usuário atual do localStorage/sessionStorage
console.log('localStorage keys:', Object.keys(localStorage));
console.log('sessionStorage keys:', Object.keys(sessionStorage));

// 3. Verificar se há dados do Supabase
const supabaseKeys = Object.keys(localStorage).filter(key => key.includes('supabase'));
console.log('Chaves do Supabase:', supabaseKeys);

supabaseKeys.forEach(key => {
  try {
    const value = JSON.parse(localStorage.getItem(key));
    console.log(`${key}:`, value);
  } catch (e) {
    console.log(`${key}:`, localStorage.getItem(key));
  }
});

// 4. Tentar acessar o estado do usuário via React DevTools
try {
  // Procurar por componentes React na página
  const reactFiber = document.querySelector('[data-reactroot], #__next, #root')._reactInternalFiber || 
                    document.querySelector('[data-reactroot], #__next, #root')._reactInternals;
  console.log('Fiber do React encontrado:', !!reactFiber);
} catch (e) {
  console.log('Não foi possível acessar React internals:', e.message);
}

// 5. Verificar Network tab manualmente
console.log('🔍 PRÓXIMOS PASSOS:');
console.log('1. Abra a aba Network do DevTools');
console.log('2. Tente marcar um item do checklist');
console.log('3. Veja qual request está falhando');
console.log('4. Verifique os dados sendo enviados');

// 6. Verificar se há erros globais
console.log('Erros não capturados:', window.onerror ? 'Handler definido' : 'Nenhum handler');

console.log('=== FIM DO DEBUG ===');