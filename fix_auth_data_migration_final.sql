-- MIGRAÇÃO DEFINITIVA PARA CORRIGIR DADOS DE AUTENTICAÇÃO
-- Resolve user_id NULL na tabela membros
-- Data: 30 de julho de 2025

-- =====================================================================
-- ETAPA 1: MIGRAÇÃO DE DADOS - POPULAR user_id NA TABELA MEMBROS
-- =====================================================================

-- 1.1. Atualizar membros que têm email correspondente na tabela users
UPDATE membros 
SET user_id = (
  SELECT u.id 
  FROM users u 
  WHERE u.email = membros.email 
  LIMIT 1
)
WHERE user_id IS NULL 
  AND email IS NOT NULL 
  AND EXISTS (
    SELECT 1 FROM users u 
    WHERE u.email = membros.email
  );

-- 1.2. Criar usuários faltantes para membros sem user_id
INSERT INTO users (id, email, nome, role, ativo, primeira_senha)
SELECT 
  gen_random_uuid(),
  m.email,
  m.nome_completo,
  CASE 
    WHEN m.tipo = 'piloto' THEN 'pilot'
    WHEN m.tipo = 'agencia' THEN 'agency'
    ELSE 'pilot'
  END as role,
  CASE WHEN m.status = 'ativo' THEN true ELSE false END,
  true -- Precisará definir senha
FROM membros m
WHERE m.user_id IS NULL 
  AND m.email IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM users u 
    WHERE u.email = m.email
  );

-- 1.3. Atualizar user_id nos membros recém-criados
UPDATE membros 
SET user_id = (
  SELECT u.id 
  FROM users u 
  WHERE u.email = membros.email 
  LIMIT 1
)
WHERE user_id IS NULL 
  AND email IS NOT NULL;

-- =====================================================================
-- ETAPA 2: SIMPLIFICAR POLÍTICAS RLS PARA USAR user_id DIRETO
-- =====================================================================

-- 2.1. Função simplificada para verificar propriedade de membro
CREATE OR REPLACE FUNCTION is_member_owner_direct(membro_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM membros m
    WHERE m.id = membro_id 
      AND m.user_id = auth.uid()
      AND m.status = 'ativo'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2.2. Função simplificada para verificar admin
CREATE OR REPLACE FUNCTION is_admin_direct()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users u
    WHERE u.id = auth.uid() 
      AND u.role IN ('admin', 'meteo', 'tesouraria')
      AND u.ativo = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================================
-- ETAPA 3: ATUALIZAR POLÍTICAS RLS PARA SEREM MAIS EFICIENTES
-- =====================================================================

-- 3.1. Política simplificada para balões
DROP POLICY IF EXISTS "Proprietários podem ver seus balões" ON baloes;
CREATE POLICY "Proprietários podem ver seus balões" ON baloes
  FOR SELECT USING (
    is_member_owner_direct(proprietario_id) OR is_admin_direct()
  );

DROP POLICY IF EXISTS "Proprietários podem criar balões" ON baloes;
CREATE POLICY "Proprietários podem criar balões" ON baloes
  FOR INSERT WITH CHECK (
    is_member_owner_direct(proprietario_id)
  );

-- 3.2. Política simplificada para voos
DROP POLICY IF EXISTS "Pilotos podem ver seus voos" ON voos;
CREATE POLICY "Pilotos podem ver seus voos" ON voos
  FOR SELECT USING (
    is_member_owner_direct(piloto_id) OR 
    (agencia_id IS NOT NULL AND is_member_owner_direct(agencia_id)) OR
    is_admin_direct()
  );

DROP POLICY IF EXISTS "Pilotos podem criar seus voos" ON voos;
CREATE POLICY "Pilotos podem criar seus voos" ON voos
  FOR INSERT WITH CHECK (
    is_member_owner_direct(piloto_id)
  );

-- 3.3. Política simplificada para checklist_itens
DROP POLICY IF EXISTS "Usuários autorizados podem gerenciar checklist" ON checklist_itens;
DROP POLICY IF EXISTS "Usuários que editam voo podem editar checklist" ON checklist_itens;

CREATE POLICY "Usuários podem gerenciar checklist de seus voos" ON checklist_itens
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM voos v
      WHERE v.id = checklist_itens.voo_id
        AND (
          is_member_owner_direct(v.piloto_id) OR
          (v.agencia_id IS NOT NULL AND is_member_owner_direct(v.agencia_id)) OR
          is_admin_direct()
        )
    )
  );

