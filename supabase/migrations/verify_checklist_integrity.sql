-- Script para verificar integridade dos dados na tabela checklist_itens
-- e identificar possíveis problemas de foreign key constraint

-- 1. Verificar se há itens com marcado_por inválido
SELECT 
    '=== ITENS COM MARCADO_POR INVÁLIDO ===' as info;

SELECT 
    ci.id,
    ci.voo_id,
    ci.marcado_por,
    ci.marcado_em,
    ci.item_descricao
FROM checklist_itens ci
WHERE ci.marcado_por IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM users u WHERE u.id = ci.marcado_por
  )
LIMIT 10;

-- 2. Verificar se há itens com created_by inválido
SELECT 
    '=== ITENS COM CREATED_BY INVÁLIDO ===' as info;

SELECT 
    ci.id,
    ci.voo_id,
    ci.created_by,
    ci.created_at,
    ci.item_descricao
FROM checklist_itens ci
WHERE ci.created_by IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM users u WHERE u.id = ci.created_by
  )
LIMIT 10;

-- 3. Verificar se há itens com preenchido_por inválido
SELECT 
    '=== ITENS COM PREENCHIDO_POR INVÁLIDO ===' as info;

SELECT 
    ci.id,
    ci.voo_id,
    ci.preenchido_por,
    ci.updated_at,
    ci.item_descricao
FROM checklist_itens ci
WHERE ci.preenchido_por IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM users u WHERE u.id = ci.preenchido_por
  )
LIMIT 10;

-- 4. Contar total de problemas por tipo
SELECT 
    '=== RESUMO DE PROBLEMAS ===' as info;

SELECT 
    'Itens com marcado_por inválido' as problema,
    COUNT(*) as quantidade
FROM checklist_itens ci
WHERE ci.marcado_por IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM users u WHERE u.id = ci.marcado_por
  )
UNION ALL
SELECT 
    'Itens com created_by inválido' as problema,
    COUNT(*) as quantidade
FROM checklist_itens ci
WHERE ci.created_by IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM users u WHERE u.id = ci.created_by
  )
UNION ALL
SELECT 
    'Itens com preenchido_por inválido' as problema,
    COUNT(*) as quantidade
FROM checklist_itens ci
WHERE ci.preenchido_por IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM users u WHERE u.id = ci.preenchido_por
  );

-- 5. Verificar integridade geral
SELECT 
    '=== ESTATÍSTICAS GERAIS ===' as info;

SELECT 
    'Total de itens checklist' as tipo,
    COUNT(*) as quantidade
FROM checklist_itens
UNION ALL
SELECT 
    'Total de usuários' as tipo,
    COUNT(*) as quantidade
FROM users
UNION ALL
SELECT 
    'Itens com marcado_por preenchido' as tipo,
    COUNT(*) as quantidade
FROM checklist_itens
WHERE marcado_por IS NOT NULL
UNION ALL
SELECT 
    'Itens marcados (true)' as tipo,
    COUNT(*) as quantidade
FROM checklist_itens
WHERE marcado = true;

-- 6. Verificar usuários recém-criados pelo script de correção
SELECT 
    '=== USUÁRIOS CRIADOS RECENTEMENTE ===' as info;

SELECT 
    u.id,
    u.email,
    u.nome,
    u.role,
    u.auth_id,
    u.created_at
FROM users u
WHERE u.created_at >= NOW() - INTERVAL '1 hour'
ORDER BY u.created_at DESC;

-- 7. Verificar se há foreign key constraints ativas
SELECT 
    '=== FOREIGN KEY CONSTRAINTS ATIVAS ===' as info;

SELECT 
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_name = 'checklist_itens'
    AND tc.table_schema = 'public';