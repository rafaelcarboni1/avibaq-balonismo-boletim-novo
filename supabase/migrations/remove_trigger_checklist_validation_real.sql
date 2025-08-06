-- REMOÇÃO DO TRIGGER QUE FORÇA marcado_por = auth.uid()
-- Este trigger está sobrescrevendo o valor enviado pelo frontend

-- Remover o trigger problemático
DROP TRIGGER IF EXISTS trigger_checklist_validation_real ON checklist_itens;

-- Remover a função associada
DROP FUNCTION IF EXISTS trigger_checklist_validation_real();

-- Criar função simples apenas para updated_at e validações básicas
-- SEM modificar o marcado_por
CREATE OR REPLACE FUNCTION trigger_checklist_simple_validation()
RETURNS TRIGGER AS $$
BEGIN
  -- Atualizar apenas o timestamp updated_at
  NEW.updated_at = NOW();
  
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
  
  -- IMPORTANTE: NÃO modificar marcado_por aqui!
  -- O valor deve vir do frontend (users_table_id)
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar o novo trigger simples
CREATE TRIGGER trigger_checklist_simple_validation
    BEFORE UPDATE ON checklist_itens
    FOR EACH ROW
    EXECUTE FUNCTION trigger_checklist_simple_validation();

SELECT 'TRIGGER PROBLEMÁTICO REMOVIDO - marcado_por agora aceita valor do frontend' as status;