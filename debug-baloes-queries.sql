-- Queries para debug do problema de balões não aparecendo
-- Execute estas queries no Supabase Dashboard

-- 0. Descobrir valores válidos do enum membro_tipo
SELECT unnest(enum_range(NULL::membro_tipo)) AS valores_validos;

-- 1. Verificar o piloto Rafael (sem filtro de tipo)
SELECT 
  id,
  nome_completo,
  tipo,
  user_id,
  created_at
FROM membros 
WHERE nome_completo ILIKE '%Rafael%';

-- 2. Listar todos os balões e seus proprietários
SELECT 
  b.id AS balao_id,
  b.prefixo,
  b.ativo,
  b.proprietario_id,
  m.nome_completo AS proprietario_nome,
  m.tipo AS proprietario_tipo,
  b.created_at,
  b.updated_at
FROM baloes AS b
LEFT JOIN membros AS m ON b.proprietario_id = m.id
ORDER BY m.nome_completo, b.prefixo;

-- 3. Verificar balões específicos do Rafael
SELECT 
  b.id AS balao_id,
  b.prefixo,
  b.ativo,
  b.proprietario_id,
  m.nome_completo AS proprietario_nome,
  m.tipo AS proprietario_tipo
FROM baloes AS b
LEFT JOIN membros AS m ON b.proprietario_id = m.id
WHERE b.prefixo IN ('BR-RAF1', 'BR-TEST1');

-- 4. Testar a query exata que está sendo executada no código
-- (Substitua os IDs pelos valores reais que aparecem no console)
SELECT *
FROM baloes
WHERE proprietario_id IN ('24a1a1f4-1304-4f45-98bc-8a9e89e533d0', 'ID_DA_AGENCIA_AQUI')
  AND ativo = true
ORDER BY prefixo;

-- 5. Verificar RLS policies da tabela baloes
SELECT
  policyname AS "Nome da Política",
  permissive AS "Tipo",
  cmd AS "Comando",
  qual AS "Condição USING",
  with_check AS "Verificação WITH CHECK"
FROM pg_policies
WHERE tablename = 'baloes';

-- 6. Verificar se RLS está habilitada na tabela
SELECT 
  schemaname,
  tablename,
  rowsecurity AS "RLS Habilitada"
FROM pg_tables 
WHERE tablename = 'baloes';