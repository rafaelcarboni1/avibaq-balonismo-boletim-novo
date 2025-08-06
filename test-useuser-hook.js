import { createClient } from '@supabase/supabase-js';

// Configuração do Supabase
const supabaseUrl = 'https://elcbodhxzvoqpzamgown.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVsY2JvZGh4enZvcXB6YW1nb3duIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEzMDQ3ODAsImV4cCI6MjA2Njg4MDc4MH0.wr15r6xgR0vAlnna2S7qs4RCLgWEPGqQZLq8jaW3BTw';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testUseUserHook() {
  console.log('🧪 TESTANDO HOOK useUser - SIMULAÇÃO');
  console.log('==========================================');
  
  try {
    // 1. Fazer login como Igor
    console.log('\n[LOGIN] Fazendo login como Igor...');
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'igor_pk_@hotmail.com',
      password: 'igorniehues'
    });
    
    if (authError) {
      console.error('❌ Erro no login:', authError);
      return;
    }
    
    console.log('✅ Login realizado com sucesso');
    console.log('Auth User ID:', authData.user.id);
    console.log('Auth User Email:', authData.user.email);
    
    // 2. Simular o que o hook useUser faz
    console.log('\n[HOOK SIMULATION] Simulando lógica do useUser...');
    
    const user = authData.user;
    let data = null;
    let error = null;
    
    // MÉTODO PRINCIPAL: Usar função RPC robusta
    try {
      console.log('[HOOK] Usando get_current_user_table_id...');
      const { data: userTableId, error: rpcError } = await supabase
        .rpc('get_current_user_table_id');
      
      if (!rpcError && userTableId) {
        console.log('[HOOK] ✅ RPC retornou ID válido:', userTableId);
        
        // Buscar dados completos do usuário
        const result = await supabase
          .from("users")
          .select("id, role, nome, whatsapp_group_joined, whatsapp_modal_shown")
          .eq('id', userTableId)
          .single();
        
        data = result.data;
        error = result.error;
        
        if (data) {
          console.log('[HOOK] ✅ Dados completos obtidos via RPC:', data);
        }
      } else {
        console.warn('[HOOK] RPC não retornou ID válido:', rpcError);
      }
    } catch (rpcError) {
      console.warn('[HOOK] Função RPC falhou, usando fallback:', rpcError);
    }
    
    // FALLBACK: Métodos tradicionais com validação
    if (!data) {
      console.log('[HOOK] Usando métodos fallback...');
      
      // Tentar por email
      console.log('[HOOK] Tentando busca por email:', user.email);
      const result = await supabase
        .from("users")
        .select("id, role, nome, whatsapp_group_joined, whatsapp_modal_shown")
        .match({ email: user.email })
        .single();
      
      data = result.data;
      error = result.error;
      
      if (data) {
        console.log('[HOOK] ✅ Dados obtidos por email:', data);
      }
    }
    
    if (data && !error && data.id) {
      // VALIDAÇÃO RIGOROSA: Verificar se o ID realmente existe
      const { data: validationCheck } = await supabase
        .from('users')
        .select('id')
        .eq('id', data.id)
        .single();
      
      if (validationCheck) {
        console.log('[HOOK] ✅ Usuário validado:', { email: user.email, role: data.role, id: data.id });
        
        // ESTRUTURA SEGURA com ID validado
        const userWithUsersData = { 
          ...user, 
          id: user.id, // ID original do auth.users para RLS
          auth_id: user.id, // Para referência
          users_table_id: data.id, // ID VALIDADO da tabela users
          role: data.role,
          whatsapp_group_joined: data.whatsapp_group_joined,
          whatsapp_modal_shown: data.whatsapp_modal_shown
        };
        
        console.log('[HOOK] ✅ Dados seguros integrados - users_table_id:', data.id);
        console.log('\n[RESULTADO FINAL] Objeto user que seria retornado pelo hook:');
        console.log(JSON.stringify({
          id: userWithUsersData.id,
          auth_id: userWithUsersData.auth_id,
          users_table_id: userWithUsersData.users_table_id,
          email: userWithUsersData.email,
          role: userWithUsersData.role
        }, null, 2));
        
        // 3. Testar se o users_table_id pode ser usado como marcado_por
        console.log('\n[TESTE MARCADO_POR] Testando se users_table_id pode ser usado como marcado_por...');
        
        // Verificar se existe algum checklist item para testar
        const { data: checklistItems, error: checklistError } = await supabase
          .from('checklist_itens')
          .select('id, voo_id')
          .limit(1);
        
        if (checklistItems && checklistItems.length > 0) {
          const testItem = checklistItems[0];
          console.log('[TESTE] Tentando atualizar item de checklist:', testItem.id);
          
          const updateData = {
            marcado: true,
            marcado_em: new Date().toISOString(),
            marcado_por: userWithUsersData.users_table_id,
            updated_at: new Date().toISOString()
          };
          
          console.log('[TESTE] Dados para atualização:', updateData);
          
          const { data: updateResult, error: updateError } = await supabase
            .from('checklist_itens')
            .update(updateData)
            .eq('id', testItem.id)
            .select('*');
          
          if (updateError) {
            console.error('[TESTE] ❌ Erro ao atualizar checklist:', updateError);
          } else {
            console.log('[TESTE] ✅ Checklist atualizado com sucesso:', updateResult);
            
            // Reverter a mudança
            await supabase
              .from('checklist_itens')
              .update({ marcado: false, marcado_por: null, marcado_em: null })
              .eq('id', testItem.id);
            console.log('[TESTE] ✅ Mudança revertida');
          }
        } else {
          console.log('[TESTE] ⚠️ Nenhum item de checklist encontrado para testar');
        }
        
      } else {
        console.error('[HOOK] 🚨 ERRO CRÍTICO: ID não passou na validação!');
      }
    } else {
      console.warn('[HOOK] ⚠️ Usuário não encontrado na tabela users:', user.email);
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

// Executar teste
testUseUserHook().then(() => {
  console.log('\n🧪 Teste do hook useUser concluído');
  process.exit(0);
}).catch(error => {
  console.error('❌ Erro no teste:', error);
  process.exit(1);
});