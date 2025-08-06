-- Script definitivo para resolver erro de foreign key constraint 23503
-- na tabela checklist_itens
-- Data: 25 de dezembro de 2024

-- =====================================================================
-- DIAGNÓSTICO INICIAL
-- =====================================================================

SELECT '=== DIAGNÓSTICO INICIAL ===' as info;

-- Verificar dados órfãos em checklist_itens
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

-- =====================================================================
-- BACKUP DE SEGURANÇA
-- =====================================================================

SELECT '=== CRIANDO BACKUP ===' as info;

-- Backup da tabela checklist_itens
CREATE TABLE IF NOT EXISTS checklist_itens_backup_fix_foreign_key AS 
SELECT * FROM checklist_itens;

SELECT 'Backup criado com' as info, COUNT(*) as registros
FROM checklist_itens_backup_fix_foreign_key;

-- =====================================================================
-- LIMPEZA DE DADOS ÓRFÃOS
-- =====================================================================

SELECT '=== LIMPANDO DADOS ÓRFÃOS ===' as info;

-- Limpar referências órfãs em marcado_por
UPDATE checklist_itens 
SET marcado_por = NULL,
    marcado_em = NULL
WHERE marcado_por IS NOT NULL 
  AND NOT EXISTS (SELECT 1 FROM users WHERE id = checklist_itens.marcado_por);

SELECT 'Referências órfãs em marcado_por limpas' as resultado;

-- Limpar referências órfãs em created_by
UPDATE checklist_itens 
SET created_by = NULL
WHERE created_by IS NOT NULL 
  AND NOT EXISTS (SELECT 1 FROM users WHERE id = checklist_itens.created_by);

SELECT 'Referências órfãs em created_by limpas' as resultado;

-- Limpar referências órfãs em preenchido_por
UPDATE checklist_itens 
SET preenchido_por = NULL
WHERE preenchido_por IS NOT NULL 
  AND NOT EXISTS (SELECT 1 FROM users WHERE id = checklist_itens.preenchido_por);

SELECT 'Referências órfãs em preenchido_por limpas' as resultado;

-- =====================================================================
-- VERIFICAÇÃO PÓS-LIMPEZA
-- =====================================================================

SELECT '=== VERIFICAÇÃO PÓS-LIMPEZA ===' as info;

-- Verificar se ainda há dados órfãos
SELECT 
    'Itens com marcado_por inválido (pós-limpeza)' as problema,
    COUNT(*) as quantidade
FROM checklist_itens ci
WHERE ci.marcado_por IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM users u WHERE u.id = ci.marcado_por
  )
UNION ALL
SELECT 
    'Itens com created_by inválido (pós-limpeza)' as problema,
    COUNT(*) as quantidade
FROM checklist_itens ci
WHERE ci.created_by IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM users u WHERE u.id = ci.created_by
  )
UNION ALL
SELECT 
    'Itens com preenchido_por inválido (pós-limpeza)' as problema,
    COUNT(*) as quantidade
FROM checklist_itens ci
WHERE ci.preenchido_por IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM users u WHERE u.id = ci.preenchido_por
  );

-- =====================================================================
-- RECRIAR CONSTRAINTS COM PROTEÇÃO
-- =====================================================================

SELECT '=== RECRIANDO CONSTRAINTS ===' as info;

-- Remover constraints existentes se existirem
ALTER TABLE checklist_itens DROP CONSTRAINT IF EXISTS checklist_itens_marcado_por_fkey;
ALTER TABLE checklist_itens DROP CONSTRAINT IF EXISTS checklist_itens_created_by_fkey;
ALTER TABLE checklist_itens DROP CONSTRAINT IF EXISTS checklist_itens_preenchido_por_fkey;

-- Recriar constraints com ON DELETE SET NULL para proteção
ALTER TABLE checklist_itens 
ADD CONSTRAINT checklist_itens_marcado_por_fkey 
FOREIGN KEY (marcado_por) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE checklist_itens 
ADD CONSTRAINT checklist_itens_created_by_fkey 
FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE checklist_itens 
ADD CONSTRAINT checklist_itens_preenchido_por_fkey 
FOREIGN KEY (preenchido_por) REFERENCES users(id) ON DELETE SET NULL;

SELECT 'Constraints recriadas com proteção ON DELETE SET NULL' as resultado;

-- =====================================================================
-- CRIAR FUNÇÃO DE VALIDAÇÃO ROBUSTA
-- =====================================================================

SELECT '=== CRIANDO FUNÇÃO DE VALIDAÇÃO ===' as info;

-- Função para validar e corrigir IDs de usuário antes de inserção/atualização
CREATE OR REPLACE FUNCTION validate_checklist_user_ids()
RETURNS TRIGGER AS $$
DECLARE
    user_email TEXT;
    user_table_id UUID;
