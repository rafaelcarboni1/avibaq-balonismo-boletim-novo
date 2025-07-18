require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// Configuração
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Dados do usuário
const email = 'rafaeldacunhacarboni@gmail.com';
const newPassword = 'Rafinha885';
const userId = '3dd68e6a-4c5d-47a4-921c-da3b497efb36';

async function resetPassword() {
  console.log('🔧 RESETANDO SENHA DO USUÁRIO');
  console.log('=============================');

  try {
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    
    console.log('\n1️⃣ Resetando senha...');
    
    const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
      userId,
      {
        password: newPassword
      }
    );

    if (error) {
      console.error('❌ Erro ao resetar senha:', error.message);
      return;
    }

    console.log('✅ Senha resetada com sucesso!');
    console.log('   User ID:', data.user.id);
    console.log('   Email:', data.user.email);
    
    // Testar login
    console.log('\n2️⃣ Testando login com nova senha...');
    const supabaseClient = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
    
    const { data: authData, error: authError } = await supabaseClient.auth.signInWithPassword({
      email,
      password: newPassword
    });

    if (authError) {
      console.error('❌ Erro no login:', authError.message);
      return;
    }

    console.log('✅ Login bem-sucedido!');
    console.log('   User ID:', authData.user.id);
    console.log('   Access Token:', authData.session.access_token.substring(0, 50) + '...');
    
    console.log('\n🎉 SENHA RESETADA E TESTADA COM SUCESSO!');
    console.log('   Email:', email);
    console.log('   Senha:', newPassword);

  } catch (error) {
    console.error('❌ Erro geral:', error.message);
    console.error('Stack:', error.stack);
  }
}

resetPassword();