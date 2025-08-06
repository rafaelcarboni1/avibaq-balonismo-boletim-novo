const fetch = require('node-fetch');

async function debugNotifications() {
  try {
    console.log('🔍 Verificando notificações no banco...');
    
    // Vamos buscar TODAS as notificações, independente do status
    const response = await fetch('http://localhost:3000/api/push/history?status=all&limit=50', {
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
      
      if (data.notifications && data.notifications.length > 0) {
        console.log('\n📝 Status das notificações:');
        data.notifications.forEach((notif, index) => {
          console.log(`${index + 1}. ${notif.title} - Status: ${notif.status} - Criada: ${notif.createdAt}`);
        });
      }
    } else {
      const error = await response.text();
      console.error('❌ Erro na resposta:', error);
    }

    // Testar também buscar notificações agendadas
    console.log('\n🔍 Verificando jobs agendados...');
    
    const scheduledResponse = await fetch('http://localhost:3000/api/push/scheduled-list?limit=10', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log('📊 Status da resposta de agendados:', scheduledResponse.status);
    
    if (scheduledResponse.ok) {
      const scheduledData = await scheduledResponse.json();
      console.log('✅ Jobs agendados:', scheduledData.length || 0);
    } else {
      const scheduledError = await scheduledResponse.text();
      console.error('❌ Erro nos agendados:', scheduledError);
    }

  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

debugNotifications();