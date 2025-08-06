-- Atualiza função RPC para retornar TODOS os membros com mensalidades_pagas
-- não apenas os com status 'ativo'

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

COMMENT ON FUNCTION get_members_public_info() IS 'Retorna todos os membros que têm mensalidades_pagas preenchido, independente do status';