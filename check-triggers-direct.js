import { createClient } from '@supabase/supabase-js';

// Configuração do Supabase
const supabaseUrl = 'https://ywvjqvzlpqjqjqjqjqjq.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl3dmpxdnpscHFqcWpxanFqcWpxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNzU3NzU4NSwiZXhwIjoyMDUzMTUzNTg1fQ.Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkTriggersAndFunctions() {
  console.log('🔍 VERIFICANDO TRIGGERS E FUNÇÕES ATIVAS');
  console.log('==========================================');
  
  try {
    // 1. Verificar triggers ativos na tabela checklist_itens
    console.log('\n[1] TRIGGERS ATIVOS NA TABELA checklist_itens:');
    const { data: triggers, error: triggerError } = await supabase
      .rpc('exec_sql', {
        sql: `
          SELECT 
            t.tgname as trigger_name,
            p.proname as function_name,
            t.tgenabled as enabled
          FROM pg_trigger t
          JOIN pg_proc p ON t.tgfoid = p.oid
          WHERE tgrelid = 'checklist_itens'::regclass
          ORDER BY t.tgname;
        `
      });
    
    if (triggerError) {
      console.log('❌ Erro ao verificar triggers:', triggerError);
    } else {
      console.log('✅ Triggers encontrados:', triggers);
    }
    
    // 2. Verificar código das funções que podem estar modificando marcado_por
    console.log('\n[2] CÓDIGO DAS FUNÇÕES RELACIONADAS:');
    const functionsToCheck = [
      'trigger_checklist_validation',
      'validate_checklist_user_ids',
      'trigger_updated_at'
    ];
    
    for (const funcName of functionsToCheck) {
      const { data: funcCode, error: funcError } = await supabase
        .rpc('exec_sql', {
          sql: `
            SELECT 
              p.proname as function_name,
              pg_get_functiondef(p.oid) as function_definition
            FROM pg_proc p
            WHERE p.proname = '${funcName}'
            AND p.pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');
          `
        });
      
      if (funcError) {
        console.log(`❌ Erro ao verificar função ${funcName}:`, funcError);
      } else if (funcCode && funcCode.length > 0) {
        console.log(`\n📋 Função ${funcName}:`);
        console.log(funcCode[0].function_definition);
      } else {
        console.log(`✅ Função ${funcName} não encontrada (removida)`);
      }
    }
    
    // 3. Teste direto de atualização
    console.log('\n[3] TESTE DIRETO DE ATUALIZAÇÃO:');
    console.log('Tentando atualizar um item de checklist diretamente...');
    
    // Primeiro, vamos encontrar um item de checklist para testar
    const { data: checklistItem, error: itemError } = await supabase
      .from('checklist_itens')
      .select('id, marcado_por')
      .limit(1)
      .single();
    
    if (itemError) {
      console.log('❌ Erro ao buscar item de checklist:', itemError);
    } else {
      console.log('✅ Item encontrado:', checklistItem);
      
      // Tentar atualizar com users_table_id do Igor
      const { data: updateResult, error: updateError } = await supabase
        .from('checklist_itens')
        .update({
          marcado_por: 'f36990a5-192f-41dc-aa95-8720d9122071', // users_table_id do Igor
          updated_at: new Date().toISOString()
        })
        .eq('id', checklistItem.id)
        .select();
      
      if (updateError) {
        console.log('❌ Erro na atualização:', updateError);
      } else {
        console.log('✅ Atualização bem-sucedida:', updateResult);
      }
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

checkTriggersAndFunctions();