// Script para corrigir usuários órfãos sem auth_id
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function fixOrphanUsers() {
  console.log('🔧 CORRIGINDO USUÁRIOS ÓRFÃOS');
  console.log('==============================');
  
  try {
    // 1. Buscar usuários órfãos
    console.log('\n1. Buscando usuários órfãos...');
    
    const { data: orphanUsers, error: orphanError } = await supabaseAdmin
      .from('users')
      .select('id, email, nome, role')
      .is('auth_id', null);
    
    if (orphanError) {
      console.log('❌ Erro ao buscar usuários órfãos:', orphanError.message);
      return;
    }
    
    console.log(`📊 Encontrados ${orphanUsers.length} usuários órfãos:`);
    orphanUsers.forEach(user => {
      console.log(`- ${user.email} (${user.nome || 'Sem nome'})`);
    });
    
    // 2. Para cada usuário órfão, tentar encontrar no auth.users
    for (const user of orphanUsers) {
      console.log(`\n🔍 Processando: ${user.email}`);
      
      // Buscar se já existe no auth.users
      const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers();
      const existingAuthUser = authUsers.users.find(authUser => authUser.email === user.email);
      
      if (existingAuthUser) {
        console.log('✅ Usuário encontrado no auth.users:', existingAuthUser.id);
        
        // Atualizar o auth_id na tabela users
        const { error: updateError } = await supabaseAdmin
          .from('users')
          .update({ auth_id: existingAuthUser.id })
          .eq('id', user.id);
        
        if (updateError) {
          console.log('❌ Erro ao atualizar auth_id:', updateError.message);
        } else {
          console.log('✅ Auth_id atualizado com sucesso');
        }
      } else {
        console.log('⚠️  Usuário não encontrado no auth.users');
        console.log('🔧 Criando usuário no auth.users...');
        
        // Criar usuário no auth.users
        const { data: newAuthUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
          email: user.email,
          password: 'senha_temporaria_123',
          email_confirm: true,
          user_metadata: {
            nome: user.nome,
            migrated: true
          }
        });
        
        if (createError) {
          console.log('❌ Erro ao criar usuário no auth:', createError.message);
        } else {
          console.log('✅ Usuário criado no auth.users:', newAuthUser.user.id);
          
          // Atualizar o auth_id na tabela users
          const { error: updateError } = await supabaseAdmin
            .from('users')
            .update({ 
              auth_id: newAuthUser.user.id,
              migrated_at: new Date().toISOString()
            })
            .eq('id', user.id);
          
          if (updateError) {
            console.log('❌ Erro ao atualizar auth_id:', updateError.message);
          } else {
            console.log('✅ Auth_id atualizado com sucesso');
          }
        }
      }
    }
    
    // 3. Verificar resultado final
    console.log('\n3. Verificando resultado final...');
    
    const { data: remainingOrphans } = await supabaseAdmin
      .from('users')
      .select('id, email')
      .is('auth_id', null);
    
    console.log(`📊 Usuários órfãos restantes: ${remainingOrphans?.length || 0}`);
    
    if (remainingOrphans && remainingOrphans.length > 0) {
      console.log('⚠️  Ainda há usuários órfãos:');
      remainingOrphans.forEach(user => {
        console.log(`- ${user.email}`);
      });
    } else {
      console.log('✅ Todos os usuários órfãos foram corrigidos!');
    }
    
    // 4. Verificar sincronização geral
    console.log('\n4. Verificando sincronização geral...');
    
    const { data: authUsersList } = await supabaseAdmin.auth.admin.listUsers();
    const { data: publicUsers } = await supabaseAdmin.from('users').select('*');
    const { data: membros } = await supabaseAdmin.from('membros').select('*');
    
    console.log('📊 Estatísticas finais:');
    console.log(`- Total auth.users: ${authUsersList.users.length}`);
    console.log(`- Total public.users: ${publicUsers?.length || 0}`);
    console.log(`- Total membros: ${membros?.length || 0}`);
    
    // Verificar quantos users têm auth_id
    const usersWithAuthId = publicUsers?.filter(u => u.auth_id) || [];
    console.log(`- Users com auth_id: ${usersWithAuthId.length}`);
    
    // Verificar quantos membros têm user_id
    const membrosWithUserId = membros?.filter(m => m.user_id) || [];
    console.log(`- Membros com user_id: ${membrosWithUserId.length}`);
    
  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

// Executar correção
fixOrphanUsers().then(() => {
  console.log('\n🏁 Correção de usuários órfãos concluída');
  process.exit(0);
}).catch(error => {
  console.error('💥 Erro fatal:', error);
  process.exit(1);
});