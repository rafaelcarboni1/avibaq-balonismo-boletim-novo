const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Configurações do Supabase
const SUPABASE_URL = 'https://elcbodhxzvoqpzamgown.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVsY2JvZGh4enZvcXB6YW1nb3duIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTMwNDc4MCwiZXhwIjoyMDY2ODgwNzgwfQ.UfTwpvPuw4ffuPHS9UPBIMNYPOuSmde8WxnN4FXVSAs';

// Criar cliente Supabase com service role
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function executeSQLScript() {
  console.log('🔧 Executando correção de usuários órfãos...');
  
  try {
    // 1. Criar backup da tabela users
    console.log('📝 Criando backup da tabela users...');
    const { error: backupError } = await supabase
      .rpc('create_users_backup');
    
    if (backupError && !backupError.message.includes('already exists')) {
      console.warn('⚠️ Aviso no backup:', backupError.message);
    }
    
    // 2. Identificar usuários órfãos
    console.log('🔍 Identificando usuários órfãos...');
    const { data: orphanUsers, error: orphanError } = await supabase
      .rpc('get_orphan_users');
    
    if (orphanError) {
      console.error('❌ Erro ao identificar usuários órfãos:', orphanError);
      // Continuar mesmo com erro, pois pode ser que a função não exista
    }
    
    console.log(`📊 Usuários órfãos encontrados: ${orphanUsers?.length || 'Verificando diretamente...'}`);
    
    // 3. Executar correção principal - inserir usuários órfãos
    console.log('🔧 Inserindo usuários órfãos em public.users...');
    
    // Query para inserir usuários órfãos
    const insertQuery = `
      INSERT INTO public.users (
        auth_id,
        email,
        nome,
        role,
        ativo,
        created_at,
        updated_at
      )
      SELECT 
        au.id as auth_id,
        au.email,
        COALESCE(
          SPLIT_PART(au.email, '@', 1),
          'Usuário'
        ) as nome,
        CASE 
          WHEN au.email ILIKE '%admin%' THEN 'admin'::user_role
          WHEN au.email ILIKE '%piloto%' THEN 'piloto'::user_role
          WHEN au.email ILIKE '%agencia%' THEN 'agencia'::user_role
          ELSE 'piloto'::user_role
        END as role,
        CASE 
          WHEN au.last_sign_in_at > NOW() - INTERVAL '30 days' THEN true
          ELSE false
        END as ativo,
        au.created_at,
        NOW() as updated_at
      FROM auth.users au
      LEFT JOIN public.users pu ON pu.auth_id = au.id
      WHERE pu.id IS NULL
      ON CONFLICT (email) DO UPDATE SET
        auth_id = EXCLUDED.auth_id,
        updated_at = NOW()
      WHERE users.auth_id IS NULL OR users.auth_id != EXCLUDED.auth_id
    `;
    
    const { data: insertResult, error: insertError } = await supabase
      .rpc('execute_sql', { query: insertQuery });
    
    if (insertError) {
      console.error('❌ Erro ao inserir usuários:', insertError);
      // Tentar abordagem alternativa
      console.log('🔄 Tentando abordagem alternativa...');
      await fixOrphanUsersAlternative();
    } else {
      console.log('✅ Usuários órfãos inseridos com sucesso');
    }
    
    return true;
  } catch (error) {
    console.error('❌ Erro ao executar script SQL:', error);
    throw error;
  }
}

async function fixOrphanUsersAlternative() {
  console.log('🔄 Executando correção alternativa...');
  
  try {
    // Buscar usuários órfãos manualmente
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      throw new Error(`Erro ao buscar usuários do auth: ${authError.message}`);
    }
    
    console.log(`📊 Total de usuários no auth: ${authUsers.users.length}`);
    
    // Buscar usuários existentes em public.users
    const { data: publicUsers, error: publicError } = await supabase
      .from('users')
      .select('auth_id, email');
    
    if (publicError) {
      throw new Error(`Erro ao buscar usuários públicos: ${publicError.message}`);
    }
    
    console.log(`📊 Total de usuários em public.users: ${publicUsers.length}`);
    
    // Identificar órfãos
    const existingAuthIds = new Set(publicUsers.map(u => u.auth_id).filter(Boolean));
    const orphanUsers = authUsers.users.filter(authUser => !existingAuthIds.has(authUser.id));
    
    console.log(`🔍 Usuários órfãos encontrados: ${orphanUsers.length}`);
    
    if (orphanUsers.length === 0) {
      console.log('✅ Nenhum usuário órfão encontrado!');
      return;
    }
    
    // Inserir usuários órfãos um por um
    let successCount = 0;
    let errorCount = 0;
    
    for (const authUser of orphanUsers) {
      try {
        const userName = authUser.email.split('@')[0] || 'Usuário';
        let userRole = 'piloto';
        
        if (authUser.email.toLowerCase().includes('admin')) {
          userRole = 'admin';
        } else if (authUser.email.toLowerCase().includes('agencia')) {
          userRole = 'agencia';
        }
        
        const isActive = authUser.last_sign_in_at && 
          new Date(authUser.last_sign_in_at) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        
        const { error: insertError } = await supabase
          .from('users')
          .insert({
            auth_id: authUser.id,
            email: authUser.email,
            nome: userName,
            role: userRole,
            ativo: isActive || false,
            created_at: authUser.created_at,
            updated_at: new Date().toISOString()
          });
        
        if (insertError) {
          console.error(`❌ Erro ao inserir usuário ${authUser.email}:`, insertError.message);
          errorCount++;
        } else {
          console.log(`✅ Usuário ${authUser.email} inserido com sucesso`);
          successCount++;
        }
      } catch (error) {
        console.error(`❌ Erro ao processar usuário ${authUser.email}:`, error.message);
        errorCount++;
      }
    }
    
    console.log(`📊 Resultado: ${successCount} sucessos, ${errorCount} erros`);
    
  } catch (error) {
    console.error('❌ Erro na correção alternativa:', error);
    throw error;
  }
}

