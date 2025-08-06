const { createClient } = require('@supabase/supabase-js');
const FormData = require('form-data');
const fs = require('fs');
const fetch = require('node-fetch');

// Configuração do Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function testUpload() {
  try {
    console.log('🔧 Teste de Upload - Diagnóstico');
    
    // 1. Verificar se o usuário está logado
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    console.log('1. Usuário autenticado:', user ? user.email : 'Não autenticado');
    
    if (userError || !user) {
      console.error('❌ Usuário não autenticado:', userError?.message);
      return;
    }
    
    // 2. Buscar um voo do usuário
    const { data: membro, error: membroError } = await supabase
      .from('membros')
      .select('id')
      .eq('user_id', user.id)
      .eq('tipo', 'piloto')
      .single();
    
    if (membroError || !membro) {
      console.error('❌ Membro não encontrado:', membroError?.message);
      return;
    }
    
    const { data: voos, error: voosError } = await supabase
      .from('voos')
      .select('id, status')
      .eq('piloto_id', membro.id)
      .in('status', ['checklist_concluido', 'finalizado'])
      .limit(1);
    
    if (voosError || !voos || voos.length === 0) {
      console.error('❌ Nenhum voo encontrado:', voosError?.message);
      return;
    }
    
    const vooId = voos[0].id;
    console.log('2. Voo encontrado:', vooId, '- Status:', voos[0].status);
    
    // 3. Testar upload de arquivo
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      console.error('❌ Token de sessão não encontrado');
      return;
    }
    
    // Criar arquivo de teste
    const testContent = 'Teste de upload - ' + new Date().toISOString();
    const testFile = '/tmp/test_upload.txt';
    fs.writeFileSync(testFile, testContent);
    
    // Preparar FormData
    const formData = new FormData();
    formData.append('file', fs.createReadStream(testFile), {
      filename: 'test_upload.txt',
      contentType: 'text/plain'
    });
    formData.append('tipo', 'track_log');
    
    console.log('3. Fazendo upload...');
    
    // Fazer upload
    const response = await fetch(`http://localhost:3000/api/voos/${vooId}/anexos/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        ...formData.getHeaders()
      },
      body: formData
    });
    
    const result = await response.json();
    
    console.log('4. Resposta da API:');
    console.log('   Status:', response.status);
    console.log('   Resultado:', JSON.stringify(result, null, 2));
    
    // Limpar arquivo temporário
    fs.unlinkSync(testFile);
    
    if (response.ok) {
      console.log('✅ Upload realizado com sucesso!');
    } else {
      console.log('❌ Erro no upload:', result.error);
    }
    
  } catch (error) {
    console.error('❌ Erro durante o teste:', error.message);
  }
}

// Executar apenas se for chamado diretamente
if (require.main === module) {
  testUpload();
}

module.exports = { testUpload };