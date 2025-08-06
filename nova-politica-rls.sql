-- Nova política RLS para permitir agências verem balões de pilotos contratados
-- Execute no Supabase Dashboard

CREATE POLICY "Agencias podem ver baloes de pilotos contratados"
ON baloes
FOR SELECT
USING (
  -- Permite se existir vínculo entre a agência logada e o proprietário do balão
  EXISTS (
    SELECT 1
    FROM vinculos_agencia_piloto v
    INNER JOIN membros agencia ON v.agencia_id = agencia.id
    WHERE v.piloto_id = baloes.proprietario_id
      AND agencia.user_id::text = auth.uid()::text
  )
);