-- 3.4. Política simplificada para vínculos
DROP POLICY IF EXISTS "Agências podem ver seus vínculos" ON vinculos_agencia_piloto;
CREATE POLICY "Agências podem ver seus vínculos" ON vinculos_agencia_piloto
  FOR SELECT USING (
    is_member_owner_direct(agencia_id) OR 
    is_member_owner_direct(piloto_id) OR 
    is_admin_direct()
  );

DROP POLICY IF EXISTS "Agências podem criar vínculos" ON vinculos_agencia_piloto;
CREATE POLICY "Agências podem criar vínculos" ON vinculos_agencia_piloto
  FOR INSERT WITH CHECK (
    is_member_owner_direct(agencia_id)
  );

-- =====================================================================
-- ETAPA 4: CORRIGIR TRIGGER DE CRIAÇÃO DE CHECKLIST
-- =====================================================================

-- 4.1. Trigger simplificado que não depende de conversão de IDs
CREATE OR REPLACE FUNCTION trigger_voos_criar_checklist()
RETURNS TRIGGER AS $$
BEGIN
  -- Criar itens de checklist padrão - sem especificar preenchido_por
  -- Será preenchido quando o usuário marcar os itens
  INSERT INTO checklist_itens (
    voo_id,
    bloco,
    categoria,
    item_texto,
    obrigatorio
  ) VALUES
  -- Bloco 1: Pré-voo
  (NEW.id, 1, 'documentacao', 'Documentação da aeronave em ordem', true),
  (NEW.id, 1, 'documentacao', 'Licença de piloto válida', true),
  (NEW.id, 1, 'equipamentos', 'Envelope em boas condições', true),
  (NEW.id, 1, 'equipamentos', 'Cesto em boas condições', true),
  (NEW.id, 1, 'equipamentos', 'Queimador testado', true),
  (NEW.id, 1, 'equipamentos', 'Instrumentos funcionando', true),
  (NEW.id, 1, 'meteorologia', 'Condições meteorológicas favoráveis', true),
  (NEW.id, 1, 'seguranca', 'Briefing de segurança realizado', true),
  (NEW.id, 1, 'seguranca', 'Equipamentos de segurança verificados', true),
  
  -- Bloco 2: Durante o voo
  (NEW.id, 2, 'operacao', 'Decolagem segura realizada', true),
  (NEW.id, 2, 'operacao', 'Controle de altitude adequado', true),
  (NEW.id, 2, 'operacao', 'Comunicação com solo mantida', false),
  (NEW.id, 2, 'seguranca', 'Passageiros seguros durante o voo', true),
  (NEW.id, 2, 'operacao', 'Pouso seguro realizado', true);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================================
-- ETAPA 5: GARANTIR PERMISSÕES E COMENTÁRIOS
-- =====================================================================

GRANT EXECUTE ON FUNCTION is_member_owner_direct(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION is_admin_direct() TO authenticated;

COMMENT ON FUNCTION is_member_owner_direct(UUID) IS 'Verificação direta de propriedade via user_id - mais eficiente';
COMMENT ON FUNCTION is_admin_direct() IS 'Verificação direta de admin via user_id - mais eficiente';

-- =====================================================================
-- ETAPA 6: VALIDAÇÃO DOS DADOS MIGRADOS
-- =====================================================================

-- Estas queries devem retornar 0 se a migração foi bem-sucedida:

-- Verificar se ainda há membros sem user_id
-- SELECT COUNT(*) as membros_sem_user_id FROM membros WHERE user_id IS NULL;

-- Verificar se todos os user_id existem na tabela users
-- SELECT COUNT(*) as user_ids_invalidos 
-- FROM membros m 
-- WHERE m.user_id IS NOT NULL 
--   AND NOT EXISTS (SELECT 1 FROM users u WHERE u.id = m.user_id);

-- Script concluído - dados limpos, políticas eficientes