import { createClient } from '@supabase/supabase-js';

// Configuração do Supabase
const supabaseUrl = 'https://elcbodhxzvoqpzamgown.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVsY2JvZGh4enZvcXB6YW1nb3duIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTMwNDc4MCwiZXhwIjoyMDY2ODgwNzgwfQ.UfTwpvPuw4ffuPHS9UPBIMNYPOuSmde8WxnN4FXVSAs';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkActiveTriggers() {
  console.log('🔍 VERIFICANDO TRIGGERS ATIVOS NA TABELA checklist_itens');
  console.log('=======================================================');
  
  try {
    // 1. Verificar triggers ativos
    console.log('\n[TRIGGERS] Verificando triggers ativos...');
    const { data: triggers, error: triggerError } = await supabase
      .rpc('exec_sql', {
        sql: `
          SELECT 
            t.tgname as trigger_name,
            p.proname as function_name,
            t.tgenabled as enabled,
            t.tgtype as trigger_type
          FROM pg_trigger t
          JOIN pg_proc p ON t.tgfoid = p.oid
          WHERE tgrelid = 'checklist_itens'::regclass
          ORDER BY t.tgname;
        `
      });
    
    if (triggerError) {
      console.error('❌ Erro ao verificar triggers:', triggerError);
      return;
    }
    
    console.log('✅ Triggers encontrados:', triggers);
    
    // 2. Verificar função específica que pode estar causando problema
    console.log('\n[FUNCTIONS] Verificando funções relacionadas...');
    const { data: functions, error: funcError } = await supabase
      .rpc('exec_sql', {
        sql: `
          SELECT 
            proname as function_name,
            prosrc as function_source
          FROM pg_proc 
          WHERE proname LIKE '%checklist%' OR proname LIKE '%validate%'
          ORDER BY proname;
        `
      });
    
    if (funcError) {
      console.error('❌ Erro ao verificar funções:', funcError);
    } else {
      console.log('✅ Funções encontradas:', functions?.length || 0);
      functions?.forEach(func => {
        console.log(`\n[FUNCTION] ${func.function_name}:`);
        console.log(func.function_source.substring(0, 200) + '...');
      });
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

// Executar verificação
checkActiveTriggers().then(() => {
  console.log('\n🔍 Verificação de triggers concluída');
  process.exit(0);
}).catch(error => {
  console.error('❌ Erro na verificação:', error);
  process.exit(1);
});