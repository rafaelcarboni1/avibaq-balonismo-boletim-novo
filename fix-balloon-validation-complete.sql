-- SCRIPT COMPLETO para corrigir validação de prefixo de balão
-- Execute este SQL no Supabase Dashboard

-- 1. Remover trigger antigo se existir
DROP TRIGGER IF EXISTS trigger_validar_balao ON baloes;
DROP TRIGGER IF EXISTS tr_validar_balao ON baloes;
DROP TRIGGER IF EXISTS baloes_validar_trigger ON baloes;

-- 2. Remover funções antigas se existirem
DROP FUNCTION IF EXISTS trigger_validar_balao() CASCADE;
DROP FUNCTION IF EXISTS tr_validar_balao() CASCADE;
DROP FUNCTION IF EXISTS validar_prefixo_balao(TEXT) CASCADE;

-- 3. Criar nova função de validação
CREATE OR REPLACE FUNCTION validar_prefixo_balao(prefixo TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  -- Valida formato PT-XXX, BR-XXX ou PP-XXX onde XXX são letras/números (ex: PT-ABC, BR-FORT1, PP-123)
  RETURN prefixo ~ '^(PT|BR|PP)-[A-Z0-9]{3,5}$';
END;
$$ LANGUAGE plpgsql;

-- 4. Criar nova função de trigger
CREATE OR REPLACE FUNCTION trigger_validar_balao()
RETURNS TRIGGER AS $$
BEGIN
  -- Validar prefixo
  IF NOT validar_prefixo_balao(NEW.prefixo) THEN
    RAISE EXCEPTION 'Prefixo deve seguir o formato PT-XXX, BR-XXX ou PP-XXX (ex: PT-ABC, BR-FORT1, PP-123)';
  END IF;
  
  -- Atualizar timestamp de updated_at
  NEW.updated_at = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Criar novo trigger
CREATE TRIGGER trigger_validar_balao
  BEFORE INSERT OR UPDATE ON baloes
  FOR EACH ROW
  EXECUTE FUNCTION trigger_validar_balao();

-- 6. Testar validações
SELECT 
  'PT-ABC' as prefixo, 
  validar_prefixo_balao('PT-ABC') as valid,
  'Deveria ser TRUE' as esperado;

SELECT 
  'BR-FORT1' as prefixo, 
  validar_prefixo_balao('BR-FORT1') as valid,
  'Deveria ser TRUE' as esperado;

SELECT 
  'PP-123' as prefixo, 
  validar_prefixo_balao('PP-123') as valid,
  'Deveria ser TRUE' as esperado;

SELECT 
  'XX-ABC' as prefixo, 
  validar_prefixo_balao('XX-ABC') as valid,
  'Deveria ser FALSE' as esperado;

-- 7. Verificar triggers ativos
SELECT 
  trigger_name, 
  event_manipulation, 
  action_statement 
FROM information_schema.triggers 
WHERE event_object_table = 'baloes';

-- 8. Testar inserção (vai dar erro de FK, mas a validação deve funcionar)
-- DESCOMENTE para testar:
-- INSERT INTO baloes (prefixo, volume_m3, proprietario_id) 
-- VALUES ('BR-FORT1', 1000, '00000000-0000-0000-0000-000000000000');