import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('[DEBUG-API] Recebida requisição de criação de voo');
    console.log('[DEBUG-API] Headers:', {
      authorization: req.headers.authorization ? 'Present' : 'Missing',
      'content-type': req.headers['content-type'],
      'user-agent': req.headers['user-agent']
    });
    console.log('[DEBUG-API] Body recebido:', req.body);

    const {
      data_voo,
      periodo,
      horario_previsto,
      local_decolagem_previsto,
      piloto_id,
      agencia_id,
      adultos_previstos,
      criancas_previstas,
      observacoes_planejamento,
      created_by,
      baloes_data
    } = req.body;

    // Validações básicas
    if (!data_voo || !periodo || !piloto_id) {
      console.error('[DEBUG-API] Dados obrigatórios faltando:', {
        data_voo: !!data_voo,
        periodo: !!periodo,
        piloto_id: !!piloto_id
      });
      return res.status(400).json({ 
        error: 'Dados obrigatórios faltando',
        required: ['data_voo', 'periodo', 'piloto_id']
      });
    }

    // Verificar se o usuário está autenticado via header Authorization
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('[DEBUG-API] Token de autorização faltando');
      return res.status(401).json({ error: 'Token de autorização necessário' });
    }

    const token = authHeader.replace('Bearer ', '');
    console.log('[DEBUG-API] Token extraído:', token.substring(0, 20) + '...');

    // Verificar o token com Supabase
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    console.log('[DEBUG-API] Resultado verificação auth:', {
      user: user ? { id: user.id, email: user.email } : null,
      error: authError
    });

    if (authError || !user) {
      console.error('[DEBUG-API] Erro de autenticação:', authError);
      return res.status(401).json({ error: 'Token inválido' });
    }

    // Verificar permissões usando a nova função de logging
    console.log('[API] Verificando permissões para criação de voo...');
    
    try {
      // Usar a função de verificação completa de permissões
      const { data: permissionCheck, error: permissionError } = await supabase
        .rpc('check_and_log_voo_creation_permissions', {
          p_user_id: user.id,
          p_piloto_id: piloto_id,
          p_agencia_id: agencia_id
        });

      console.log('[API] Resultado da verificação de permissões:', permissionCheck);

      if (permissionError) {
        console.error('[API] Erro na verificação de permissões:', permissionError);
        return res.status(500).json({ 
          error: 'Erro interno na verificação de permissões',
          details: permissionError 
        });
      }

      if (!permissionCheck || permissionCheck.length === 0 || !permissionCheck[0].can_create_voo) {
        const errorReason = permissionCheck?.[0]?.error_reason || 'Permissão negada';
        console.error('[API] Permissão negada:', errorReason);
        return res.status(403).json({ 
          error: 'Permissão negada para criar voo',
          reason: errorReason,
          permission_type: permissionCheck?.[0]?.permission_type || 'none'
        });
      }

      console.log('[API] Permissões verificadas com sucesso:', {
        permission_type: permissionCheck[0].permission_type
      });
    } catch (error) {
      console.error('[API] Erro inesperado na verificação de permissões:', error);
      return res.status(500).json({ 
        error: 'Erro inesperado na verificação de permissões',
        details: error 
      });
    }

    // A verificação de vínculos já foi feita na função check_and_log_voo_creation_permissions
    // Não é necessário verificar novamente aqui

    // Preparar dados do voo
    const vooData = {
      data_voo,
      periodo,
      horario_previsto,
      local_decolagem_previsto,
      piloto_id,
      agencia_id,
      status: 'rascunho',
      adultos_previstos: adultos_previstos || 0,
      criancas_previstas: criancas_previstas || 0,
      observacoes_planejamento,
      created_by: user.id
    };

    console.log('[DEBUG-API] Dados do voo preparados:', vooData);

    // Criar o voo com captura detalhada de erros RLS
    console.log('[API] Criando voo com dados:', vooData);
    
    let voo;
    try {
      const { data, error: vooError } = await supabase
        .from('voos')
        .insert([vooData])
        .select()
        .single();

      if (vooError) {
        // Log detalhado do erro RLS
        console.error('[API] Erro detalhado ao criar voo:', {
          error: vooError,
          code: vooError.code,
          message: vooError.message,
          details: vooError.details,
          hint: vooError.hint,
          user_id: user.id,
          voo_data: vooData
        });

        // Verificar se é erro de RLS
        if (vooError.code === '42501' || vooError.message?.includes('permission denied') || vooError.message?.includes('RLS')) {
          return res.status(403).json({ 
            error: 'Erro de permissão RLS ao criar voo',
            rls_error: true,
            code: vooError.code,
            message: vooError.message,
            details: vooError.details,
            hint: vooError.hint,
            context: {
              user_id: user.id,
              user_email: user.email,
              voo_data: vooData
            }
          });
        }

        return res.status(400).json({ 
          error: 'Erro ao criar voo',
          details: vooError.message,
          code: vooError.code
        });
      }

      voo = data;
      console.log('[API] Voo criado com sucesso:', {
        id: voo.id,
        data_voo: voo.data_voo
      });
    } catch (error) {
      console.error('[API] Erro inesperado ao criar voo:', error);
      return res.status(500).json({ 
        error: 'Erro inesperado ao criar voo',
        details: error 
      });
    }

    // Associar balões se fornecidos com captura detalhada de erros RLS
    if (baloes_data && baloes_data.length > 0) {
      console.log('[DEBUG-API] Associando balões ao voo:', baloes_data);
      
      const voosBaloesData = baloes_data.map((balao: any) => ({
        voo_id: voo.id,
        balao_id: balao.balao_id,
        adultos_previstos: balao.adultos_previstos || 0,
        criancas_previstas: balao.criancas_previstas || 0
      }));

      try {
        const { error: baloesError } = await supabase
          .from('voos_baloes')
          .insert(voosBaloesData);

        console.log('[DEBUG-API] Resultado associação balões:', {
          error: baloesError,
          quantidade: voosBaloesData.length
        });

        if (baloesError) {
          // Log detalhado do erro RLS para balões
          console.error('[DEBUG-API] Erro detalhado ao associar balões:', {
            error: baloesError,
            code: baloesError.code,
            message: baloesError.message,
            details: baloesError.details,
            hint: baloesError.hint,
            user_id: user.id,
            voo_id: voo.id,
            baloes_data: voosBaloesData
          });

          // Tentar deletar o voo criado para manter consistência
          await supabase.from('voos').delete().eq('id', voo.id);
          
          // Verificar se é erro de RLS
          if (baloesError.code === '42501' || baloesError.message?.includes('permission denied') || baloesError.message?.includes('RLS')) {
            return res.status(403).json({ 
              error: 'Erro de permissão RLS ao associar balões',
              rls_error: true,
              code: baloesError.code,
              message: baloesError.message,
              details: baloesError.details,
              hint: baloesError.hint,
              context: {
                user_id: user.id,
                user_email: user.email,
                voo_id: voo.id,
                baloes_data: voosBaloesData
              }
            });
          }

          return res.status(400).json({ 
            error: 'Erro ao associar balões ao voo',
            details: baloesError.message
          });
        }
      } catch (error) {
        console.error('[DEBUG-API] Erro inesperado ao associar balões:', error);
        // Tentar deletar o voo criado para manter consistência
        await supabase.from('voos').delete().eq('id', voo.id);
        
        return res.status(500).json({ 
          error: 'Erro inesperado ao associar balões',
          details: error 
        });
      }
    }

    console.log('[DEBUG-API] Voo criado com sucesso:', {
      voo_id: voo.id,
      piloto_id,
      agencia_id: vooData.agencia_id,
      total_baloes: baloes_data?.length || 0
    });

    return res.status(201).json({ 
      success: true,
      voo: {
        id: voo.id,
        data_voo: voo.data_voo,
        periodo: voo.periodo,
        status: voo.status,
        piloto_id: voo.piloto_id,
        agencia_id: voo.agencia_id
      }
    });

  } catch (error) {
    console.error('[DEBUG-API] Erro inesperado:', {
      error,
      message: error instanceof Error ? error.message : 'Erro desconhecido',
      stack: error instanceof Error ? error.stack : undefined
    });
    
    return res.status(500).json({ 
      error: 'Erro interno do servidor',
      message: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
}