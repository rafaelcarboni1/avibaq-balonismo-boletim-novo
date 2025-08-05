-- Script para verificar triggers ativos na tabela checklist_itens
-- Este script ajudará a identificar qual trigger está causando o problema

-- 1. Verificar triggers ativos
SELECT 
  'TRIGGERS ATIVOS:' as info;

SELECT 
  t.tgname as trigger_name,
  p.proname as function_name,
  t.tgenabled as enabled,
  CASE 
    WHEN t.tgtype & 2 = 2 THEN 'BEFORE'
    WHEN t.tgtype & 4 = 4 THEN 'AFTER'
    ELSE 'OTHER'
  END as trigger_timing,
  CASE 
    WHEN t.tgtype & 16 = 16 THEN 'INSERT'
    WHEN t.tgtype & 8 = 8 THEN 'DELETE'
    WHEN t.tgtype & 4 = 4 THEN 'UPDATE'
    ELSE 'OTHER'
  END as trigger_event
FROM pg_trigger t
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE tgrelid = 'checklist_itens'::regclass
ORDER BY t.tgname;

-- 2. Verificar código das funções relacionadas a checklist
SELECT 
  '\nFUNÇÕES RELACIONADAS:' as info;

SELECT 
  proname as function_name,
  CASE 
    WHEN LENGTH(prosrc) > 500 THEN LEFT(prosrc, 500) || '...'
    ELSE prosrc
  END as function_source_preview
FROM pg_proc 
WHERE proname LIKE '%checklist%' OR proname LIKE '%validate%'
ORDER BY proname;

-- 3. Verificar se há algum trigger que modifica marcado_por
SELECT 
  '\nTRIGGERS QUE PODEM MODIFICAR MARCADO_POR:' as info;

SELECT 
  p.proname as function_name,
  'Contém auth.uid()' as contains_auth_uid
FROM pg_proc p
JOIN pg_trigger t ON t.tgfoid = p.oid
WHERE tgrelid = 'checklist_itens'::regclass
AND (prosrc LIKE '%auth.uid()%' OR prosrc LIKE '%marcado_por%')
ORDER BY p.proname;

-- 4. Mostrar o código completo das funções problemáticas
SELECT 
  '\nCÓDIGO COMPLETO DAS FUNÇÕES PROBLEMÁTICAS:' as info;

SELECT 
  p.proname as function_name,
  p.prosrc as complete_source
FROM pg_proc p
JOIN pg_trigger t ON t.tgfoid = p.oid
WHERE tgrelid = 'checklist_itens'::regclass
AND prosrc LIKE '%auth.uid()%'
ORDER BY p.proname;