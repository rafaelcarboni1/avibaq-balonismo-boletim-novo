// Script para gerar VAPID keys para Push Notifications
// Execute: node generate-vapid-keys.js

const crypto = require('crypto');

function generateVapidKeys() {
  const { publicKey, privateKey } = crypto.generateKeyPairSync('ec', {
    namedCurve: 'prime256v1',
    publicKeyEncoding: {
      type: 'spki',
      format: 'der'
    },
    privateKeyEncoding: {
      type: 'pkcs8',
      format: 'der'
    }
  });

  // Converter para base64 URL-safe
  const publicKeyBase64 = publicKey.toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');

  const privateKeyBase64 = privateKey.toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');

  return {
    publicKey: publicKeyBase64,
    privateKey: privateKeyBase64
  };
}

console.log('🔐 Gerando VAPID Keys para Push Notifications...\n');

const vapidKeys = generateVapidKeys();

console.log('✅ VAPID Keys geradas com sucesso!\n');

console.log('📋 Adicione estas variáveis ao seu .env.local:\n');
console.log('# VAPID Keys para Push Notifications');
console.log(`VAPID_PUBLIC_KEY=${vapidKeys.publicKey}`);
console.log(`VAPID_PRIVATE_KEY=${vapidKeys.privateKey}`);
console.log(`NEXT_PUBLIC_VAPID_PUBLIC_KEY=${vapidKeys.publicKey}`);

console.log('\n📋 E também no seu ambiente de produção (Vercel):\n');
console.log('Environment Variables:');
console.log(`VAPID_PUBLIC_KEY = ${vapidKeys.publicKey}`);
console.log(`VAPID_PRIVATE_KEY = ${vapidKeys.privateKey}`);
console.log(`NEXT_PUBLIC_VAPID_PUBLIC_KEY = ${vapidKeys.publicKey}`);

console.log('\n🚀 Próximos passos:');
console.log('1. Adicione as chaves ao .env.local');
console.log('2. Configure as mesmas chaves no Vercel/ambiente de produção');
console.log('3. Reinicie o servidor de desenvolvimento');
console.log('4. Teste as notificações push');

console.log('\n💡 Importante:');
console.log('- NUNCA compartilhe a chave privada (VAPID_PRIVATE_KEY)');
console.log('- A chave pública pode ser vista no frontend');
console.log('- Mantenha as chaves seguras e faça backup');

module.exports = { generateVapidKeys };