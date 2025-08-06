-- SCRIPT SIMPLIFICADO PARA APLICAR NO DASHBOARD SUPABASE
-- https://supabase.com/dashboard/project/elcbodhxzvoqpzamgown/sql

-- =====================================================================
-- REMOVER TRIGGERS ANTIGOS (SE EXISTIREM)
-- =====================================================================

DROP TRIGGER IF EXISTS trigger_checklist_validation ON checklist_itens;
DROP TRIGGER IF EXISTS trigger_checklist_updated_at ON checklist_itens;
DROP FUNCTION IF EXISTS trigger_checklist_validation();
DROP FUNCTION IF EXISTS trigger_update_updated_at();

-- =====================================================================
-- CRIAR TRIGGER PARA ESTRUTURA REAL
-- =====================================================================

CREATE OR REPLACE FUNCTION trigger_checklist_validation_real()
RETURNS TRIGGER AS $$
DECLARE
  user_table_id UUID;
  user_email TEXT;
BEGIN
  -- Atualizar timestamp updated_at
  NEW.updated_at = NOW();
  
  -- Se está marcando/desmarcando, registrar timestamp e usuário
  IF OLD.marcado IS DISTINCT FROM NEW.marcado OR OLD.observacao IS DISTINCT FROM NEW.observacao THEN
    NEW.preenchido_em = NOW();
    
    -- Conversão de auth.uid() para marcado_por
    SELECT id INTO user_table_id FROM users WHERE id = auth.uid();
    
    IF user_table_id IS NOT NULL THEN
      NEW.marcado_por = user_table_id;
    ELSE
      -- Fallback por email
      SELECT email INTO user_email FROM auth.users WHERE id = auth.uid();
      
      IF user_email IS NOT NULL THEN
        SELECT id INTO user_table_id FROM users WHERE email = user_email;
        NEW.marcado_por = user_table_id;
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar o trigger
CREATE TRIGGER trigger_checklist_validation_real
    BEFORE UPDATE ON checklist_itens
    FOR EACH ROW
    EXECUTE FUNCTION trigger_checklist_validation_real();

-- =====================================================================
-- VERIFICAR SE FUNCIONOU
-- =====================================================================

-- Execute esta query para confirmar que o trigger foi criado:
SELECT tgname, tgrelid::regclass 
FROM pg_trigger 
WHERE tgrelid = 'checklist_itens'::regclass;