-- MIGRAÇÃO SEGURA DE DADOS DE AUTENTICAÇÃO - PRESERVA FLUXO DE ASSOCIAÇÃO
-- Resolve user_id NULL sem quebrar novos cadastros
-- Data: 30 de julho de 2025

-- =====================================================================
-- ETAPA 1: ANÁLISE E VALIDAÇÃO PRÉVIA
-- =====================================================================

-- 1.1. Identificar registros problemáticos (apenas para auditoria)
-- Esta query mostra quantos membros têm user_id NULL:
-- SELECT COUNT(*) as membros_sem_user_id FROM membros WHERE user_id IS NULL;

-- 1.2. Identificar membros com email mas sem user_id correspondente:
-- SELECT m.id, m.email, m.nome_completo, m.tipo, m.status 
-- FROM membros m 
-- WHERE m.user_id IS NULL 
--   AND m.email IS NOT NULL 
--   AND NOT EXISTS (SELECT 1 FROM users u WHERE u.email = m.email);

-- =====================================================================
-- ETAPA 2: MIGRAÇÃO CUIDADOSA DOS DADOS EXISTENTES
-- =====================================================================

-- 2.1. PRIMEIRO: Atualizar membros que JÁ TÊM usuário correspondente na tabela users
-- Isso vincula registros existentes sem criar duplicatas
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

-- 2.2. SEGUNDO: Criar usuários na tabela users APENAS para membros sem usuário correspondente
-- Mas SEM criar auth.users (para não interferir no sistema de login)
INSERT INTO users (id, email, nome, role, ativo, primeira_senha, username, created_at)
SELECT 
  gen_random_uuid() as id,
  m.email,
  m.nome_completo,
  CASE 
    WHEN m.tipo = 'piloto' THEN 'piloto'
    WHEN m.tipo = 'agencia' THEN 'agencia'
    ELSE 'piloto'
  END as role,
  CASE WHEN m.status = 'ativo' THEN true ELSE false END as ativo,
  true as primeira_senha, -- Precisará definir senha se quiser logar
  COALESCE(SPLIT_PART(m.email, '@', 1), 'user_' || m.id::text) as username,
  NOW() as created_at
FROM membros m
WHERE m.user_id IS NULL 
  AND m.email IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM users u 
    WHERE u.email = m.email
  );

-- 2.3. TERCEIRO: Atualizar user_id nos membros recém-vinculados
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
-- ETAPA 3: GARANTIR QUE O FLUXO DE ASSOCIAÇÃO CONTINUE FUNCIONANDO
-- =====================================================================

-- 3.1. Verificar se o trigger handle_new_user ainda está ativo
-- (Esta é apenas uma verificação, não uma alteração)
-- SELECT * FROM information_schema.triggers 
-- WHERE trigger_name = 'on_auth_user_created';

-- 3.2. Verificar se a API route create-user-profile ainda funciona
-- (Não fazemos alterações aqui)

-- =====================================================================
-- ETAPA 4: FUNÇÕES AUXILIARES MELHORADAS (MAS COMPATÍVEIS)
-- =====================================================================

