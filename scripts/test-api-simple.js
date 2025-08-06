require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Configuração
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Dados conhecidos
const email = 'rafaeldacunhacarboni@gmail.com';
const password = 'Rafinha885';
const userId = '3dd68e6a-4c5d-47a4-921c-da3b497efb36';
const membroId = '24a1a1f4-1304-4f45-98bc-8a9e89e533d0';

async function testApiSimple() {
  console.log('🔍 TESTE SIMPLES DA API DE UPLOAD');
  console.log('=================================');

  try {
    // 1. Fazer login para obter token
    console.log('\n1️⃣ Fazendo login...');
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (authError) {
      console.error('❌ Erro no login:', authError.message);
      
      // Tentar criar usuário se não existir
      console.log('\n🔄 Tentando criar usuário...');
      const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
      
      const { data: createData, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          nome: 'Rafael da Cunha Carboni'
        }
      });
      
      if (createError) {
        console.error('❌ Erro ao criar usuário:', createError.message);
        return;
      }
      
      console.log('✅ Usuário criado, tentando login novamente...');
      
      const { data: authData2, error: authError2 } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (authError2) {
        console.error('❌ Erro no segundo login:', authError2.message);
        return;
      }
      
      console.log('✅ Login bem-sucedido após criação');
      console.log('   User ID:', authData2.user.id);
      
      return;
    }

    console.log('✅ Login bem-sucedido');
    console.log('   User ID:', authData.user.id);
    console.log('   Access Token:', authData.session.access_token.substring(0, 50) + '...');

    // 2. Buscar voo usando service key
    console.log('\n2️⃣ Buscando voo do piloto...');
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    
    const { data: voos, error: voosError } = await supabaseAdmin
      .from('voos')
      .select('id, data_voo, local_decolagem_previsto, status')
      .eq('piloto_id', membroId)
      .limit(1);

    if (voosError || !voos || voos.length === 0) {
      console.error('❌ Erro ao buscar voos:', voosError?.message || 'Nenhum voo encontrado');
      return;
    }

    const voo = voos[0];
    console.log('✅ Voo encontrado:', voo.id);
    console.log('   Data:', voo.data_voo);
    console.log('   Local:', voo.local_decolagem_previsto);
    console.log('   Status:', voo.status);

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

    // 4. Gerar comando curl para teste manual
    console.log('\n4️⃣ Comando curl para teste manual:');
    console.log('===================================');
    
    const curlCommand = `curl -X POST http://localhost:3000/api/voos/${voo.id}/anexos/upload \\
  -H "Authorization: Bearer ${authData.session.access_token}" \\
  -F "file=@${testFilePath}" \\
  -F "tipo=foto_voo" \\
  -v`;
    
    console.log(curlCommand);
    
    console.log('\n💡 INSTRUÇÕES:');
    console.log('1. Copie o comando curl acima');
    console.log('2. Execute em um terminal separado');
    console.log('3. Verifique a resposta da API');
    
    console.log('\n📝 INFORMAÇÕES PARA DEBUG:');
    console.log('==========================');
    console.log('   - Voo ID:', voo.id);
    console.log('   - User ID:', authData.user.id);
    console.log('   - Token válido até:', new Date(authData.session.expires_at * 1000).toLocaleString());
    console.log('   - Arquivo de teste:', testFilePath);

  } catch (error) {
    console.error('❌ Erro geral:', error.message);
    console.error('Stack:', error.stack);
  }
}

testApiSimple();