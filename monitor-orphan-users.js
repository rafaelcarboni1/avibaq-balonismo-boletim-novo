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

// Configurações do monitoramento
const MONITORING_CONFIG = {
  // Intervalo de verificação em minutos
  checkIntervalMinutes: 30,
  // Arquivo de log
  logFile: path.join(__dirname, 'orphan-users-monitor.log'),
  // Arquivo de relatório
  reportFile: path.join(__dirname, 'orphan-users-daily-report.json'),
  // Limite de usuários órfãos para alerta
  alertThreshold: 5,
  // Email para alertas (configurar se necessário)
  alertEmail: null
};

class OrphanUserMonitor {
  constructor() {
    this.isRunning = false;
    this.intervalId = null;
    this.stats = {
      totalChecks: 0,
      orphansFound: 0,
      orphansFixed: 0,
      lastCheck: null,
      errors: 0
    };
  }

  log(message, level = 'INFO') {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [${level}] ${message}`;
    
    console.log(logMessage);
    
    // Salvar no arquivo de log
    try {
      fs.appendFileSync(MONITORING_CONFIG.logFile, logMessage + '\n');
    } catch (error) {
      console.error('Erro ao escrever no log:', error.message);
    }
  }

  async checkOrphanUsers() {
    try {
      this.log('🔍 Iniciando verificação de usuários órfãos...');
      
      // Buscar usuários do auth
      const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
      
      if (authError) {
        throw new Error(`Erro ao buscar usuários do auth: ${authError.message}`);
      }
      
      // Buscar usuários em public.users
      const { data: publicUsers, error: publicError } = await supabase
        .from('users')
        .select('auth_id, email');
      
      if (publicError) {
        throw new Error(`Erro ao buscar usuários públicos: ${publicError.message}`);
      }
      
      // Identificar órfãos
      const existingAuthIds = new Set(publicUsers.map(u => u.auth_id).filter(Boolean));
      const orphanUsers = authUsers.users.filter(authUser => !existingAuthIds.has(authUser.id));
      
      this.stats.totalChecks++;
      this.stats.lastCheck = new Date().toISOString();
      
      if (orphanUsers.length > 0) {
        this.stats.orphansFound += orphanUsers.length;
        this.log(`⚠️  ALERTA: ${orphanUsers.length} usuários órfãos encontrados!`, 'WARN');
        
        // Listar usuários órfãos
        orphanUsers.forEach(user => {
          this.log(`   - ${user.email} (ID: ${user.id}, Criado: ${user.created_at})`);
        });
        
        // Auto-correção se habilitada
        if (orphanUsers.length <= MONITORING_CONFIG.alertThreshold) {
          this.log('🔧 Iniciando auto-correção...');
          const fixed = await this.autoFixOrphanUsers(orphanUsers);
          this.stats.orphansFixed += fixed;
          this.log(`✅ ${fixed} usuários órfãos corrigidos automaticamente`);
        } else {
          this.log(`❌ Muitos usuários órfãos (${orphanUsers.length}). Intervenção manual necessária!`, 'ERROR');
          await this.sendAlert(orphanUsers);
        }
      } else {
        this.log('✅ Nenhum usuário órfão encontrado');
      }
      
      return {
        orphansFound: orphanUsers.length,
        totalAuthUsers: authUsers.users.length,
        totalPublicUsers: publicUsers.length
      };
      
    } catch (error) {
      this.stats.errors++;
      this.log(`❌ Erro na verificação: ${error.message}`, 'ERROR');
      throw error;
    }
  }

  async autoFixOrphanUsers(orphanUsers) {
    let fixedCount = 0;
    
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
          this.log(`❌ Erro ao corrigir usuário ${authUser.email}: ${insertError.message}`, 'ERROR');
        } else {
          this.log(`✅ Usuário ${authUser.email} corrigido com sucesso`);
          fixedCount++;
        }
      } catch (error) {
        this.log(`❌ Erro ao processar usuário ${authUser.email}: ${error.message}`, 'ERROR');
      }
    }
    
    return fixedCount;
  }

  async sendAlert(orphanUsers) {
    // Implementar envio de alerta (email, webhook, etc.)
    this.log(`🚨 ALERTA CRÍTICO: ${orphanUsers.length} usuários órfãos requerem atenção!`, 'CRITICAL');
    
    // Salvar relatório de alerta
    const alertReport = {
      timestamp: new Date().toISOString(),
      type: 'CRITICAL_ORPHAN_USERS',
      count: orphanUsers.length,
      users: orphanUsers.map(u => ({
        id: u.id,
        email: u.email,
        created_at: u.created_at,
        last_sign_in_at: u.last_sign_in_at
      }))
    };
    
    const alertFile = path.join(__dirname, `alert-${Date.now()}.json`);
    fs.writeFileSync(alertFile, JSON.stringify(alertReport, null, 2));
    this.log(`📄 Relatório de alerta salvo em: ${alertFile}`);
  }

  async generateDailyReport() {
    const report = {
      date: new Date().toISOString().split('T')[0],
      timestamp: new Date().toISOString(),
      stats: { ...this.stats },
      status: this.isRunning ? 'RUNNING' : 'STOPPED'
    };
    
    try {
      fs.writeFileSync(MONITORING_CONFIG.reportFile, JSON.stringify(report, null, 2));
      this.log(`📊 Relatório diário gerado: ${MONITORING_CONFIG.reportFile}`);
    } catch (error) {
      this.log(`❌ Erro ao gerar relatório diário: ${error.message}`, 'ERROR');
    }
  }

  start() {
    if (this.isRunning) {
      this.log('⚠️  Monitor já está em execução');
      return;
    }
    
    this.log('🚀 Iniciando monitor de usuários órfãos...');
    this.log(`⏰ Intervalo de verificação: ${MONITORING_CONFIG.checkIntervalMinutes} minutos`);
    this.log(`📝 Log: ${MONITORING_CONFIG.logFile}`);
    this.log(`📊 Relatório: ${MONITORING_CONFIG.reportFile}`);
    
    this.isRunning = true;
    
    // Primeira verificação imediata
    this.checkOrphanUsers().catch(error => {
      this.log(`❌ Erro na verificação inicial: ${error.message}`, 'ERROR');
    });
    
    // Configurar verificações periódicas
    this.intervalId = setInterval(async () => {
      try {
        await this.checkOrphanUsers();
      } catch (error) {
        this.log(`❌ Erro na verificação periódica: ${error.message}`, 'ERROR');
      }
    }, MONITORING_CONFIG.checkIntervalMinutes * 60 * 1000);
    
    // Gerar relatório diário
    const dailyReportInterval = setInterval(() => {
      this.generateDailyReport();
    }, 24 * 60 * 60 * 1000); // 24 horas
    
    // Salvar referência para limpeza
    this.dailyReportInterval = dailyReportInterval;
    
    this.log('✅ Monitor iniciado com sucesso');
  }

  stop() {
    if (!this.isRunning) {
      this.log('⚠️  Monitor já está parado');
      return;
    }
    
    this.log('🛑 Parando monitor de usuários órfãos...');
    
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    
    if (this.dailyReportInterval) {
      clearInterval(this.dailyReportInterval);
      this.dailyReportInterval = null;
    }
    
    this.isRunning = false;
    
    // Gerar relatório final
    this.generateDailyReport();
    
    this.log('✅ Monitor parado com sucesso');
  }

  getStats() {
    return {
      ...this.stats,
      isRunning: this.isRunning,
      uptime: this.isRunning ? 'Em execução' : 'Parado'
    };
  }
}

// Função para executar verificação única
async function runSingleCheck() {
  const monitor = new OrphanUserMonitor();
  
  try {
    console.log('🔍 Executando verificação única de usuários órfãos...');
    const result = await monitor.checkOrphanUsers();
    
    console.log('📊 Resultado da verificação:');
    console.log(`   - Usuários órfãos: ${result.orphansFound}`);
    console.log(`   - Total auth.users: ${result.totalAuthUsers}`);
    console.log(`   - Total public.users: ${result.totalPublicUsers}`);
    
    return result;
  } catch (error) {
    console.error('❌ Erro na verificação:', error.message);
    throw error;
  }
}

// Função principal
async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'check';
  
  switch (command) {
    case 'start':
      const monitor = new OrphanUserMonitor();
      monitor.start();
      
      // Manter o processo vivo
      process.on('SIGINT', () => {
        console.log('\n🛑 Recebido sinal de interrupção...');
        monitor.stop();
        process.exit(0);
      });
      
      // Manter o processo rodando
      setInterval(() => {}, 1000);
      break;
      
    case 'check':
      await runSingleCheck();
      break;
      
    case 'stats':
      // Ler estatísticas do arquivo de relatório
      try {
        const reportData = fs.readFileSync(MONITORING_CONFIG.reportFile, 'utf8');
        const report = JSON.parse(reportData);
        console.log('📊 Estatísticas do Monitor:');
        console.log(JSON.stringify(report, null, 2));
      } catch (error) {
        console.log('❌ Nenhum relatório encontrado. Execute uma verificação primeiro.');
      }
      break;
      
    default:
      console.log('📖 Uso do Monitor de Usuários Órfãos:');
      console.log('  node monitor-orphan-users.js check    - Verificação única');
      console.log('  node monitor-orphan-users.js start    - Iniciar monitoramento contínuo');
      console.log('  node monitor-orphan-users.js stats    - Mostrar estatísticas');
      break;
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  main().catch(error => {
    console.error('💥 Erro:', error.message);
    process.exit(1);
  });
}

module.exports = { OrphanUserMonitor, runSingleCheck };