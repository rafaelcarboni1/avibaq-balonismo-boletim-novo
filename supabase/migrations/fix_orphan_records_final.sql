-- CORREÇÃO DEFINITIVA DOS REGISTROS ÓRFÃOS NA TABELA CHECKLIST_ITENS
-- Este script resolve o erro 23503 de foreign key constraint

BEGIN;

-- 1. DIAGNÓSTICO INICIAL
SELECT 'DIAGNÓSTICO INICIAL - Registros órfãos encontrados:' as status;

-- Contar registros órfãos por tipo
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

-- 2. BACKUP DOS DADOS ÓRFÃOS ANTES DA LIMPEZA
DROP TABLE IF EXISTS checklist_itens_backup_orphan_cleanup;
CREATE TABLE checklist_itens_backup_orphan_cleanup AS
SELECT 
    ci.*,
    'backup_' || to_char(now(), 'YYYY_MM_DD_HH24_MI_SS') as backup_reason
FROM checklist_itens ci 
LEFT JOIN users u1 ON ci.marcado_por = u1.id 
LEFT JOIN users u2 ON ci.created_by = u2.id 
LEFT JOIN users u3 ON ci.preenchido_por = u3.id 
WHERE 
    (ci.marcado_por IS NOT NULL AND u1.id IS NULL) OR
    (ci.created_by IS NOT NULL AND u2.id IS NULL) OR
    (ci.preenchido_por IS NOT NULL AND u3.id IS NULL);

SELECT 'BACKUP CRIADO - Registros salvos em checklist_itens_backup_orphan_cleanup' as status;

-- 3. LIMPEZA DOS REGISTROS ÓRFÃOS
-- Limpar marcado_por órfãos
WITH updated_rows AS (
    UPDATE checklist_itens 
    SET marcado_por = NULL,
        marcado_em = NULL,
        updated_at = now()
    WHERE marcado_por IS NOT NULL 
    AND marcado_por NOT IN (SELECT id FROM users)
    RETURNING id
)
SELECT 'LIMPEZA 1/3 - marcado_por órfãos removidos: ' || COUNT(*) as status
FROM updated_rows;

-- Limpar created_by órfãos
WITH updated_rows AS (
    UPDATE checklist_itens 
    SET created_by = NULL,
        updated_at = now()
    WHERE created_by IS NOT NULL 
    AND created_by NOT IN (SELECT id FROM users)
    RETURNING id
)
SELECT 'LIMPEZA 2/3 - created_by órfãos removidos: ' || COUNT(*) as status
FROM updated_rows;

-- Limpar preenchido_por órfãos
WITH updated_rows AS (
    UPDATE checklist_itens 
    SET preenchido_por = NULL,
        updated_at = now()
    WHERE preenchido_por IS NOT NULL 
    AND preenchido_por NOT IN (SELECT id FROM users)
    RETURNING id
)
SELECT 'LIMPEZA 3/3 - preenchido_por órfãos removidos: ' || COUNT(*) as status
FROM updated_rows;

-- 4. RECRIAR CONSTRAINTS COM ON DELETE SET NULL
-- Remover constraints existentes se existirem
ALTER TABLE checklist_itens DROP CONSTRAINT IF EXISTS checklist_itens_marcado_por_fkey;
ALTER TABLE checklist_itens DROP CONSTRAINT IF EXISTS checklist_itens_created_by_fkey;
ALTER TABLE checklist_itens DROP CONSTRAINT IF EXISTS checklist_itens_preenchido_por_fkey;

-- Criar novas constraints com ON DELETE SET NULL
ALTER TABLE checklist_itens 
ADD CONSTRAINT checklist_itens_marcado_por_fkey 
FOREIGN KEY (marcado_por) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE checklist_itens 
ADD CONSTRAINT checklist_itens_created_by_fkey 
FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE checklist_itens 
ADD CONSTRAINT checklist_itens_preenchido_por_fkey 
FOREIGN KEY (preenchido_por) REFERENCES users(id) ON DELETE SET NULL;

SELECT 'CONSTRAINTS RECRIADAS - Todas com ON DELETE SET NULL' as status;

