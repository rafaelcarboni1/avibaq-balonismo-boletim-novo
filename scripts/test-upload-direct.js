require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const FormData = require('form-data');
const fetch = require('node-fetch');

async function testUploadDirect() {
  try {
    console.log('🚀 Testando upload direto via Node.js...');
    
    // 1. Configurar Supabase
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Variáveis de ambiente do Supabase não encontradas');
    }
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    // 2. Fazer login
    console.log('1️⃣ Fazendo login...');
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'rafaeldacunhacarboni@gmail.com',
      password: 'Rafinha885'
    });
    
    if (authError) {
      throw new Error(`Erro no login: ${authError.message}`);
    }
    
    console.log('✅ Login bem-sucedido');
    console.log('   User ID:', authData.user.id);
    console.log('   Access Token:', authData.session.access_token.substring(0, 50) + '...');
    
    // 3. Buscar membro
    console.log('\n2️⃣ Buscando dados do membro...');
    const { data: membros, error: membroError } = await supabase
      .from('membros')
      .select('id, nome_completo')
      .eq('user_id', authData.user.id)
      .single();
    
    if (membroError) {
      throw new Error(`Erro ao buscar membro: ${membroError.message}`);
    }
    
    console.log('✅ Membro encontrado:', membros.nome_completo);
    console.log('   Membro ID:', membros.id);
    
    // 4. Buscar voo
    console.log('\n3️⃣ Buscando voo...');
    const { data: voos, error: voosError } = await supabase
      .from('voos')
      .select('id, data_voo, local_decolagem_previsto, status')
      .eq('piloto_id', membros.id)
      .limit(1);
    
    if (voosError) {
      throw new Error(`Erro ao buscar voos: ${voosError.message}`);
    }
    
    if (!voos || voos.length === 0) {
      throw new Error('Nenhum voo encontrado para este piloto');
    }
    
    const voo = voos[0];
    console.log('✅ Voo encontrado:', voo.id);
    console.log('   Data:', voo.data_voo);
    console.log('   Local:', voo.local_decolagem_previsto);
    console.log('   Status:', voo.status);
    
    // 5. Verificar se arquivo de teste existe
    const testImagePath = './scripts/test-image.jpg';
    if (!fs.existsSync(testImagePath)) {
      console.log('\n3️⃣ Criando arquivo de teste...');
      // Criar um arquivo JPEG simples (header mínimo)
      const jpegHeader = Buffer.from([
        0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01,
        0x01, 0x01, 0x00, 0x48, 0x00, 0x48, 0x00, 0x00, 0xFF, 0xD9
      ]);
      fs.writeFileSync(testImagePath, jpegHeader);
      console.log('✅ Arquivo de teste criado:', testImagePath);
    }
    
    // 6. Preparar FormData
    console.log('\n4️⃣ Preparando upload...');
    const formData = new FormData();
    // Usar buffer em vez de stream para evitar problemas de parsing
    const fileBuffer = fs.readFileSync(testImagePath);
    formData.append('file', fileBuffer, {
      filename: 'test-image.jpg',
      contentType: 'image/jpeg'
    });
    formData.append('tipo', 'foto_voo');
    
    // 7. Fazer upload via fetch
    console.log('\n5️⃣ Enviando arquivo...');
    const uploadUrl = `http://localhost:3000/api/voos/${voo.id}/anexos/upload`;
    
    const response = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authData.session.access_token}`,
        ...formData.getHeaders()
      },
      body: formData
    });
    
    console.log('📊 Status da resposta:', response.status);
    console.log('📊 Headers da resposta:', Object.fromEntries(response.headers.entries()));
    
    const responseText = await response.text();
    console.log('📊 Corpo da resposta:', responseText);
    
    if (response.ok) {
      console.log('\n🎉 UPLOAD BEM-SUCEDIDO!');
      try {
        const responseData = JSON.parse(responseText);
        console.log('📄 Dados do anexo:', responseData);
      } catch (e) {
        console.log('⚠️ Resposta não é JSON válido');
      }
    } else {
      console.log('\n❌ UPLOAD FALHOU!');
      console.log('Status:', response.status);
      console.log('Resposta:', responseText);
    }
    
  } catch (error) {
    console.error('\n💥 Erro durante o teste:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Executar o teste
testUploadDirect();