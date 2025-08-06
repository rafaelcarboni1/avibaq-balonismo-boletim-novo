-- CORREÇÃO DO TRIGGER: Remover substituição forçada do marcado_por
-- O trigger estava forçando marcado_por = auth.uid() sempre, ignorando o valor enviado pelo frontend

-- Remover trigger problemático
DROP TRIGGER IF EXISTS trigger_checklist_validation ON checklist_itens;
DROP FUNCTION IF EXISTS trigger_checklist_validation();

-- Recriar função SEM forçar marcado_por = auth.uid()
CREATE OR REPLACE FUNCTION trigger_checklist_validation()
RETURNS TRIGGER AS $$
BEGIN
  -- Atualizar timestamp
  NEW.updated_at = NOW();
  
  -- Se está marcando/desmarcando, registrar timestamp
  -- IMPORTANTE: NÃO forçar marcado_por = auth.uid() aqui!
  -- O frontend já envia o users_table_id correto
  IF OLD.marcado IS DISTINCT FROM NEW.marcado OR OLD.motivo_nao_marcado IS DISTINCT FROM NEW.motivo_nao_marcado THEN
    NEW.marcado_em = NOW();
    -- REMOVIDO: NEW.marcado_por = auth.uid(); 
    -- O marcado_por deve vir do frontend com o users_table_id correto
  END IF;
  
  -- Validar que se não marcado, deve ter motivo
  IF NEW.marcado = false AND (NEW.motivo_nao_marcado IS NULL OR trim(NEW.motivo_nao_marcado) = '') THEN
    RAISE EXCEPTION 'Motivo é obrigatório quando item não é marcado';
  END IF;
  
  -- Se marcado, limpar motivo
  IF NEW.marcado = true THEN
    NEW.motivo_nao_marcado = NULL;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recriar trigger
CREATE TRIGGER trigger_checklist_validation
  BEFORE UPDATE ON checklist_itens
  FOR EACH ROW
  EXECUTE FUNCTION trigger_checklist_validation();

-- Verificar se o trigger foi aplicado corretamente
SELECT 
  tgname as trigger_name,
  proname as function_name
FROM pg_trigger t
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE tgrelid = 'checklist_itens'::regclass;