-- 4.1. Função que funciona tanto para usuários existentes quanto novos
CREATE OR REPLACE FUNCTION is_member_owner_compatible(membro_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  current_user_id UUID;
  current_user_email TEXT;
BEGIN
  -- Tentar primeiro o método direto (mais rápido para usuários com user_id correto)
  IF EXISTS (
    SELECT 1 FROM membros m
    WHERE m.id = membro_id 
      AND m.user_id = auth.uid()
      AND m.status = 'ativo'
  ) THEN
    RETURN TRUE;
  END IF;
  
  -- Fallback por email (para casos onde user_id ainda não foi vinculado)
  SELECT email INTO current_user_email FROM auth.users WHERE id = auth.uid();
  
  IF current_user_email IS NOT NULL THEN
    RETURN EXISTS (
      SELECT 1 FROM membros m
      WHERE m.id = membro_id 
        AND m.email = current_user_email
        AND m.status = 'ativo'
    );
  END IF;
  
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4.2. Função de admin compatível
CREATE OR REPLACE FUNCTION is_admin_compatible()
RETURNS BOOLEAN AS $$
DECLARE
  current_user_email TEXT;
BEGIN
  -- Tentar primeiro método direto
  IF EXISTS (
    SELECT 1 FROM users u
    WHERE u.id = auth.uid() 
      AND u.role IN ('admin', 'meteo', 'tesouraria')
      AND u.ativo = true
  ) THEN
    RETURN TRUE;
  END IF;
  
  -- Fallback por email
  SELECT email INTO current_user_email FROM auth.users WHERE id = auth.uid();
  
  IF current_user_email IS NOT NULL THEN
    RETURN EXISTS (
      SELECT 1 FROM users u
      WHERE u.email = current_user_email
        AND u.role IN ('admin', 'meteo', 'tesouraria')
        AND u.ativo = true
    );
  END IF;
  
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================================
-- ETAPA 5: POLÍTICAS RLS COMPATÍVEIS COM NOVOS E ANTIGOS USUÁRIOS
-- =====================================================================

-- 5.1. Política para balões (compatível com ambos os fluxos)
DROP POLICY IF EXISTS "Proprietários podem ver seus balões" ON baloes;
CREATE POLICY "Proprietários podem ver seus balões" ON baloes
  FOR SELECT USING (
    is_member_owner_compatible(proprietario_id) OR is_admin_compatible()
  );

DROP POLICY IF EXISTS "Proprietários podem criar balões" ON baloes;
CREATE POLICY "Proprietários podem criar balões" ON baloes
  FOR INSERT WITH CHECK (
    is_member_owner_compatible(proprietario_id)
  );

DROP POLICY IF EXISTS "Proprietários podem atualizar seus balões" ON baloes;
CREATE POLICY "Proprietários podem atualizar seus balões" ON baloes
  FOR UPDATE USING (
    is_member_owner_compatible(proprietario_id) OR is_admin_compatible()
  );

-- 5.2. Política para voos (compatível)
DROP POLICY IF EXISTS "Pilotos podem ver seus voos" ON voos;
CREATE POLICY "Pilotos podem ver seus voos" ON voos
  FOR SELECT USING (
    is_member_owner_compatible(piloto_id) OR 
    (agencia_id IS NOT NULL AND is_member_owner_compatible(agencia_id)) OR
    is_admin_compatible()
  );

DROP POLICY IF EXISTS "Pilotos podem criar seus voos" ON voos;
CREATE POLICY "Pilotos podem criar seus voos" ON voos
  FOR INSERT WITH CHECK (
    is_member_owner_compatible(piloto_id)
  );

DROP POLICY IF EXISTS "Pilotos podem atualizar seus voos" ON voos;
CREATE POLICY "Pilotos podem atualizar seus voos" ON voos
  FOR UPDATE USING (
    is_member_owner_compatible(piloto_id) OR 
    (agencia_id IS NOT NULL AND is_member_owner_compatible(agencia_id)) OR
    is_admin_compatible()
  );

-- 5.3. Política para checklist (compatível)
DROP POLICY IF EXISTS "Usuários podem gerenciar checklist de seus voos" ON checklist_itens;
DROP POLICY IF EXISTS "Usuários autorizados podem gerenciar checklist" ON checklist_itens;
DROP POLICY IF EXISTS "Usuários que editam voo podem editar checklist" ON checklist_itens;

CREATE POLICY "Usuários podem gerenciar checklist" ON checklist_itens
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM voos v
      WHERE v.id = checklist_itens.voo_id
        AND (
          is_member_owner_compatible(v.piloto_id) OR
          (v.agencia_id IS NOT NULL AND is_member_owner_compatible(v.agencia_id)) OR
          is_admin_compatible()
        )
    )
  );

-- 5.4. Política para vínculos (compatível)
DROP POLICY IF EXISTS "Agências podem ver seus vínculos" ON vinculos_agencia_piloto;
CREATE POLICY "Agências podem ver seus vínculos" ON vinculos_agencia_piloto
  FOR SELECT USING (
    is_member_owner_compatible(agencia_id) OR 
    is_member_owner_compatible(piloto_id) OR 
    is_admin_compatible()
  );

DROP POLICY IF EXISTS "Agências podem criar vínculos" ON vinculos_agencia_piloto;
CREATE POLICY "Agências podem criar vínculos" ON vinculos_agencia_piloto
  FOR INSERT WITH CHECK (
    is_member_owner_compatible(agencia_id)
  );

-- =====================================================================
-- ETAPA 6: CORREÇÃO DO TRIGGER DE VOOS (SEM QUEBRAR NADA)
-- =====================================================================

-- 6.1. Trigger corrigido que funciona em ambos os cenários
CREATE OR REPLACE FUNCTION trigger_voos_insert_validation()
RETURNS TRIGGER AS $$
DECLARE
  user_email TEXT;
  user_table_id UUID;
