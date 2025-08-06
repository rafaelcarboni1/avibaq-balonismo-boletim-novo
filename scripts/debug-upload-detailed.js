#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
const FormData = require('form-data');
const fs = require('fs');
const fetch = require('node-fetch');

// Configuração do Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🕵️ DEBUG DETALHADO DO UPLOAD');
console.log('='*60);

async function debugUpload() {
  try {
    const vooId = '8c930b01-b679-4659-8224-3db8bd0b5d85';
    
    console.log('1. 📋 Verificando anexos existentes...');
    const { data: anexos, error: anexosError } = await supabase
      .from('voos_anexos')
      .select('*')
      .eq('voo_id', vooId);
    
    if (anexosError) {
      console.log('   ❌ Erro ao buscar anexos:', anexosError.message);
      console.log('   Detalhes:', JSON.stringify(anexosError, null, 2));
    } else {
      console.log(`   ✅ Encontrados ${anexos.length} anexos na tabela`);
      anexos.forEach((anexo, index) => {
        console.log(`   ${index + 1}. ${anexo.nome_arquivo} (${anexo.tipo}) - ${anexo.created_at}`);
      });
    }

    console.log('\n2. 📁 Verificando arquivos no Storage...');
    const { data: storageFiles, error: storageError } = await supabase
      .storage
      .from('voos-anexos')
      .list(`voos/${vooId}`, {
        limit: 50,
        sortBy: { column: 'created_at', order: 'desc' }
      });
    
    if (storageError) {
      console.log('   ❌ Erro ao listar Storage:', storageError.message);
      console.log('   Detalhes:', JSON.stringify(storageError, null, 2));
    } else {
      console.log(`   ✅ Encontrados ${storageFiles.length} arquivos no Storage`);
      storageFiles.forEach((file, index) => {
        console.log(`   ${index + 1}. ${file.name} (${file.metadata?.size || 'N/A'} bytes) - ${file.created_at}`);
      });
    }

    console.log('\n3. 🔍 Comparando Storage vs Banco...');
    const storageCount = storageFiles?.length || 0;
    const bancoCount = anexos?.length || 0;
    
    if (storageCount > bancoCount) {
      console.log('   ⚠️  PROBLEMA IDENTIFICADO!');
      console.log(`   📁 Storage: ${storageCount} arquivos`);
      console.log(`   🗄️  Banco: ${bancoCount} registros`);
      console.log('   💡 Arquivos estão sendo enviados ao Storage mas não salvos no banco!');
    } else if (storageCount === bancoCount) {
      console.log('   ✅ Storage e banco estão sincronizados');
    } else {
      console.log('   ❓ Banco tem mais registros que Storage (situação estranha)');
    }

    console.log('\n4. 🧪 Testando inserção direta no banco...');
    const testInsert = {
      voo_id: vooId,
      tipo: 'foto_voo',
      nome_arquivo: 'teste_debug.jpg',
      nome_original: 'teste_debug.jpg',
      url_storage: 'https://test.com/test.jpg',
      tamanho_bytes: 1024,
      mime_type: 'image/jpeg',
      uploaded_por: '3dd68e6a-4c5d-47a4-921c-da3b497efb36' // ID do usuário piloto
    };
    
    const { data: insertResult, error: insertError } = await supabase
      .from('voos_anexos')
      .insert(testInsert)
      .select();
    
    if (insertError) {
      console.log('   ❌ ERRO na inserção direta:', insertError.message);
      console.log('   Código:', insertError.code);
      console.log('   Detalhes:', JSON.stringify(insertError, null, 2));
      
      // Verificar políticas RLS
      console.log('\n5. 🔐 Testando políticas RLS...');
      const { data: { user } } = await supabase.auth.getUser();
      console.log('   Usuário autenticado:', user ? user.email : 'Não autenticado');
      
      if (!user) {
        console.log('   ❌ Usuário não autenticado! Isso pode ser o problema.');
        console.log('   💡 Para testar: faça login na aplicação primeiro');
      }
    } else {
      console.log('   ✅ Inserção direta funcionou!');
      console.log('   Registro criado:', insertResult[0]?.id);
      
      // Limpar registro de teste
      await supabase
        .from('voos_anexos')
        .delete()
        .eq('id', insertResult[0]?.id);
      console.log('   🧹 Registro de teste removido');
    }

    console.log('\n6. 🌐 Testando API endpoint...');
    try {
      const response = await fetch(`http://localhost:3000/api/voos/${vooId}/anexos/upload`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ test: true })
      });
      
      const result = await response.json();
      console.log('   Status:', response.status);
      console.log('   Resposta:', JSON.stringify(result, null, 2));
    } catch (error) {
      console.log('   ❌ Erro ao testar API:', error.message);
      console.log('   💡 Certifique-se de que npm run dev está rodando');
    }

    console.log('\n' + '='*60);
    console.log('🎯 DIAGNÓSTICO COMPLETO');
    console.log('='*60);
    
    if (storageCount > bancoCount) {
      console.log('🔍 PROBLEMA IDENTIFICADO: Upload funciona no Storage, falha no banco');
      console.log('📋 POSSÍVEIS CAUSAS:');
      console.log('   1. Políticas RLS bloqueando inserção');
      console.log('   2. Usuário não autenticado na API');
      console.log('   3. Erro na API endpoint');
      console.log('   4. Conflito na estrutura da tabela');
      console.log('\n💡 PRÓXIMOS PASSOS:');
      console.log('   1. Verificar logs do terminal onde npm run dev está rodando');
      console.log('   2. Verificar se há erros específicos nos logs');
      console.log('   3. Testar com usuário autenticado');
    } else {
      console.log('✅ Sistema parece estar funcionando corretamente');
      console.log('💡 Se ainda há problemas, verifique:');
      console.log('   1. Console do navegador para erros JavaScript');
      console.log('   2. Logs do servidor para erros específicos');
    }

  } catch (error) {
    console.error('❌ Erro durante diagnóstico:', error.message);
    console.error('Stack:', error.stack);
  }
}

debugUpload();