import { createClient } from '@supabase/supabase-js';

// Configuração do Supabase
const supabaseUrl = 'https://elcbodhxzvoqpzamgown.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVsY2JvZGh4enZvcXB6YW1nb3duIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTMwNDc4MCwiZXhwIjoyMDY2ODgwNzgwfQ.UfTwpvPuw4ffuPHS9UPBIMNYPOuSmde8WxnN4FXVSAs';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixStoragePolicies() {
  console.log('🔧 Corrigindo políticas de storage...');
  
  try {
    // Primeiro, vamos remover todas as políticas existentes
    console.log('🗑️  Removendo políticas antigas...');
    
    const policiesToDrop = [
      'Usuários podem fazer upload para seus voos',
      'Usuários podem ver anexos de seus voos', 
      'Usuários podem atualizar anexos de seus voos',
      'Usuários podem deletar anexos de seus voos',
      'Admins podem gerenciar todos os anexos'
    ];
    
    for (const policyName of policiesToDrop) {
      try {
        const { error } = await supabase.rpc('exec_sql', {
          sql: `DROP POLICY IF EXISTS "${policyName}" ON storage.objects;`
        });
        
        if (error && !error.message.includes('does not exist')) {
          console.error(`❌ Erro ao remover política "${policyName}":`, error);
        } else {
          console.log(`✅ Política "${policyName}" removida`);
        }
      } catch (err) {
        console.log(`⚠️  Política "${policyName}" não existia`);
      }
    }
    
    // Agora vamos criar políticas mais simples e permissivas
    console.log('\n📝 Criando novas políticas permissivas...');
    
    const newPolicies = [
      {
        name: 'Permitir upload para usuários autenticados',
        sql: `
          CREATE POLICY "Permitir upload para usuários autenticados" ON storage.objects
            FOR INSERT WITH CHECK (
              bucket_id = 'voos-anexos' AND
              auth.uid() IS NOT NULL
            );
        `
      },
      {
        name: 'Permitir visualização para usuários autenticados',
        sql: `
          CREATE POLICY "Permitir visualização para usuários autenticados" ON storage.objects
            FOR SELECT USING (
              bucket_id = 'voos-anexos' AND
              auth.uid() IS NOT NULL
            );
        `
      },
      {
        name: 'Permitir atualização para usuários autenticados',
        sql: `
          CREATE POLICY "Permitir atualização para usuários autenticados" ON storage.objects
            FOR UPDATE USING (
              bucket_id = 'voos-anexos' AND
              auth.uid() IS NOT NULL
            );
        `
      },
      {
        name: 'Permitir exclusão para usuários autenticados',
        sql: `
          CREATE POLICY "Permitir exclusão para usuários autenticados" ON storage.objects
            FOR DELETE USING (
              bucket_id = 'voos-anexos' AND
              auth.uid() IS NOT NULL
            );
        `
      }
    ];
    
    for (const policy of newPolicies) {
      try {
        const { error } = await supabase.rpc('exec_sql', {
          sql: policy.sql
        });
        
        if (error) {
          console.error(`❌ Erro ao criar política "${policy.name}":`, error);
        } else {
          console.log(`✅ Política "${policy.name}" criada`);
        }
      } catch (err) {
        console.error(`❌ Erro inesperado ao criar política "${policy.name}":`, err);
      }
    }
    
    // Verificar se RLS está habilitado
    console.log('\n🔒 Verificando RLS...');
    
    try {
      const { data, error } = await supabase.rpc('exec_sql', {
        sql: `
          SELECT 
            schemaname,
            tablename,
            rowsecurity
          FROM pg_tables 
          WHERE schemaname = 'storage' AND tablename = 'objects';
        `
      });
      
      if (error) {
        console.error('❌ Erro ao verificar RLS:', error);
      } else {
        console.log('✅ Status RLS verificado:', data);
      }
    } catch (err) {
      console.log('⚠️  Não foi possível verificar RLS diretamente');
    }
    
    console.log('\n🎉 Políticas de storage atualizadas!');
    console.log('\n📋 Próximos passos:');
    console.log('1. Teste o upload novamente');
    console.log('2. Se ainda não funcionar, pode ser necessário desabilitar RLS temporariamente');
    console.log('3. Verifique se o usuário está autenticado corretamente no frontend');
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

fixStoragePolicies().catch(console.error);