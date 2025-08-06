-- Cria função RPC para buscar informações públicas dos membros
-- Esta função bypassa RLS para permitir leitura pública de associados em dia

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
  WHERE m.status = 'ativo';
END;
$$;

-- Permite que qualquer um execute a função
GRANT EXECUTE ON FUNCTION get_members_public_info() TO anon;
GRANT EXECUTE ON FUNCTION get_members_public_info() TO authenticated;

-- Comentário para documentar a função
COMMENT ON FUNCTION get_members_public_info() IS 
  'Retorna informações públicas de membros ativos para exibição de associados em dia';