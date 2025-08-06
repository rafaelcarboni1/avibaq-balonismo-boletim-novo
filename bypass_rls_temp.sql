-- BYPASS TEMPORÁRIO RLS - SOLUÇÃO EMERGENCIAL
-- Execute no Dashboard do Supabase

-- 1. DESABILITAR RLS TEMPORARIAMENTE (apenas para teste)
ALTER TABLE baloes DISABLE ROW LEVEL SECURITY;

-- 2. VERIFICAR STATUS
SELECT 
  'RLS STATUS APÓS DISABLE' as status,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
JOIN pg_class ON pg_tables.tablename = pg_class.relname 
WHERE tablename = 'baloes';

-- 3. APÓS TESTAR, REABILITAR IMEDIATAMENTE
-- ALTER TABLE baloes ENABLE ROW LEVEL SECURITY;