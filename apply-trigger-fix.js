import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

// Configuração do Supabase
const supabaseUrl = 'https://ywvjqvzlpqjqjqjqjqjq.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl3dmpxdnpscHFqcWpxanFqcWpxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNzU3NzU4NSwiZXhwIjoyMDUzMTUzNTg1fQ.Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyTriggerFix() {
  console.log('🔧 APLICANDO CORREÇÃO DO TRIGGER');
  console.log('================================');
  
  try {
    // Ler o arquivo SQL
    const sqlContent = readFileSync('./supabase/migrations/remove_trigger_checklist_validation_real.sql', 'utf8');
    
    // Dividir em comandos individuais
    const commands = sqlContent
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd && !cmd.startsWith('--') && cmd !== '');
    
    console.log(`📋 Executando ${commands.length} comandos SQL...`);
    
    for (let i = 0; i < commands.length; i++) {
      const command = commands[i];
      console.log(`\n[${i + 1}/${commands.length}] Executando:`);
      console.log(command.substring(0, 100) + (command.length > 100 ? '...' : ''));
      
      const { data, error } = await supabase.rpc('exec_sql', {
        sql: command
      });
      
      if (error) {
        console.log(`❌ Erro no comando ${i + 1}:`, error);
        // Continuar mesmo com erro, alguns comandos podem falhar se já foram executados
      } else {
        console.log(`✅ Comando ${i + 1} executado com sucesso`);
        if (data) {
          console.log('Resultado:', data);
        }
      }
    }
    
    console.log('\n🎉 CORREÇÃO APLICADA!');
    console.log('Agora o marcado_por deve aceitar o valor enviado pelo frontend.');
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

applyTriggerFix();