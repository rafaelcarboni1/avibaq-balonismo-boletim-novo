import { createClient } from '@supabase/supabase-js';
import type { Database } from '../integrations/supabase/types';

// Cliente específico para uploads com service_role key
// ATENÇÃO: Este cliente tem privilégios elevados e deve ser usado apenas para uploads
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://elcbodhxzvoqpzamgown.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVsY2JvZGh4enZvcXB6YW1nb3duIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTMwNDc4MCwiZXhwIjoyMDY2ODgwNzgwfQ.UfTwpvPuw4ffuPHS9UPBIMNYPOuSmde8WxnN4FXVSAs';

if (!SUPABASE_SERVICE_KEY) {
  throw new Error('SUPABASE_SERVICE_ROLE_KEY não encontrada nas variáveis de ambiente');
}

export const supabaseUpload = createClient<Database>(
  SUPABASE_URL,
  SUPABASE_SERVICE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// Função helper para upload seguro
export async function uploadFileSecure({
  file,
  bucket,
  path,
  userId,
  allowedTypes = [],
  maxSizeBytes = 50 * 1024 * 1024
}: {
  file: File;
  bucket: string;
  path: string;
  userId: string;
  allowedTypes?: string[];
  maxSizeBytes?: number;
}) {
  try {
    // Validações de segurança
    if (!userId) {
      return { success: false, error: 'Usuário não autenticado' };
    }

    // Validar tamanho do arquivo
    if (file.size > maxSizeBytes) {
      const maxSizeMB = Math.round(maxSizeBytes / (1024 * 1024));
      return { success: false, error: `Arquivo muito grande. Máximo permitido: ${maxSizeMB}MB` };
    }

    // Validar tipos de arquivo permitidos
    if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
      return { success: false, error: `Tipo de arquivo não permitido: ${file.type}. Tipos aceitos: ${allowedTypes.join(', ')}` };
    }

    // Gerar nome único para o arquivo
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
    const fullPath = `${path}/${fileName}`;

    // Realizar upload
    const { data, error } = await supabaseUpload.storage
      .from(bucket)
      .upload(fullPath, file);

    if (error) {
      return { success: false, error: error.message };
    }

    // Obter URL pública
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

// Função helper para exclusão segura
export async function deleteFileSecure({
  url,
  bucket,
  userId
}: {
  url: string;
  bucket: string;
  userId: string;
}) {
  try {
    // Validações de segurança
    if (!userId) {
      return { success: false, error: 'Usuário não autenticado' };
    }

    // Extrair o path da URL
    const urlParts = url.split(`/${bucket}/`);
    if (urlParts.length < 2) {
      return { success: false, error: 'URL inválida' };
    }
    const path = urlParts[1];

    // Realizar exclusão
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