#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Iniciando servidor estável sem Fast Refresh...');

// Definir variáveis de ambiente para desabilitar Fast Refresh
const env = {
  ...process.env,
  NODE_ENV: 'development',
  FAST_REFRESH: 'false',
  TURBO_TRACE: '0',
  NEXT_TELEMETRY_DISABLED: '1'
};

// Iniciar o servidor Next.js com configurações otimizadas
const nextServer = spawn('npx', ['next', 'dev', '--port', '3000'], {
  env,
  stdio: 'inherit',
  shell: true
});

// Tratar sinais para limpar o processo
process.on('SIGINT', () => {
  console.log('\n🛑 Parando servidor...');
  nextServer.kill('SIGINT');
  process.exit(0);
});

process.on('SIGTERM', () => {
  nextServer.kill('SIGTERM');
  process.exit(0);
});

nextServer.on('error', (error) => {
  console.error('❌ Erro no servidor:', error);
});

nextServer.on('exit', (code) => {
  console.log(`🔄 Servidor finalizado com código ${code}`);
});

console.log('💡 Servidor iniciado em modo estável.');
console.log('🌐 Acesse: http://localhost:3000');
console.log('📋 Para testar upload: http://localhost:3000/piloto/pos-voo/8c930b01-b679-4659-8224-3db8bd0b5d85');