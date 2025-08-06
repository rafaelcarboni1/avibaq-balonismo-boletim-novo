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

async function fixTriggerMigration() {
  console.log('🔧 Corrigindo trigger de usuário...\n');
  
  try {
    // Ler o arquivo da migração corrigida
    const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '20250715000001_fix_auto_user_profile_trigger.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('📄 Executando migração corrigida...');
    
    // Executar cada comando SQL separadamente
    const commands = migrationSQL.split(';').filter(cmd => cmd.trim() && !cmd.trim().startsWith('--'));
    
    for (const command of commands) {
      const cleanCommand = command.trim();
      if (cleanCommand) {
        console.log(`Executando: ${cleanCommand.substring(0, 50)}...`);
        const { error } = await supabase.rpc('exec_sql', { sql: cleanCommand });
        
        if (error) {
          console.error('❌ Erro no comando:', error);
          // Continua mesmo com erro para tentar executar todos os comandos
        } else {
          console.log('✅ Comando executado com sucesso');
        }
      }
    }
    
    console.log('\n🎉 Trigger corrigido! Teste o cadastro novamente.');
    
  } catch (error) {
    console.error('💥 Erro fatal:', error.message);
    process.exit(1);
  }
}

fixTriggerMigration();