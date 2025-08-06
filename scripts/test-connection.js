#!/usr/bin/env node

/**
 * Script de teste de conexão com Supabase
 * Testa diferentes métodos de conexão e verifica dependências
 */

const fs = require('fs');
const path = require('path');

// Verificar se o pacote pg está instalado
function checkDependencies() {
  console.log('🔍 Verificando dependências...');
  
  try {
    require.resolve('pg');
    console.log('✅ Pacote pg encontrado');
    return true;
  } catch (error) {
    console.log('❌ Pacote pg não encontrado');
    console.log('\n📦 Para instalar, execute:');
    console.log('npm install pg');
    console.log('\nOu se preferir:');
    console.log('yarn add pg');
    return false;
  }
}

// Tentar diferentes connection strings
async function testConnections() {
  if (!checkDependencies()) {
    return;
  }

  const { Client } = require('pg');
  
  const connectionOptions = [
    {
      name: 'Connection String Completa',
      config: {
        connectionString: 'postgresql://postgres:[YOUR-PASSWORD]@db.elcbodhxzvoqpzamgown.supabase.co:5432/postgres',
        ssl: { rejectUnauthorized: false }
      }
    },
    {
      name: 'Configuração Separada',
      config: {
        host: 'db.elcbodhxzvoqpzamgown.supabase.co',
        port: 5432,
        database: 'postgres',
        user: 'postgres',
        password: '[YOUR-PASSWORD]',
        ssl: { rejectUnauthorized: false }
      }
    },
    {
      name: 'Com Pool de Conexões',
      config: {
        connectionString: 'postgresql://postgres:[YOUR-PASSWORD]@db.elcbodhxzvoqpzamgown.supabase.co:6543/postgres',
        ssl: { rejectUnauthorized: false }
      }
    }
  ];

  console.log('\n🔗 Testando conexões com Supabase...');
  console.log('⚠️  LEMBRE-SE: Substitua [YOUR-PASSWORD] pela senha real!\n');

  for (const option of connectionOptions) {
    console.log(`📡 Testando: ${option.name}`);
    
    // Verificar se ainda tem placeholder
    const configStr = JSON.stringify(option.config);
    if (configStr.includes('[YOUR-PASSWORD]')) {
      console.log('⚠️  Senha não configurada (ainda contém [YOUR-PASSWORD])');
      console.log('   Configure a senha real antes de testar\n');
      continue;
    }

    const client = new Client(option.config);
    
    try {
      console.log('   Conectando...');
      await client.connect();
      
      console.log('   ✅ Conexão estabelecida!');
      
      // Teste básico
      const result = await client.query('SELECT current_database(), current_user, version()');
      console.log(`   📊 Database: ${result.rows[0].current_database}`);
      console.log(`   👤 User: ${result.rows[0].current_user}`);
      console.log(`   🐘 PostgreSQL: ${result.rows[0].version.split(' ')[1]}`);
      
      // Teste de tabelas
      const tablesResult = await client.query(`
        SELECT COUNT(*) as table_count 
        FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
      `);
      console.log(`   📋 Tabelas públicas: ${tablesResult.rows[0].table_count}`);
      
      console.log('   🎉 Teste concluído com sucesso!\n');
      
      await client.end();
      return true;
      
    } catch (error) {
      console.log(`   ❌ Erro: ${error.message}`);
      
      // Diagnóstico do erro
      if (error.message.includes('password authentication failed')) {
        console.log('   💡 Dica: Verifique se a senha está correta');
      } else if (error.message.includes('ECONNREFUSED')) {
        console.log('   💡 Dica: Verifique conectividade de rede');
      } else if (error.message.includes('timeout')) {
        console.log('   💡 Dica: Conexão muito lenta, tente novamente');
      }
      
      console.log('');
      
      try {
        await client.end();
      } catch (endError) {
        // Ignorar erro ao fechar conexão
      }
    }
  }
  
  return false;
}

// Gerar template de configuração
function generateConfigTemplate() {
  const template = `
// ⚙️ TEMPLATE DE CONFIGURAÇÃO
// Copie e cole no script principal, substituindo [YOUR-PASSWORD]

const connectionString = 'postgresql://postgres:SUA_SENHA_AQUI@db.elcbodhxzvoqpzamgown.supabase.co:5432/postgres';

// OU use configuração separada:
const config = {
  host: 'db.elcbodhxzvoqpzamgown.supabase.co',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: 'SUA_SENHA_AQUI',
  ssl: { rejectUnauthorized: false }
};
`;
  
  console.log(template);
}

// Verificar informações do projeto
function showProjectInfo() {
  console.log('📋 INFORMAÇÕES DO PROJETO SUPABASE\n');
  console.log('🆔 Project ID: elcbodhxzvoqpzamgown');
  console.log('🌐 URL: https://elcbodhxzvoqpzamgown.supabase.co');
  console.log('🗄️  Database Host: db.elcbodhxzvoqpzamgown.supabase.co');
  console.log('🔌 Porta Direta: 5432');
  console.log('🔌 Porta Pooling: 6543');
  console.log('👤 Usuário: postgres');
  console.log('🔑 Senha: [NECESSÁRIA - obter no Dashboard]\n');
  
  console.log('📍 COMO OBTER A SENHA:');
  console.log('1. Acesse: https://supabase.com/dashboard/project/elcbodhxzvoqpzamgown');
  console.log('2. Vá em Settings → Database');
  console.log('3. Na seção Connection Info, veja a senha ou reset');
  console.log('4. Copie a senha e substitua [YOUR-PASSWORD] nos scripts\n');
}

// Função principal
async function main() {
  console.log('🔍 TESTE DE CONEXÃO SUPABASE\n');
  
  showProjectInfo();
  
  const success = await testConnections();
  
  if (!success) {
    console.log('❌ Nenhuma conexão foi bem-sucedida\n');
    generateConfigTemplate();
    
    console.log('\n🔧 PRÓXIMOS PASSOS:');
    console.log('1. Obtenha a senha no Supabase Dashboard');
    console.log('2. Substitua [YOUR-PASSWORD] pela senha real');
    console.log('3. Execute novamente: node scripts/test-connection.js');
    console.log('4. Após sucesso, execute: node scripts/analyze-database-direct.js');
  } else {
    console.log('🎉 CONEXÃO FUNCIONANDO!');
    console.log('\n✅ Agora você pode executar a análise completa:');
    console.log('node scripts/analyze-database-direct.js');
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { testConnections, checkDependencies };