BEGIN
  -- Se created_by não foi definido, tentar definir
  IF NEW.created_by IS NULL THEN
    -- Primeiro: tentar buscar diretamente na tabela users por auth.uid()
    SELECT id INTO user_table_id FROM users WHERE id = auth.uid();
    
    IF user_table_id IS NOT NULL THEN
      NEW.created_by = user_table_id;
    ELSE
      -- Fallback: buscar por email se não encontrou direto
      SELECT email INTO user_email FROM auth.users WHERE id = auth.uid();
      
      IF user_email IS NOT NULL THEN
        SELECT id INTO user_table_id FROM users WHERE email = user_email;
        
        IF user_table_id IS NOT NULL THEN
          NEW.created_by = user_table_id;
        END IF;
      END IF;
    END IF;
  END IF;
  
  -- Validações existentes (mantidas)
  IF NOT EXISTS (
    SELECT 1 FROM membros 
    WHERE id = NEW.piloto_id 
    AND tipo = 'piloto' 
    AND status = 'ativo'
  ) THEN
    RAISE EXCEPTION 'Piloto deve estar ativo para criar voos';
  END IF;
  
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
-- ETAPA 7: CORREÇÃO DO TRIGGER DE CHECKLIST (SEM QUEBRAR NADA)
-- =====================================================================

-- 7.1. Trigger de checklist que não gera problemas de foreign key
CREATE OR REPLACE FUNCTION trigger_voos_criar_checklist()
RETURNS TRIGGER AS $$
DECLARE
  user_table_id UUID;
  user_email TEXT;
BEGIN
  -- Tentar identificar o user_id para preenchido_por (opcional)
  SELECT id INTO user_table_id FROM users WHERE id = auth.uid();
  
  IF user_table_id IS NULL THEN
    -- Fallback por email
    SELECT email INTO user_email FROM auth.users WHERE id = auth.uid();
    IF user_email IS NOT NULL THEN
      SELECT id INTO user_table_id FROM users WHERE email = user_email;
    END IF;
  END IF;

  -- Criar itens de checklist (preenchido_por pode ser NULL se não conseguir determinar)
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
-- ETAPA 8: PERMISSÕES E COMENTÁRIOS
-- =====================================================================

GRANT EXECUTE ON FUNCTION is_member_owner_compatible(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION is_admin_compatible() TO authenticated;

COMMENT ON FUNCTION is_member_owner_compatible(UUID) IS 'Verificação de propriedade compatível com usuários existentes e novos cadastros';
COMMENT ON FUNCTION is_admin_compatible() IS 'Verificação de admin compatível com usuários existentes e novos cadastros';
COMMENT ON FUNCTION trigger_voos_insert_validation() IS 'Trigger de validação de voos compatível com ambos os fluxos de usuário';
COMMENT ON FUNCTION trigger_voos_criar_checklist() IS 'Trigger de criação de checklist que não quebra foreign keys';

-- =====================================================================
-- ETAPA 9: VALIDAÇÃO FINAL
-- =====================================================================

-- Estas queries devem mostrar a melhoria nos dados:

-- Verificar quantos membros ainda têm user_id NULL:
-- SELECT COUNT(*) as membros_sem_user_id FROM membros WHERE user_id IS NULL;

-- Verificar se todos os user_id são válidos:
-- SELECT COUNT(*) as user_ids_invalidos 
-- FROM membros m 
-- WHERE m.user_id IS NOT NULL 
--   AND NOT EXISTS (SELECT 1 FROM users u WHERE u.id = m.user_id);

-- =====================================================================
-- RESUMO DO QUE ESTA MIGRAÇÃO FAZ:
-- =====================================================================

-- ✅ Resolve user_id NULL em membros existentes
-- ✅ Cria registros users para membros sem usuário (SEM afetar auth.users)
-- ✅ Mantém o fluxo de associação intacto (trigger + API route)
-- ✅ Políticas RLS funcionam para usuários antigos E novos
-- ✅ Triggers corrigidos para não gerar foreign key errors
-- ✅ Sistema compatível com ambos os cenários

-- IMPORTANTE: Esta migração NÃO afeta:
-- - O processo de signup via auth.signUp()
-- - O trigger handle_new_user() 
-- - A API route create-user-profile
-- - O fluxo normal de criação de membros

-- Script concluído - aplicar com segurança!