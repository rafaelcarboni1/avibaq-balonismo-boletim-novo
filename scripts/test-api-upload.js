const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Configurações
const supabaseUrl = 'https://elcbodhxzvoqpzamgown.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVsY2JvZGh4enZvcXB6YW1nb3duIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTMwNDc4MCwiZXhwIjoyMDY2ODgwNzgwfQ.UfTwpvPuw4ffuPHS9UPBIMNYPOuSmde8WxnN4FXVSAs';

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// Dados conhecidos do usuário
const userId = '3dd68e6a-4c5d-47a4-921c-da3b497efb36';
const membroId = '24a1a1f4-1304-4f45-98bc-8a9e89e533d0';

async function testApiUpload() {
  console.log('🔍 TESTE DE UPLOAD VIA API');
  console.log('==========================\n');

  try {
    // 1. Buscar voo do piloto
    console.log('1️⃣ Buscando voo do piloto...');
    const { data: voos, error: voosError } = await supabaseAdmin
      .from('voos')
      .select('id, status')
      .eq('piloto_id', membroId)
      .limit(1);

    if (voosError || !voos || voos.length === 0) {
      console.error('❌ Erro ao buscar voos:', voosError?.message);
      return;
    }

    const voo = voos[0];
    console.log('✅ Voo encontrado:', voo.id);

    // 2. Criar arquivo de teste
    console.log('\n2️⃣ Criando arquivo de teste...');
    const testContent = 'Teste de upload via API - ' + new Date().toISOString();
    const testFilePath = path.join(__dirname, 'test-upload.txt');
    fs.writeFileSync(testFilePath, testContent);
    console.log('✅ Arquivo criado:', testFilePath);

    // 3. Testar a API diretamente usando service key
    console.log('\n3️⃣ Testando API com service key...');
    
    // Simular o que a API faz internamente
    console.log('\n📋 SIMULAÇÃO DO PROCESSO DA API:');
    console.log('================================');
    
    // Verificar se o usuário é piloto
    const { data: membro, error: membroError } = await supabaseAdmin
      .from('membros')
      .select('id, tipo')
      .eq('user_id', userId)
      .single();

    if (membroError || !membro) {
      console.error('❌ Erro ao buscar membro:', membroError?.message);
      return;
    }

    console.log('✅ Membro encontrado:', membro.id, '- Tipo:', membro.tipo);

    // Verificar se o voo pertence ao piloto
    const { data: vooVerificacao, error: vooError } = await supabaseAdmin
      .from('voos')
      .select('id, piloto_id, status')
      .eq('id', voo.id)
      .eq('piloto_id', membro.id)
      .single();

    if (vooError || !vooVerificacao) {
      console.error('❌ Voo não pertence ao piloto ou não encontrado:', vooError?.message);
      return;
    }

    console.log('✅ Voo pertence ao piloto');

    // Testar upload no storage com tipo válido
    const fileName = `test-${Date.now()}.jpg`;
    const storagePath = `voos/${voo.id}/${fileName}`;
    
    // Criar um buffer simples simulando uma imagem JPEG
    const fakeImageBuffer = Buffer.from('fake-jpeg-content-for-testing');
    
    console.log('\n4️⃣ Testando upload no storage...');
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('voos-anexos')
      .upload(storagePath, fakeImageBuffer, {
        contentType: 'image/jpeg'
      });

    if (uploadError) {
      console.error('❌ Erro no upload:', uploadError.message);
      return;
    }

    console.log('✅ Upload no storage bem-sucedido:', uploadData.path);

    // Obter URL pública
    const { data: { publicUrl } } = supabaseAdmin.storage
      .from('voos-anexos')
      .getPublicUrl(storagePath);

    console.log('✅ URL pública gerada:', publicUrl);

    // Testar inserção na tabela voos_anexos
    console.log('\n5️⃣ Testando inserção na tabela voos_anexos...');
    const { data: anexoData, error: anexoError } = await supabaseAdmin
      .from('voos_anexos')
      .insert({
        voo_id: voo.id,
        tipo: 'foto_voo',
        nome_arquivo: fileName,
        nome_original: `original-${fileName}`,
        url_storage: publicUrl,
        tamanho_bytes: fakeImageBuffer.length,
        mime_type: 'image/jpeg',
        uploaded_por: userId
      })
      .select()
      .single();

    if (anexoError) {
      console.error('❌ Erro ao inserir anexo:', anexoError.message);
      
      // Limpar arquivo do storage
      await supabaseAdmin.storage.from('voos-anexos').remove([storagePath]);
      console.log('🧹 Arquivo removido do storage devido ao erro');
      return;
    }

    console.log('✅ Anexo inserido na tabela:', anexoData.id);

    // Limpar dados de teste
    console.log('\n6️⃣ Limpando dados de teste...');
    await supabaseAdmin.from('voos_anexos').delete().eq('id', anexoData.id);
    await supabaseAdmin.storage.from('voos-anexos').remove([storagePath]);
    console.log('✅ Dados de teste removidos');

    console.log('\n🎉 TESTE COMPLETO BEM-SUCEDIDO!');
    console.log('   O processo de upload funciona corretamente quando executado com service key.');
    console.log('   O problema pode estar na autenticação ou nas políticas RLS.');

    // Informações para debug manual
    console.log('\n📝 INFORMAÇÕES PARA DEBUG MANUAL:');
    console.log('==================================');
    console.log('   - Voo ID:', voo.id);
    console.log('   - User ID:', userId);
    console.log('   - Membro ID:', membroId);
    console.log('   - Arquivo de teste:', testFilePath);
    console.log('\n💡 PRÓXIMOS PASSOS:');
    console.log('   1. Verificar se o servidor Next.js está rodando');
    console.log('   2. Testar login manual no frontend');
    console.log('   3. Verificar políticas RLS no Supabase Dashboard');
    console.log('   4. Verificar logs do servidor durante upload');

  } catch (error) {
    console.error('❌ Erro geral:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Executar teste
testApiUpload().catch(console.error);