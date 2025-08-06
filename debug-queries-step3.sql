-- Query 3: Verificar RLS policies da tabela baloes
SELECT
  policyname AS "Nome da Política",
  permissive AS "Tipo",
  cmd AS "Comando",
  qual AS "Condição USING",
  with_check AS "Verificação WITH CHECK"
FROM pg_policies
WHERE tablename = 'baloes';