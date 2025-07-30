-- TESTE RLS DIRETO NA APLICAÇÃO
-- Cole este SQL no console do navegador (logado como piloto)

-- Teste 1: Verificar auth.uid()
const { data: authTest } = await supabase.rpc('debug_auth_uid');
console.log('Auth UID:', authTest);

-- Teste 2: Verificar seus dados
const { data: userData } = await supabase
  .from('membros')
  .select('id, nome_completo, email, user_id, tipo')
  .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
  .eq('tipo', 'piloto')
  .single();
console.log('Seus dados:', userData);

-- Teste 3: Inserção manual
const { data: insertTest, error: insertError } = await supabase
  .from('baloes')
  .insert({
    prefixo: 'TEST-001',
    volume_m3: 3000,
    nome_batismo: 'Teste',
    observacoes: 'Debug RLS',
    proprietario_id: userData.id,
    ativo: true
  });
console.log('Insert result:', insertTest, 'Error:', insertError);