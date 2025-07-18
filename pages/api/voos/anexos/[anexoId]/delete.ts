import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Cliente com service role para operações privilegiadas
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Cliente normal para verificações de autenticação
const supabase = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    const { anexoId } = req.query;

    if (!anexoId || typeof anexoId !== 'string') {
      return res.status(400).json({ error: 'ID do anexo é obrigatório' });
    }

    // Verificar autenticação
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Token de autenticação necessário' });
    }

    const token = authHeader.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return res.status(401).json({ error: 'Token inválido' });
    }

    // Buscar o anexo e verificar permissões
    const { data: anexo, error: anexoError } = await supabaseAdmin
      .from('voos_anexos')
      .select(`
        *,
        voos!inner (
          id,
          piloto_id,
          agencia_id
        )
      `)
      .eq('id', anexoId)
      .single();

    if (anexoError || !anexo) {
      return res.status(404).json({ error: 'Anexo não encontrado' });
    }

    // Verificar se o usuário tem permissão para deletar
    let hasPermission = false;

    // Verificar se é administrador
    const { data: admin } = await supabaseAdmin
      .from('usuarios_admin')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (admin) {
      hasPermission = true;
    } else {
      // Verificar se é o piloto do voo
      const { data: piloto } = await supabaseAdmin
        .from('membros')
        .select('id')
        .eq('user_id', user.id)
        .eq('tipo', 'piloto')
        .single();

      if (piloto && anexo.voos.piloto_id === piloto.id) {
        hasPermission = true;
      } else if (anexo.voos.agencia_id) {
        // Verificar se é da agência do voo
        const { data: agencia } = await supabaseAdmin
          .from('membros')
          .select('id')
          .eq('user_id', user.id)
          .eq('tipo', 'agencia')
          .single();

        if (agencia && anexo.voos.agencia_id === agencia.id) {
          hasPermission = true;
        }
      }
    }

    if (!hasPermission) {
      return res.status(403).json({ error: 'Sem permissão para deletar este anexo' });
    }

    // Extrair o path do storage da URL
    const urlParts = anexo.url_storage.split('/voos-anexos/');
    if (urlParts.length < 2) {
      return res.status(400).json({ error: 'URL do anexo inválida' });
    }
    const storagePath = urlParts[1];

    // Deletar do storage
    const { error: storageError } = await supabaseAdmin.storage
      .from('voos-anexos')
      .remove([storagePath]);

    if (storageError) {
      console.error('Erro ao deletar do storage:', storageError);
      // Continuar mesmo com erro no storage, pois o arquivo pode já ter sido deletado
    }

    // Deletar do banco
    const { error: deleteError } = await supabaseAdmin
      .from('voos_anexos')
      .delete()
      .eq('id', anexoId);

    if (deleteError) {
      console.error('Erro ao deletar anexo:', deleteError);
      return res.status(500).json({ error: `Erro ao deletar anexo: ${deleteError.message}` });
    }

    return res.status(200).json({
      success: true,
      message: 'Anexo deletado com sucesso'
    });

  } catch (error) {
    console.error('Erro ao deletar anexo:', error);
    return res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Erro interno do servidor' 
    });
  }
}