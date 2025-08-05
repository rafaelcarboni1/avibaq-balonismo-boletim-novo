-- Remove todos os triggers da tabela checklist_itens

-- Primeiro, vamos listar todos os triggers existentes
DO $$
DECLARE
    trigger_record RECORD;
BEGIN
    -- Loop através de todos os triggers na tabela checklist_itens
    FOR trigger_record IN 
        SELECT trigger_name 
        FROM information_schema.triggers 
        WHERE event_object_table = 'checklist_itens' 
        AND trigger_schema = 'public'
    LOOP
        -- Remove cada trigger encontrado
        EXECUTE 'DROP TRIGGER IF EXISTS ' || trigger_record.trigger_name || ' ON checklist_itens';
        RAISE NOTICE 'Trigger removido: %', trigger_record.trigger_name;
    END LOOP;
END $$;

-- Verificar se ainda existem triggers
SELECT 
    trigger_name,
    event_manipulation,
    action_timing
FROM information_schema.triggers
WHERE event_object_table = 'checklist_itens'
    AND trigger_schema = 'public';