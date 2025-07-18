require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const FormData = require('form-data');
const fs = require('fs');
const fetch = require('node-fetch');

// Configuração
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('🔧 Configuração:');
console.log('   Supabase URL:', supabaseUrl ? 'Configurado' : 'FALTANDO');
console.log('   Anon Key:', supabaseAnonKey ? 'Configurado' : 'FALTANDO');
const email = 'rafaeldacunhacarboni@gmail.com';
const password = 'Rafinha885';

async function testRealAPI() {
  console.log('🔍 TESTE DA API REAL DE UPLOAD');
  console.log('==============================');

  try {
    // 1. Fazer login
    console.log('\n1️⃣ Fazendo login...');
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (authError) {
      console.error('❌ Erro no login:', authError.message);
      return;
    }

    console.log('✅ Login bem-sucedido');
    console.log('   User ID:', authData.user.id);
    console.log('   Access Token:', authData.session.access_token.substring(0, 50) + '...');

    // 2. Buscar voo do piloto
    console.log('\n2️⃣ Buscando voo do piloto...');
    const { data: voos, error: voosError } = await supabase
      .from('voos')
      .select('id, data_voo, local_decolagem')
      .eq('piloto_id', authData.user.id)
      .limit(1);

    if (voosError || !voos || voos.length === 0) {
      console.error('❌ Erro ao buscar voos:', voosError?.message || 'Nenhum voo encontrado');
      return;
    }

    const voo = voos[0];
    console.log('✅ Voo encontrado:', voo.id);
    console.log('   Data:', voo.data_voo);
    console.log('   Local:', voo.local_decolagem);

    // 3. Criar arquivo de teste
    console.log('\n3️⃣ Criando arquivo de teste...');
    const testFilePath = './scripts/test-image.jpg';
    
    // Criar um arquivo de imagem fake simples
    const fakeJpegHeader = Buffer.from([
      0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01,
      0x01, 0x01, 0x00, 0x48, 0x00, 0x48, 0x00, 0x00, 0xFF, 0xDB, 0x00, 0x43,
      0x00, 0x08, 0x06, 0x06, 0x07, 0x06, 0x05, 0x08, 0x07, 0x07, 0x07, 0x09,
      0x09, 0x08, 0x0A, 0x0C, 0x14, 0x0D, 0x0C, 0x0B, 0x0B, 0x0C, 0x19, 0x12,
      0x13, 0x0F, 0x14, 0x1D, 0x1A, 0x1F, 0x1E, 0x1D, 0x1A, 0x1C, 0x1C, 0x20,
      0x24, 0x2E, 0x27, 0x20, 0x22, 0x2C, 0x23, 0x1C, 0x1C, 0x28, 0x37, 0x29,
      0x2C, 0x30, 0x31, 0x34, 0x34, 0x34, 0x1F, 0x27, 0x39, 0x3D, 0x38, 0x32,
      0x3C, 0x2E, 0x33, 0x34, 0x32, 0xFF, 0xD9
    ]);
    
    fs.writeFileSync(testFilePath, fakeJpegHeader);
    console.log('✅ Arquivo de teste criado:', testFilePath);

    // 4. Testar upload via API
    console.log('\n4️⃣ Testando upload via API...');
    
    const formData = new FormData();
    formData.append('file', fs.createReadStream(testFilePath));
    formData.append('tipo', 'foto_voo');

    const response = await fetch(`http://localhost:3000/api/voos/${voo.id}/anexos/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authData.session.access_token}`,
        ...formData.getHeaders()
      },
      body: formData
    });

    console.log('   Status:', response.status);
    console.log('   Status Text:', response.statusText);

    const responseText = await response.text();
    console.log('   Response:', responseText);

    if (response.ok) {
      console.log('\n🎉 UPLOAD BEM-SUCEDIDO!');
      const result = JSON.parse(responseText);
      console.log('   Anexo ID:', result.id);
      console.log('   URL:', result.url_storage);
    } else {
      console.log('\n❌ UPLOAD FALHOU!');
      console.log('   Erro:', responseText);
    }

    // 5. Limpeza
    console.log('\n5️⃣ Limpando arquivo de teste...');
    if (fs.existsSync(testFilePath)) {
      fs.unlinkSync(testFilePath);
      console.log('✅ Arquivo removido');
    }

  } catch (error) {
    console.error('❌ Erro geral:', error.message);
    console.error('Stack:', error.stack);
  }
}

testRealAPI();