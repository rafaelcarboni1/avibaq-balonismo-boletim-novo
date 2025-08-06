// Teste básico das APIs de push notifications
// Execute: node test-push-basic.js

const fetch = require('node-fetch');

async function testPushAPIs() {
  const baseUrl = 'http://localhost:3000';
  
  console.log('🧪 === TESTE DAS APIs DE PUSH NOTIFICATIONS ===\n');
  
  // 1. Testar API de envio imediato
  console.log('1️⃣ Testando API send-immediate...');
  try {
    const response = await fetch(`${baseUrl}/api/push/send-immediate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        adminUserId: '00000000-0000-0000-0000-000000000001', // UUID fake para teste
        title: 'Teste Básico',
        message: 'Mensagem de teste básica',
        targetAudience: { type: 'all' }
      })
    });
    
    const result = await response.text();
    console.log(`Status: ${response.status}`);
    console.log(`Resposta: ${result}\n`);
    
  } catch (error) {
    console.log(`❌ Erro: ${error.message}\n`);
  }
  
  // 2. Testar API de agendamento
  console.log('2️⃣ Testando API schedule...');
  try {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(14, 0, 0, 0);
    
    const response = await fetch(`${baseUrl}/api/push/schedule`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        adminUserId: '00000000-0000-0000-0000-000000000001',
        title: 'Teste Agendamento',
        message: 'Mensagem de teste agendada',
        scheduledFor: tomorrow.toISOString().slice(0, 16), // formato datetime-local
        targetAudience: { type: 'all' },
        recurring: false
      })
    });
    
    const result = await response.text();
    console.log(`Status: ${response.status}`);
    console.log(`Resposta: ${result}\n`);
    
  } catch (error) {
    console.log(`❌ Erro: ${error.message}\n`);
  }
  
  console.log('✅ Testes concluídos!');
}

// Executar se chamado diretamente
if (require.main === module) {
  testPushAPIs().catch(console.error);
}

module.exports = { testPushAPIs };