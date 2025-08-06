/**
 * Script simplificado para migrar usuários para o Supabase Auth
 * Versão robusta com timeouts e logging detalhado
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Variáveis de ambiente não encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

console.log('🔄 INICIANDO MIGRAÇÃO DE USUÁRIOS\n');

try {
  console.log('1️⃣ Testando conexão com Supabase...');
  
  // Testar conexão
  const { data: testData, error: testError } = await supabase
    .from('users')
    .select('count')
    .limit(1);

  if (testError) {
    console.error('❌ Erro de conexão:', testError.message);
    process.exit(1);
  }
  
  console.log('✅ Conexão estabelecida com sucesso\n');

  console.log('2️⃣ Buscando usuários para migrar...');
  
  // Primeiro, contar quantos usuários precisam ser migrados
  const { count: totalCount, error: countError } = await supabase
    .from('users')
    .select('*', { count: 'exact' })
    .in('role', ['piloto', 'agencia'])
    .is('auth_id', null);

  if (countError) {
    console.error('❌ Erro ao contar usuários:', countError.message);
    process.exit(1);
  }

  console.log(`📊 Total de usuários para migrar: ${totalCount}`);
  
  if (totalCount === 0) {
    console.log('🎉 Nenhum usuário encontrado para migrar!');
    process.exit(0);
  }

  // Buscar usuários pilotos e agências sem auth_id (TODOS)
  const { data: users, error: usersError } = await supabase
    .from('users')
    .select('id, email, role, nome, razao_social, nome_fantasia')
    .in('role', ['piloto', 'agencia'])
    .is('auth_id', null);

  if (usersError) {
    console.error('❌ Erro ao buscar usuários:', usersError.message);
    process.exit(1);
  }

  console.log(`✅ Encontrados ${users.length} usuários para migrar`);

  console.log('\n3️⃣ Preparando migração em lotes...');
  
  // Dividir usuários em lotes de 50
  const BATCH_SIZE = 50;
  const batches = [];
  for (let i = 0; i < users.length; i += BATCH_SIZE) {
    batches.push(users.slice(i, i + BATCH_SIZE));
  }
  
  console.log(`📦 Dividido em ${batches.length} lotes de até ${BATCH_SIZE} usuários\n`);

  const results = { success: 0, errors: 0, skipped: 0, links: [] };
  let processedCount = 0;

  // Buscar todos os emails do Auth uma única vez para otimizar
  console.log('📋 Carregando usuários existentes no Auth...');
  const { data: authUsers } = await supabase.auth.admin.listUsers();
  const existingEmails = new Set(authUsers.users.map(u => u.email));
  console.log(`✅ ${existingEmails.size} emails já existem no Auth\n`);

  for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
    const batch = batches[batchIndex];
    const batchNumber = batchIndex + 1;
    
    console.log(`🚀 Processando lote ${batchNumber}/${batches.length} (${batch.length} usuários)...`);
    
    for (const user of batch) {
      processedCount++;
      const displayName = user.nome || user.razao_social || user.nome_fantasia || 'Nome não definido';
      console.log(`👤 [${processedCount}/${totalCount}] ${displayName} (${user.email})`);

      try {
        // Verificar se email já existe no Auth (usando o Set otimizado)
        if (existingEmails.has(user.email)) {
          console.log('   ⚠️  Email já existe no Auth - pulando');
          results.skipped++;
          continue;
        }

        // Criar usuário no Auth
        const { data: authUser, error: createError } = await supabase.auth.admin.createUser({
          email: user.email,
          email_confirm: true,
          user_metadata: {
            nome: displayName,
            role: user.role,
            migrated_at: new Date().toISOString()
          }
        });

        if (createError) {
          console.error('   ❌ Erro ao criar:', createError.message);
          results.errors++;
          continue;
        }

        // Gerar link de recovery
        const { data: recoveryData, error: recoveryError } = await supabase.auth.admin.generateLink({
          type: 'recovery',
          email: user.email,
          options: {
            redirectTo: 'https://avibaq-balonismo-boletim-novo.vercel.app/redefinir-senha'
          }
        });

        // Atualizar tabela users
        const { error: updateError } = await supabase
          .from('users')
          .update({ 
            auth_id: authUser.user.id,
            migrated_at: new Date().toISOString()
          })
          .eq('id', user.id);

        if (updateError) {
          console.error('   ❌ Erro ao atualizar tabela:', updateError.message);
          results.errors++;
          continue;
        }

        console.log('   ✅ Migrado com sucesso!');
        results.success++;
        
        // Adicionar email ao Set para próximas verificações
        existingEmails.add(user.email);
        
        if (recoveryData?.properties?.action_link) {
          results.links.push({
            email: user.email,
            nome: displayName,
            role: user.role,
            link: recoveryData.properties.action_link
          });
        }

      } catch (error) {
        console.error('   ❌ Erro inesperado:', error.message);
        results.errors++;
      }
    }
    
    // Resumo do lote
    console.log(`\n📊 Lote ${batchNumber} concluído:`);
    console.log(`   ✅ Sucessos: ${results.success}`);
    console.log(`   ⚠️  Pulados: ${results.skipped}`);
    console.log(`   ❌ Erros: ${results.errors}\n`);
  }

  // Resumo final
  console.log('🎉 MIGRAÇÃO COMPLETA CONCLUÍDA!');
  console.log('================================');
  console.log(`📊 Total processado: ${processedCount}/${totalCount} usuários`);
  console.log(`✅ Migrados com sucesso: ${results.success}`);
  console.log(`⚠️  Já existiam (pulados): ${results.skipped}`);
  console.log(`❌ Erros durante migração: ${results.errors}\n`);

  // Mostrar links
  if (results.links.length > 0) {
    console.log('🔗 LINKS DE RECOVERY:');
    console.log('====================');
    results.links.forEach(item => {
      console.log(`\n📧 ${item.nome} (${item.role})`);
      console.log(`Email: ${item.email}`);
      console.log(`Link: ${item.link}`);
    });
    console.log('\n💡 Envie estes links por email para os usuários.');
  }

} catch (error) {
  console.error('❌ Erro fatal:', error.message);
} finally {
  console.log('\n🔄 Finalizando...');
  process.exit(0);
}