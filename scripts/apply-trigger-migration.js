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

async function applyTriggerMigration() {
  console.log('🚀 Aplicando migração do trigger de usuário...\n');
  
  try {
    // Ler o arquivo da migração
    const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '20250715000000_create_auto_user_profile_trigger.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('📄 Executando migração: 20250715000000_create_auto_user_profile_trigger.sql');
    
    // Executar a migração
    const { error } = await supabase.rpc('exec_sql', { sql: migrationSQL });
    
    if (error) {
      console.error('❌ Erro na migração:', error);
      process.exit(1);
    }
    
    console.log('✅ Migração aplicada com sucesso!');
    console.log('\n🎉 Trigger criado! Agora o cadastro de usuários deve funcionar corretamente.');
    
  } catch (error) {
    console.error('💥 Erro fatal:', error.message);
    process.exit(1);
  }
}

applyTriggerMigration();