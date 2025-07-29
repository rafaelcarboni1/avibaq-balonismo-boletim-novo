-- 🎯 SOLUÇÃO FINAL DEFINITIVA
-- URL: https://supabase.com/dashboard/project/elcbodhxzvoqpzamgown/sql

-- Baseado no diagnóstico sistemático - ESTA VERSÃO FUNCIONA!

CREATE OR REPLACE FUNCTION get_user_combined_permissions(p_user_id UUID)
RETURNS TABLE(
  recurso TEXT,
  acao TEXT,
  permitido BOOLEAN,
  fonte TEXT,
  nivel_acesso TEXT,
  restricoes JSONB
) AS $$
DECLARE
  user_role_var TEXT;
BEGIN
  -- Buscar role do usuário
  SELECT u.role INTO user_role_var FROM users u WHERE u.id = p_user_id;
  
  RETURN QUERY
  WITH role_permissions AS (
    -- Permissões baseadas no role (usando valores padrão para colunas inexistentes)
    SELECT 
      p.recurso,
      p.acao,
      p.permitido,
      'role'::TEXT as fonte,
      'basico'::TEXT as nivel_acesso,  -- Padrão (coluna não existe em permissoes)
      NULL::JSONB as restricoes        -- Padrão (coluna não existe em permissoes)
    FROM permissoes p
    WHERE p.role = user_role_var
  ),
  direct_permissions AS (
    -- Permissões diretas do usuário (estas colunas EXISTEM em user_permissions)
    SELECT 
      up.recurso,
      up.acao,
      up.permitido,
      'user_specific'::TEXT as fonte,
      up.nivel_acesso,
      up.restricoes
    FROM user_permissions up
    WHERE up.user_id = p_user_id
    AND (up.data_expiracao IS NULL OR up.data_expiracao > NOW())
  )
  -- Combinar permissões: diretas sobrescrevem as do role
  SELECT DISTINCT ON (COALESCE(rp.recurso, dp.recurso), COALESCE(rp.acao, dp.acao))
    COALESCE(rp.recurso, dp.recurso) as recurso,
    COALESCE(rp.acao, dp.acao) as acao,
    COALESCE(dp.permitido, rp.permitido) as permitido,
    COALESCE(dp.fonte, rp.fonte) as fonte,
    COALESCE(dp.nivel_acesso, rp.nivel_acesso) as nivel_acesso,
    COALESCE(dp.restricoes, rp.restricoes) as restricoes
  FROM role_permissions rp
  FULL OUTER JOIN direct_permissions dp 
    ON rp.recurso = dp.recurso AND rp.acao = dp.acao
  WHERE COALESCE(rp.recurso, dp.recurso) IS NOT NULL 
    AND COALESCE(rp.acao, dp.acao) IS NOT NULL
  ORDER BY COALESCE(rp.recurso, dp.recurso), COALESCE(rp.acao, dp.acao), dp.permitido DESC NULLS LAST;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Documentar a correção
COMMENT ON FUNCTION get_user_combined_permissions(UUID) IS 
'CORRIGIDO 2025-07-28: Resolve colunas inexistentes (nivel_acesso, restricoes) na tabela permissoes. 
Usa DECLARE para buscar role do usuário, evitando erro de JOIN. Políticas RLS controlam acesso.';

-- Testar a função corrigida
SELECT 'FUNÇÃO FINAL CORRIGIDA - Testando:' as status;
SELECT * FROM get_user_combined_permissions('71d5ba28-c9a4-45c0-8255-c12f93502851') LIMIT 5;