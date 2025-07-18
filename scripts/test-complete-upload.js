// Teste completo do fluxo de upload de anexos
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Configuração do Supabase
const supabaseUrl = 'https://elcbodhxzvoqpzamgown.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVsY2JvZGh4enZvcXB6YW1nb3duIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEzMDQ3ODAsImV4cCI6MjA2Njg4MDc4MH0.wr15r6xgR0vAlnna2S7qs4RCLgWEPGqQZLq8jaW3BTw';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testCompleteUploadFlow() {
  try {
    console.log('🧪 Iniciando teste completo do fluxo de upload...');
    
    // 1. Verificar se existe um voo de teste
    console.log('\n📋 Verificando voos existentes...');
    const { data: voos, error: voosError } = await supabase
      .from('voos')
      .select('id, data_voo, periodo, status')
      .limit(5);
    
    if (voosError) {
      console.error('❌ Erro ao buscar voos:', voosError.message);
      return;
    }
    
    console.log('✅ Voos encontrados:', voos?.length || 0);
    if (voos && voos.length > 0) {
      console.log('📄 Primeiros voos:', voos.map(v => ({ id: v.id, data: v.data_voo, periodo: v.periodo, status: v.status })));
    }
    
    // 2. Verificar anexos existentes
    console.log('\n📎 Verificando anexos existentes...');
    const { data: anexos, error: anexosError } = await supabase
      .from('voos_anexos')
      .select('id, voo_id, tipo, nome_arquivo, url_storage')
      .limit(5);
    
    if (anexosError) {
      console.error('❌ Erro ao buscar anexos:', anexosError.message);
    } else {
      console.log('✅ Anexos encontrados:', anexos?.length || 0);
      if (anexos && anexos.length > 0) {
        console.log('📄 Primeiros anexos:', anexos);
      }
    }
    
    // 3. Verificar buckets de storage
    console.log('\n🗂️ Verificando buckets de storage...');
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error('❌ Erro ao listar buckets:', bucketsError.message);
    } else {
      console.log('✅ Buckets encontrados:', buckets?.map(b => ({ name: b.name, public: b.public })));
    }
    
    // 4. Verificar arquivos no bucket voos-anexos
    console.log('\n📁 Verificando arquivos no bucket voos-anexos...');
    const { data: files, error: filesError } = await supabase.storage
      .from('voos-anexos')
      .list('', { limit: 10 });
    
    if (filesError) {
      console.error('❌ Erro ao listar arquivos:', filesError.message);
    } else {
      console.log('✅ Arquivos encontrados:', files?.length || 0);
      if (files && files.length > 0) {
        console.log('📄 Primeiros arquivos:', files.map(f => ({ name: f.name, size: f.metadata?.size })));
      }
    }
    
    console.log('\n🎉 Teste completo finalizado!');
    console.log('\n📝 Resumo:');
    console.log(`- Voos: ${voos?.length || 0}`);
    console.log(`- Anexos: ${anexos?.length || 0}`);
    console.log(`- Buckets: ${buckets?.length || 0}`);
    console.log(`- Arquivos no storage: ${files?.length || 0}`);
    
  } catch (error) {
    console.error('❌ Erro no teste:', error.message);
  }
}

// Executar teste
testCompleteUploadFlow();