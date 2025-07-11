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

async function applyMigrations() {
  console.log('🚀 Iniciando aplicação das migrações...\n');

  for (const migration of migrations) {
    try {
      console.log(`📄 Aplicando migração: ${migration}`);
      
      // Ler arquivo SQL
      const migrationPath = path.join(__dirname, '../supabase/migrations', migration);
      const sqlContent = fs.readFileSync(migrationPath, 'utf8');
      
      // Executar SQL
      const { error } = await supabase.rpc('exec_sql', { sql: sqlContent });
      
      if (error) {
        console.error(`❌ Erro na migração ${migration}:`, error);
        
        // Se erro de relação já existe, continuar
        if (error.message && error.message.includes('already exists')) {
          console.log(`⚠️  Tabela/função já existe, continuando...`);
        } else {
          throw error;
        }
      } else {
        console.log(`✅ Migração ${migration} aplicada com sucesso`);
      }
      
    } catch (error) {
      console.error(`💥 Erro fatal na migração ${migration}:`, error.message);
      
      // Se for erro de tabela já existe, continuar
      if (error.message && error.message.includes('already exists')) {
        console.log(`⚠️  Continuando devido a objeto já existente...`);
        continue;
      }
      
      console.log('🛑 Parando execução devido ao erro');
      break;
    }
    
    // Pequena pausa entre migrações
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('\n🎉 Processo de migração concluído!');
  console.log('\n📋 Próximos passos para testar:');
  console.log('1. Acesse /admin/login');
  console.log('2. Crie um usuário piloto/agência ou use os dados de teste');
  console.log('3. Teste as páginas:');
  console.log('   - /piloto/meus-baloes');
  console.log('   - /piloto/convites'); 
  console.log('   - /piloto/planejamento');
  console.log('   - /agencia/frota');
  console.log('   - /agencia/pilotos');
}

applyMigrations().catch(console.error);