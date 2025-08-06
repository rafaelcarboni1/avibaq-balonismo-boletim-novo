-- ADAPTAÇÃO PARA ESTRUTURA REAL DA TABELA checklist_itens
-- Estrutura descoberta: id(bigint), checklist_id, secao_id, item_id, marcado, observacao, marcado_por, created_at, preenchido_em, updated_at
-- Data: 04 de agosto de 2025

-- =====================================================================
-- REMOVER TRIGGERS INCOMPATÍVEIS
-- =====================================================================

-- Remover triggers que foram criados para a estrutura antiga
DROP TRIGGER IF EXISTS trigger_checklist_validation ON checklist_itens;
DROP TRIGGER IF EXISTS trigger_checklist_updated_at ON checklist_itens;

-- Remover funções que não são compatíveis
DROP FUNCTION IF EXISTS trigger_checklist_validation();
DROP FUNCTION IF EXISTS trigger_update_updated_at();

-- =====================================================================
-- CRIAR TRIGGER COMPATÍVEL COM ESTRUTURA REAL
-- =====================================================================

-- Função de validação adaptada para a estrutura real
CREATE OR REPLACE FUNCTION trigger_checklist_validation_real()
RETURNS TRIGGER AS $$
DECLARE
  user_table_id UUID;
  user_email TEXT;
BEGIN
  -- Atualizar timestamp updated_at (existe na estrutura real)
  NEW.updated_at = NOW();
  
  -- Se está marcando/desmarcando, registrar timestamp e usuário
  IF OLD.marcado IS DISTINCT FROM NEW.marcado OR OLD.observacao IS DISTINCT FROM NEW.observacao THEN
    NEW.preenchido_em = NOW();
    
    -- CONVERSÃO de auth.uid() para marcado_por (campo correto da estrutura real)
    -- Primeiro: tentar busca direta por ID
    SELECT id INTO user_table_id FROM users WHERE id = auth.uid();
    
    IF user_table_id IS NOT NULL THEN
      NEW.marcado_por = user_table_id;
    ELSE
      -- Fallback: buscar por email se não encontrou por ID direto
      SELECT email INTO user_email FROM auth.users WHERE id = auth.uid();
      
      IF user_email IS NOT NULL THEN
        SELECT id INTO user_table_id FROM users WHERE email = user_email;
        
        IF user_table_id IS NOT NULL THEN
          NEW.marcado_por = user_table_id;
        ELSE
          -- Se não conseguir identificar o usuário, deixar NULL
          RAISE WARNING 'Não foi possível identificar usuário para marcado_por: auth_id=%, email=%', auth.uid(), user_email;
          NEW.marcado_por = NULL;
        END IF;
      ELSE
        RAISE WARNING 'Não foi possível obter email para auth.uid(): %', auth.uid();
        NEW.marcado_por = NULL;
      END IF;
    END IF;
  END IF;
  
  -- Validação: se não marcado, deve ter observacao (motivo)
  IF NEW.marcado = false AND (
    NEW.observacao IS NULL OR 
    trim(NEW.observacao) = '' OR 
    trim(NEW.observacao) = 'Aguardando preenchimento'
  ) THEN
    RAISE EXCEPTION 'Observação é obrigatória quando item não é marcado';
  END IF;
  
  -- Se marcado, limpar observacao
  IF NEW.marcado = true THEN
    NEW.observacao = NULL;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar o trigger na estrutura real
CREATE TRIGGER trigger_checklist_validation_real
    BEFORE UPDATE ON checklist_itens
    FOR EACH ROW
    EXECUTE FUNCTION trigger_checklist_validation_real();

-- =====================================================================
-- COMENTÁRIOS
-- =====================================================================

COMMENT ON FUNCTION trigger_checklist_validation_real() IS 'Trigger adaptado para estrutura real: marcado_por, observacao, preenchido_em, updated_at';

-- =====================================================================
-- VERIFICAÇÃO PÓS-APLICAÇÃO
-- =====================================================================

-- Verificar se o trigger foi criado:
-- SELECT tgname FROM pg_trigger WHERE tgrelid = 'checklist_itens'::regclass;

-- Script concluído - adaptado para estrutura real da tabela!