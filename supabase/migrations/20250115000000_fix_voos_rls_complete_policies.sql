-- =====================================================================
-- CORREÇÃO COMPLETA DAS POLÍTICAS RLS DA TABELA VOOS
-- Data: 15 de janeiro de 2025
-- Objetivo: Restaurar funcionalidade de criação de voos
-- Problema: Políticas de INSERT, UPDATE e DELETE foram removidas inadvertidamente
-- =====================================================================

BEGIN;

-- Passo 1: Verificar estado antes da correção
SELECT 'ANTES DA CORREÇÃO - Políticas existentes:' as status;
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'voos' ORDER BY cmd;

-- Passo 2: Remover políticas conflitantes (se existirem)
DROP POLICY IF EXISTS "Pilotos podem criar voos" ON voos;
DROP POLICY IF EXISTS "Agências podem criar voos" ON voos;
DROP POLICY IF EXISTS "Agências podem criar voos para pilotos vinculados" ON voos;
DROP POLICY IF EXISTS "Pilotos podem criar seus voos" ON voos;
DROP POLICY IF EXISTS "Usuários podem atualizar seus voos" ON voos;
DROP POLICY IF EXISTS "Pilotos podem atualizar seus voos" ON voos;
DROP POLICY IF EXISTS "Agências podem atualizar seus voos" ON voos;
DROP POLICY IF EXISTS "Apenas admins podem deletar voos" ON voos;

-- Passo 3: Criar política de INSERT para pilotos
CREATE POLICY "Pilotos podem criar voos" ON voos
  FOR INSERT WITH CHECK (
    -- Verificar se o usuário é dono do piloto_id
    is_user_member_owner(piloto_id) AND
    -- Verificar se o piloto está ativo
    EXISTS (
      SELECT 1 FROM membros 
      WHERE id = piloto_id 
      AND tipo = 'piloto' 
      AND status = 'ativo'
    )
  );

-- Passo 4: Criar política de INSERT para agências
CREATE POLICY "Agências podem criar voos" ON voos
  FOR INSERT WITH CHECK (
    -- Deve ter agencia_id preenchido
    agencia_id IS NOT NULL AND
    -- Verificar se o usuário é dono da agência
    is_user_member_owner(agencia_id) AND
    -- Verificar se a agência está ativa
    EXISTS (
      SELECT 1 FROM membros 
      WHERE id = agencia_id 
      AND tipo = 'agencia' 
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

-- Passo 5: Criar política de UPDATE
CREATE POLICY "Usuários podem atualizar seus voos" ON voos
  FOR UPDATE USING (
    -- Piloto pode atualizar seus próprios voos
    is_user_member_owner(piloto_id) OR 
    -- Agência pode atualizar voos onde está envolvida
    (agencia_id IS NOT NULL AND is_user_member_owner(agencia_id)) OR
    -- Admins podem atualizar qualquer voo
    is_admin_user()
  );

-- Passo 6: Criar política de DELETE (apenas admins)
CREATE POLICY "Apenas admins podem deletar voos" ON voos
  FOR DELETE USING (
    is_admin_user()
  );

-- Passo 7: Verificar resultado
SELECT 'APÓS CORREÇÃO - Políticas criadas:' as status;
SELECT 
  policyname, 
  cmd,
  CASE cmd
    WHEN 'SELECT' THEN '👁️ Visualização'
    WHEN 'INSERT' THEN '➕ Criação'
    WHEN 'UPDATE' THEN '✏️ Atualização'
    WHEN 'DELETE' THEN '🗑️ Exclusão'
  END as funcionalidade
FROM pg_policies 
WHERE tablename = 'voos' 
ORDER BY cmd, policyname;

-- Passo 8: Comentários para documentação
COMMENT ON TABLE voos IS 'Tabela de voos com políticas RLS corrigidas em 15/01/2025 - INSERT/UPDATE/DELETE restaurados';

-- Passo 9: Verificação final das políticas
SELECT 
  'Resumo das políticas RLS:' as info,
  COUNT(*) as total_policies,
  COUNT(CASE WHEN cmd = 'SELECT' THEN 1 END) as select_policies,
  COUNT(CASE WHEN cmd = 'INSERT' THEN 1 END) as insert_policies,
  COUNT(CASE WHEN cmd = 'UPDATE' THEN 1 END) as update_policies,
  COUNT(CASE WHEN cmd = 'DELETE' THEN 1 END) as delete_policies
FROM pg_policies 
WHERE tablename = 'voos';

COMMIT;

-- Mensagem de sucesso
SELECT '✅ CORREÇÃO APLICADA COM SUCESSO!' as resultado;
SELECT 'Próximo passo: executar testes de validação' as proxima_acao;
SELECT 'Funcionalidade de criação de voos restaurada' as funcionalidade_restaurada;