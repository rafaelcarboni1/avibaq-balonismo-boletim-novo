-- CORREÇÃO ABRANGENTE DE TODAS AS FOREIGN KEY CONSTRAINTS PROBLEMÁTICAS
-- Remove TODAS as constraints que referenciam users(id) onde auth.uid() é usado
-- Data: 30 de julho de 2025

-- =====================================================================
-- REMOVER TODAS AS FOREIGN KEY CONSTRAINTS PARA users(id)
-- =====================================================================

-- 1. Tabela: voos
ALTER TABLE voos DROP CONSTRAINT IF EXISTS voos_created_by_fkey;
ALTER TABLE voos DROP CONSTRAINT IF EXISTS voos_cancelado_por_fkey;

-- 2. Tabela: checklist_itens  
ALTER TABLE checklist_itens DROP CONSTRAINT IF EXISTS checklist_itens_preenchido_por_fkey;

-- 3. Tabela: voos_anexos
ALTER TABLE voos_anexos DROP CONSTRAINT IF EXISTS voos_anexos_uploaded_por_fkey;

-- 4. Tabela: user_permissions
ALTER TABLE user_permissions DROP CONSTRAINT IF EXISTS user_permissions_user_id_fkey;
ALTER TABLE user_permissions DROP CONSTRAINT IF EXISTS user_permissions_concedido_por_fkey;

-- 5. Tabela: logs_atividade (se existir)
ALTER TABLE logs_atividade DROP CONSTRAINT IF EXISTS logs_atividade_admin_user_id_fkey;
ALTER TABLE logs_atividade DROP CONSTRAINT IF EXISTS logs_atividade_target_user_id_fkey;

-- 6. Tabela: push_notifications (se existir)
ALTER TABLE push_notifications DROP CONSTRAINT IF EXISTS push_notifications_user_id_fkey;
ALTER TABLE push_notifications DROP CONSTRAINT IF EXISTS push_notifications_created_by_fkey;

-- 7. Tabela: user_notification_preferences (se existir)
ALTER TABLE user_notification_preferences DROP CONSTRAINT IF EXISTS user_notification_preferences_user_id_fkey;
ALTER TABLE user_notification_preferences DROP CONSTRAINT IF EXISTS fk_user_id;

-- 8. Tabela: dados_offline
ALTER TABLE dados_offline DROP CONSTRAINT IF EXISTS dados_offline_user_id_fkey;

-- =====================================================================
-- TORNAR TODOS OS CAMPOS NULLABLE QUANDO APROPRIADO
-- =====================================================================

-- Alguns campos que eram NOT NULL podem precisar ser nullable
-- já que não temos garantia de conseguir converter auth.uid() para users.id

-- Voos - created_by pode ser null se não conseguir converter
ALTER TABLE voos ALTER COLUMN created_by DROP NOT NULL;
ALTER TABLE voos ALTER COLUMN cancelado_por DROP NOT NULL;

-- Checklist - preenchido_por pode ser null
ALTER TABLE checklist_itens ALTER COLUMN preenchido_por DROP NOT NULL;

-- Voos anexos - uploaded_por pode ser null  
ALTER TABLE voos_anexos ALTER COLUMN uploaded_por DROP NOT NULL;

-- =====================================================================
-- COMENTÁRIOS EXPLICATIVOS
-- =====================================================================

COMMENT ON COLUMN voos.created_by IS 'ID do usuário na tabela users (convertido de auth.uid via email) - pode ser NULL se conversão falhar';
COMMENT ON COLUMN voos.cancelado_por IS 'ID do usuário na tabela users (convertido de auth.uid via email) - pode ser NULL se conversão falhar';
COMMENT ON COLUMN checklist_itens.preenchido_por IS 'ID do usuário na tabela users (convertido de auth.uid via email) - pode ser NULL se conversão falhar';
COMMENT ON COLUMN voos_anexos.uploaded_por IS 'ID do usuário na tabela users (convertido de auth.uid via email) - pode ser NULL se conversão falhar';

-- =====================================================================
-- SCRIPT CONCLUÍDO
-- =====================================================================

-- Este script remove TODAS as foreign key constraints que podem causar
-- problemas com a mistura de auth.uid() e users.id no sistema.
-- 
-- Os campos continuam existindo para rastreabilidade, mas não têm mais
-- constraints rígidas que impedem inserções quando IDs não correspondem.
--
-- As políticas RLS continuam fornecendo segurança através de verificação
-- por email usando as funções is_user_member_owner() e is_admin_user().