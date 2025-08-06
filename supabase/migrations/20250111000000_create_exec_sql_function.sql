-- Migração para criar função exec_sql
-- Criada em: 2025-01-11
-- Descrição: Função auxiliar para executar SQL dinâmico nas migrações

-- Criar função exec_sql para permitir execução de SQL dinâmico
CREATE OR REPLACE FUNCTION public.exec_sql(sql TEXT)
RETURNS VOID AS $$
BEGIN
  EXECUTE sql;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comentário sobre a função
COMMENT ON FUNCTION public.exec_sql IS 'Função auxiliar para executar SQL dinâmico nas migrações';