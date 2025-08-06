-- Migração para corrigir políticas RLS após mudança na estrutura user_id
-- Criada em: 2025-07-30
-- Descrição: Corrige políticas RLS que estão bloqueando acesso devido a user_id NULL

-- 1. DROPAR POLÍTICAS ANTIGAS DA TABELA BALÕES
DROP POLICY IF EXISTS "Proprietários podem ver seus balões" ON baloes;
DROP POLICY IF EXISTS "Proprietários podem criar balões" ON baloes;
DROP POLICY IF EXISTS "Proprietários podem atualizar seus balões" ON baloes;
DROP POLICY IF EXISTS "Proprietários podem deletar seus balões" ON baloes;

-- 2. CRIAR POLÍTICAS RLS MAIS ROBUSTAS PARA BALÕES
-- Política de SELECT (Ver balões)
CREATE POLICY "Proprietários podem ver seus balões" ON baloes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM membros m 
      JOIN users u ON (
        (m.user_id = u.id AND u.id = auth.uid()) OR 
        (m.user_id IS NULL AND m.email = u.email AND u.id = auth.uid())
      )
      WHERE m.id = baloes.proprietario_id 
      AND m.status = 'ativo'
    )
  );

-- Política de INSERT (Criar balões)
CREATE POLICY "Proprietários podem criar balões" ON baloes
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM membros m 
      JOIN users u ON (
        (m.user_id = u.id AND u.id = auth.uid()) OR 
        (m.user_id IS NULL AND m.email = u.email AND u.id = auth.uid())
      )
      WHERE m.id = baloes.proprietario_id 
      AND m.status = 'ativo'
    )
  );

-- Política de UPDATE (Atualizar balões)
CREATE POLICY "Proprietários podem atualizar seus balões" ON baloes
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM membros m 
      JOIN users u ON (
        (m.user_id = u.id AND u.id = auth.uid()) OR 
        (m.user_id IS NULL AND m.email = u.email AND u.id = auth.uid())
      )
      WHERE m.id = baloes.proprietario_id 
      AND m.status = 'ativo'
    )
  );

-- Política de DELETE (Deletar balões)
CREATE POLICY "Proprietários podem deletar seus balões" ON baloes
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM membros m 
      JOIN users u ON (
        (m.user_id = u.id AND u.id = auth.uid()) OR 
        (m.user_id IS NULL AND m.email = u.email AND u.id = auth.uid())
      )
      WHERE m.id = baloes.proprietario_id 
      AND m.status = 'ativo'
    )
  );

-- 3. VERIFICAR E CORRIGIR POLÍTICAS DE OUTRAS TABELAS RELACIONADAS

-- Dropar e recriar políticas de voos que também podem ter o mesmo problema
DROP POLICY IF EXISTS "Pilotos podem ver seus voos" ON voos;
DROP POLICY IF EXISTS "Agências podem ver voos de seus pilotos" ON voos;
DROP POLICY IF EXISTS "Pilotos podem criar voos" ON voos;
DROP POLICY IF EXISTS "Pilotos podem atualizar seus voos" ON voos;
DROP POLICY IF EXISTS "Pilotos podem deletar seus voos" ON voos;

-- Recriar políticas de voos com a nova lógica
CREATE POLICY "Pilotos podem ver seus voos" ON voos
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM membros m 
      JOIN users u ON (
        (m.user_id = u.id AND u.id = auth.uid()) OR 
        (m.user_id IS NULL AND m.email = u.email AND u.id = auth.uid())
      )
      WHERE m.id = voos.piloto_id 
      AND m.tipo = 'piloto'
      AND m.status = 'ativo'
    )
  );

CREATE POLICY "Agências podem ver voos de seus pilotos" ON voos
  FOR SELECT USING (
    agencia_id IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM membros m 
      JOIN users u ON (
        (m.user_id = u.id AND u.id = auth.uid()) OR 
        (m.user_id IS NULL AND m.email = u.email AND u.id = auth.uid())
      )
      WHERE m.id = voos.agencia_id 
      AND m.tipo = 'agencia'
      AND m.status = 'ativo'
    )
  );

CREATE POLICY "Pilotos podem criar voos" ON voos
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM membros m 
      JOIN users u ON (
        (m.user_id = u.id AND u.id = auth.uid()) OR 
        (m.user_id IS NULL AND m.email = u.email AND u.id = auth.uid())
      )
      WHERE m.id = piloto_id 
      AND m.tipo = 'piloto'
      AND m.status = 'ativo'
    )
  );

CREATE POLICY "Pilotos podem atualizar seus voos" ON voos
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM membros m 
      JOIN users u ON (
        (m.user_id = u.id AND u.id = auth.uid()) OR 
        (m.user_id IS NULL AND m.email = u.email AND u.id = auth.uid())
      )
      WHERE m.id = voos.piloto_id 
      AND m.tipo = 'piloto'
      AND m.status = 'ativo'
    )
  );

CREATE POLICY "Pilotos podem deletar seus voos" ON voos
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM membros m 
      JOIN users u ON (
        (m.user_id = u.id AND u.id = auth.uid()) OR 
        (m.user_id IS NULL AND m.email = u.email AND u.id = auth.uid())
      )
      WHERE m.id = voos.piloto_id 
      AND m.tipo = 'piloto'
      AND m.status = 'ativo'
    ) AND
    status IN ('rascunho', 'planejado') -- Só pode deletar voos não iniciados
  );

-- 4. CRIAR FUNÇÃO AUXILIAR PARA VERIFICAR SE USUÁRIO É DONO DO MEMBRO
CREATE OR REPLACE FUNCTION is_member_owner(member_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM membros m 
    JOIN users u ON (
      (m.user_id = u.id AND u.id = auth.uid()) OR 
      (m.user_id IS NULL AND m.email = u.email AND u.id = auth.uid())
    )
    WHERE m.id = member_id 
    AND m.status = 'ativo'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. TESTAR AS POLÍTICAS (comandos informativos)
DO $$
BEGIN
  RAISE NOTICE '=== POLÍTICAS RLS ATUALIZADAS ===';
  RAISE NOTICE 'Políticas de balões: Corrigidas para funcionar com user_id NULL';
  RAISE NOTICE 'Políticas de voos: Corrigidas para funcionar com user_id NULL';  
  RAISE NOTICE 'Função auxiliar: is_member_owner() criada';
  RAISE NOTICE 'TESTE: Faça login como piloto e tente cadastrar um balão';
  RAISE NOTICE '================================';
END $$;

-- 6. Log da migração
INSERT INTO logs_atividade (acao, detalhes) VALUES 
('fix_rls_policies_user_id', jsonb_build_object(
  'descricao', 'Corrigidas políticas RLS para funcionar com user_id NULL',
  'tabelas_afetadas', '["baloes", "voos"]',
  'politicas_recriadas', 9,
  'funcao_auxiliar', 'is_member_owner',
  'data_criacao', NOW()
));