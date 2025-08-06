-- CORREÇÃO DAS POLÍTICAS RLS DA TABELA VOOS_BALOES
-- Data: 31 de julho de 2025
-- Problema: Políticas de voos_baloes não foram atualizadas na migração anterior

-- =====================================================================
-- ETAPA 1: REMOVER POLÍTICAS ANTIGAS INCOMPATÍVEIS
-- =====================================================================

-- Remover todas as políticas existentes da tabela voos_baloes
DROP POLICY IF EXISTS "Usuários que veem voo podem ver balões" ON voos_baloes;
DROP POLICY IF EXISTS "Usuários que editam voo podem editar balões" ON voos_baloes;
DROP POLICY IF EXISTS "Balão deve pertencer ao responsável do voo" ON voos_baloes;

-- =====================================================================
-- ETAPA 2: CRIAR POLÍTICAS COMPATÍVEIS COM AS NOVAS FUNÇÕES
-- =====================================================================

-- 2.1. Política para SELECT (ver balões dos voos que o usuário pode ver)
CREATE POLICY "Usuários podem ver balões de seus voos" ON voos_baloes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM voos v
      WHERE v.id = voos_baloes.voo_id
        AND (
          is_member_owner_compatible(v.piloto_id) OR 
          (v.agencia_id IS NOT NULL AND is_member_owner_compatible(v.agencia_id)) OR
          is_admin_compatible()
        )
    )
  );

-- 2.2. Política para INSERT (criar associações de balões)
CREATE POLICY "Usuários podem associar balões aos seus voos" ON voos_baloes
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM voos v
      WHERE v.id = voos_baloes.voo_id
        AND (
          is_member_owner_compatible(v.piloto_id) OR 
          (v.agencia_id IS NOT NULL AND is_member_owner_compatible(v.agencia_id))
        )
    )
    AND
    -- Validar que balão pertence ao mesmo proprietário do voo
    EXISTS (
      SELECT 1 FROM voos v
      JOIN baloes b ON b.id = voos_baloes.balao_id
      WHERE v.id = voos_baloes.voo_id
        AND (
          -- Balão pertence ao piloto
          b.proprietario_id = v.piloto_id
          OR 
          -- Balão pertence à agência (se houver)
          (v.agencia_id IS NOT NULL AND b.proprietario_id = v.agencia_id)
        )
    )
  );

-- 2.3. Política para UPDATE (atualizar dados dos balões nos voos)
CREATE POLICY "Usuários podem atualizar balões de seus voos" ON voos_baloes
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM voos v
      WHERE v.id = voos_baloes.voo_id
        AND (
          is_member_owner_compatible(v.piloto_id) OR 
          (v.agencia_id IS NOT NULL AND is_member_owner_compatible(v.agencia_id)) OR
          is_admin_compatible()
        )
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1 FROM voos v
      WHERE v.id = voos_baloes.voo_id
        AND (
          is_member_owner_compatible(v.piloto_id) OR 
          (v.agencia_id IS NOT NULL AND is_member_owner_compatible(v.agencia_id))
        )
    )
    AND
    -- Validar que balão pertence ao mesmo proprietário do voo
    EXISTS (
      SELECT 1 FROM voos v
      JOIN baloes b ON b.id = voos_baloes.balao_id
      WHERE v.id = voos_baloes.voo_id
        AND (
          -- Balão pertence ao piloto
          b.proprietario_id = v.piloto_id
          OR 
          -- Balão pertence à agência (se houver)
          (v.agencia_id IS NOT NULL AND b.proprietario_id = v.agencia_id)
        )
    )
  );

-- 2.4. Política para DELETE (remover balões dos voos)
CREATE POLICY "Usuários podem remover balões de seus voos" ON voos_baloes
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM voos v
      WHERE v.id = voos_baloes.voo_id
        AND (
          is_member_owner_compatible(v.piloto_id) OR 
          (v.agencia_id IS NOT NULL AND is_member_owner_compatible(v.agencia_id)) OR
          is_admin_compatible()
        )
    )
  );

-- =====================================================================
-- ETAPA 3: COMENTÁRIOS E DOCUMENTAÇÃO
-- =====================================================================

COMMENT ON POLICY "Usuários podem ver balões de seus voos" ON voos_baloes IS 
  'Permite visualizar balões apenas dos voos que o usuário tem permissão para ver';

COMMENT ON POLICY "Usuários podem associar balões aos seus voos" ON voos_baloes IS 
  'Permite associar balões apenas aos próprios voos e apenas balões que pertencem ao usuário';

COMMENT ON POLICY "Usuários podem atualizar balões de seus voos" ON voos_baloes IS 
  'Permite atualizar dados dos balões apenas nos próprios voos';

COMMENT ON POLICY "Usuários podem remover balões de seus voos" ON voos_baloes IS 
  'Permite remover balões apenas dos próprios voos';

-- =====================================================================
-- ETAPA 4: VALIDAÇÃO
-- =====================================================================

-- Estas queries podem ser usadas para testar após a aplicação:

-- Verificar se as políticas foram criadas corretamente:
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
-- FROM pg_policies 
-- WHERE tablename = 'voos_baloes';

-- Testar se usuário consegue ver voos_baloes de seus próprios voos:
-- SELECT vb.* FROM voos_baloes vb 
-- JOIN voos v ON v.id = vb.voo_id 
-- WHERE v.piloto_id IN (SELECT id FROM membros WHERE user_id = auth.uid());

-- =====================================================================
-- RESUMO DA CORREÇÃO:
-- =====================================================================

-- ✅ Remove políticas antigas que só verificavam existência do voo
-- ✅ Cria políticas que usam as mesmas funções compatíveis de auth
-- ✅ Mantém validação de propriedade dos balões 
-- ✅ Separa políticas por operação (SELECT, INSERT, UPDATE, DELETE)
-- ✅ Inclui admins nas permissões de visualização
-- ✅ Usa fallback por email igual às outras tabelas

-- Esta correção resolve o erro: "new row violates row-level security policy for table voos_baloes"