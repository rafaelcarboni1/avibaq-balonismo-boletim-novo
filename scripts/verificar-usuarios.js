import { createClient } from '@supabase/supabase-js';

// Cliente admin para acessar dados
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function verificarUsuarios() {
  try {
    console.log('🔍 Verificando usuários na tabela users...\n');
    
    // Buscar todos os usuários
    const { data: usuarios, error } = await supabaseAdmin
      .from('users')
      .select('id, nome, email, role, primeira_senha, created_at')
      .order('created_at', { ascending: false });
      
    if (error) {
      console.error('❌ Erro ao buscar usuários:', error);
      return;
    }
    
    console.log(`📊 Total de usuários encontrados: ${usuarios.length}\n`);
    
    // Separar usuários por primeira_senha
    const usuariosTemporarios = usuarios.filter(u => u.primeira_senha === true);
    const usuariosNormais = usuarios.filter(u => u.primeira_senha === false);
    
    console.log('🟡 Usuários com primeira_senha=true (senha temporária):');
    console.log('=' .repeat(60));
    if (usuariosTemporarios.length === 0) {
      console.log('✅ Nenhum usuário com senha temporária encontrado\n');
    } else {
      usuariosTemporarios.forEach(user => {
        console.log(`📧 Email: ${user.email}`);
        console.log(`👤 Nome: ${user.nome}`);
        console.log(`🏷️  Role: ${user.role}`);
        console.log(`📅 Criado: ${new Date(user.created_at).toLocaleString('pt-BR')}`);
        console.log('-'.repeat(40));
      });
    }
    
    console.log('\n🟢 Usuários com primeira_senha=false (senha normal):');
    console.log('=' .repeat(60));
    if (usuariosNormais.length === 0) {
      console.log('❌ Nenhum usuário com senha normal encontrado\n');
    } else {
      usuariosNormais.forEach(user => {
        console.log(`📧 Email: ${user.email}`);
        console.log(`👤 Nome: ${user.nome}`);
        console.log(`🏷️  Role: ${user.role}`);
        console.log(`📅 Criado: ${new Date(user.created_at).toLocaleString('pt-BR')}`);
        console.log('-'.repeat(40));
      });
    }
    
    // Estatísticas
    console.log('\n📈 Estatísticas:');
    console.log(`• Usuários com senha temporária: ${usuariosTemporarios.length}`);
    console.log(`• Usuários com senha normal: ${usuariosNormais.length}`);
    console.log(`• Admins: ${usuarios.filter(u => u.role === 'admin').length}`);
    console.log(`• Pilotos: ${usuarios.filter(u => u.role === 'piloto').length}`);
    console.log(`• Agências: ${usuarios.filter(u => u.role === 'agencia').length}`);
    
  } catch (error) {
    console.error('❌ Erro inesperado:', error);
  }
}

// Executar verificação
verificarUsuarios();