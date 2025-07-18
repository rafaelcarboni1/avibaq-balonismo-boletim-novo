import { createClient } from '@supabase/supabase-js';

// Configuração do Supabase
const supabaseUrl = 'https://elcbodhxzvoqpzamgown.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVsY2JvZGh4enZvcXB6YW1nb3duIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTMwNDc4MCwiZXhwIjoyMDY2ODgwNzgwfQ.UfTwpvPuw4ffuPHS9UPBIMNYPOuSmde8WxnN4FXVSAs';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createExecSqlFunction() {
  console.log('🚀 Criando função exec_sql...');
  
  try {
    // Usar query SQL direto para criar a função
    const { error } = await supabase
      .from('_dummy') // Não importa a tabela, vamos usar .rpc() com SQL direto
      .select('1')
      .limit(0);
    
    // Executar SQL direto usando a API REST
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'apikey': supabaseServiceKey
      },
      body: JSON.stringify({
        sql: `
          CREATE OR REPLACE FUNCTION public.exec_sql(sql TEXT)
          RETURNS VOID AS $$
          BEGIN
            EXECUTE sql;
          END;
          $$ LANGUAGE plpgsql SECURITY DEFINER;
        `
      })
    });
    
    if (!response.ok) {
      // Se a função não existe, vamos tentar criar usando SQL direto
      console.log('⚠️  Função exec_sql não existe, criando usando SQL direto...');
      
      const { data, error: sqlError } = await supabase
        .from('pg_stat_user_functions')
        .select('*')
        .limit(1);
      
      // Usar uma abordagem diferente - executar SQL usando a API do Supabase
      const createFunctionSQL = `
        CREATE OR REPLACE FUNCTION public.exec_sql(sql TEXT)
        RETURNS VOID AS $$
        BEGIN
          EXECUTE sql;
        END;
        $$ LANGUAGE plpgsql SECURITY DEFINER;
      `;
      
      console.log('📝 Executando SQL para criar função...');
      console.log('⚠️  ATENÇÃO: Execute este SQL manualmente no Supabase Dashboard:');
      console.log('\n' + createFunctionSQL + '\n');
      
      console.log('🔗 Acesse: https://elcbodhxzvoqpzamgown.supabase.co/project/elcbodhxzvoqpzamgown/sql');
      console.log('📋 Cole o SQL acima e execute');
      
      return;
    }
    
    console.log('✅ Função exec_sql criada com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro ao criar função exec_sql:', error);
    
    const createFunctionSQL = `
CREATE OR REPLACE FUNCTION public.exec_sql(sql TEXT)
RETURNS VOID AS $$
BEGIN
  EXECUTE sql;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
    `;
    
    console.log('\n⚠️  ATENÇÃO: Execute este SQL manualmente no Supabase Dashboard:');
    console.log('\n' + createFunctionSQL + '\n');
    console.log('🔗 Acesse: https://elcbodhxzvoqpzamgown.supabase.co/project/elcbodhxzvoqpzamgown/sql');
    console.log('📋 Cole o SQL acima e execute');
  }
}

createExecSqlFunction().catch(console.error);