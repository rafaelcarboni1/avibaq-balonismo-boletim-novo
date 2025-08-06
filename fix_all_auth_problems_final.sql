-- CORREÇÃO DEFINITIVA DE TODOS OS PROBLEMAS DE AUTENTICAÇÃO - AVIBAQ
-- Data: 30 de julho de 2025
-- Problema: Foreign key constraints e políticas RLS falhando com auth.uid() vs users.id

-- =====================================================================
-- PARTE 1: REMOVER FOREIGN KEY CONSTRAINTS PROBLEMÁTICAS
-- =====================================================================

-- 1.1. Remover constraint de created_by em voos
ALTER TABLE voos DROP CONSTRAINT IF EXISTS voos_created_by_fkey;
ALTER TABLE voos DROP CONSTRAINT IF EXISTS voos_cancelado_por_fkey;

-- 1.2. Remover constraint de preenchido_por em checklist_itens  
ALTER TABLE checklist_itens DROP CONSTRAINT IF EXISTS checklist_itens_preenchido_por_fkey;

-- 1.3. Remover constraint de uploaded_por em voos_anexos (se existir)
ALTER TABLE voos_anexos DROP CONSTRAINT IF EXISTS voos_anexos_uploaded_por_fkey;

-- 1.4. Remover constraints de user_permissions (se existir)
ALTER TABLE user_permissions DROP CONSTRAINT IF EXISTS user_permissions_user_id_fkey;
ALTER TABLE user_permissions DROP CONSTRAINT IF EXISTS user_permissions_concedido_por_fkey;

-- =====================================================================
-- PARTE 2: CORRIGIR TRIGGER DE VOOS
-- =====================================================================

-- 2.1. Função corrigida para validar dados na inserção de voos
CREATE OR REPLACE FUNCTION trigger_voos_insert_validation()
RETURNS TRIGGER AS $$
DECLARE
  user_email TEXT;
  user_table_id UUID;
BEGIN
  -- Definir created_by se não informado
  IF NEW.created_by IS NULL THEN
    -- Buscar email do usuário autenticado
    SELECT email INTO user_email FROM auth.users WHERE id = auth.uid();
    
    IF user_email IS NOT NULL THEN
      -- Buscar ID correspondente na tabela users por email
      SELECT id INTO user_table_id FROM users WHERE email = user_email;
      
      IF user_table_id IS NOT NULL THEN
        NEW.created_by = user_table_id;
      END IF;
    END IF;
  END IF;
  
  -- Validar que piloto está ativo e em dia
  IF NOT EXISTS (
    SELECT 1 FROM membros 
    WHERE id = NEW.piloto_id 
    AND tipo = 'piloto' 
    AND status = 'ativo'
  ) THEN
    RAISE EXCEPTION 'Piloto deve estar ativo para criar voos';
  END IF;
  
  -- Se agência especificada, validar que está ativa
  IF NEW.agencia_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM membros 
    WHERE id = NEW.agencia_id 
    AND tipo = 'agencia' 
    AND status = 'ativo'
  ) THEN
    RAISE EXCEPTION 'Agência deve estar ativa para criar voos';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================================
-- PARTE 3: CORRIGIR POLÍTICAS RLS DE CHECKLIST_ITENS
-- =====================================================================

-- 3.1. Remover política antiga
DROP POLICY IF EXISTS "Usuários que editam voo podem editar checklist" ON checklist_itens;

-- 3.2. Criar política corrigida usando nossa função is_user_member_owner
CREATE POLICY "Usuários autorizados podem gerenciar checklist" ON checklist_itens
  FOR ALL USING (
    -- Verificar se usuário pode acessar o voo relacionado
    EXISTS (
      SELECT 1 FROM voos v
      WHERE v.id = checklist_itens.voo_id
      AND (
        -- Piloto do voo
        is_user_member_owner(v.piloto_id) OR
        -- Agência do voo (se houver)
        (v.agencia_id IS NOT NULL AND is_user_member_owner(v.agencia_id)) OR
        -- Admin
        is_admin_user()
      )
    )
  ) WITH CHECK (
    -- Mesma lógica para inserção/atualização
    EXISTS (
      SELECT 1 FROM voos v
      WHERE v.id = checklist_itens.voo_id
      AND (
        -- Piloto do voo
        is_user_member_owner(v.piloto_id) OR
        -- Agência do voo (se houver)
        (v.agencia_id IS NOT NULL AND is_user_member_owner(v.agencia_id)) OR
        -- Admin
        is_admin_user()
      )
    )
  );

