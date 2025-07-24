/**
 * Script para migrar usuários existentes na tabela 'users' para o Supabase Auth
 * 
 * Este script:
 * 1. Busca todos os pilotos e agências na tabela 'users' que ainda não têm conta no Auth
 * 2. Cria contas no Supabase Auth para cada um
 * 3. Gera links de recovery para definir senha no primeiro acesso
 * 4. Associa os IDs do Auth com os registros na tabela 'users'
 * 
 * IMPORTANTE: Use apenas em ambiente seguro com SUPABASE_SERVICE_ROLE_KEY
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Variáveis de ambiente NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórias');
  process.exit(1);
}

// Cliente com privilégios administrativos
const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

/**
 * Busca usuários na tabela 'users' que ainda não têm conta no Auth
 */
async function getUsersToMigrate() {
  console.log('🔍 Buscando usuários para migrar...\n');

  try {
    // Buscar pilotos e agências que ainda não têm auth_id definido
    const { data: users, error } = await supabase
      .from('users')
      .select('id, email, role, nome, razao_social, nome_fantasia')
      .in('role', ['piloto', 'agencia'])
      .is('auth_id', null); // Só usuários que ainda não foram migrados

    if (error) {
      console.error('❌ Erro ao buscar usuários:', error.message);
      return [];
    }

    console.log(`📊 Encontrados ${users.length} usuários para migrar:`);
    console.log(`   🛩️  Pilotos: ${users.filter(u => u.role === 'piloto').length}`);
    console.log(`   🏢 Agências: ${users.filter(u => u.role === 'agencia').length}\n`);

    return users;
  } catch (error) {
    console.error('❌ Erro inesperado ao buscar usuários:', error.message);
    return [];
  }
}

/**
 * Verifica se um email já existe no Supabase Auth
 */
async function emailExistsInAuth(email) {
  try {
    const { data, error } = await supabase.auth.admin.listUsers();
    
    if (error) {
      console.error(`   ⚠️  Erro ao verificar email ${email}:`, error.message);
      return false;
    }

    return data.users.some(user => user.email === email);
  } catch (error) {
    console.error(`   ⚠️  Erro inesperado ao verificar email ${email}:`, error.message);
    return false;
  }
}

/**
 * Cria usuário no Supabase Auth e gera link de recovery
 */
