-- APLIQUE ESTE SQL NO SUPABASE DASHBOARD -> SQL EDITOR
-- Para corrigir a função RPC e permitir acesso a TODOS os 62 membros

-- 1. Atualizar a função existente para retornar todos os membros com mensalidades_pagas
CREATE OR REPLACE FUNCTION get_members_public_info()
RETURNS TABLE (
  nome_completo TEXT,
  tipo membro_tipo,
  status membro_status,
  mensalidades_pagas TEXT[]
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Retorna TODOS os membros que têm mensalidades_pagas preenchido
  -- não apenas os com status 'ativo'
  RETURN QUERY
  SELECT 
    m.nome_completo,
    m.tipo,
    m.status,
    m.mensalidades_pagas
  FROM membros m
  WHERE m.mensalidades_pagas IS NOT NULL 
    AND array_length(m.mensalidades_pagas, 1) > 0;
END;
$$;

-- 2. Adicionar comentário explicativo
COMMENT ON FUNCTION get_members_public_info() IS 'Retorna todos os membros que têm mensalidades_pagas preenchido, independente do status. Usado para páginas públicas que mostram associados em dia.';

-- 3. Criar uma função específica para membros em dia com julho 2025
CREATE OR REPLACE FUNCTION get_members_julho_2025()
RETURNS TABLE (
  nome_completo TEXT,
  tipo membro_tipo,
  status membro_status
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    m.nome_completo,
    m.tipo,
    m.status
  FROM membros m
  WHERE m.mensalidades_pagas IS NOT NULL 
    AND '07/2025' = ANY(m.mensalidades_pagas);
END;
$$;

COMMENT ON FUNCTION get_members_julho_2025() IS 'Retorna especificamente os membros que pagaram a mensalidade de julho/2025';

-- 4. Verificar quantos membros têm mensalidades_pagas preenchido
-- (Execute esta query separadamente para conferir)
-- SELECT COUNT(*) as total_com_mensalidades FROM membros WHERE mensalidades_pagas IS NOT NULL;

-- 5. Verificar quantos têm julho 2025
-- (Execute esta query separadamente para conferir)  
-- SELECT COUNT(*) as total_julho_2025 FROM membros WHERE '07/2025' = ANY(mensalidades_pagas);