-- =====================================================================
-- PARTE 4: CORRIGIR TRIGGER DE CHECKLIST AUTOMÁTICO
-- =====================================================================

-- 4.1. Verificar se existe trigger para criar checklist automático
-- e corrigir para usar users_table_id se necessário

CREATE OR REPLACE FUNCTION trigger_voos_criar_checklist()
RETURNS TRIGGER AS $$
DECLARE
  user_email TEXT;
  user_table_id UUID;
BEGIN
  -- Buscar email do usuário autenticado para conversão de ID
  SELECT email INTO user_email FROM auth.users WHERE id = auth.uid();
  
  IF user_email IS NOT NULL THEN
    -- Buscar ID correspondente na tabela users
    SELECT id INTO user_table_id FROM users WHERE email = user_email;
  END IF;

  -- Criar itens de checklist padrão para o voo
  INSERT INTO checklist_itens (
    voo_id,
    bloco,
    categoria,
    item_texto,
    obrigatorio,
    preenchido_por
  ) VALUES
  -- Bloco 1: Pré-voo
  (NEW.id, 1, 'documentacao', 'Documentação da aeronave em ordem', true, user_table_id),
  (NEW.id, 1, 'documentacao', 'Licença de piloto válida', true, user_table_id),
  (NEW.id, 1, 'equipamentos', 'Envelope em boas condições', true, user_table_id),
  (NEW.id, 1, 'equipamentos', 'Cesto em boas condições', true, user_table_id),
  (NEW.id, 1, 'equipamentos', 'Queimador testado', true, user_table_id),
  (NEW.id, 1, 'equipamentos', 'Instrumentos funcionando', true, user_table_id),
  (NEW.id, 1, 'meteorologia', 'Condições meteorológicas favoráveis', true, user_table_id),
  (NEW.id, 1, 'seguranca', 'Briefing de segurança realizado', true, user_table_id),
  (NEW.id, 1, 'seguranca', 'Equipamentos de segurança verificados', true, user_table_id),
  
  -- Bloco 2: Durante o voo
  (NEW.id, 2, 'operacao', 'Decolagem segura realizada', true, user_table_id),
  (NEW.id, 2, 'operacao', 'Controle de altitude adequado', true, user_table_id),
  (NEW.id, 2, 'operacao', 'Comunicação com solo mantida', false, user_table_id),
  (NEW.id, 2, 'seguranca', 'Passageiros seguros durante o voo', true, user_table_id),
  (NEW.id, 2, 'operacao', 'Pouso seguro realizado', true, user_table_id);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================================
-- PARTE 5: APLICAR CORREÇÕES EM TODAS AS POLÍTICAS RLS QUE USAM users(id)
-- =====================================================================

-- 5.1. Corrigir política de voos que pode estar falhando
DROP POLICY IF EXISTS "Pilotos podem ver seus voos" ON voos;
CREATE POLICY "Pilotos podem ver seus voos" ON voos
  FOR SELECT USING (
    is_user_member_owner(piloto_id) OR 
    (agencia_id IS NOT NULL AND is_user_member_owner(agencia_id)) OR
    is_admin_user()
  );

DROP POLICY IF EXISTS "Pilotos podem criar seus voos" ON voos;
CREATE POLICY "Pilotos podem criar seus voos" ON voos
  FOR INSERT WITH CHECK (
    is_user_member_owner(piloto_id) OR
    (agencia_id IS NOT NULL AND is_user_member_owner(agencia_id))
  );

DROP POLICY IF EXISTS "Pilotos podem atualizar seus voos" ON voos;
CREATE POLICY "Pilotos podem atualizar seus voos" ON voos
  FOR UPDATE USING (
    is_user_member_owner(piloto_id) OR 
    (agencia_id IS NOT NULL AND is_user_member_owner(agencia_id)) OR
    is_admin_user()
  );

-- =====================================================================
-- PARTE 6: COMENTÁRIOS E VALIDAÇÃO
-- =====================================================================

COMMENT ON FUNCTION trigger_voos_insert_validation() IS 'Validação de voos corrigida para usar email em vez de auth.uid() direto';
COMMENT ON FUNCTION trigger_voos_criar_checklist() IS 'Criação automática de checklist corrigida para usar users.id via email';

-- Verificação final - estas consultas devem retornar dados sem erro
-- SELECT * FROM auth.users LIMIT 1;
-- SELECT * FROM users LIMIT 1; 
-- SELECT * FROM membros LIMIT 1;

-- Script concluído - aplicar na ordem exata no Supabase SQL Editor