async function createAuthUser(user) {
  try {
    // Verificar se email já existe no Auth
    const emailExists = await emailExistsInAuth(user.email);
    if (emailExists) {
      console.log(`   ⚠️  Email ${user.email} já existe no Auth - pulando`);
      return { success: false, reason: 'email_exists' };
    }

    // Criar usuário no Auth sem senha (será definida via recovery)
    const { data: authUser, error: createError } = await supabase.auth.admin.createUser({
      email: user.email,
      email_confirm: true, // Confirmar email automaticamente
      user_metadata: {
        nome: user.nome || user.razao_social || user.nome_fantasia,
        role: user.role,
        migrated_at: new Date().toISOString()
      }
    });

    if (createError) {
      console.error(`   ❌ Erro ao criar usuário Auth:`, createError.message);
      return { success: false, reason: 'create_error', error: createError.message };
    }

    // Gerar link de recovery para definir senha
    const { data: recoveryData, error: recoveryError } = await supabase.auth.admin.generateLink({
      type: 'recovery',
      email: user.email,
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/redefinir-senha`
      }
    });

    if (recoveryError) {
      console.error(`   ⚠️  Erro ao gerar link de recovery:`, recoveryError.message);
      // Não é erro crítico, continuamos
    }

    // Atualizar tabela users com o auth_id
    const { error: updateError } = await supabase
      .from('users')
      .update({ 
        auth_id: authUser.user.id,
        migrated_at: new Date().toISOString()
      })
      .eq('id', user.id);

    if (updateError) {
      console.error(`   ❌ Erro ao atualizar tabela users:`, updateError.message);
      return { success: false, reason: 'update_error', error: updateError.message };
    }

    return {
      success: true,
      authId: authUser.user.id,
      recoveryLink: recoveryData?.properties?.action_link || null
    };

  } catch (error) {
    console.error(`   ❌ Erro inesperado:`, error.message);
    return { success: false, reason: 'unexpected_error', error: error.message };
  }
}

/**
 * Executa a migração de todos os usuários
 */
async function migrateUsers() {
  const users = await getUsersToMigrate();
  
  if (users.length === 0) {
    console.log('✅ Nenhum usuário encontrado para migrar!\n');
    return;
  }

  console.log('🚀 Iniciando migração de usuários...\n');

  const results = {
    success: 0,
    skipped: 0,
    errors: 0,
    recoveryLinks: []
  };

  for (const user of users) {
    const displayName = user.nome || user.razao_social || user.nome_fantasia || 'Nome não definido';
    console.log(`👤 Migrando: ${displayName} (${user.email}) - ${user.role}`);

    const result = await createAuthUser(user);

    if (result.success) {
      console.log(`   ✅ Sucesso! Auth ID: ${result.authId}`);
      results.success++;
      
      if (result.recoveryLink) {
        results.recoveryLinks.push({
          email: user.email,
          nome: displayName,
          role: user.role,
          link: result.recoveryLink
        });
        console.log(`   🔗 Link de recovery gerado`);
      }
    } else {
      if (result.reason === 'email_exists') {
        results.skipped++;
      } else {
        console.error(`   ❌ Falha: ${result.error || result.reason}`);
        results.errors++;
      }
    }

    console.log(''); // Linha em branco para separar usuários
  }

  // Resumo final
  console.log('🎉 Migração concluída!\n');
  console.log('📊 RESUMO:');
  console.log('===========');
  console.log(`✅ Usuários migrados com sucesso: ${results.success}`);
  console.log(`⚠️  Usuários já existentes (pulados): ${results.skipped}`);
  console.log(`❌ Erros durante migração: ${results.errors}\n`);

  // Mostrar links de recovery
  if (results.recoveryLinks.length > 0) {
    console.log('🔗 LINKS DE DEFINIÇÃO DE SENHA:');
    console.log('================================');
    console.log('⚠️  IMPORTANTE: Envie estes links para os usuários definirem suas senhas:\n');
    
    results.recoveryLinks.forEach(item => {
      console.log(`📧 ${item.nome} (${item.role})`);
      console.log(`   Email: ${item.email}`);
      console.log(`   Link: ${item.link}\n`);
    });

    console.log('💡 DICA: Copie estes links e envie por email para cada usuário.');
    console.log('   Eles devem acessar o link para definir sua senha inicial.\n');
  }

  console.log('🚀 Os usuários agora podem fazer login no sistema!');
}

/**
 * Verifica a estrutura do banco de dados antes da migração
 */
async function checkDatabaseStructure() {
  console.log('🔍 Verificando estrutura do banco de dados...\n');

  try {
    // Verificar se tabela users tem as colunas necessárias
    const { data: sampleUser, error } = await supabase
      .from('users')
      .select('id, email, role, auth_id')
      .limit(1);

    if (error) {
      console.error('❌ Erro ao acessar tabela users:', error.message);
      console.log('   💡 Verifique se as migrações foram aplicadas');
      return false;
    }

    // Verificar se coluna auth_id existe
    if (sampleUser.length > 0 && !('auth_id' in sampleUser[0])) {
      console.error('❌ Coluna auth_id não encontrada na tabela users');
      console.log('   💡 Execute a migração para adicionar a coluna auth_id');
      return false;
    }

    console.log('✅ Estrutura do banco está correta');
    return true;

  } catch (error) {
    console.error('❌ Erro ao verificar estrutura:', error.message);
    return false;
  }
}

/**
 * Função principal
 */
async function main() {
  console.log('🔄 MIGRAÇÃO DE USUÁRIOS - AVIBAQ');
  console.log('=================================\n');
  console.log('Este script irá migrar usuários da tabela "users" para o Supabase Auth\n');

  try {
    // Verificar estrutura do banco
    const structureOk = await checkDatabaseStructure();
    if (!structureOk) {
      console.log('🛑 Pare aqui e corrija a estrutura do banco antes de continuar.');
      process.exit(1);
    }

    console.log(''); // Linha em branco

    // Executar migração
    await migrateUsers();

    console.log('\n✨ Processo de migração finalizado!');
    console.log('\n📝 PRÓXIMOS PASSOS:');
    console.log('==================');
    console.log('1. Envie os links de recovery por email para cada usuário');
    console.log('2. Oriente os usuários a acessarem o link para definir senha');
    console.log('3. Teste o login de alguns usuários migrados');
    console.log('4. Monitore logs de erro durante os primeiros logins\n');
    
  } catch (error) {
    console.error('❌ Erro fatal durante execução:', error.message);
    process.exit(1);
  } finally {
    // Forçar saída do processo
    setTimeout(() => {
      console.log('🔄 Finalizando processo...');
      process.exit(0);  
    }, 1000);
  }
}

// Executar apenas se chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('❌ Erro fatal durante execução:', error);
    process.exit(1);
  });
}

export { migrateUsers, getUsersToMigrate };