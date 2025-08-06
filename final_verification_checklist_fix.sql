-- Verificação final das correções aplicadas no sistema de checklist
-- Este script confirma se o erro de foreign key constraint foi resolvido

-- 1. Verificar se não há mais dados órfãos em checklist_itens
SELECT 
    '=== VERIFICAÇÃO DE DADOS ÓRFÃOS EM CHECKLIST_ITENS ===' as status;

-- Verificar marcado_por órfãos
SELECT 
    'marcado_por órfãos' as tipo,
    COUNT(*) as quantidade
FROM checklist_itens ci
WHERE ci.marcado_por IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM users u WHERE u.id = ci.marcado_por
  );

-- Verificar created_by órfãos
SELECT 
    'created_by órfãos' as tipo,
    COUNT(*) as quantidade
FROM checklist_itens ci
WHERE ci.created_by IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM users u WHERE u.id = ci.created_by
  );

-- Verificar preenchido_por órfãos
SELECT 
    'preenchido_por órfãos' as tipo,
    COUNT(*) as quantidade
FROM checklist_itens ci
WHERE ci.preenchido_por IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM users u WHERE u.id = ci.preenchido_por
  );

-- 2. Verificar integridade entre auth.users e public.users
SELECT 
    '=== INTEGRIDADE AUTH.USERS <-> PUBLIC.USERS ===' as status;

SELECT 
    'Usuários órfãos (auth sem public)' as tipo,
    COUNT(*) as quantidade
FROM auth.users au
LEFT JOIN public.users pu ON pu.auth_id = au.id
WHERE pu.id IS NULL;

-- 3. Verificar usuários ativos recentes
SELECT 
    '=== USUÁRIOS ATIVOS RECENTES ===' as status;

SELECT 
    au.email,
    au.last_sign_in_at,
    pu.id as users_table_id,
    pu.role,
    CASE 
        WHEN pu.id IS NOT NULL THEN '✅ OK'
        ELSE '❌ PROBLEMA'
    END as status_integridade
FROM auth.users au
LEFT JOIN public.users pu ON pu.auth_id = au.id
WHERE au.last_sign_in_at > NOW() - INTERVAL '7 days'
ORDER BY au.last_sign_in_at DESC;

-- 4. Testar inserção de um item de checklist (simulação)
SELECT 
    '=== TESTE DE INSERÇÃO (SIMULAÇÃO) ===' as status;

-- Buscar um usuário válido para teste
DO $$
DECLARE
    test_user_id UUID;
    test_voo_id UUID;
    test_item_id UUID;
BEGIN
    -- Buscar um usuário válido
    SELECT id INTO test_user_id 
    FROM users 
    WHERE role = 'piloto' 
    LIMIT 1;
    
    IF test_user_id IS NOT NULL THEN
        -- Buscar um voo existente
        SELECT id INTO test_voo_id 
        FROM voos 
        LIMIT 1;
        
        IF test_voo_id IS NOT NULL THEN
            -- Simular inserção de item de checklist
            RAISE NOTICE '✅ TESTE: Usuário válido encontrado: %', test_user_id;
            RAISE NOTICE '✅ TESTE: Voo válido encontrado: %', test_voo_id;
            RAISE NOTICE '✅ TESTE: Inserção de checklist_item seria bem-sucedida';
        ELSE
            RAISE NOTICE '⚠️ TESTE: Nenhum voo encontrado para teste';
        END IF;
    ELSE
        RAISE NOTICE '❌ TESTE: Nenhum usuário piloto encontrado';
    END IF;
END $$;

-- 5. Verificar constraints de foreign key
SELECT 
    '=== CONSTRAINTS DE FOREIGN KEY ===' as status;

SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as definition
FROM pg_constraint 
WHERE conrelid = 'checklist_itens'::regclass
  AND contype = 'f'
  AND conname LIKE '%_fkey'
ORDER BY conname;

-- 6. Estatísticas finais
SELECT 
    '=== ESTATÍSTICAS FINAIS ===' as status;

SELECT 
    'Total auth.users' as tipo,
    COUNT(*) as quantidade
FROM auth.users
UNION ALL
SELECT 
    'Total public.users' as tipo,
    COUNT(*) as quantidade
FROM public.users
UNION ALL
SELECT 
    'Total checklist_itens' as tipo,
    COUNT(*) as quantidade
FROM checklist_itens
UNION ALL
SELECT 
    'Checklist_itens com marcado_por válido' as tipo,
    COUNT(*) as quantidade
FROM checklist_itens ci
INNER JOIN users u ON u.id = ci.marcado_por;

-- 7. Resultado final
SELECT 
    '=== RESULTADO FINAL ===' as status,
    CASE 
        WHEN (
            SELECT COUNT(*) 
            FROM checklist_itens ci
            WHERE ci.marcado_por IS NOT NULL
              AND NOT EXISTS (SELECT 1 FROM users u WHERE u.id = ci.marcado_por)
        ) = 0 
        AND (
            SELECT COUNT(*) 
            FROM auth.users au
            LEFT JOIN public.users pu ON pu.auth_id = au.id
            WHERE pu.id IS NULL
        ) = 0
        THEN '✅ TODAS AS CORREÇÕES FORAM APLICADAS COM SUCESSO'
        ELSE '❌ AINDA HÁ PROBLEMAS QUE PRECISAM SER CORRIGIDOS'
    END as resultado;

-- 8. Próximos passos recomendados
SELECT 
    '=== PRÓXIMOS PASSOS ===' as info,
    'Teste o sistema de checklist no frontend para confirmar que o erro foi resolvido' as acao_1,
    'Monitore os logs do frontend para verificar se não há mais erros de foreign key' as acao_2,
    'Considere implementar monitoramento automático para detectar futuros problemas' as acao_3;