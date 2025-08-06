-- CORREÇÃO ABRANGENTE DAS POLÍTICAS RLS DA TABELA VOOS
-- Data: 25 de janeiro de 2025
-- Problema: Pilotos e agências não conseguem ver histórico de voos
-- Solução: Recriar políticas RLS com lógica corrigida

-- =====================================================================
-- PARTE 1: REMOVER POLÍTICAS EXISTENTES
-- =====================================================================

-- Remover todas as políticas existentes da tabela voos
DROP POLICY IF EXISTS "Pilots can view their flights" ON voos;
DROP POLICY IF EXISTS "Agencies can view their flights" ON voos;
DROP POLICY IF EXISTS "Admins can view all flights" ON voos;
DROP POLICY IF EXISTS "Direct pilot access" ON voos;
DROP POLICY IF EXISTS "Pilotos podem ver seus voos" ON voos;
DROP POLICY IF EXISTS "Agências podem ver seus voos" ON voos;
DROP POLICY IF EXISTS "Admins podem ver todos os voos" ON voos;
DROP POLICY IF EXISTS "Política temporária voos" ON voos;

-- =====================================================================
-- PARTE 2: GARANTIR QUE RLS ESTÁ HABILITADO
-- =====================================================================

ALTER TABLE voos ENABLE ROW LEVEL SECURITY;

-- =====================================================================
-- PARTE 3: CRIAR POLÍTICAS RLS CORRIGIDAS
-- =====================================================================

-- Política 1: Pilotos podem ver seus próprios voos
-- Corrige o problema de comparação entre user_id e piloto_id
CREATE POLICY "pilotos_podem_ver_seus_voos" ON voos
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM membros m 
      WHERE m.id = voos.piloto_id 
      AND m.user_id = auth.uid()
      AND m.tipo = 'piloto'
      AND m.status = 'ativo'
    )
  );

-- Política 2: Agências podem ver voos de seus pilotos vinculados
-- Considera os vínculos entre agência e piloto
CREATE POLICY "agencias_podem_ver_voos_pilotos" ON voos
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM membros agencia
      JOIN vinculos_agencia_piloto v ON agencia.id = v.agencia_id
      WHERE agencia.user_id = auth.uid()
      AND agencia.tipo = 'agencia'
      AND agencia.status = 'ativo'
      AND v.piloto_id = voos.piloto_id
      AND v.status = 'aceito'
    )
  );

-- Política 3: Agências podem ver voos onde são diretamente responsáveis
-- Para casos onde a agência é definida diretamente no voo
CREATE POLICY "agencias_podem_ver_voos_diretos" ON voos
  FOR SELECT USING (
    voos.agencia_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM membros m 
      WHERE m.id = voos.agencia_id 
      AND m.user_id = auth.uid()
      AND m.tipo = 'agencia'
      AND m.status = 'ativo'
    )
  );

-- Política 4: Administradores podem ver todos os voos
CREATE POLICY "admins_podem_ver_todos_voos" ON voos
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'meteo', 'tesouraria')
    )
  );

-- =====================================================================
-- PARTE 4: POLÍTICAS PARA OPERAÇÕES DE ESCRITA
-- =====================================================================

-- Política para INSERT: Pilotos podem criar seus próprios voos
CREATE POLICY "pilotos_podem_criar_voos" ON voos
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM membros m 
      WHERE m.id = piloto_id 
      AND m.user_id = auth.uid()
      AND m.tipo = 'piloto'
      AND m.status = 'ativo'
    )
  );

-- Política para UPDATE: Pilotos podem atualizar seus próprios voos
CREATE POLICY "pilotos_podem_atualizar_voos" ON voos
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM membros m 
      WHERE m.id = piloto_id 
      AND m.user_id = auth.uid()
      AND m.tipo = 'piloto'
      AND m.status = 'ativo'
    )
  );

-- Política para DELETE: Apenas admins podem deletar voos
CREATE POLICY "admins_podem_deletar_voos" ON voos
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );

-- =====================================================================
-- PARTE 5: FUNÇÃO DE DEBUG PARA TESTAR ACESSO
-- =====================================================================

CREATE OR REPLACE FUNCTION debug_voos_access()
RETURNS TABLE (
  user_id UUID,
  user_role TEXT,
  is_pilot BOOLEAN,
  is_agency BOOLEAN,
  pilot_member_id UUID,
  agency_member_id UUID,
  total_voos_visible INTEGER
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    auth.uid() as user_id,
    u.role as user_role,
    EXISTS(SELECT 1 FROM membros WHERE user_id = auth.uid() AND tipo = 'piloto' AND status = 'ativo') as is_pilot,
    EXISTS(SELECT 1 FROM membros WHERE user_id = auth.uid() AND tipo = 'agencia' AND status = 'ativo') as is_agency,
    (SELECT id FROM membros WHERE user_id = auth.uid() AND tipo = 'piloto' AND status = 'ativo' LIMIT 1) as pilot_member_id,
    (SELECT id FROM membros WHERE user_id = auth.uid() AND tipo = 'agencia' AND status = 'ativo' LIMIT 1) as agency_member_id,
    (SELECT COUNT(*)::INTEGER FROM voos) as total_voos_visible
  FROM users u 
  WHERE u.id = auth.uid();
END;
$$;

-- =====================================================================
-- PARTE 6: COMENTÁRIOS E DOCUMENTAÇÃO
-- =====================================================================

COMMENT ON TABLE voos IS 'Políticas RLS corrigidas em 25/01/2025 - Permite acesso correto para pilotos e agências ao histórico de voos';

-- Log da correção
INSERT INTO logs_atividade (usuario_id, acao, detalhes)
SELECT 
  auth.uid(),
  'SISTEMA',
  '{"acao": "Políticas RLS da tabela voos corrigidas", "detalhes": "Permite acesso ao histórico para pilotos e agências"}'
WHERE auth.uid() IS NOT NULL;

-- Mensagem de sucesso
DO $$
BEGIN
  RAISE NOTICE '✅ Políticas RLS da tabela voos corrigidas com sucesso!';
  RAISE NOTICE '✅ Pilotos podem ver seus voos históricos';
  RAISE NOTICE '✅ Agências podem ver voos de seus pilotos';
  RAISE NOTICE '✅ Administradores mantêm acesso total';
END $$;