-- 🐞 DIAGNÓSTICO PASSO A PASSO
-- Execute CADA bloco separadamente no Supabase para ver os resultados

-- ===== PASSO 3: TESTE FUNÇÃO SIMPLES =====
CREATE OR REPLACE FUNCTION get_user_combined_permissions_debug_simple(p_user_id UUID)
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
  
  -- Retornar permissões da role (SEM as colunas inexistentes)
  RETURN QUERY
  SELECT 
    p.recurso,
    p.acao,
    p.permitido,
    'role'::TEXT as fonte,
    'basico'::TEXT as nivel_acesso,  -- Valor padrão
    NULL::JSONB as restricoes        -- Valor padrão
  FROM permissoes p
  WHERE p.role = user_role_var;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Testar função simples
SELECT '[PASSO 3] Testando função simples:' as info;
SELECT * FROM get_user_combined_permissions_debug_simple('71d5ba28-c9a4-45c0-8255-c12f93502851') LIMIT 5;