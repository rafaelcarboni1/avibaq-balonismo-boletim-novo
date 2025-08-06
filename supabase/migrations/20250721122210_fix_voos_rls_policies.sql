-- Fix RLS policies for voos table
-- Issue: Pilots cannot see their own flights due to RLS policy problems

-- Drop existing problematic policies and recreate them
DROP POLICY IF EXISTS "Pilotos podem ver seus voos" ON voos;
DROP POLICY IF EXISTS "Agências podem ver seus voos" ON voos;
DROP POLICY IF EXISTS "Admins podem ver todos os voos" ON voos;

-- Create improved RLS policies for SELECT operations

-- Policy 1: Pilots can see their own flights
CREATE POLICY "Pilots can view their flights" ON voos
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM membros m 
      JOIN users u ON m.user_id = u.id 
      WHERE m.id = voos.piloto_id 
      AND u.id = auth.uid()
      AND m.tipo = 'piloto'
    )
  );

-- Policy 2: Agencies can see flights they are involved in
CREATE POLICY "Agencies can view their flights" ON voos
  FOR SELECT USING (
    voos.agencia_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM membros m 
      JOIN users u ON m.user_id = u.id 
      WHERE m.id = voos.agencia_id 
      AND u.id = auth.uid()
      AND m.tipo = 'agencia'
    )
  );

-- Policy 3: Admins can see all flights
CREATE POLICY "Admins can view all flights" ON voos
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'meteo', 'tesouraria')
    )
  );

-- Policy 4: Alternative simple policy for pilots (fallback)
-- This is a more direct approach that should definitely work
CREATE POLICY "Direct pilot access" ON voos
  FOR SELECT USING (
    piloto_id IN (
      SELECT m.id 
      FROM membros m 
      WHERE m.user_id = auth.uid() 
      AND m.tipo = 'piloto'
    )
  );

-- Enable RLS (make sure it's enabled)
ALTER TABLE voos ENABLE ROW LEVEL SECURITY;

-- Add some debugging - create a function to test RLS
CREATE OR REPLACE FUNCTION debug_pilot_access(pilot_member_id UUID)
RETURNS TABLE (
  user_authenticated BOOLEAN,
  user_id UUID,
  is_pilot BOOLEAN,
  member_id UUID,
  member_status TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    auth.uid() IS NOT NULL as user_authenticated,
    auth.uid() as user_id,
    EXISTS(SELECT 1 FROM membros WHERE user_id = auth.uid() AND tipo = 'piloto') as is_pilot,
    m.id as member_id,
    m.status as member_status
  FROM membros m 
  WHERE m.user_id = auth.uid() AND m.tipo = 'piloto'
  LIMIT 1;
END;
$$;

-- Comment explaining the fix
COMMENT ON TABLE voos IS 'RLS policies fixed on 2025-07-21 - Added multiple policy approaches to ensure pilot access';