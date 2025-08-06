-- Fix missing columns in voos table
-- These columns exist in migration 20250111000003 but may not be applied in production

-- Add missing columns if they don't exist
DO $$ 
BEGIN
  -- Add adultos_transportados column if it doesn't exist
  IF NOT EXISTS (
    SELECT column_name 
    FROM information_schema.columns 
    WHERE table_name = 'voos' 
    AND column_name = 'adultos_transportados'
  ) THEN
    ALTER TABLE voos ADD COLUMN adultos_transportados INTEGER;
    ALTER TABLE voos ADD CONSTRAINT check_adultos_transportados CHECK (adultos_transportados IS NULL OR adultos_transportados >= 0);
  END IF;

  -- Add criancas_transportadas column if it doesn't exist
  IF NOT EXISTS (
    SELECT column_name 
    FROM information_schema.columns 
    WHERE table_name = 'voos' 
    AND column_name = 'criancas_transportadas'
  ) THEN
    ALTER TABLE voos ADD COLUMN criancas_transportadas INTEGER;
    ALTER TABLE voos ADD CONSTRAINT check_criancas_transportadas CHECK (criancas_transportadas IS NULL OR criancas_transportadas >= 0);
  END IF;

  -- Add duracao_minutos column if it doesn't exist
  IF NOT EXISTS (
    SELECT column_name 
    FROM information_schema.columns 
    WHERE table_name = 'voos' 
    AND column_name = 'duracao_minutos'
  ) THEN
    ALTER TABLE voos ADD COLUMN duracao_minutos INTEGER;
    ALTER TABLE voos ADD CONSTRAINT check_duracao_minutos CHECK (duracao_minutos IS NULL OR duracao_minutos > 0);
  END IF;

  -- Add altitude_maxima column if it doesn't exist
  IF NOT EXISTS (
    SELECT column_name 
    FROM information_schema.columns 
    WHERE table_name = 'voos' 
    AND column_name = 'altitude_maxima'
  ) THEN
    ALTER TABLE voos ADD COLUMN altitude_maxima INTEGER;
    ALTER TABLE voos ADD CONSTRAINT check_altitude_maxima CHECK (altitude_maxima IS NULL OR altitude_maxima > 0);
  END IF;

  -- Add local_pouso column if it doesn't exist
  IF NOT EXISTS (
    SELECT column_name 
    FROM information_schema.columns 
    WHERE table_name = 'voos' 
    AND column_name = 'local_pouso'
  ) THEN
    ALTER TABLE voos ADD COLUMN local_pouso TEXT;
  END IF;

  -- Add observacoes_pos_voo column if it doesn't exist
  IF NOT EXISTS (
    SELECT column_name 
    FROM information_schema.columns 
    WHERE table_name = 'voos' 
    AND column_name = 'observacoes_pos_voo'
  ) THEN
    ALTER TABLE voos ADD COLUMN observacoes_pos_voo TEXT;
  END IF;

END $$;

-- Add comment to indicate this is a fix migration
COMMENT ON TABLE voos IS 'Tabela principal para registro e controle de voos de balão - corrigida em 2025-07-19';