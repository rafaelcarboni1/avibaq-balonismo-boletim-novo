import { createClient } from '@supabase/supabase-js';

// Configuração do Supabase
const SUPABASE_URL = 'https://elcbodhxzvoqpzamgown.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVsY2JvZGh4enZvcXB6YW1nb3duIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEzMDQ3ODAsImV4cCI6MjA2Njg4MDc4MH0.wr15r6xgR0vAlnna2S7qs4RCLgWEPGqQZLq8jaW3BTw';
const SUPABASE_SERVICE_ROLE = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVsY2JvZGh4enZvcXB6YW1nb3duIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTMwNDc4MCwiZXhwIjoyMDY2ODgwNzgwfQ.UfTwpvPuw4ffuPHS9UPBIMNYPOuSmde8WxnN4FXVSAs';

// Cliente público para login
const supabasePublic = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Cliente admin para consultas privilegiadas
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE);

class UserInconsistencyInvestigator {
  constructor() {
    this.results = {
      igorAuthId: '7e85dac4-7a9f-48d6-a073-e0aeb2a63b64',
      rpcReturnedId: 'f36990a5-192f-41dc-aa95-8720d9122071',
      igorUserInTable: null,
      allUsers: [],
      authUsers: [],
      duplicates: [],
      inconsistencies: [],
      analysis: {}
    };
  }

  async loginAsIgor() {
    console.log('\n=== FAZENDO LOGIN COMO IGOR ===');
    
    try {
      const { data, error } = await supabasePublic.auth.signInWithPassword({
        email: 'igor_pk_@hotmail.com',
        password: 'igorniehues'
      });

      if (error) {
        console.error('❌ Erro no login:', error.message);
        return false;
      }

      console.log('✅ Login realizado com sucesso');
      console.log('📋 User ID do auth:', data.user.id);
      console.log('📧 Email:', data.user.email);
      
      this.results.igorAuthId = data.user.id;
      return true;
    } catch (error) {
      console.error('❌ Erro inesperado no login:', error);
      return false;
    }
  }

  async checkIgorInUsersTable() {
    console.log('\n=== VERIFICANDO IGOR NA TABELA USERS ===');
    
    try {
      // Buscar por auth_id do Igor
      const { data: userByAuthId, error: error1 } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('auth_id', this.results.igorAuthId)
        .single();

      if (error1 && error1.code !== 'PGRST116') {
        console.error('❌ Erro ao buscar por auth_id:', error1);
      } else if (userByAuthId) {
        console.log('✅ Usuário encontrado por auth_id:', userByAuthId);
        this.results.igorUserInTable = userByAuthId;
      } else {
        console.log('❌ Nenhum usuário encontrado com auth_id:', this.results.igorAuthId);
      }

      // Buscar por email do Igor
      const { data: userByEmail, error: error2 } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('email', 'igor_pk_@hotmail.com');

      if (error2) {
        console.error('❌ Erro ao buscar por email:', error2);
      } else if (userByEmail && userByEmail.length > 0) {
        console.log('✅ Usuário(s) encontrado(s) por email:');
        userByEmail.forEach((user, index) => {
          console.log(`   ${index + 1}. ID: ${user.id}, Auth ID: ${user.auth_id}, Nome: ${user.nome}`);
        });
      } else {
        console.log('❌ Nenhum usuário encontrado com email: igor_pk_@hotmail.com');
      }

      // Buscar pelo ID retornado pela RPC
      const { data: userByRpcId, error: error3 } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('id', this.results.rpcReturnedId)
        .single();

      if (error3 && error3.code !== 'PGRST116') {
        console.error('❌ Erro ao buscar por RPC ID:', error3);
      } else if (userByRpcId) {
        console.log('✅ Usuário encontrado com ID retornado pela RPC:', userByRpcId);
      } else {
        console.log('❌ Nenhum usuário encontrado com ID da RPC:', this.results.rpcReturnedId);
      }

    } catch (error) {
      console.error('❌ Erro inesperado ao verificar Igor:', error);
    }
  }

