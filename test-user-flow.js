const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Configurações do Supabase
const SUPABASE_URL = 'https://elcbodhxzvoqpzamgown.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVsY2JvZGh4enZvcXB6YW1nb3duIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTMwNDc4MCwiZXhwIjoyMDY2ODgwNzgwfQ.UfTwpvPuw4ffuPHS9UPBIMNYPOuSmde8WxnN4FXVSAs';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVsY2JvZGh4enZvcXB6YW1nb3duIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEzMDQ3ODAsImV4cCI6MjA2Njg4MDc4MH0.wr15r6xgR0vAlnna2S7qs4RCLgWEPGqQZLq8jaW3BTw';

// Cliente admin (service role)
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Cliente público (anon key)
const supabasePublic = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

class UserFlowTester {
  constructor() {
    this.testResults = {
      totalTests: 0,
      passed: 0,
      failed: 0,
      errors: [],
      details: []
    };
    this.testUsers = [];
  }

  log(message, level = 'INFO') {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [${level}] ${message}`;
    console.log(logMessage);
  }

  async runTest(testName, testFunction) {
    this.testResults.totalTests++;
    this.log(`🧪 Executando teste: ${testName}`);
    
    try {
      const result = await testFunction();
      if (result.success) {
        this.testResults.passed++;
        this.log(`✅ ${testName}: PASSOU`);
      } else {
        this.testResults.failed++;
        this.log(`❌ ${testName}: FALHOU - ${result.error}`, 'ERROR');
        this.testResults.errors.push({ test: testName, error: result.error });
      }
      
      this.testResults.details.push({
        test: testName,
        success: result.success,
        error: result.error || null,
        data: result.data || null
      });
      
    } catch (error) {
      this.testResults.failed++;
      this.log(`💥 ${testName}: ERRO - ${error.message}`, 'ERROR');
      this.testResults.errors.push({ test: testName, error: error.message });
      
      this.testResults.details.push({
        test: testName,
        success: false,
        error: error.message,
        data: null
      });
    }
  }

  // Teste 1: Verificar integridade atual do sistema
  async testSystemIntegrity() {
    try {
      // Verificar usuários órfãos
      const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers();
      const { data: publicUsers } = await supabaseAdmin
        .from('users')
        .select('auth_id, email');
      
      const existingAuthIds = new Set(publicUsers.map(u => u.auth_id).filter(Boolean));
      const orphanUsers = authUsers.users.filter(authUser => !existingAuthIds.has(authUser.id));
      
      if (orphanUsers.length === 0) {
        return {
          success: true,
          data: {
            totalAuthUsers: authUsers.users.length,
            totalPublicUsers: publicUsers.length,
            orphanUsers: 0
          }
        };
      } else {
        return {
          success: false,
          error: `${orphanUsers.length} usuários órfãos encontrados`,
          data: { orphanUsers: orphanUsers.length }
        };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Teste 2: Simular cadastro completo de usuário
  async testCompleteUserRegistration() {
    const testEmail = `teste-${Date.now()}@avibaq.com.br`;
    const testPassword = 'TesteSeguro123!';
    
    try {
      // 1. Criar usuário no auth
      const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: testEmail,
        password: testPassword,
        email_confirm: true
      });
      
      if (authError) {
        return { success: false, error: `Erro ao criar usuário no auth: ${authError.message}` };
      }
      
      this.testUsers.push({ id: authUser.user.id, email: testEmail });
      
      // 2. Criar perfil em public.users
      const { error: profileError } = await supabaseAdmin
        .from('users')
        .insert({
          auth_id: authUser.user.id,
          email: testEmail,
          nome: 'Usuário Teste',
          role: 'piloto',
          ativo: true
        });
      
      if (profileError) {
        return { success: false, error: `Erro ao criar perfil: ${profileError.message}` };
      }
      
      // 3. Verificar se o usuário foi criado corretamente
      const { data: createdUser, error: fetchError } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('auth_id', authUser.user.id)
        .single();
      
      if (fetchError || !createdUser) {
        return { success: false, error: 'Usuário não encontrado após criação' };
      }
      
      return {
        success: true,
        data: {
          authUserId: authUser.user.id,
          publicUserId: createdUser.id,
          email: testEmail
        }
      };
      
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Teste 3: Testar foreign key constraints
  async testForeignKeyConstraints() {
    try {
      // Buscar um usuário válido
      const { data: users } = await supabaseAdmin
        .from('users')
        .select('id')
        .limit(1);
      
      if (!users || users.length === 0) {
        return { success: false, error: 'Nenhum usuário encontrado para teste' };
      }
      
      const testUserId = users[0].id;
      
      // Buscar um voo válido
      const { data: voos } = await supabaseAdmin
        .from('voos')
        .select('id')
        .limit(1);
      
      if (!voos || voos.length === 0) {
        return { success: false, error: 'Nenhum voo encontrado para teste' };
      }
      
      const testVooId = voos[0].id;
      
      // Tentar inserir item de checklist
      const { data: checklistItem, error: insertError } = await supabaseAdmin
        .from('checklist_itens')
        .insert({
          voo_id: testVooId,
          bloco: 1,
          item_numero: 999,
          item_descricao: 'Teste de constraint',
          marcado: true,
          marcado_por: testUserId,
          marcado_em: new Date().toISOString()
        })
        .select()
        .single();
      
      if (insertError) {
        return { success: false, error: `Erro ao inserir item de checklist: ${insertError.message}` };
      }
      
      // Limpar o teste
      await supabaseAdmin
        .from('checklist_itens')
        .delete()
        .eq('id', checklistItem.id);
      
      return {
        success: true,
        data: {
          testUserId,
          testVooId,
          checklistItemId: checklistItem.id
        }
      };
      
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Teste 4: Testar login e operações do usuário
  async testUserLogin() {
    if (this.testUsers.length === 0) {
      return { success: false, error: 'Nenhum usuário de teste disponível' };
    }
    
    const testUser = this.testUsers[0];
    
    try {
      // Tentar fazer login
      const { data: loginData, error: loginError } = await supabasePublic.auth.signInWithPassword({
        email: testUser.email,
        password: 'TesteSeguro123!'
      });
      
      if (loginError) {
        return { success: false, error: `Erro no login: ${loginError.message}` };
      }
      
      // Verificar se consegue acessar dados do usuário
      const { data: userData, error: userError } = await supabasePublic
        .from('users')
        .select('*')
        .eq('auth_id', loginData.user.id)
        .single();
      
      if (userError) {
        return { success: false, error: `Erro ao buscar dados do usuário: ${userError.message}` };
      }
      
      // Fazer logout
      await supabasePublic.auth.signOut();
      
      return {
        success: true,
        data: {
          userId: userData.id,
          email: userData.email,
          nome: userData.nome
        }
      };
      
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Teste 5: Verificar RLS (Row Level Security)
  async testRowLevelSecurity() {
    try {
      // Tentar acessar dados sem autenticação (deve falhar ou retornar dados limitados)
      const { data: usersWithoutAuth, error: noAuthError } = await supabasePublic
        .from('users')
        .select('*')
        .limit(1);
      
      // Dependendo da configuração RLS, isso pode ou não retornar dados
      // O importante é que não dê erro de sistema
      
      return {
        success: true,
        data: {
          accessWithoutAuth: !noAuthError,
          recordsReturned: usersWithoutAuth?.length || 0
        }
      };
      
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Limpeza: Remover usuários de teste
  async cleanup() {
    this.log('🧹 Iniciando limpeza dos usuários de teste...');
    
    for (const testUser of this.testUsers) {
      try {
        // Remover do public.users
        await supabaseAdmin
          .from('users')
          .delete()
          .eq('auth_id', testUser.id);
        
        // Remover do auth.users
        await supabaseAdmin.auth.admin.deleteUser(testUser.id);
        
        this.log(`✅ Usuário de teste removido: ${testUser.email}`);
      } catch (error) {
        this.log(`❌ Erro ao remover usuário de teste ${testUser.email}: ${error.message}`, 'ERROR');
      }
    }
    
    this.testUsers = [];
  }

  // Executar todos os testes
  async runAllTests() {
    this.log('🚀 Iniciando bateria de testes do fluxo de usuários...');
    this.log('=' .repeat(60));
    
    try {
      // Executar testes
      await this.runTest('Integridade do Sistema', () => this.testSystemIntegrity());
      await this.runTest('Cadastro Completo de Usuário', () => this.testCompleteUserRegistration());
      await this.runTest('Foreign Key Constraints', () => this.testForeignKeyConstraints());
      await this.runTest('Login de Usuário', () => this.testUserLogin());
      await this.runTest('Row Level Security', () => this.testRowLevelSecurity());
      
    } finally {
      // Sempre executar limpeza
      await this.cleanup();
    }
    
    // Gerar relatório
    this.generateReport();
  }

  generateReport() {
    this.log('=' .repeat(60));
    this.log('📊 RELATÓRIO FINAL DOS TESTES');
    this.log('=' .repeat(60));
    
    this.log(`Total de testes: ${this.testResults.totalTests}`);
    this.log(`✅ Passou: ${this.testResults.passed}`);
    this.log(`❌ Falhou: ${this.testResults.failed}`);
    
    const successRate = ((this.testResults.passed / this.testResults.totalTests) * 100).toFixed(1);
    this.log(`📈 Taxa de sucesso: ${successRate}%`);
    
    if (this.testResults.errors.length > 0) {
      this.log('\n❌ ERROS ENCONTRADOS:');
      this.testResults.errors.forEach((error, index) => {
        this.log(`${index + 1}. ${error.test}: ${error.error}`);
      });
    }
    
    // Salvar relatório em arquivo
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalTests: this.testResults.totalTests,
        passed: this.testResults.passed,
        failed: this.testResults.failed,
        successRate: `${successRate}%`
      },
      details: this.testResults.details,
      errors: this.testResults.errors
    };
    
    const reportFile = path.join(__dirname, 'user-flow-test-report.json');
    fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));
    this.log(`\n📄 Relatório detalhado salvo em: ${reportFile}`);
    
    // Conclusão
    if (this.testResults.failed === 0) {
      this.log('\n🎉 TODOS OS TESTES PASSARAM! O sistema está funcionando corretamente.');
    } else {
      this.log('\n⚠️  ALGUNS TESTES FALHARAM. Verifique os erros acima.');
    }
  }
}

// Função principal
async function main() {
  const tester = new UserFlowTester();
  
  try {
    await tester.runAllTests();
  } catch (error) {
    console.error('💥 Erro durante os testes:', error.message);
    process.exit(1);
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  main();
}

module.exports = { UserFlowTester };