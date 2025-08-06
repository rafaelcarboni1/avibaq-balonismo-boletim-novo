// Teste direto das funções de upload seguro
import { createClient } from '@supabase/supabase-js';

// Configuração do cliente Supabase com service_role
const supabaseUrl = 'https://elcbodhxzvoqpzamgown.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVsY2JvZGh4enZvcXB6YW1nb3duIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTMwNDc4MCwiZXhwIjoyMDY2ODgwNzgwfQ.UfTwpvPuw4ffuPHS9UPBIMNYPOuSmde8WxnN4FXVSAs';

const supabaseUpload = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Função de upload seguro (cópia da implementação)
async function uploadFileSecure({
  file,
  bucket,
  path,
  userId,
  allowedTypes = [],
  maxSizeBytes = 50 * 1024 * 1024
}) {
  try {
    if (!userId) {
      return { success: false, error: 'Usuário não autenticado' };
    }

    if (file.size > maxSizeBytes) {
      const maxSizeMB = Math.round(maxSizeBytes / (1024 * 1024));
      return { success: false, error: `Arquivo muito grande. Máximo permitido: ${maxSizeMB}MB` };
    }

    if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
      return { success: false, error: `Tipo de arquivo não permitido: ${file.type}. Tipos aceitos: ${allowedTypes.join(', ')}` };
    }

    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
    const fullPath = `${path}/${fileName}`;

    const { data, error } = await supabaseUpload.storage
      .from(bucket)
      .upload(fullPath, file);

    if (error) {
      return { success: false, error: error.message };
    }

    const { data: { publicUrl } } = supabaseUpload.storage
      .from(bucket)
      .getPublicUrl(fullPath);

    return { 
      success: true, 
      data, 
      url: publicUrl,
      path: fullPath
    };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Erro desconhecido no upload'
    };
  }
}

// Função de exclusão segura (cópia da implementação)
async function deleteFileSecure({
  url,
  bucket,
  userId
}) {
  try {
    if (!userId) {
      return { success: false, error: 'Usuário não autenticado' };
    }

    const urlParts = url.split(`/${bucket}/`);
    if (urlParts.length < 2) {
      return { success: false, error: 'URL inválida' };
    }
    const path = urlParts[1];

    const { data, error } = await supabaseUpload.storage
      .from(bucket)
      .remove([path]);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Erro desconhecido na exclusão'
    };
  }
}

// Simular um arquivo de teste
const createTestFile = () => {
  const content = 'Este é um arquivo de teste para upload seguro';
  const blob = new Blob([content], { type: 'text/plain' });
  const file = new File([blob], 'test-secure-upload.txt', { type: 'text/plain' });
  return file;
};

console.log('🧪 Testando função de upload seguro...');

try {
  const testFile = createTestFile();
  
  console.log('📁 Testando upload com função segura...');
  
  const result = await uploadFileSecure({
    file: testFile,
    bucket: 'voos-anexos',
    path: 'voos/test-voo-id/track',
    userId: 'test-user-id',
    allowedTypes: ['text/plain'],
    maxSizeBytes: 10 * 1024 * 1024 // 10MB
  });
  
  if (result.success) {
    console.log('✅ Upload seguro bem-sucedido!');
    console.log('   URL:', result.url);
    console.log('   Path:', result.path);
    
    // Testar exclusão
    console.log('\n🗑️ Testando exclusão segura...');
    const deleteResult = await deleteFileSecure({
      url: result.url,
      bucket: 'voos-anexos',
      userId: 'test-user-id'
    });
    
    if (deleteResult.success) {
      console.log('✅ Exclusão segura bem-sucedida!');
    } else {
      console.log('❌ Erro na exclusão:', deleteResult.error);
    }
  } else {
    console.log('❌ Erro no upload seguro:', result.error);
  }
  
} catch (error) {
  console.error('❌ Erro no teste:', error.message);
}

console.log('\n🔧 Teste concluído!');