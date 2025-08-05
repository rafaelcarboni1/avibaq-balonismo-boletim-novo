-- VALIDAÇÃO FINAL DA CORREÇÃO DO ERRO 23503
-- Verificar se todas as correções foram aplicadas com sucesso

SELECT '=== VALIDAÇÃO FINAL DA CORREÇÃO ===' as status;

-- 1. VERIFICAR REGISTROS ÓRFÃOS RESTANTES
SELECT 'Verificando registros órfãos restantes:' as status;

SELECT 
    'marcado_por órfãos' as tipo,
    COUNT(*) as quantidade
FROM checklist_itens ci 
LEFT JOIN users u ON ci.marcado_por = u.id 
WHERE ci.marcado_por IS NOT NULL AND u.id IS NULL

UNION ALL

SELECT 
    'created_by órfãos' as tipo,
    COUNT(*) as quantidade
FROM checklist_itens ci 
LEFT JOIN users u ON ci.created_by = u.id 
WHERE ci.created_by IS NOT NULL AND u.id IS NULL

UNION ALL

SELECT 
    'preenchido_por órfãos' as tipo,
    COUNT(*) as quantidade
FROM checklist_itens ci 
LEFT JOIN users u ON ci.preenchido_por = u.id 
WHERE ci.preenchido_por IS NOT NULL AND u.id IS NULL;

-- 2. VERIFICAR CONSTRAINTS DE FOREIGN KEY
SELECT 'Verificando constraints de foreign key:' as status;

SELECT 
    conname as constraint_name,
    contype as constraint_type,
    CASE confdeltype 
        WHEN 'a' THEN 'NO ACTION'
        WHEN 'r' THEN 'RESTRICT'
        WHEN 'c' THEN 'CASCADE'
        WHEN 'n' THEN 'SET NULL'
        WHEN 'd' THEN 'SET DEFAULT'
        ELSE 'UNKNOWN'
    END as on_delete_action
FROM pg_constraint 
WHERE conrelid = 'checklist_itens'::regclass 
AND contype = 'f'
AND conname LIKE '%_fkey';

-- 3. VERIFICAR SE O TRIGGER EXISTE
SELECT 'Verificando trigger de validação:' as status;

SELECT 
    tgname as trigger_name,
    tgrelid::regclass as table_name,
    tgenabled as enabled
FROM pg_trigger 
WHERE tgname = 'validate_checklist_user_ids_trigger';

-- 4. VERIFICAR SE A FUNÇÃO RPC EXISTE E TEM PERMISSÕES
SELECT 'Verificando função RPC:' as status;

SELECT 
    proname as function_name,
    prorettype::regtype as return_type,
    prosecdef as security_definer
FROM pg_proc 
WHERE proname = 'get_current_user_table_id';

-- Verificar permissões da função
SELECT 'Verificando permissões da função RPC:' as status;

SELECT 
    grantee,
    privilege_type
FROM information_schema.routine_privileges 
WHERE routine_name = 'get_current_user_table_id'
AND grantee IN ('anon', 'authenticated', 'public');

-- 5. TESTAR A FUNÇÃO RPC (se possível)
SELECT 'Testando função RPC (retornará NULL se não autenticado):' as status;

SELECT get_current_user_table_id() as user_table_id_result;

-- 6. VERIFICAR INTEGRIDADE DOS DADOS
SELECT 'Verificando integridade dos dados:' as status;

SELECT 
    'Total de itens de checklist' as tipo,
    COUNT(*) as quantidade
FROM checklist_itens

UNION ALL

SELECT 
    'Itens com marcado_por válido' as tipo,
    COUNT(*) as quantidade
FROM checklist_itens ci
INNER JOIN users u ON ci.marcado_por = u.id

UNION ALL

SELECT 
    'Itens com created_by válido' as tipo,
    COUNT(*) as quantidade
FROM checklist_itens ci
INNER JOIN users u ON ci.created_by = u.id

UNION ALL

SELECT 
    'Itens com preenchido_por válido' as tipo,
    COUNT(*) as quantidade
FROM checklist_itens ci
INNER JOIN users u ON ci.preenchido_por = u.id;

-- 7. VERIFICAR TABELAS DE BACKUP
SELECT 'Verificando tabelas de backup criadas:' as status;

SELECT 
    schemaname,
    tablename,
    tableowner
FROM pg_tables 
WHERE tablename LIKE 'checklist_itens_backup%'
ORDER BY tablename;

-- 8. RESULTADO FINAL
SELECT 
    CASE 
        WHEN (
            SELECT COUNT(*) 
            FROM checklist_itens ci 
            LEFT JOIN users u1 ON ci.marcado_por = u1.id 
            LEFT JOIN users u2 ON ci.created_by = u2.id 
            LEFT JOIN users u3 ON ci.preenchido_por = u3.id 
            WHERE 
                (ci.marcado_por IS NOT NULL AND u1.id IS NULL) OR
                (ci.created_by IS NOT NULL AND u2.id IS NULL) OR
                (ci.preenchido_por IS NOT NULL AND u3.id IS NULL)
        ) = 0 THEN '✅ CORREÇÃO APLICADA COM SUCESSO - Nenhum registro órfão encontrado'
        ELSE '❌ AINDA EXISTEM REGISTROS ÓRFÃOS - Verificar logs acima'
    END as resultado_final;

SELECT '=== FIM DA VALIDAÇÃO ===' as status;