-- SCRIPT DE CORREÇÃO MANUAL - Execute no Dashboard do Supabase
-- SQL Editor > New Query > Cole este código e execute

-- 1. PRIMEIRO: Verificar o estado atual
SELECT 
  'Membros ativos' as categoria,
  COUNT(*) as total
FROM membros 
WHERE status = 'ativo'

UNION ALL

SELECT 
  'Membros com user_id preenchido' as categoria,
  COUNT(*) as total
FROM membros 
WHERE user_id IS NOT NULL AND status = 'ativo'

UNION ALL

SELECT 
  'Pilotos ativos' as categoria,
  COUNT(*) as total
FROM membros 
WHERE tipo = 'piloto' AND status = 'ativo'

UNION ALL

SELECT 
  'Pilotos com user_id preenchido' as categoria,
  COUNT(*) as total
FROM membros 
WHERE tipo = 'piloto' AND user_id IS NOT NULL AND status = 'ativo';

-- 2. MOSTRAR MEMBROS SEM VINCULAÇÃO
SELECT 
  m.nome_completo,
  m.email,
  m.tipo,
  m.status,
  CASE 
    WHEN u.id IS NOT NULL THEN 'Usuário existe na tabela users'
    ELSE 'Usuário NÃO existe na tabela users'
  END as status_usuario
FROM membros m
LEFT JOIN users u ON m.email = u.email
WHERE m.user_id IS NULL 
AND m.status = 'ativo'
ORDER BY m.tipo, m.nome_completo;

-- 3. CORRIGIR A VINCULAÇÃO - EXECUTE ESTE COMANDO
UPDATE membros 
SET user_id = u.id
FROM users u 
WHERE membros.email = u.email 
AND membros.user_id IS NULL;

-- 4. VERIFICAR SE A CORREÇÃO FUNCIONOU
SELECT 
  m.nome_completo,
  m.email,
  m.tipo,
  m.user_id,
  u.role,
  'VINCULADO!' as status
FROM membros m
JOIN users u ON m.user_id = u.id
WHERE m.status = 'ativo'
ORDER BY m.tipo, m.nome_completo;

-- 5. MOSTRAR ESTATÍSTICAS FINAIS
SELECT 
  'AFTER - Membros ativos' as categoria,
  COUNT(*) as total
FROM membros 
WHERE status = 'ativo'

UNION ALL

SELECT 
  'AFTER - Membros com user_id preenchido' as categoria,
  COUNT(*) as total
FROM membros 
WHERE user_id IS NOT NULL AND status = 'ativo'

UNION ALL

SELECT 
  'AFTER - Pilotos com user_id preenchido' as categoria,
  COUNT(*) as total
FROM membros 
WHERE tipo = 'piloto' AND user_id IS NOT NULL AND status = 'ativo';