BEGIN
    -- Validar marcado_por
    IF NEW.marcado_por IS NOT NULL THEN
        IF NOT EXISTS (SELECT 1 FROM users WHERE id = NEW.marcado_por) THEN
            RAISE WARNING 'marcado_por inválido: %. Definindo como NULL.', NEW.marcado_por;
            NEW.marcado_por = NULL;
            NEW.marcado_em = NULL;
        END IF;
    END IF;
    
    -- Validar created_by
    IF NEW.created_by IS NOT NULL THEN
        IF NOT EXISTS (SELECT 1 FROM users WHERE id = NEW.created_by) THEN
            RAISE WARNING 'created_by inválido: %. Tentando corrigir...', NEW.created_by;
            
            -- Tentar obter usuário atual por auth.uid()
            IF auth.uid() IS NOT NULL THEN
                SELECT email INTO user_email FROM auth.users WHERE id = auth.uid();
                IF user_email IS NOT NULL THEN
                    SELECT id INTO user_table_id FROM users WHERE email = user_email;
                    IF user_table_id IS NOT NULL THEN
                        NEW.created_by = user_table_id;
                        RAISE NOTICE 'created_by corrigido para: %', user_table_id;
                    ELSE
                        NEW.created_by = NULL;
                        RAISE WARNING 'Usuário não encontrado na tabela users: %', user_email;
                    END IF;
                ELSE
                    NEW.created_by = NULL;
                END IF;
            ELSE
                NEW.created_by = NULL;
            END IF;
        END IF;
    END IF;
    
    -- Validar preenchido_por
    IF NEW.preenchido_por IS NOT NULL THEN
        IF NOT EXISTS (SELECT 1 FROM users WHERE id = NEW.preenchido_por) THEN
            RAISE WARNING 'preenchido_por inválido: %. Tentando corrigir...', NEW.preenchido_por;
            
            -- Tentar obter usuário atual por auth.uid()
            IF auth.uid() IS NOT NULL THEN
                SELECT email INTO user_email FROM auth.users WHERE id = auth.uid();
                IF user_email IS NOT NULL THEN
                    SELECT id INTO user_table_id FROM users WHERE email = user_email;
                    IF user_table_id IS NOT NULL THEN
                        NEW.preenchido_por = user_table_id;
                        RAISE NOTICE 'preenchido_por corrigido para: %', user_table_id;
                    ELSE
                        NEW.preenchido_por = NULL;
                        RAISE WARNING 'Usuário não encontrado na tabela users: %', user_email;
                    END IF;
                ELSE
                    NEW.preenchido_por = NULL;
                END IF;
            ELSE
                NEW.preenchido_por = NULL;
            END IF;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================================
-- APLICAR TRIGGER DE VALIDAÇÃO
-- =====================================================================

SELECT '=== APLICANDO TRIGGER ===' as info;

-- Remover trigger existente se existir
DROP TRIGGER IF EXISTS trigger_validate_checklist_user_ids ON checklist_itens;

-- Criar trigger para validação antes de INSERT e UPDATE
CREATE TRIGGER trigger_validate_checklist_user_ids
    BEFORE INSERT OR UPDATE ON checklist_itens
    FOR EACH ROW
    EXECUTE FUNCTION validate_checklist_user_ids();

SELECT 'Trigger de validação aplicado' as resultado;

-- =====================================================================
-- CRIAR FUNÇÃO RPC PARA FRONTEND
-- =====================================================================

SELECT '=== CRIANDO FUNÇÃO RPC ===' as info;

-- Função RPC para obter ID da tabela users baseado no auth.uid()
CREATE OR REPLACE FUNCTION get_current_user_table_id()
RETURNS UUID AS $$
DECLARE
    user_email TEXT;
    user_table_id UUID;
BEGIN
    -- Obter email do usuário autenticado
    SELECT email INTO user_email FROM auth.users WHERE id = auth.uid();
    
    IF user_email IS NULL THEN
        RETURN NULL;
    END IF;
    
    -- Buscar ID na tabela users
    SELECT id INTO user_table_id FROM users WHERE email = user_email;
    
    RETURN user_table_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Conceder permissões
GRANT EXECUTE ON FUNCTION get_current_user_table_id() TO authenticated;
GRANT EXECUTE ON FUNCTION get_current_user_table_id() TO anon;

SELECT 'Função RPC criada' as resultado;

-- =====================================================================
-- VERIFICAÇÃO FINAL
-- =====================================================================

SELECT '=== VERIFICAÇÃO FINAL ===' as info;

-- Verificar se constraints estão ativas
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

-- Verificar se triggers estão ativos
SELECT 
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers
WHERE event_object_table = 'checklist_itens'
    AND trigger_schema = 'public';

-- Estatísticas finais
SELECT 
    'Total de itens checklist' as estatistica,
    COUNT(*) as valor
FROM checklist_itens
UNION ALL
SELECT 
    'Itens com marcado_por válido' as estatistica,
    COUNT(*) as valor
FROM checklist_itens ci
WHERE ci.marcado_por IS NOT NULL
  AND EXISTS (SELECT 1 FROM users u WHERE u.id = ci.marcado_por)
UNION ALL
SELECT 
    'Itens com created_by válido' as estatistica,
    COUNT(*) as valor
FROM checklist_itens ci
WHERE ci.created_by IS NOT NULL
  AND EXISTS (SELECT 1 FROM users u WHERE u.id = ci.created_by)
UNION ALL
SELECT 
    'Itens com preenchido_por válido' as estatistica,
    COUNT(*) as valor
FROM checklist_itens ci
WHERE ci.preenchido_por IS NOT NULL
  AND EXISTS (SELECT 1 FROM users u WHERE u.id = ci.preenchido_por);

-- =====================================================================
-- RESUMO DA CORREÇÃO
-- =====================================================================

SELECT '=== RESUMO DA CORREÇÃO ===' as info;

SELECT 
    '✅ Dados órfãos limpos' as acao,
    'Todas as referências inválidas foram removidas' as resultado
UNION ALL
SELECT 
    '✅ Constraints recriadas' as acao,
    'Foreign keys com ON DELETE SET NULL para proteção' as resultado
UNION ALL
SELECT 
    '✅ Trigger de validação' as acao,
    'Valida e corrige IDs antes de inserção/atualização' as resultado
UNION ALL
SELECT 
    '✅ Função RPC criada' as acao,
    'get_current_user_table_id() para frontend usar' as resultado
UNION ALL
SELECT 
    '✅ Backup criado' as acao,
    'checklist_itens_backup_fix_foreign_key para rollback' as resultado;

SELECT '=== CORREÇÃO CONCLUÍDA ===' as status;