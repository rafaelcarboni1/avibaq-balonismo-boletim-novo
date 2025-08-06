const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const fetch = require('node-fetch');

// Configurações
const supabaseUrl = 'https://elcbodhxzvoqpzamgown.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVsY2JvZGh4enZvcXB6YW1nb3duIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEzMDQ3ODAsImV4cCI6MjA2Njg4MDc4MH0.wr15r6xgR0vAlnna2S7qs4RCLgWEPGqQZLq8jaW3BTw';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVsY2JvZGh4enZvcXB6YW1nb3duIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTMwNDc4MCwiZXhwIjoyMDY2ODgwNzgwfQ.UfTwpvPuw4ffuPHS9UPBIMNYPOuSmde8WxnN4FXVSAs';

const supabase = createClient(supabaseUrl, supabaseAnonKey);
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// Dados de teste
const testEmail = 'rafaeldacunhacarboni@gmail.com';
const testPassword = 'Rafinha885';

async function debugUploadComplete() {
  console.log('🔍 DIAGNÓSTICO COMPLETO DE UPLOAD');
  console.log('================================\n');

  try {
    // 1. Usar user_id conhecido (pular autenticação por enquanto)
    console.log('1️⃣ Usando user_id conhecido...');
    const knownUserId = '3dd68e6a-4c5d-47a4-921c-da3b497efb36';
    console.log('✅ User ID definido:', knownUserId);
    
    // Simular dados de auth
    const authData = {
      user: { id: knownUserId },
      session: { access_token: 'mock-token-for-testing' }
    };

    // 2. Verificar se é piloto
    console.log('\n2️⃣ Verificando se usuário é piloto...');
    const { data: membro, error: membroError } = await supabaseAdmin
      .from('membros')
      .select('id, tipo')
      .eq('user_id', authData.user.id)
      .single();

    if (membroError || !membro) {
      console.error('❌ Erro ao buscar membro:', membroError?.message);
      return;
    }

    console.log('✅ Usuário encontrado como membro');
    console.log('   Membro ID:', membro.id);
    console.log('   Tipo:', membro.tipo);

    if (membro.tipo !== 'piloto') {
      console.error('❌ Usuário não é piloto');
      return;
    }

    // 3. Buscar um voo do piloto
    console.log('\n3️⃣ Buscando voos do piloto...');
    const { data: voos, error: voosError } = await supabaseAdmin
      .from('voos')
      .select('id, status, piloto_id')
      .eq('piloto_id', membro.id)
      .limit(1);

    if (voosError || !voos || voos.length === 0) {
      console.error('❌ Erro ao buscar voos ou nenhum voo encontrado:', voosError?.message);
      return;
    }

    const voo = voos[0];
    console.log('✅ Voo encontrado');
    console.log('   Voo ID:', voo.id);
    console.log('   Status:', voo.status);
    console.log('   Piloto ID:', voo.piloto_id);

    // 4. Verificar bucket
    console.log('\n4️⃣ Verificando bucket voos-anexos...');
    const { data: buckets, error: bucketsError } = await supabaseAdmin.storage.listBuckets();
    
    if (bucketsError) {
      console.error('❌ Erro ao listar buckets:', bucketsError.message);
      return;
    }

    const voosAnexosBucket = buckets.find(b => b.name === 'voos-anexos');
    if (!voosAnexosBucket) {
      console.error('❌ Bucket voos-anexos não encontrado');
      return;
    }

    console.log('✅ Bucket voos-anexos encontrado');
    console.log('   ID:', voosAnexosBucket.id);
    console.log('   Público:', voosAnexosBucket.public);

    // 5. Testar upload direto no Storage (com service key)
    console.log('\n5️⃣ Testando upload direto no Storage...');
    const testContent = 'Teste de upload - ' + new Date().toISOString();
    const testPath = `voos/${voo.id}/teste-${Date.now()}.txt`;

    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('voos-anexos')
      .upload(testPath, testContent, {
        contentType: 'text/plain'
      });

    if (uploadError) {
      console.error('❌ Erro no upload direto:', uploadError.message);
    } else {
      console.log('✅ Upload direto bem-sucedido');
      console.log('   Path:', uploadData.path);
      
      // Limpar arquivo de teste
      await supabaseAdmin.storage.from('voos-anexos').remove([testPath]);
      console.log('   Arquivo de teste removido');
    }

    // 6. Testar upload via API route
    console.log('\n6️⃣ Testando upload via API route...');
    
    // Criar arquivo de teste
    const testFilePath = path.join(__dirname, 'test-image.txt');
    fs.writeFileSync(testFilePath, 'Conteúdo de teste para upload via API');

    try {
      const form = new FormData();
      form.append('file', fs.createReadStream(testFilePath), {
        filename: 'test-image.txt',
        contentType: 'text/plain'
      });
      form.append('tipo', 'foto_voo');

      const response = await fetch(`http://localhost:3000/api/voos/${voo.id}/anexos/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authData.session.access_token}`,
          ...form.getHeaders()
        },
        body: form
      });

      const result = await response.text();
      
      console.log('   Status da resposta:', response.status);
      console.log('   Headers da resposta:', Object.fromEntries(response.headers.entries()));
      
      if (response.ok) {
        console.log('✅ Upload via API bem-sucedido');
        console.log('   Resposta:', result);
      } else {
        console.error('❌ Erro no upload via API');
        console.error('   Resposta:', result);
      }

    } catch (apiError) {
      console.error('❌ Erro na requisição para API:', apiError.message);
    } finally {
      // Limpar arquivo de teste
      if (fs.existsSync(testFilePath)) {
        fs.unlinkSync(testFilePath);
      }
    }

    // 7. Verificar políticas RLS
    console.log('\n7️⃣ Verificando políticas RLS...');
    const testStoragePath = `voos/${voo.id}/test.jpg`;
    
    // Testar função storage.foldername
    const { data: folderTest, error: folderError } = await supabaseAdmin
      .rpc('exec_sql', {
        sql: `SELECT storage.foldername('${testStoragePath}') as folder_result`
      });

    if (folderError) {
      console.error('❌ Erro ao testar storage.foldername:', folderError.message);
    } else {
      console.log('✅ Função storage.foldername funcionando');
      console.log('   Resultado:', folderTest);
    }

    // 8. Testar condição da política RLS
    const { data: rlsTest, error: rlsError } = await supabaseAdmin
      .rpc('exec_sql', {
        sql: `
          SELECT 
            '${authData.user.id}' as user_id,
            '${voo.id}' as voo_id,
            (storage.foldername('${testStoragePath}'))[2] as path_voo_id,
            (
              '${authData.user.id}' IN (
                SELECT u.id
                FROM auth.users u
                JOIN membros m ON m.user_id = u.id
                JOIN voos v ON v.piloto_id = m.id
                WHERE m.tipo = 'piloto' 
                AND (storage.foldername('${testStoragePath}'))[2] = v.id::text
              )
            ) as rls_condition_result
        `
      });

    if (rlsError) {
      console.error('❌ Erro ao testar condição RLS:', rlsError.message);
    } else {
      console.log('✅ Teste de condição RLS concluído');
      console.log('   Resultado:', rlsTest);
    }

  } catch (error) {
    console.error('❌ Erro geral:', error.message);
    console.error('Stack:', error.stack);
  }

  console.log('\n🏁 Diagnóstico concluído');
}

// Executar diagnóstico
debugUploadComplete().catch(console.error);