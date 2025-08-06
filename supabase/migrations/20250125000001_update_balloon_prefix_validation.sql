-- Atualizar função de validação de prefixo para aceitar PT- e BR-
CREATE OR REPLACE FUNCTION validar_prefixo_balao(prefixo TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  -- Valida formato PT-XXX, BR-XXX ou PP-XXX onde XXX são letras/números (ex: PT-ABC, BR-FORT1, PP-123)
  RETURN prefixo ~ '^(PT|BR|PP)-[A-Z0-9]{3,4}$';
END;
$$ LANGUAGE plpgsql;

-- Atualizar trigger para usar a nova validação
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

-- Comentário atualizado
COMMENT ON COLUMN baloes.prefixo IS 'Prefixo do balão no formato PT-XXX, BR-XXX ou PP-XXX';