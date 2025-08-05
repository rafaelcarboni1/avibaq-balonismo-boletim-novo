import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://elcbodhxzvoqpzamgown.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVsY2JvZGh4enZvcXB6YW1nb3duIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEzMDQ3ODAsImV4cCI6MjA2Njg4MDc4MH0.wr15r6xgR0vAlnna2S7qs4RCLgWEPGqQZLq8jaW3BTw';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVsY2JvZGh4enZvcXB6YW1nb3duIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTMwNDc4MCwiZXhwIjoyMDY2ODgwNzgwfQ.UfTwpvPuw4ffuPHS9UPBIMNYPOuSmde8WxnN4FXVSAs';

const supabasePublic = createClient(supabaseUrl, supabaseAnonKey);
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

class RPCTester {
  constructor() {
    this.results = {
      loginSuccess: false,
      userAuthId: null,
      rpcResult: null,
      userTableData: null,
      debugResult: null
    };
  }

  log(step, message) {
    console.log(`[${step}] ${message}`);
  }

  async testLogin() {
    this.log('LOGIN', 'Fazendo login com credenciais do Igor...');
    
    try {
      const { data, error } = await supabasePublic.auth.signInWithPassword({
        email: 'igor_pk_@hotmail.com',
        password: 'igorniehues'
      });

      if (error) {
        console.error('❌ Erro no login:', error.message);
        return false;
      }

      if (data.user) {
        this.results.loginSuccess = true;
        this.results.userAuthId = data.user.id;
        this.log('LOGIN', `✅ Login realizado com sucesso`);
        this.log('LOGIN', `   Auth ID: ${data.user.id}`);
        this.log('LOGIN', `   Email: ${data.user.email}`);
        return true;
      }
    } catch (error) {
      console.error('❌ Erro inesperado no login:', error);
      return false;
    }

    return false;
  }

  async testRPCFunction() {
    this.log('RPC', 'Testando função get_current_user_table_id...');
    
    try {
      const { data, error } = await supabasePublic.rpc('get_current_user_table_id');

      if (error) {
        console.error('❌ Erro na função RPC:', error);
        this.results.rpcResult = { error: error.message };
        return null;
      }

      this.results.rpcResult = data;
      this.log('RPC', `✅ Função RPC executada`);
      this.log('RPC', `   Resultado: ${data}`);
      return data;
    } catch (error) {
      console.error('❌ Erro inesperado na RPC:', error);
      this.results.rpcResult = { error: error.message };
      return null;
    }
  }

  async testDebugFunction() {
    this.log('DEBUG', 'Testando função debug_get_current_user_table_id...');
    
    try {
      const { data, error } = await supabasePublic.rpc('debug_get_current_user_table_id');

      if (error) {
        console.error('❌ Erro na função debug:', error);
        this.results.debugResult = { error: error.message };
        return null;
      }

      this.results.debugResult = data;
      this.log('DEBUG', `✅ Função debug executada`);
      this.log('DEBUG', `   Resultado:`, JSON.stringify(data, null, 2));
      return data;
    } catch (error) {
      console.error('❌ Erro inesperado na debug:', error);
      this.results.debugResult = { error: error.message };
      return null;
    }
  }

  async getUserTableData() {
    this.log('DATA', 'Buscando dados do Igor na tabela users...');
    
    try {
      // Buscar por auth_id
      const { data: userByAuthId, error: authError } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('auth_id', this.results.userAuthId)
        .single();

      if (authError && authError.code !== 'PGRST116') {
        console.error('❌ Erro ao buscar por auth_id:', authError);
      }

      // Buscar por email
      const { data: userByEmail, error: emailError } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('email', 'igor_pk_@hotmail.com')
        .single();

      if (emailError && emailError.code !== 'PGRST116') {
        console.error('❌ Erro ao buscar por email:', emailError);
      }

      this.results.userTableData = {
        byAuthId: userByAuthId,
        byEmail: userByEmail
      };

      this.log('DATA', '✅ Dados da tabela users:');
      if (userByAuthId) {
        this.log('DATA', `   Por auth_id: ID=${userByAuthId.id}, Nome=${userByAuthId.nome}`);
      } else {
        this.log('DATA', '   Por auth_id: Não encontrado');
      }
      
      if (userByEmail) {
        this.log('DATA', `   Por email: ID=${userByEmail.id}, Nome=${userByEmail.nome}, auth_id=${userByEmail.auth_id}`);
      } else {
        this.log('DATA', '   Por email: Não encontrado');
      }

      return { userByAuthId, userByEmail };
    } catch (error) {
      console.error('❌ Erro inesperado ao buscar dados:', error);
      return null;
    }
  }

  async analyzeResults() {
    this.log('ANALYSIS', '=== ANÁLISE DOS RESULTADOS ===');
    
    console.log('\n📊 RESUMO:');
    console.log(`   Login realizado: ${this.results.loginSuccess ? '✅' : '❌'}`);
    console.log(`   Auth ID do login: ${this.results.userAuthId}`);
    console.log(`   Resultado da RPC: ${this.results.rpcResult}`);
    
    if (this.results.userTableData) {
      const { byAuthId, byEmail } = this.results.userTableData;
      
      console.log('\n🔍 INCONSISTÊNCIAS IDENTIFICADAS:');
      
      if (!byAuthId && byEmail) {
        console.log('❌ PROBLEMA: Usuário existe na tabela users mas auth_id não está sincronizado');
        console.log(`   - Auth ID do login: ${this.results.userAuthId}`);
        console.log(`   - Auth ID na tabela: ${byEmail.auth_id}`);
        console.log(`   - ID da tabela users: ${byEmail.id}`);
        
        if (this.results.rpcResult === byEmail.id) {
          console.log('✅ A função RPC está retornando o ID correto da tabela users');
        } else {
          console.log('❌ A função RPC não está retornando o ID correto');
        }
      } else if (byAuthId) {
        console.log('✅ Usuário encontrado por auth_id - sincronização OK');
      } else {
        console.log('❌ PROBLEMA CRÍTICO: Usuário não encontrado na tabela users');
      }
    }
    
    if (this.results.debugResult) {
      console.log('\n🐛 DEBUG INFO:');
      console.log(JSON.stringify(this.results.debugResult, null, 2));
    }
  }

  async runFullTest() {
    console.log('🧪 INICIANDO TESTE COMPLETO DA FUNÇÃO RPC\n');
    
    // 1. Login
    const loginSuccess = await this.testLogin();
    if (!loginSuccess) {
      console.log('❌ Teste interrompido - falha no login');
      return;
    }
    
    // 2. Buscar dados da tabela
    await this.getUserTableData();
    
    // 3. Testar função RPC
    await this.testRPCFunction();
    
    // 4. Testar função debug
    await this.testDebugFunction();
    
    // 5. Análise
    await this.analyzeResults();
    
    // 6. Salvar relatório
    const reportPath = 'rpc-test-report.json';
    const fs = await import('fs');
    fs.writeFileSync(reportPath, JSON.stringify({
      timestamp: new Date().toISOString(),
      testResults: this.results,
      summary: {
        loginSuccess: this.results.loginSuccess,
        rpcWorking: this.results.rpcResult !== null && !this.results.rpcResult.error,
        authIdSynced: this.results.userTableData?.byAuthId !== null
      }
    }, null, 2));
    
    console.log(`\n📄 Relatório salvo em: ${reportPath}`);
  }
}

// Executar teste
const tester = new RPCTester();
tester.runFullTest().catch(console.error);