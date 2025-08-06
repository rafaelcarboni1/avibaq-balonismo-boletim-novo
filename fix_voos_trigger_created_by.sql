-- Correção do trigger de voos que estava causando erro de foreign key
-- Problema: created_by = auth.uid() não existe na tabela users
-- Solução: Buscar o users.id correspondente ao auth.uid() por email

-- Função corrigida para validar dados na inserção
CREATE OR REPLACE FUNCTION trigger_voos_insert_validation()
RETURNS TRIGGER AS $$
DECLARE
  user_email TEXT;
  user_table_id UUID;
BEGIN
  -- Definir created_by se não informado
  IF NEW.created_by IS NULL THEN
    -- Buscar email do usuário autenticado
    SELECT email INTO user_email FROM auth.users WHERE id = auth.uid();
    
    IF user_email IS NOT NULL THEN
      -- Buscar ID correspondente na tabela users
      SELECT id INTO user_table_id FROM users WHERE email = user_email;
      
      IF user_table_id IS NOT NULL THEN
        NEW.created_by = user_table_id;
      END IF;
    END IF;
  END IF;
  
  -- Validar que piloto está ativo e em dia
  IF NOT EXISTS (
    SELECT 1 FROM membros 
    WHERE id = NEW.piloto_id 
    AND tipo = 'piloto' 
    AND status = 'ativo'
  ) THEN
    RAISE EXCEPTION 'Piloto deve estar ativo para criar voos';
  END IF;
  
  -- Se agência especificada, validar que está ativa
  IF NEW.agencia_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM membros 
    WHERE id = NEW.agencia_id 
    AND tipo = 'agencia' 
    AND status = 'ativo'
  ) THEN
    RAISE EXCEPTION 'Agência deve estar ativa para criar voos';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Comentário explicativo
COMMENT ON FUNCTION trigger_voos_insert_validation() IS 'Valida dados de voos na inserção, corrigindo created_by para usar users.id em vez de auth.uid()';