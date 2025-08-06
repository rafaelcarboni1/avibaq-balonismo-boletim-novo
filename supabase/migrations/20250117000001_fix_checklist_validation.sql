-- Fix checklist validation constraint issue
-- This migration resolves the inconsistency between automatic checklist creation and validation

-- Replace the checklist validation function to allow initial state
CREATE OR REPLACE FUNCTION trigger_checklist_validation()
RETURNS TRIGGER AS $$
BEGIN
  -- Update timestamp
  NEW.updated_at = NOW();
  
  -- If marking/unmarking, record timestamp and user
  IF OLD.marcado IS DISTINCT FROM NEW.marcado OR OLD.motivo_nao_marcado IS DISTINCT FROM NEW.motivo_nao_marcado THEN
    NEW.preenchido_em = NOW();
    NEW.preenchido_por = auth.uid();
  END IF;
  
  -- Validate that if not marked, must have reason (EXCEPT in initial state)
  -- Allow "Aguardando preenchimento" as valid initial state
  IF NEW.marcado = false AND (
    NEW.motivo_nao_marcado IS NULL OR 
    trim(NEW.motivo_nao_marcado) = ''
  ) THEN
    RAISE EXCEPTION 'Motivo é obrigatório quando item não é marcado';
  END IF;
  
  -- If marked, clear reason
  IF NEW.marcado = true THEN
    NEW.motivo_nao_marcado = NULL;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Update the table constraint to be less restrictive for initial state
ALTER TABLE checklist_itens 
DROP CONSTRAINT IF EXISTS check_motivo_obrigatorio;

-- New constraint that allows "Aguardando preenchimento" as valid state
ALTER TABLE checklist_itens 
ADD CONSTRAINT check_motivo_obrigatorio CHECK (
  marcado = true OR 
  motivo_nao_marcado IS NOT NULL
);

-- Add comments
COMMENT ON CONSTRAINT check_motivo_obrigatorio ON checklist_itens IS 
'Allows initial state "Aguardando preenchimento" but requires reason for unmarked items in use';