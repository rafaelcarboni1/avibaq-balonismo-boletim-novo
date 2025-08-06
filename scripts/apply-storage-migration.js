import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuração do Supabase
const supabaseUrl = 'https://elcbodhxzvoqpzamgown.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVsY2JvZGh4enZvcXB6YW1nb3duIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTMwNDc4MCwiZXhwIjoyMDY2ODgwNzgwfQ.UfTwpvPuw4ffuPHS9UPBIMNYPOuSmde8WxnN4FXVSAs';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createStorageBucket() {
  console.log('🚀 Criando bucket de storage para anexos de voos...');
  
  try {
    // Verificar se o bucket já existe
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('❌ Erro ao listar buckets:', listError);
      return;
    }
    
    const existingBucket = buckets.find(bucket => bucket.name === 'voos-anexos');
    
    if (existingBucket) {
      console.log('✅ Bucket voos-anexos já existe!');
    } else {
      // Criar o bucket
      const { data, error } = await supabase.storage.createBucket('voos-anexos', {
        public: false,
        fileSizeLimit: 52428800, // 50MB
        allowedMimeTypes: [
          'application/pdf',
          'application/gpx+xml',
          'application/vnd.google-earth.kml+xml',
          'application/json',
          'text/xml',
          'image/jpeg',
          'image/png',
          'image/webp'
        ]
      });
      
      if (error) {
        console.error('❌ Erro ao criar bucket:', error);
        return;
      }
      
      console.log('✅ Bucket voos-anexos criado com sucesso!');
    }
    
    // Verificar bucket boletim-media também
    const existingBoletimBucket = buckets.find(bucket => bucket.name === 'boletim-media');
    
    if (!existingBoletimBucket) {
      const { data, error } = await supabase.storage.createBucket('boletim-media', {
        public: false,
        fileSizeLimit: 52428800, // 50MB
        allowedMimeTypes: [
          'audio/mpeg',
          'audio/wav',
          'audio/mp3',
          'image/jpeg',
          'image/png',
          'image/webp'
        ]
      });
      
      if (error) {
        console.error('❌ Erro ao criar bucket boletim-media:', error);
      } else {
        console.log('✅ Bucket boletim-media criado com sucesso!');
      }
    } else {
      console.log('✅ Bucket boletim-media já existe!');
    }
    
    console.log('\n🎉 Configuração de storage concluída!');
    console.log('\n📋 Próximos passos:');
    console.log('1. Teste o upload de anexos em /piloto/pos-voo/[id]');
    console.log('2. Verifique se os arquivos são salvos corretamente');
    console.log('3. Teste o download e exclusão de anexos');
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

createStorageBucket().catch(console.error);