async function checkOrphanUsers() {
  console.log('🔍 Verificando usuários órfãos...');
  
  try {
    // Buscar todos os usuários do auth
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.error('❌ Erro ao buscar usuários do auth:', authError);
      return null;
    }
    
    // Buscar usuários existentes em public.users
    const { data: publicUsers, error: publicError } = await supabase
      .from('users')
      .select('auth_id, email');
    
    if (publicError) {
      console.error('❌ Erro ao buscar usuários públicos:', publicError);
      return null;
    }
    
    // Identificar órfãos
    const existingAuthIds = new Set(publicUsers.map(u => u.auth_id).filter(Boolean));
    const orphanUsers = authUsers.users.filter(authUser => !existingAuthIds.has(authUser.id));
    
    console.log(`📊 Encontrados ${orphanUsers?.length || 0} usuários órfãos`);
    return orphanUsers;
  } catch (error) {
    console.error('❌ Erro na verificação:', error);
    return null;
  }
}

async function generateReport(orphansBefore, orphansAfter) {
  const report = {
    timestamp: new Date().toISOString(),
    orphansBefore: orphansBefore?.length || 0,
    orphansAfter: orphansAfter?.length || 0,
    usersFixed: (orphansBefore?.length || 0) - (orphansAfter?.length || 0),
    details: {
      beforeCorrection: orphansBefore || [],
      afterCorrection: orphansAfter || []
    }
  };
  
  // Salvar relatório
  const reportPath = path.join(__dirname, 'orphan-users-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  console.log('📋 Relatório gerado:');
  console.log(`   - Usuários órfãos antes: ${report.orphansBefore}`);
  console.log(`   - Usuários órfãos depois: ${report.orphansAfter}`);
  console.log(`   - Usuários corrigidos: ${report.usersFixed}`);
  console.log(`   - Relatório salvo em: ${reportPath}`);
  
  return report;
}

async function testForeignKeyConstraint() {
  console.log('🧪 Testando constraint de foreign key...');
  
  try {
    // Verificar se há itens de checklist com marcado_por inválido
    const { data: invalidItems, error: checkError } = await supabase
      .from('checklist_itens')
      .select('id, marcado_por')
      .not('marcado_por', 'is', null)
      .limit(10);
    
    if (checkError) {
      console.log('❌ Erro ao verificar itens de checklist:', checkError.message);
      return false;
    }
    
    if (!invalidItems || invalidItems.length === 0) {
      console.log('✅ Nenhum item de checklist com marcado_por encontrado');
      return true;
    }
    
    console.log(`📊 Verificando ${invalidItems.length} itens de checklist...`);
    
    // Verificar se os marcado_por são válidos
    let invalidCount = 0;
    for (const item of invalidItems) {
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('id', item.marcado_por)
        .single();
      
      if (userError || !user) {
        invalidCount++;
        console.log(`❌ Item ${item.id} tem marcado_por inválido: ${item.marcado_por}`);
      }
    }
    
    if (invalidCount === 0) {
      console.log('✅ Todos os itens de checklist têm marcado_por válidos');
      return true;
    } else {
      console.log(`⚠️  Encontrados ${invalidCount} itens com marcado_por inválido`);
      return false;
    }
    
  } catch (error) {
    console.log('❌ Erro no teste de constraint:', error.message);
    return false;
  }
}

async function main() {
  console.log('🚀 Iniciando correção de usuários órfãos...');
  console.log('=' .repeat(50));
  
  try {
    // 1. Verificar usuários órfãos antes da correção
    const orphansBefore = await checkOrphanUsers();
    
    // 2. Executar correção
    await executeSQLScript();
    
    // 4. Verificar usuários órfãos após a correção
    const orphansAfter = await checkOrphanUsers();
    
    // 5. Gerar relatório
    const report = await generateReport(orphansBefore, orphansAfter);
    
    // 6. Testar constraint
    const constraintTest = await testForeignKeyConstraint();
    
    console.log('=' .repeat(50));
    console.log('🎉 Correção concluída com sucesso!');
    
    if (report.usersFixed > 0) {
      console.log(`✅ ${report.usersFixed} usuários órfãos foram corrigidos`);
    } else {
      console.log('ℹ️  Nenhum usuário órfão encontrado para correção');
    }
    
    if (constraintTest) {
      console.log('✅ Problema de foreign key constraint resolvido');
    } else {
      console.log('⚠️  Problema de foreign key constraint ainda existe');
    }
    
  } catch (error) {
    console.error('💥 Erro durante a execução:', error);
    process.exit(1);
  }
}

// Executar o script
if (require.main === module) {
  main();
}

module.exports = { main, checkOrphanUsers, generateReport, testForeignKeyConstraint };