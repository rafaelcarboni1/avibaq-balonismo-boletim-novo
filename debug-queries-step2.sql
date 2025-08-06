-- Query 2: Verificar o piloto Rafael (sem filtro de tipo)
SELECT 
  id,
  nome_completo,
  tipo,
  user_id,
  created_at
FROM membros 
WHERE nome_completo ILIKE '%Rafael%';