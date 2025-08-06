-- =====================================================================
-- ADICIONAR POLÍTICA RLS DE INSERT PARA AGÊNCIAS NA TABELA VOOS
-- Data: 15 de janeiro de 2025
-- Objetivo: Permitir que agências criem voos para pilotos vinculados
-- Problema: Política de INSERT para agências estava faltando
-- =====================================================================

BEGIN;

-- Passo 1: Verificar políticas existentes antes da correção
SELECT 'ANTES - Políticas de INSERT existentes:' as status;
SELECT policyname FROM pg_policies WHERE tablename = 'voos' AND cmd = 'INSERT';

-- Passo 2: Adicionar política de INSERT para agências
CREATE POLICY "Agências podem criar voos para pilotos vinculados" ON voos
  FOR INSERT WITH CHECK (
    -- Deve ter agencia_id preenchido
    agencia_id IS NOT NULL AND
    -- Verificar se o usuário é dono da agência (usando lógica user_id/email)
    EXISTS (
      SELECT 1 FROM membros m 
      JOIN users u ON (
        (m.user_id = u.id AND u.id = auth.uid()) OR 
        (m.user_id IS NULL AND m.email = u.email AND u.id = auth.uid())
      )
      WHERE m.id = agencia_id 
      AND m.tipo = 'agencia'
      AND m.status = 'ativo'
    ) AND
    -- Verificar se o piloto está ativo
    EXISTS (
      SELECT 1 FROM membros 
      WHERE id = piloto_id 
      AND tipo = 'piloto' 
      AND status = 'ativo'
    ) AND
    -- Verificar se existe vínculo aceito entre agência e piloto
    EXISTS (
      SELECT 1 FROM vinculos_agencia_piloto v
      WHERE v.agencia_id = voos.agencia_id
      AND v.piloto_id = voos.piloto_id
      AND v.status = 'aceito'
    )
  );

-- Passo 3: Verificar resultado
SELECT 'APÓS - Políticas de INSERT criadas:' as status;
SELECT 
  policyname,
  CASE 
    WHEN policyname LIKE '%Pilotos%' THEN '👨‍✈️ Pilotos'
    WHEN policyname LIKE '%Agências%' THEN '🏢 Agências'
    ELSE '❓ Outros'
  END as tipo_usuario
FROM pg_policies 
WHERE tablename = 'voos' AND cmd = 'INSERT'
ORDER BY policyname;

-- Passo 4: Comentário para documentação
COMMENT ON TABLE voos IS 'Tabela de voos - Política INSERT para agências adicionada em 15/01/2025';

-- Passo 5: Log da migração
INSERT INTO logs_atividade (acao, detalhes) VALUES 
('add_agencia_insert_policy_voos', jsonb_build_object(
  'descricao', 'Adicionada política RLS de INSERT para agências criarem voos',
  'tabela_afetada', 'voos',
  'politica_criada', 'Agências podem criar voos para pilotos vinculados',
  'data_criacao', NOW()
));

COMMIT;

-- Mensagem de sucesso
SELECT '✅ POLÍTICA DE INSERT PARA AGÊNCIAS ADICIONADA!' as resultado;
SELECT 'Agências agora podem criar voos para pilotos vinculados' as funcionalidade_adicionada;
SELECT 'Próximo passo: aplicar migração e testar criação de voos' as proxima_acao;