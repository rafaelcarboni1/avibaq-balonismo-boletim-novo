-- DIAGNÓSTICO COMPLETO DO FLUXO DE CHECKLIST
-- Data: 1 de agosto de 2025
-- Objetivo: Testar todo o fluxo desde auth até checklist

-- =====================================================================
-- FASE 1: DIAGNÓSTICO DO SISTEMA DE AUTENTICAÇÃO
-- =====================================================================

-- 1.1 Verificar estrutura das tabelas de usuários
SELECT 'TABELA AUTH.USERS' as tabela, 
       COUNT(*) as total_usuarios,
       string_agg(DISTINCT SUBSTRING(email, 1, 20), ', ') as emails_sample
FROM auth.users;

SELECT 'TABELA PUBLIC.USERS' as tabela,
       COUNT(*) as total_usuarios,
       string_agg(DISTINCT role, ', ') as roles,
       string_agg(DISTINCT SUBSTRING(email, 1, 20), ', ') as emails_sample  
FROM public.users;

-- 1.2 Verificar sincronização entre auth.users e public.users
SELECT 'USUÁRIOS ÓRFÃOS EM AUTH' as problema,
       COUNT(*) as quantidade
FROM auth.users au
LEFT JOIN public.users pu ON pu.auth_id = au.id
WHERE pu.auth_id IS NULL;

SELECT 'USUÁRIOS ÓRFÃOS EM PUBLIC' as problema,
       COUNT(*) as quantidade  
FROM public.users pu
LEFT JOIN auth.users au ON au.id = pu.auth_id
WHERE au.id IS NULL;

-- =====================================================================
-- FASE 2: VERIFICAR ESTRUTURA DA TABELA CHECKLIST_ITENS
-- =====================================================================

-- 2.1 Verificar se colunas existem
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'checklist_itens' 
  AND table_schema = 'public'
  AND column_name IN ('created_by', 'preenchido_por', 'marcado_por')
ORDER BY column_name;

-- 2.2 Verificar foreign keys da tabela checklist_itens
SELECT 
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_name = 'checklist_itens'
    AND tc.table_schema = 'public';

-- =====================================================================
-- FASE 3: SIMULAR CRIAÇÃO DE VOO E CHECKLIST
-- =====================================================================

-- 3.1 Simular busca de usuário atual (como o hook useUser faria)
DO $$
DECLARE
    current_auth_id UUID;
    user_by_auth_id RECORD;
    user_by_email RECORD;
    test_email TEXT := 'test@example.com'; -- Email de teste
BEGIN
    -- Simular auth.uid() usando um usuário real
    SELECT id, email INTO current_auth_id, test_email 
    FROM auth.users 
    ORDER BY created_at DESC 
    LIMIT 1;
    
    RAISE NOTICE '=== SIMULAÇÃO DE USUÁRIO LOGADO ===';
    RAISE NOTICE 'Auth ID simulado: %', current_auth_id;
    RAISE NOTICE 'Email: %', test_email;
    
    -- Testar busca por auth_id (método otimizado)
    BEGIN
        SELECT * INTO user_by_auth_id 
        FROM public.users 
        WHERE auth_id = current_auth_id;
        
        IF FOUND THEN
            RAISE NOTICE '✅ Usuário encontrado por auth_id: % (role: %)', user_by_auth_id.id, user_by_auth_id.role;
        ELSE
            RAISE NOTICE '❌ Usuário NÃO encontrado por auth_id';
        END IF;
    EXCEPTION
        WHEN OTHERS THEN
            RAISE NOTICE '❌ ERRO na busca por auth_id: %', SQLERRM;
    END;
    
    -- Testar busca por email (fallback)
    BEGIN
        SELECT * INTO user_by_email 
        FROM public.users 
        WHERE email = test_email;
        
        IF FOUND THEN
            RAISE NOTICE '✅ Usuário encontrado por email: % (role: %)', user_by_email.id, user_by_email.role;
        ELSE
            RAISE NOTICE '❌ Usuário NÃO encontrado por email';
        END IF;
    EXCEPTION
        WHEN OTHERS THEN
            RAISE NOTICE '❌ ERRO na busca por email: %', SQLERRM;
    END;
    
    RAISE NOTICE '=======================================';
END $$;

-- =====================================================================
-- FASE 4: TESTAR INSERÇÃO DIRETA EM CHECKLIST_ITENS
-- =====================================================================

-- 4.1 Tentar inserir um item de checklist de teste
DO $$
DECLARE
    test_user_id UUID;
    test_voo_id UUID := gen_random_uuid(); -- ID fictício de voo
BEGIN
    -- Pegar um usuário válido da tabela users
    SELECT id INTO test_user_id 
    FROM public.users 
    ORDER BY created_at DESC 
    LIMIT 1;
    
    RAISE NOTICE '=== TESTE DE INSERÇÃO EM CHECKLIST_ITENS ===';
    RAISE NOTICE 'User ID para teste: %', test_user_id;
    RAISE NOTICE 'Voo ID fictício: %', test_voo_id;
    
    -- Tentar inserir item de checklist
    BEGIN
        INSERT INTO checklist_itens (
            voo_id,
            bloco,
            categoria, 
            item_texto,
            obrigatorio,
            created_by,
            preenchido_por,
            marcado_por
        ) VALUES (
            test_voo_id,
            1,
            'teste',
            'Item de teste para diagnóstico',
            true,
            test_user_id,
            test_user_id,
            test_user_id
        );
        
        RAISE NOTICE '✅ Inserção de teste FUNCIONOU!';
        
        -- Remover item de teste
        DELETE FROM checklist_itens WHERE voo_id = test_voo_id;
        RAISE NOTICE '🧹 Item de teste removido';
        
    EXCEPTION
        WHEN foreign_key_violation THEN
            RAISE NOTICE '❌ ERRO Foreign Key: User ID % não existe ou é inválido', test_user_id;
            RAISE NOTICE 'Detalhes do erro: %', SQLERRM;
        WHEN OTHERS THEN
            RAISE NOTICE '❌ ERRO GERAL: %', SQLERRM;
    END;
    
    RAISE NOTICE '=============================================';
END $$;

-- =====================================================================
-- FASE 5: VERIFICAR TRIGGER ATUAL
-- =====================================================================

-- 5.1 Mostrar definição do trigger atual
SELECT 
    routine_name,
    routine_definition
FROM information_schema.routines
WHERE routine_name = 'trigger_voos_criar_checklist'
  AND routine_schema = 'public';

-- =====================================================================
-- RESUMO DO DIAGNÓSTICO
-- =====================================================================

SELECT '🔍 DIAGNÓSTICO COMPLETO EXECUTADO' as status,
       'Verifique os logs acima para identificar o problema' as instrucao;