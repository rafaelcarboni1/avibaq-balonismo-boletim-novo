-- Script para adicionar colunas faltantes nas tabelas push_notifications
-- Execute este script no SQL Editor do Supabase

-- VERIFICAR ESTRUTURA ATUAL
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'push_notifications' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- ADICIONAR COLUNAS FALTANTES (se não existirem)

-- 1. Adicionar send_type se não existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'push_notifications' 
          AND column_name = 'send_type'
          AND table_schema = 'public'
    ) THEN
        ALTER TABLE push_notifications 
        ADD COLUMN send_type VARCHAR(20) NOT NULL DEFAULT 'immediate' 
        CHECK (send_type IN ('immediate', 'scheduled', 'recurring'));
        RAISE NOTICE 'Coluna send_type adicionada';
    ELSE
        RAISE NOTICE 'Coluna send_type já existe';
    END IF;
END $$;

-- 2. Adicionar scheduled_date se não existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'push_notifications' 
          AND column_name = 'scheduled_date'
          AND table_schema = 'public'
    ) THEN
        ALTER TABLE push_notifications 
        ADD COLUMN scheduled_date TIMESTAMP WITH TIME ZONE;
        RAISE NOTICE 'Coluna scheduled_date adicionada';
    ELSE
        RAISE NOTICE 'Coluna scheduled_date já existe';
    END IF;
END $$;

-- 3. Adicionar recurring_rule se não existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'push_notifications' 
          AND column_name = 'recurring_rule'
          AND table_schema = 'public'
    ) THEN
        ALTER TABLE push_notifications 
        ADD COLUMN recurring_rule JSONB;
        RAISE NOTICE 'Coluna recurring_rule adicionada';
    ELSE
        RAISE NOTICE 'Coluna recurring_rule já existe';
    END IF;
END $$;

-- 4. Adicionar total_targeted se não existir  
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'push_notifications' 
          AND column_name = 'total_targeted'
          AND table_schema = 'public'
    ) THEN
        ALTER TABLE push_notifications 
        ADD COLUMN total_targeted INTEGER DEFAULT 0;
        RAISE NOTICE 'Coluna total_targeted adicionada';
    ELSE
        RAISE NOTICE 'Coluna total_targeted já existe';
    END IF;
END $$;

-- 5. Adicionar total_sent se não existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'push_notifications' 
          AND column_name = 'total_sent'
          AND table_schema = 'public'
    ) THEN
        ALTER TABLE push_notifications 
        ADD COLUMN total_sent INTEGER DEFAULT 0;
        RAISE NOTICE 'Coluna total_sent adicionada';
    ELSE
        RAISE NOTICE 'Coluna total_sent já existe';
    END IF;
END $$;

-- 6. Adicionar total_delivered se não existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'push_notifications' 
          AND column_name = 'total_delivered'
          AND table_schema = 'public'
    ) THEN
        ALTER TABLE push_notifications 
        ADD COLUMN total_delivered INTEGER DEFAULT 0;
        RAISE NOTICE 'Coluna total_delivered adicionada';
    ELSE
        RAISE NOTICE 'Coluna total_delivered já existe';
    END IF;
END $$;

-- 7. Adicionar total_failed se não existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'push_notifications' 
          AND column_name = 'total_failed'
          AND table_schema = 'public'
    ) THEN
        ALTER TABLE push_notifications 
        ADD COLUMN total_failed INTEGER DEFAULT 0;
        RAISE NOTICE 'Coluna total_failed adicionada';
    ELSE
        RAISE NOTICE 'Coluna total_failed já existe';
    END IF;
END $$;

-- 8. Adicionar total_expired se não existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'push_notifications' 
          AND column_name = 'total_expired'
          AND table_schema = 'public'
    ) THEN
        ALTER TABLE push_notifications 
        ADD COLUMN total_expired INTEGER DEFAULT 0;
        RAISE NOTICE 'Coluna total_expired adicionada';
    ELSE
        RAISE NOTICE 'Coluna total_expired já existe';
    END IF;
END $$;

-- 9. Adicionar sent_at se não existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'push_notifications' 
          AND column_name = 'sent_at'
          AND table_schema = 'public'
    ) THEN
        ALTER TABLE push_notifications 
        ADD COLUMN sent_at TIMESTAMP WITH TIME ZONE;
        RAISE NOTICE 'Coluna sent_at adicionada';
    ELSE
        RAISE NOTICE 'Coluna sent_at já existe';
    END IF;
END $$;

-- VERIFICAR ESTRUTURA FINAL
SELECT 'Estrutura final da tabela push_notifications:' as info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'push_notifications' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- SUCESSO
SELECT 'Colunas faltantes adicionadas com sucesso!' as result;