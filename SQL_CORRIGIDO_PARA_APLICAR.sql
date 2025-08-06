-- APLIQUE ESTE SQL NO SUPABASE DASHBOARD -> SQL EDITOR
-- Corrige erro de mudança de estrutura da função

-- 1. DROPAR função existente primeiro (resolve o erro 42P13)
DROP FUNCTION IF EXISTS get_members_public_info();

-- 2. RECRIAR função com novo nome do campo (nome_exibicao) + ORDEM ALEATÓRIA
CREATE OR REPLACE FUNCTION get_members_public_info()
RETURNS TABLE (
  nome_exibicao TEXT,
  tipo membro_tipo,
  status membro_status,
  mensalidades_pagas TEXT[]
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Para empresas, mostra nome_empresa; para pilotos, mostra nome_completo
  -- ORDEM ALEATÓRIA para evitar sempre os mesmos nomes primeiro
  RETURN QUERY
  SELECT 
    CASE 
      WHEN m.tipo = 'agencia' AND m.nome_empresa IS NOT NULL AND m.nome_empresa != '' 
      THEN m.nome_empresa
      ELSE m.nome_completo
    END as nome_exibicao,
    m.tipo,
    m.status,
    m.mensalidades_pagas
  FROM membros m
  WHERE m.mensalidades_pagas IS NOT NULL 
    AND array_length(m.mensalidades_pagas, 1) > 0
  ORDER BY RANDOM();  -- ✨ ORDEM ALEATÓRIA SEMPRE
END;
$$;

-- 3. Dropar e recriar a segunda função também
DROP FUNCTION IF EXISTS get_members_julho_2025();

CREATE OR REPLACE FUNCTION get_members_julho_2025()
RETURNS TABLE (
  nome_exibicao TEXT,
  tipo membro_tipo,
  status membro_status
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    CASE 
      WHEN m.tipo = 'agencia' AND m.nome_empresa IS NOT NULL AND m.nome_empresa != '' 
      THEN m.nome_empresa
      ELSE m.nome_completo
    END as nome_exibicao,
    m.tipo,
    m.status
  FROM membros m
  WHERE m.mensalidades_pagas IS NOT NULL 
    AND '07/2025' = ANY(m.mensalidades_pagas)
  ORDER BY RANDOM();  -- ✨ ORDEM ALEATÓRIA SEMPRE
END;
$$;

-- 4. Adicionar comentários
COMMENT ON FUNCTION get_members_public_info() IS 'Retorna todos os membros com mensalidades_pagas. Para empresas mostra nome_empresa, para pilotos mostra nome_completo.';
COMMENT ON FUNCTION get_members_julho_2025() IS 'Retorna membros que pagaram julho/2025 com nome correto para exibição.';

-- 5. Testar as funções (execute separadamente para conferir)
-- SELECT * FROM get_members_public_info();
-- SELECT * FROM get_members_julho_2025();