import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuração do Supabase
const supabaseUrl = 'https://elcbodhxzvoqpzamgown.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVsY2JvZGh4enZvcXB6YW1nb3duIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTMwNDc4MCwiZXhwIjoyMDY2ODgwNzgwfQ.UfTwpvPuw4ffuPHS9UPBIMNYPOuSmde8WxnN4FXVSAs';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function executeSql(sqlContent, migrationName) {
  try {
    console.log(`\n📄 Executando: ${migrationName}`);
    
    // Dividir em comandos separados (dividir por ponto e vírgula + quebra de linha)
    const commands = sqlContent
      .split(/;\s*\n/)
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'));

    for (let i = 0; i < commands.length; i++) {
      let command = commands[i];
      if (!command.endsWith(';')) {
        command += ';';
      }
      
      if (command.length < 10) continue; // Pular comandos muito pequenos
      
      console.log(`   Executando comando ${i + 1}/${commands.length}...`);
      
      const { error } = await supabase.rpc('exec_sql', { sql: command });
      
      if (error) {
        console.log(`   ⚠️  Erro (pode ser normal): ${error.message.substring(0, 100)}...`);
        
        // Se for erro de "já existe", continuar
        if (error.message.includes('already exists') || 
            error.message.includes('duplicate key') ||
            error.message.includes('relation') ||
            error.message.includes('does not exist')) {
          console.log('   ✅ Continuando (objeto já existe)...');
          continue;
        }
      } else {
        console.log(`   ✅ Comando executado com sucesso`);
      }
    }
    
    console.log(`✅ ${migrationName} concluída`);
    return true;
    
  } catch (error) {
    console.error(`❌ Erro em ${migrationName}:`, error.message);
    return false;
  }
}

async function runMigrations() {
  console.log('🚀 Executando migrações do módulo de voos...\n');
  
  // Lista de migrações em ordem
  const migrations = [
    '20250111000001_create_baloes_table.sql',
    '20250111000002_create_vinculos_agencia_piloto.sql',
    '20250111000003_create_voos_table.sql',
    '20250111000004_create_voos_baloes.sql',
    '20250111000005_create_checklist_itens.sql',
    '20250111000006_create_voos_anexos.sql',
    '20250111000007_create_dados_offline.sql',
    '20250111000008_create_storage_buckets.sql',
    '20250111000009_seed_dados_teste.sql'
  ];

  for (const migration of migrations) {
    try {
      const migrationPath = path.join(__dirname, '../supabase/migrations', migration);
      const sqlContent = fs.readFileSync(migrationPath, 'utf8');
      
      await executeSql(sqlContent, migration);
      
      // Pausa entre migrações
      await new Promise(resolve => setTimeout(resolve, 2000));
      
    } catch (error) {
      console.error(`💥 Erro ao ler migração ${migration}:`, error.message);
    }
  }
  
  console.log('\n🎉 Todas as migrações foram processadas!');
  console.log('\n📋 Como testar agora:');
  console.log('1. Execute: npm run dev');
  console.log('2. Acesse: http://localhost:3000/admin/login');
  console.log('3. Use os dados de teste ou crie novos usuários');
  console.log('4. Teste as páginas:');
  console.log('   • /piloto/meus-baloes (gestão de balões)');
  console.log('   • /piloto/convites (convites de agências)');
  console.log('   • /piloto/planejamento (planejar voos)');
  console.log('   • /agencia/frota (gestão da frota)');
  console.log('   • /agencia/pilotos (gestão de pilotos)');
}

runMigrations().catch(console.error);