-- 5. CRIAR/ATUALIZAR FUNÇÃO DE VALIDAÇÃO
CREATE OR REPLACE FUNCTION validate_checklist_user_ids()
RETURNS TRIGGER AS $$
BEGIN
    -- Validar marcado_por
    IF NEW.marcado_por IS NOT NULL THEN
        IF NOT EXISTS (SELECT 1 FROM users WHERE id = NEW.marcado_por) THEN
            RAISE EXCEPTION 'Usuário marcado_por (%) não existe na tabela users', NEW.marcado_por;
        END IF;
    END IF;
    
    -- Validar created_by
    IF NEW.created_by IS NOT NULL THEN
        IF NOT EXISTS (SELECT 1 FROM users WHERE id = NEW.created_by) THEN
            RAISE EXCEPTION 'Usuário created_by (%) não existe na tabela users', NEW.created_by;
        END IF;
    END IF;
    
    -- Validar preenchido_por
    IF NEW.preenchido_por IS NOT NULL THEN
        IF NOT EXISTS (SELECT 1 FROM users WHERE id = NEW.preenchido_por) THEN
            RAISE EXCEPTION 'Usuário preenchido_por (%) não existe na tabela users', NEW.preenchido_por;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Remover trigger existente se existir
DROP TRIGGER IF EXISTS validate_checklist_user_ids_trigger ON checklist_itens;

-- Criar novo trigger
CREATE TRIGGER validate_checklist_user_ids_trigger
    BEFORE INSERT OR UPDATE ON checklist_itens
    FOR EACH ROW
    EXECUTE FUNCTION validate_checklist_user_ids();

SELECT 'TRIGGER DE VALIDAÇÃO CRIADO' as status;

-- 6. ATUALIZAR/CRIAR FUNÇÃO RPC PARA FRONTEND
CREATE OR REPLACE FUNCTION get_current_user_table_id()
RETURNS INTEGER AS $$
DECLARE
    user_table_id INTEGER;
    current_auth_id UUID;
BEGIN
    -- Obter o auth_id do usuário autenticado
    current_auth_id := auth.uid();
    
    -- Se não há usuário autenticado, retornar NULL
    IF current_auth_id IS NULL THEN
        RETURN NULL;
    END IF;
    
    -- Buscar o user_table_id na tabela users
    SELECT id INTO user_table_id
    FROM users 
    WHERE auth_id = current_auth_id;
    
    -- Se não encontrou por auth_id, tentar por email
    IF user_table_id IS NULL THEN
        SELECT id INTO user_table_id
        FROM users 
        WHERE email = auth.email();
    END IF;
    
    RETURN user_table_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Garantir permissões para a função RPC
GRANT EXECUTE ON FUNCTION get_current_user_table_id() TO anon;
GRANT EXECUTE ON FUNCTION get_current_user_table_id() TO authenticated;

SELECT 'FUNÇÃO RPC CRIADA/ATUALIZADA COM PERMISSÕES' as status;

-- 7. VERIFICAÇÃO FINAL
SELECT 'VERIFICAÇÃO FINAL - Registros órfãos restantes:' as status;

SELECT 
    'marcado_por órfãos restantes' as tipo,
    COUNT(*) as quantidade
FROM checklist_itens ci 
LEFT JOIN users u ON ci.marcado_por = u.id 
WHERE ci.marcado_por IS NOT NULL AND u.id IS NULL

UNION ALL

SELECT 
    'created_by órfãos restantes' as tipo,
    COUNT(*) as quantidade
FROM checklist_itens ci 
LEFT JOIN users u ON ci.created_by = u.id 
WHERE ci.created_by IS NOT NULL AND u.id IS NULL

UNION ALL

SELECT 
    'preenchido_por órfãos restantes' as tipo,
    COUNT(*) as quantidade
FROM checklist_itens ci 
LEFT JOIN users u ON ci.preenchido_por = u.id 
WHERE ci.preenchido_por IS NOT NULL AND u.id IS NULL;

-- 8. TESTE DE INSERÇÃO PARA VALIDAR CORREÇÃO
SELECT 'TESTE - Tentando inserir registro com usuário inexistente (deve falhar):' as status;

-- Este INSERT deve falhar graciosamente devido ao trigger
DO $$
BEGIN
    BEGIN
        INSERT INTO checklist_itens (voo_id, bloco, item_numero, item_descricao, marcado, marcado_por)
        VALUES (1, 1, 999, 'TESTE - Item de validação', false, 99999);
        
        RAISE NOTICE 'ERRO: Insert com usuário inexistente foi permitido!';
    EXCEPTION
        WHEN OTHERS THEN
            RAISE NOTICE 'SUCESSO: Insert com usuário inexistente foi bloqueado: %', SQLERRM;
    END;
END $$;

SELECT 'CORREÇÃO CONCLUÍDA COM SUCESSO!' as status;

COMMIT;