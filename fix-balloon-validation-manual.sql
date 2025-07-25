-- Execute este SQL no Supabase Dashboard para corrigir a validação de prefixo

-- Primeiro, verificar a função atual
SELECT proname, prosrc FROM pg_proc WHERE proname = 'validar_prefixo_balao';

-- Atualizar a função para aceitar PT-, BR- e PP-
CREATE OR REPLACE FUNCTION validar_prefixo_balao(prefixo TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  -- Valida formato PT-XXX, BR-XXX ou PP-XXX onde XXX são letras/números (ex: PT-ABC, BR-FORT1, PP-123)
  RETURN prefixo ~ '^(PT|BR|PP)-[A-Z0-9]{3,4}$';
END;
$$ LANGUAGE plpgsql;

-- Atualizar o trigger
CREATE OR REPLACE FUNCTION trigger_validar_balao()
RETURNS TRIGGER AS $$
BEGIN
  IF NOT validar_prefixo_balao(NEW.prefixo) THEN
    RAISE EXCEPTION 'Prefixo deve seguir o formato PT-XXX, BR-XXX ou PP-XXX (ex: PT-ABC, BR-FORT1, PP-123)';
  END IF;
  
  -- Atualizar timestamp de updated_at
  NEW.updated_at = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Testar a validação
SELECT validar_prefixo_balao('PT-ABC') as pt_abc_valid;
SELECT validar_prefixo_balao('BR-FORT1') as br_fort1_valid;
SELECT validar_prefixo_balao('PP-123') as pp_123_valid;
SELECT validar_prefixo_balao('XX-ABC') as xx_abc_invalid;