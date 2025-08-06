-- Migração final para corrigir a função get_user_combined_permissions
-- Remove definitivamente as referências às colunas inexistentes na tabela permissoes

-- Problema identificado: A função está tentando acessar colunas que não existem na tabela permissoes:
-- - p.nivel_acesso (não existe em permissoes)
-- - p.restricoes (não existe em permissoes)
-- 
-- Solução: Fornecer valores padrão para essas colunas quando vindas da tabela permissoes

CREATE OR REPLACE FUNCTION get_user_combined_permissions(p_user_id UUID)
RETURNS TABLE(
  recurso TEXT,
  acao TEXT,
  permitido BOOLEAN,
  fonte TEXT, -- 'role' ou 'user_specific'
  nivel_acesso TEXT,
  restricoes JSONB
) AS $$
BEGIN
  -- Verificar se o usuário atual é admin ou está consultando suas próprias permissões
  IF NOT (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid() 
      AND u.role = 'admin'
    ) 
    OR auth.uid() = p_user_id
  ) THEN
    RAISE EXCEPTION 'Acesso negado: apenas admins podem consultar permissões de outros usuários';
  END IF;

  RETURN QUERY
  WITH user_role AS (
    -- Buscar o role do usuário
    SELECT u.role
    FROM users u
    WHERE u.id = p_user_id
  ),
  role_permissions AS (
    -- Permissões herdadas do role
    -- CORREÇÃO: remover p.nivel_acesso e p.restricoes que não existem na tabela permissoes
    SELECT 
      p.recurso,
      p.acao,
      p.permitido,
      'role'::TEXT as fonte,
      'basico'::TEXT as nivel_acesso, -- Valor padrão já que coluna não existe em permissoes
      NULL::JSONB as restricoes       -- Valor padrão já que coluna não existe em permissoes
    FROM permissoes p
    CROSS JOIN user_role ur
    WHERE p.role = ur.role
  ),
  direct_permissions AS (
    -- Permissões diretas do usuário (estas colunas existem em user_permissions)
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
  -- Combinar permissões: permissões diretas sobrescrevem as do role
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

-- Adicionar comentário para documentar a correção
COMMENT ON FUNCTION get_user_combined_permissions(UUID) IS 
'Função corrigida que combina permissões de role e específicas do usuário. 
Não acessa colunas nivel_acesso e restricoes da tabela permissoes pois elas não existem.
Usa valores padrão: nivel_acesso = basico, restricoes = NULL para permissões de role.';

-- Garantir que admins tenham acesso total às funções RPC
-- Política adicional para garantir que admins possam executar a função
DO $$
BEGIN
  -- Verificar se a política já existe antes de criar
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'users' 
    AND policyname = 'Admins can read all users for permissions'
  ) THEN
    -- Política para permitir que admins leiam informações de usuários para gerenciar permissões
    CREATE POLICY "Admins can read all users for permissions" ON users
      FOR SELECT USING (
        EXISTS (
          SELECT 1 FROM users u
          WHERE u.id = auth.uid() 
          AND u.role = 'admin'
        )
      );
  END IF;
END $$;

-- Log da correção aplicada
-- Registrar a aplicação da migração nos comentários
COMMENT ON FUNCTION get_user_combined_permissions(UUID) IS 
'Função corrigida em 2025-07-28: remove referencias a colunas inexistentes na tabela permissoes (nivel_acesso, restricoes). 
Combina permissões de role e específicas do usuário usando valores padrão para colunas ausentes.';