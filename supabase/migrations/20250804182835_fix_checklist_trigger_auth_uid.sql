-- CORRE��O DEFINITIVA DO TRIGGER DE CHECKLIST
-- Problema: trigger usa auth.uid() que aponta para auth.users, mas foreign key aponta para public.users
-- Data: 04 de agosto de 2025

-- =====================================================================
-- CORRIGIR TRIGGER DE VALIDA��O DO CHECKLIST
-- =====================================================================

-- Substitui o trigger problem�tico por vers�o corrigida que usa convers�o de ID
CREATE OR REPLACE FUNCTION trigger_checklist_validation()
RETURNS TRIGGER AS $$
DECLARE
  user_table_id UUID;
  user_email TEXT;
BEGIN
  -- Atualizar timestamp
  NEW.updated_at = NOW();
  
  -- Se est� marcando/desmarcando, registrar timestamp e usu�rio CORRETO
  IF OLD.marcado IS DISTINCT FROM NEW.marcado OR OLD.motivo_nao_marcado IS DISTINCT FROM NEW.motivo_nao_marcado THEN
    NEW.preenchido_em = NOW();
    
    -- CORRE��O CR�TICA: Converter auth.uid() para users.id correto
    -- Primeiro: tentar busca direta por ID
    SELECT id INTO user_table_id FROM users WHERE id = auth.uid();
    
    IF user_table_id IS NOT NULL THEN
      NEW.preenchido_por = user_table_id;
    ELSE
      -- Fallback: buscar por email se n�o encontrou por ID direto
      SELECT email INTO user_email FROM auth.users WHERE id = auth.uid();
      
      IF user_email IS NOT NULL THEN
        SELECT id INTO user_table_id FROM users WHERE email = user_email;
        
        IF user_table_id IS NOT NULL THEN
          NEW.preenchido_por = user_table_id;
        ELSE
          -- Se n�o conseguir identificar o usu�rio, deixar NULL ao inv�s de falhar
          RAISE WARNING 'N�o foi poss�vel identificar usu�rio para preenchido_por: auth_id=%, email=%', auth.uid(), user_email;
          NEW.preenchido_por = NULL;
        END IF;
      ELSE
        RAISE WARNING 'N�o foi poss�vel obter email para auth.uid(): %', auth.uid();
        NEW.preenchido_por = NULL;
      END IF;
    END IF;
  END IF;
  
  -- Validar que se n�o marcado, deve ter motivo (exceto estado inicial)
  IF NEW.marcado = false AND (
    NEW.motivo_nao_marcado IS NULL OR 
    trim(NEW.motivo_nao_marcado) = '' OR 
    trim(NEW.motivo_nao_marcado) = 'Aguardando preenchimento'
  ) THEN
    RAISE EXCEPTION 'Motivo � obrigat�rio quando item n�o � marcado';
  END IF;
  
  -- Se marcado, limpar motivo
  IF NEW.marcado = true THEN
    NEW.motivo_nao_marcado = NULL;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================================
-- COMENT�RIOS E VALIDA��O
-- =====================================================================

COMMENT ON FUNCTION trigger_checklist_validation() IS 'Trigger corrigido que converte auth.uid() para users.id correto - resolve foreign key errors';