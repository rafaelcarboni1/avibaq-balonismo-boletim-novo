import { createClient } from '@supabase/supabase-js';

// Cliente admin para acessar dados
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function corrigirUsuario() {
  const email = 'rafaeldacunhacarboni@gmail.com';
  
  try {
    console.log(`🔧 Corrigindo usuário ${email}...`);
    
    // Atualizar primeira_senha para false
    const { data, error } = await supabaseAdmin
      .from('users')
      .update({ primeira_senha: false })
      .eq('email', email)
      .select();
    
    if (error) {
      console.error('❌ Erro ao corrigir usuário:', error);
      return;
    }
    
    console.log('✅ Usuário corrigido com sucesso!');
    console.log('📄 Dados atualizados:', data);
    
  } catch (error) {
    console.error('❌ Erro inesperado:', error);
  }
}

corrigirUsuario();