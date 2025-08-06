// Teste das APIs com usuário fixo
// Execute: node test-push-with-fixed-user.js

const fetch = require('node-fetch');

const FIXED_ADMIN_ID = '00000000-1111-2222-3333-444444444444';
const baseUrl = 'http://localhost:3000';

async function testPushAPIs() {
  console.log('🧪 === TESTE COM USUÁRIO FIXO ===\n');
  console.log(`📍 Usando adminUserId: ${FIXED_ADMIN_ID}\n`);
  
  // 1. Testar API de envio imediato
  console.log('1️⃣ Testando API send-immediate...');
  try {
    const response = await fetch(`${baseUrl}/api/push/send-immediate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        adminUserId: FIXED_ADMIN_ID,
        title: 'Teste Fix',
        message: 'Mensagem com usuário fixo',
        targetAudience: { type: 'all' }
      })
    });
    
    const result = await response.text();
    console.log(`✅ Status: ${response.status}`);
    
    if (response.status === 200) {
      console.log(`🎉 SUCESSO! Resposta:`);
      console.log(result);
    } else {
      console.log(`❌ ERRO! Resposta:`);
      console.log(result);
    }
    console.log('');
    
  } catch (error) {
    console.log(`❌ Erro de conexão: ${error.message}\n`);
  }
  
  // 2. Testar API de agendamento
  console.log('2️⃣ Testando API schedule...');
  try {
    // Data para amanhã às 14h
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const scheduledFor = tomorrow.toISOString().slice(0, 16); // formato datetime-local
    
    console.log(`📅 Agendando para: ${scheduledFor}`);
    
    const response = await fetch(`${baseUrl}/api/push/schedule`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        adminUserId: FIXED_ADMIN_ID,
        title: 'Agend Fix',
        message: 'Mensagem agendada com usuário fixo',
        scheduledFor: scheduledFor,
        targetAudience: { type: 'all' },
        recurring: false
      })
    });
    
    const result = await response.text();
    console.log(`✅ Status: ${response.status}`);
    
    if (response.status === 200) {
      console.log(`🎉 SUCESSO! Resposta:`);
      console.log(result);
    } else {
      console.log(`❌ ERRO! Resposta:`);
      console.log(result);
    }
    console.log('');
    
  } catch (error) {
    console.log(`❌ Erro de conexão: ${error.message}\n`);
  }
  
  console.log('✅ Testes concluídos!\n');
  console.log('📋 PRÓXIMOS PASSOS:');
  console.log('1. Se os testes funcionaram, o problema é a autenticação do frontend');
  console.log('2. Se ainda há erros, precisamos ajustar a estrutura do banco');
  console.log('3. Depois de funcionar, integramos com a autenticação real');
}

// Executar
if (require.main === module) {
  testPushAPIs().catch(console.error);
}

module.exports = { testPushAPIs };