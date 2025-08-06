-- =====================================================================
-- TESTE DAS POLÍTICAS RLS DA TABELA VOOS
-- Data: 15 de janeiro de 2025
-- Objetivo: Verificar se todas as políticas necessárias estão presentes
-- =====================================================================

BEGIN;

-- 1. Listar todas as políticas RLS da tabela voos
SELECT 
  '=== POLÍTICAS RLS DA TABELA VOOS ===' as titulo;

SELECT 
  policyname as "Nome da Política",
  cmd as "Comando",
  CASE cmd
    WHEN 'SELECT' THEN '👁️ Visualização'
    WHEN 'INSERT' THEN '➕ Criação'
    WHEN 'UPDATE' THEN '✏️ Atualização'
    WHEN 'DELETE' THEN '🗑️ Exclusão'
    ELSE '❓ Outro'
  END as "Funcionalidade",
  CASE 
    WHEN policyname LIKE '%Pilotos%' THEN '👨‍✈️ Pilotos'
    WHEN policyname LIKE '%Agências%' OR policyname LIKE '%Agencia%' THEN '🏢 Agências'
    WHEN policyname LIKE '%Admin%' THEN '👑 Administradores'
    WHEN policyname LIKE '%Usuários%' OR policyname LIKE '%Usuario%' THEN '👤 Usuários'
    ELSE '❓ Indefinido'
  END as "Tipo de Usuário"
FROM pg_policies 
WHERE tablename = 'voos'
ORDER BY cmd, policyname;

-- 2. Verificar se temos todas as políticas necessárias
SELECT 
  '=== RESUMO DAS POLÍTICAS ===' as titulo;

SELECT 
  cmd as "Comando",
  COUNT(*) as "Quantidade",
  CASE 
    WHEN cmd = 'SELECT' AND COUNT(*) >= 3 THEN '✅ OK'
    WHEN cmd = 'INSERT' AND COUNT(*) >= 2 THEN '✅ OK'
    WHEN cmd = 'UPDATE' AND COUNT(*) >= 1 THEN '✅ OK'
    WHEN cmd = 'DELETE' AND COUNT(*) >= 1 THEN '✅ OK'
    ELSE '❌ FALTANDO'
  END as "Status"
FROM pg_policies 
WHERE tablename = 'voos'
GROUP BY cmd
ORDER BY cmd;

-- 3. Verificar políticas específicas que devem existir
SELECT 
  '=== VERIFICAÇÃO DE POLÍTICAS ESPECÍFICAS ===' as titulo;

SELECT 
  'Pilotos podem criar voos' as politica_esperada,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE tablename = 'voos' 
      AND cmd = 'INSERT' 
      AND policyname LIKE '%Pilotos%criar%'
    ) THEN '✅ EXISTE'
    ELSE '❌ NÃO EXISTE'
  END as status

UNION ALL

SELECT 
  'Agências podem criar voos' as politica_esperada,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE tablename = 'voos' 
      AND cmd = 'INSERT' 
      AND (policyname LIKE '%Agências%criar%' OR policyname LIKE '%Agencia%criar%')
    ) THEN '✅ EXISTE'
    ELSE '❌ NÃO EXISTE'
  END as status

UNION ALL

SELECT 
  'Política de UPDATE para usuários' as politica_esperada,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE tablename = 'voos' 
      AND cmd = 'UPDATE'
    ) THEN '✅ EXISTE'
    ELSE '❌ NÃO EXISTE'
  END as status

UNION ALL

SELECT 
  'Política de DELETE para admins' as politica_esperada,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE tablename = 'voos' 
      AND cmd = 'DELETE'
    ) THEN '✅ EXISTE'
    ELSE '❌ NÃO EXISTE'
  END as status;

-- 4. Verificar se RLS está habilitado
SELECT 
  '=== STATUS DO RLS ===' as titulo;

SELECT 
  schemaname as "Schema",
  tablename as "Tabela",
  rowsecurity as "RLS Habilitado",
  CASE rowsecurity
    WHEN true THEN '✅ ATIVO'
    ELSE '❌ INATIVO'
  END as "Status"
FROM pg_tables 
WHERE tablename = 'voos';

-- 5. Verificar funções auxiliares
SELECT 
  '=== FUNÇÕES AUXILIARES ===' as titulo;

SELECT 
  proname as "Nome da Função",
  CASE 
    WHEN proname = 'is_user_member_owner' THEN '✅ EXISTE'
    WHEN proname = 'is_admin_user' THEN '✅ EXISTE'
    WHEN proname = 'is_member_owner' THEN '✅ EXISTE'
    ELSE '❓ OUTRA'
  END as "Status"
FROM pg_proc 
WHERE proname IN ('is_user_member_owner', 'is_admin_user', 'is_member_owner')
ORDER BY proname;

COMMIT;

-- Mensagem final
SELECT '🔍 TESTE DE POLÍTICAS RLS CONCLUÍDO!' as resultado;
SELECT 'Verifique os resultados acima para identificar problemas' as instrucao;