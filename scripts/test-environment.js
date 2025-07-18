#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

console.log('🔍 Testando ambiente de desenvolvimento...\n');

// Teste 1: Verificar versões
console.log('1. 📦 Verificando versões:');
console.log('   Node.js:', process.version);

try {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  console.log('   Next.js:', packageJson.dependencies.next);
  console.log('   React:', packageJson.dependencies.react);
} catch (error) {
  console.error('   ❌ Erro ao ler package.json:', error.message);
}

// Teste 2: Verificar arquivos críticos
console.log('\n2. 📄 Verificando arquivos críticos:');
const criticalFiles = [
  'next.config.js',
  'package.json',
  'tsconfig.json',
  'tailwind.config.ts'
];

criticalFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`   ✅ ${file} existe`);
  } else {
    console.log(`   ❌ ${file} não encontrado`);
  }
});

// Teste 3: Verificar .next directory
console.log('\n3. 🗂️ Verificando cache do Next.js:');
const nextDir = '.next';
if (fs.existsSync(nextDir)) {
  console.log('   ✅ Diretório .next existe');
  // Limpar cache
  exec('rm -rf .next', (error) => {
    if (error) {
      console.error('   ❌ Erro ao limpar cache:', error.message);
    } else {
      console.log('   🧹 Cache limpo');
    }
  });
} else {
  console.log('   ℹ️ Diretório .next não existe (normal)');
}

// Teste 4: Verificar espaço em disco
console.log('\n4. 💾 Verificando espaço em disco:');
exec('df -h .', (error, stdout, stderr) => {
  if (error) {
    console.error('   ❌ Erro ao verificar espaço:', error.message);
  } else {
    console.log('   💾 Espaço em disco:');
    console.log(stdout);
  }
});

// Teste 5: Verificar permissões
console.log('\n5. 🔐 Verificando permissões:');
try {
  fs.accessSync('.', fs.constants.R_OK | fs.constants.W_OK);
  console.log('   ✅ Permissões de leitura/escrita OK');
} catch (error) {
  console.error('   ❌ Problema de permissões:', error.message);
}

// Teste 6: Verificar se há processos Node.js rodando
console.log('\n6. 🔍 Verificando processos Node.js:');
exec('ps aux | grep node', (error, stdout, stderr) => {
  if (error) {
    console.error('   ❌ Erro ao verificar processos:', error.message);
  } else {
    const lines = stdout.split('\n').filter(line => 
      line.includes('node') && 
      !line.includes('grep') &&
      !line.includes('test-environment')
    );
    if (lines.length > 0) {
      console.log('   ⚠️ Processos Node.js ativos:');
      lines.forEach(line => console.log(`     ${line.trim()}`));
    } else {
      console.log('   ✅ Nenhum processo Node.js ativo');
    }
  }
});

console.log('\n🎯 Recomendações:');
console.log('   1. Pare todos os processos Node.js ativos');
console.log('   2. Limpe o cache: rm -rf .next');
console.log('   3. Reinstale node_modules: rm -rf node_modules && npm install');
console.log('   4. Use o servidor estável: node scripts/start-stable-server.js');
console.log('\n✅ Teste concluído!');