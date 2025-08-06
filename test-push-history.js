const fetch = require('node-fetch');

async function testPushHistory() {
  try {
    console.log('🔍 Testando API de histórico de notificações...');
    
    const response = await fetch('http://localhost:3000/api/push/history?page=1&limit=10', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log('📊 Status da resposta:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Dados recebidos:');
      console.log('- Total de notificações:', data.notifications?.length || 0);
      console.log('- Stats:', JSON.stringify(data.stats, null, 2));
      console.log('- Pagination:', JSON.stringify(data.pagination, null, 2));
      
      if (data.notifications && data.notifications.length > 0) {
        console.log('\n📝 Primeira notificação:');
        console.log(JSON.stringify(data.notifications[0], null, 2));
      }
    } else {
      const error = await response.text();
      console.error('❌ Erro na resposta:', error);
    }

  } catch (error) {
    console.error('❌ Erro ao testar:', error.message);
  }
}

testPushHistory();