  async getAllUsers() {
    console.log('\n=== LISTANDO TODOS OS USUÁRIOS DA TABELA USERS ===');
    
    try {
      const { data: users, error } = await supabaseAdmin
        .from('users')
        .select('id, auth_id, email, nome, created_at')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Erro ao buscar usuários:', error);
        return;
      }

      console.log(`📊 Total de usuários encontrados: ${users.length}`);
      console.log('\n📋 Lista de usuários:');
      
      users.forEach((user, index) => {
        console.log(`${index + 1}. ID: ${user.id}`);
        console.log(`   Auth ID: ${user.auth_id || 'NULL'}`);
        console.log(`   Email: ${user.email || 'NULL'}`);
        console.log(`   Nome: ${user.nome || 'NULL'}`);
        console.log(`   Criado em: ${user.created_at}`);
        console.log('   ---');
      });

      this.results.allUsers = users;
      return users;
    } catch (error) {
      console.error('❌ Erro inesperado ao listar usuários:', error);
      return [];
    }
  }

  async getAuthUsers() {
    console.log('\n=== TENTANDO ACESSAR TABELA AUTH.USERS ===');
    
    try {
      // Tentar acessar auth.users (pode não funcionar devido a RLS)
      const { data: authUsers, error } = await supabaseAdmin
        .from('auth.users')
        .select('id, email, created_at')
        .limit(10);

      if (error) {
        console.log('⚠️  Não foi possível acessar auth.users:', error.message);
        console.log('   (Isso é normal devido às políticas de segurança)');
      } else {
        console.log('✅ Usuários da tabela auth.users:');
        authUsers.forEach((user, index) => {
          console.log(`${index + 1}. ID: ${user.id}, Email: ${user.email}`);
        });
        this.results.authUsers = authUsers;
      }
    } catch (error) {
      console.log('⚠️  Erro ao acessar auth.users:', error.message);
    }
  }

  async checkForDuplicatesAndInconsistencies() {
    console.log('\n=== VERIFICANDO DUPLICATAS E INCONSISTÊNCIAS ===');
    
    const users = this.results.allUsers;
    
    // Verificar duplicatas por email
    const emailMap = new Map();
    const authIdMap = new Map();
    
    users.forEach(user => {
      // Duplicatas por email
      if (user.email) {
        if (emailMap.has(user.email)) {
          emailMap.get(user.email).push(user);
        } else {
          emailMap.set(user.email, [user]);
        }
      }
      
      // Duplicatas por auth_id
      if (user.auth_id) {
        if (authIdMap.has(user.auth_id)) {
          authIdMap.get(user.auth_id).push(user);
        } else {
          authIdMap.set(user.auth_id, [user]);
        }
      }
    });

    // Reportar duplicatas por email
    console.log('\n🔍 Verificando duplicatas por email:');
    let emailDuplicates = 0;
    emailMap.forEach((userList, email) => {
      if (userList.length > 1) {
        emailDuplicates++;
        console.log(`❌ Email duplicado: ${email}`);
        userList.forEach(user => {
          console.log(`   - ID: ${user.id}, Auth ID: ${user.auth_id}, Nome: ${user.nome}`);
        });
      }
    });
    if (emailDuplicates === 0) {
      console.log('✅ Nenhuma duplicata por email encontrada');
    }

    // Reportar duplicatas por auth_id
    console.log('\n🔍 Verificando duplicatas por auth_id:');
    let authIdDuplicates = 0;
    authIdMap.forEach((userList, authId) => {
      if (userList.length > 1) {
        authIdDuplicates++;
        console.log(`❌ Auth ID duplicado: ${authId}`);
        userList.forEach(user => {
          console.log(`   - ID: ${user.id}, Email: ${user.email}, Nome: ${user.nome}`);
        });
      }
    });
    if (authIdDuplicates === 0) {
      console.log('✅ Nenhuma duplicata por auth_id encontrada');
    }

    // Verificar usuários sem auth_id
    const usersWithoutAuthId = users.filter(user => !user.auth_id);
    console.log(`\n🔍 Usuários sem auth_id: ${usersWithoutAuthId.length}`);
    usersWithoutAuthId.forEach(user => {
      console.log(`   - ID: ${user.id}, Email: ${user.email}, Nome: ${user.nome}`);
    });

    // Verificar usuários sem email
    const usersWithoutEmail = users.filter(user => !user.email);
    console.log(`\n🔍 Usuários sem email: ${usersWithoutEmail.length}`);
    usersWithoutEmail.forEach(user => {
      console.log(`   - ID: ${user.id}, Auth ID: ${user.auth_id}, Nome: ${user.nome}`);
    });

    this.results.analysis = {
      totalUsers: users.length,
      emailDuplicates,
      authIdDuplicates,
      usersWithoutAuthId: usersWithoutAuthId.length,
      usersWithoutEmail: usersWithoutEmail.length
    };
  }

  async testRpcFunction() {
    console.log('\n=== TESTANDO FUNÇÃO RPC get_current_user_table_id ===');
    
    try {
      const { data: rpcResult, error } = await supabasePublic.rpc('get_current_user_table_id');
      
      if (error) {
        console.error('❌ Erro na função RPC:', error);
      } else {
        console.log('✅ Resultado da RPC:', rpcResult);
        console.log('🔍 Comparação:');
        console.log(`   Auth ID do Igor: ${this.results.igorAuthId}`);
        console.log(`   ID retornado pela RPC: ${rpcResult}`);
        console.log(`   São iguais? ${this.results.igorAuthId === rpcResult ? '✅ SIM' : '❌ NÃO'}`);
        
        this.results.rpcReturnedId = rpcResult;
      }
    } catch (error) {
      console.error('❌ Erro inesperado na RPC:', error);
    }
  }

  generateReport() {
    console.log('\n' + '='.repeat(60));
    console.log('📊 RELATÓRIO FINAL DE INVESTIGAÇÃO');
    console.log('='.repeat(60));
    
    console.log('\n🎯 PROBLEMA IDENTIFICADO:');
    console.log(`   Auth ID do Igor: ${this.results.igorAuthId}`);
    console.log(`   ID retornado pela RPC: ${this.results.rpcReturnedId}`);
    console.log(`   Inconsistência: ${this.results.igorAuthId !== this.results.rpcReturnedId ? '❌ SIM' : '✅ NÃO'}`);
    
    console.log('\n📈 ESTATÍSTICAS:');
    console.log(`   Total de usuários: ${this.results.analysis.totalUsers}`);
    console.log(`   Duplicatas por email: ${this.results.analysis.emailDuplicates}`);
    console.log(`   Duplicatas por auth_id: ${this.results.analysis.authIdDuplicates}`);
    console.log(`   Usuários sem auth_id: ${this.results.analysis.usersWithoutAuthId}`);
    console.log(`   Usuários sem email: ${this.results.analysis.usersWithoutEmail}`);
    
    console.log('\n💡 PRÓXIMOS PASSOS:');
    if (this.results.igorAuthId !== this.results.rpcReturnedId) {
      console.log('   1. Verificar implementação da função RPC get_current_user_table_id');
      console.log('   2. Verificar se há problema na associação auth_id -> user_id');
      console.log('   3. Considerar corrigir dados inconsistentes');
    } else {
      console.log('   ✅ Não há inconsistência detectada');
    }
    
    return this.results;
  }

  async investigate() {
    console.log('🔍 INICIANDO INVESTIGAÇÃO DE INCONSISTÊNCIAS DE USUÁRIOS');
    console.log('='.repeat(60));
    
    try {
      // 1. Login como Igor
      const loginSuccess = await this.loginAsIgor();
      if (!loginSuccess) {
        console.error('❌ Falha no login. Abortando investigação.');
        return;
      }

      // 2. Testar função RPC
      await this.testRpcFunction();
      
      // 3. Verificar Igor na tabela users
      await this.checkIgorInUsersTable();
      
      // 4. Listar todos os usuários
      await this.getAllUsers();
      
      // 5. Tentar acessar auth.users
      await this.getAuthUsers();
      
      // 6. Verificar duplicatas e inconsistências
      await this.checkForDuplicatesAndInconsistencies();
      
      // 7. Gerar relatório final
      const report = this.generateReport();
      
      // 8. Salvar relatório em arquivo
      const fs = await import('fs');
      fs.writeFileSync('user-inconsistency-report.json', JSON.stringify(report, null, 2));
      console.log('\n💾 Relatório salvo em: user-inconsistency-report.json');
      
    } catch (error) {
      console.error('❌ Erro durante a investigação:', error);
    }
  }
}

// Executar investigação
const investigator = new UserInconsistencyInvestigator();
investigator.investigate().then(() => {
  console.log('\n🏁 Investigação concluída!');
  process.exit(0);
}).catch(error => {
  console.error('❌ Erro fatal:', error);
  process.exit(1);
});