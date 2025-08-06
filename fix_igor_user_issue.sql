-- Script para corrigir o problema específico do usuário Igor
-- Data: Janeiro 2025
-- Problema: Usuário não consegue usar checklist devido a foreign key constraint

-- =====================================================================
-- CORREÇÃO ESPECÍFICA PARA IGOR_PK_@HOTMAIL.COM
-- =====================================================================

-- 1. Verificar estado atual do usuário Igor
SELECT 'ESTADO ATUAL DO IGOR' as info;

SELECT 
    au.id as auth_id,
    au.email as auth_email,
    u.id as users_table_id,
    u.auth_id as users_auth_id,
    u.email as users_email,
    u.role,
    m.id as membro_id,
    m.user_id as membro_user_id
FROM auth.users au
LEFT JOIN users u ON u.email = au.email
LEFT JOIN membros m ON m.email = au.email
WHERE au.email = 'igor_pk_@hotmail.com';

-- 2. Corrigir registro em public.users se necessário
DO $$
DECLARE
    auth_user_id UUID;
    users_record_id UUID;
    membro_record_id UUID;
BEGIN
    -- Buscar ID do usuário em auth.users
    SELECT id INTO auth_user_id 
    FROM auth.users 
    WHERE email = 'igor_pk_@hotmail.com';
    
    IF auth_user_id IS NULL THEN
        RAISE EXCEPTION 'Usuário igor_pk_@hotmail.com não encontrado em auth.users';
    END IF;
    
    RAISE NOTICE 'Auth ID encontrado: %', auth_user_id;
    
    -- Verificar se existe em public.users
    SELECT id INTO users_record_id 
    FROM users 
    WHERE email = 'igor_pk_@hotmail.com';
    
    IF users_record_id IS NULL THEN
        -- Criar registro em public.users
        RAISE NOTICE 'Criando registro em public.users para Igor...';
        
        INSERT INTO users (email, auth_id, role, nome, created_at, updated_at)
        VALUES (
            'igor_pk_@hotmail.com',
            auth_user_id,
            'piloto',
            'Igor',
            NOW(),
            NOW()
        )
        RETURNING id INTO users_record_id;
        
        RAISE NOTICE 'Registro criado em public.users com ID: %', users_record_id;
    ELSE
        -- Atualizar auth_id se necessário
        UPDATE users 
        SET auth_id = auth_user_id,
            updated_at = NOW()
        WHERE id = users_record_id 
          AND (auth_id IS NULL OR auth_id != auth_user_id);
        
        RAISE NOTICE 'Registro atualizado em public.users: %', users_record_id;
    END IF;
    
    -- Verificar e corrigir registro em membros
    SELECT id INTO membro_record_id 
    FROM membros 
    WHERE email = 'igor_pk_@hotmail.com';
    
    IF membro_record_id IS NOT NULL THEN
        -- Atualizar user_id em membros se necessário
        UPDATE membros 
        SET user_id = users_record_id,
            updated_at = NOW()
        WHERE id = membro_record_id 
          AND (user_id IS NULL OR user_id != users_record_id);
        
        RAISE NOTICE 'Registro em membros atualizado: %', membro_record_id;
    ELSE
        RAISE NOTICE 'ATENÇÃO: Usuário Igor não encontrado em membros';
    END IF;
    
END $$;

-- 3. Verificar resultado da correção
SELECT 'RESULTADO APOS CORRECAO' as info;

SELECT 
    au.id as auth_id,
    u.id as users_table_id,
    u.auth_id as users_auth_id,
    u.role,
    m.id as membro_id,
    m.user_id as membro_user_id,
    CASE 
        WHEN u.id IS NOT NULL AND u.auth_id = au.id THEN '✅ CORRIGIDO'
        WHEN u.id IS NULL THEN '❌ AINDA FALTA REGISTRO EM USERS'
        WHEN u.auth_id != au.id THEN '❌ AUTH_ID DESSINCRONIZADO'
        ELSE '⚠️ VERIFICAR MANUALMENTE'
    END as status
FROM auth.users au
LEFT JOIN users u ON u.email = au.email
LEFT JOIN membros m ON m.email = au.email
WHERE au.email = 'igor_pk_@hotmail.com';

-- 4. Testar função RPC após correção
SELECT 'TESTE RPC APOS CORRECAO' as info;

-- Simular o que get_current_user_table_id retornaria agora
WITH igor_test AS (
    SELECT 
        au.id as auth_uid,
        u.id as expected_result
    FROM auth.users au
    JOIN users u ON u.email = au.email
    WHERE au.email = 'igor_pk_@hotmail.com'
)
SELECT 
    auth_uid,
    expected_result,
    CASE 
        WHEN expected_result IS NOT NULL THEN '✅ RPC FUNCIONARÁ'
        ELSE '❌ RPC AINDA RETORNARÁ NULL'
    END as rpc_status
FROM igor_test;

-- 5. Limpar dados órfãos relacionados ao Igor (se existirem)
SELECT 'LIMPEZA DE DADOS ORFAOS' as info;

-- Buscar e corrigir itens de checklist órfãos
WITH igor_data AS (
    SELECT 
        au.id as auth_id,
        u.id as correct_users_id
    FROM auth.users au
    JOIN users u ON u.email = au.email
    WHERE au.email = 'igor_pk_@hotmail.com'
)
UPDATE checklist_itens 
SET marcado_por = igor_data.correct_users_id,
    updated_at = NOW()
FROM igor_data
WHERE checklist_itens.marcado_por::text = igor_data.auth_id::text;

-- Itens corrigidos (diagnóstico removido por compatibilidade)

-- 6. Verificação final
SELECT 'VERIFICACAO FINAL' as info;

SELECT 
    'Usuário Igor está pronto para usar o checklist' as resultado,
    u.id as users_table_id_valido,
    u.role as role_confirmado
FROM users u
WHERE u.email = 'igor_pk_@hotmail.com'
  AND u.auth_id IS NOT NULL;

-- 7. Instruções para o frontend
SELECT 'INSTRUCOES PARA FRONTEND' as info;

SELECT 
    'O hook useUser deve retornar users_table_id válido agora' as instrucao,
    u.id as users_table_id_esperado
FROM users u
WHERE u.email = 'igor_pk_@hotmail.com';

SELECT 'CORRECAO CONCLUIDA - Igor pode tentar usar o checklist novamente' as status_final;