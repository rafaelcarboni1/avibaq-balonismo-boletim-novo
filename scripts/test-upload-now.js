#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
const FormData = require('form-data');
const fs = require('fs');
const fetch = require('node-fetch');

// Configuração do Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente não encontradas!');
  console.error('   Certifique-se de que .env.local está configurado');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🧪 TESTE DE UPLOAD - IGNORANDO WARNINGS DO FAST REFRESH');
console.log('='*50);

async function testUploadWithServer() {
  try {
    // Verificar se o servidor está rodando
    console.log('1. 🌐 Verificando se servidor está rodando...');
    
    try {
      const serverResponse = await fetch('http://localhost:3000');
      if (serverResponse.ok) {
        console.log('   ✅ Servidor está rodando em localhost:3000');
      } else {
        console.log('   ❌ Servidor não está respondendo');
        return;
      }
    } catch (error) {
      console.log('   ❌ Servidor não está rodando. Execute: npm run dev');
      return;
    }

    // Verificar conexão com Supabase
    console.log('2. 🔗 Verificando conexão com Supabase...');
    const { data, error } = await supabase.from('voos').select('id').limit(1);
    
    if (error) {
      console.log('   ❌ Erro na conexão com Supabase:', error.message);
      return;
    }
    
    console.log('   ✅ Conexão com Supabase OK');

    // Verificar se existe o voo de teste
    console.log('3. 🎯 Verificando voo de teste...');
    const vooId = '8c930b01-b679-4659-8224-3db8bd0b5d85';
    
    const { data: vooData, error: vooError } = await supabase
      .from('voos')
      .select('id, status, piloto_id')
      .eq('id', vooId)
      .single();
    
    if (vooError || !vooData) {
      console.log('   ❌ Voo de teste não encontrado');
      return;
    }
    
    console.log('   ✅ Voo de teste encontrado:', vooData.status);

    // Verificar storage
    console.log('4. 📁 Verificando Storage...');
    const { data: storageData, error: storageError } = await supabase
      .storage
      .from('voos-anexos')
      .list('', { limit: 1 });
    
    if (storageError) {
      console.log('   ❌ Erro no Storage:', storageError.message);
      return;
    }
    
    console.log('   ✅ Storage acessível');

    console.log('\n🎯 INSTRUÇÕES PARA TESTE MANUAL:');
    console.log('='*50);
    console.log('1. 🌐 Abra o navegador em: http://localhost:3000');
    console.log('2. 🔐 Faça login com: rafaeldacunhacarboni@gmail.com');
    console.log('3. 📄 Acesse: http://localhost:3000/piloto/pos-voo/8c930b01-b679-4659-8224-3db8bd0b5d85');
    console.log('4. 📤 Scroll até "Anexos do Voo" e teste upload');
    console.log('5. 👀 Observe os logs no terminal (onde npm run dev está rodando)');
    console.log('6. 🔍 Abra Console do navegador (F12) para ver possíveis erros');
    console.log('\n📋 LOGS ESPERADOS NO TERMINAL:');
    console.log('   - "Iniciando upload para Storage: voos/..."');
    console.log('   - "Upload para Storage concluído"');
    console.log('   - "Salvando anexo no banco"');
    console.log('   - "Anexo salvo no banco com sucesso"');
    console.log('\n⚠️  IMPORTANTE: Ignore os warnings de Fast Refresh!');
    console.log('   O servidor está funcionando normalmente.');
    console.log('\n✅ Pré-requisitos verificados! Teste o upload agora.');

  } catch (error) {
    console.error('❌ Erro durante verificação:', error.message);
  }
}

testUploadWithServer();