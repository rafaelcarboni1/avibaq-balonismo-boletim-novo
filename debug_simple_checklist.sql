-- DIAGNÓSTICO SIMPLES E FUNCIONAL DO CHECKLIST
-- Data: 1 de agosto de 2025

-- =====================================================================
-- VERIFICAR ESTRUTURA BÁSICA
-- =====================================================================

-- 1. Verificar se colunas existem na tabela checklist_itens
SELECT 
    'COLUNAS DA TABELA checklist_itens' as info,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'checklist_itens' 
  AND table_schema = 'public'
ORDER BY column_name;

-- 2. Verificar foreign keys
SELECT 
    'FOREIGN KEYS DA TABELA checklist_itens' as info,
    tc.constraint_name,
    kcu.column_name,
    ccu.table_name AS foreign_table,
    ccu.column_name AS foreign_column
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_name = 'checklist_itens';

-- =====================================================================
-- VERIFICAR DADOS DE USUÁRIOS
-- =====================================================================

-- 3. Contar usuários em ambas as tabelas
SELECT 'USUÁRIOS EM AUTH.USERS' as tabela, COUNT(*) as total FROM auth.users;
SELECT 'USUÁRIOS EM PUBLIC.USERS' as tabela, COUNT(*) as total FROM public.users;

-- 4. Verificar se existem usuários órfãos
SELECT 
    'USUÁRIOS ÓRFÃOS (auth sem public)' as problema,
    COUNT(*) as quantidade
FROM auth.users au
LEFT JOIN public.users pu ON pu.auth_id = au.id
WHERE pu.auth_id IS NULL;

-- =====================================================================
-- TESTE SIMPLES DE INSERÇÃO
-- =====================================================================

-- 5. Pegar um usuário válido para teste
SELECT 
    'USUÁRIO PARA TESTE' as info,
    id as user_id,
    email,
    role
FROM public.users 
ORDER BY created_at DESC 
LIMIT 1;

-- =====================================================================
-- RESULTADO
-- =====================================================================

SELECT '✅ DIAGNÓSTICO SIMPLES EXECUTADO' as status;