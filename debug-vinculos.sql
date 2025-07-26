-- Verificar estrutura da tabela vinculos_agencia_piloto
SELECT 
  v.agencia_id,
  v.piloto_id,
  a.nome_completo AS agencia_nome,
  p.nome_completo AS piloto_nome,
  v.created_at
FROM vinculos_agencia_piloto v
LEFT JOIN membros a ON v.agencia_id = a.id  
LEFT JOIN membros p ON v.piloto_id = p.id
ORDER BY v.created_at DESC;