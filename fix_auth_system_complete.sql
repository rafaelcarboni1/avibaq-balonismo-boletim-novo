-- CORREÇÃO COMPLETA DO SISTEMA DE AUTENTICAÇÃO AVIBAQ
-- Data: 31 de julho de 2025
-- Objetivo: Resolver todos os problemas identificados no diagnóstico
-- EXECUTAR EM ORDEM - NÃO PULAR ETAPAS

-- =====================================================================
-- FASE 1: ESTABILIZAÇÃO IMEDIATA (EXECUTAR PRIMEIRO)
-- =====================================================================

-- 1.1. Habilitar RLS nas tabelas vulneráveis
ALTER TABLE voos ENABLE ROW LEVEL SECURITY;
ALTER TABLE permissoes ENABLE ROW LEVEL SECURITY;

-- 1.2. Criar função para corrigir usuários órfãos
CREATE OR REPLACE FUNCTION fix_orphaned_auth_users()
RETURNS TABLE(fixed_count INTEGER, error_count INTEGER, orphaned_emails TEXT[]) AS $$
DECLARE
  v_fixed_count INTEGER := 0;
  v_error_count INTEGER := 0;
  v_orphaned_emails TEXT[] := '{}';
  auth_user RECORD;
BEGIN
  RAISE NOTICE 'Iniciando correção de usuários órfãos...';
  
  -- Encontrar usuários em auth.users sem registro em public.users
  FOR auth_user IN 
    SELECT au.id, au.email, au.created_at
    FROM auth.users au
    LEFT JOIN public.users pu ON pu.auth_id = au.id
    WHERE pu.auth_id IS NULL
    ORDER BY au.created_at
  LOOP
    BEGIN
      RAISE NOTICE 'Corrigindo usuário órfão: %', auth_user.email;
      
      -- Tentar criar registro em public.users
      INSERT INTO public.users (auth_id, email, nome, role, ativo, created_at)
      VALUES (
        auth_user.id, 
        auth_user.email, 
        COALESCE(SPLIT_PART(auth_user.email, '@', 1), ''), -- Nome baseado no email
        'piloto', -- Role padrão
        true, 
        auth_user.created_at
      );
      
      v_fixed_count := v_fixed_count + 1;
      v_orphaned_emails := array_append(v_orphaned_emails, auth_user.email);
      
    EXCEPTION WHEN OTHERS THEN
      v_error_count := v_error_count + 1;
      RAISE NOTICE 'ERRO ao corrigir usuário %: %', auth_user.email, SQLERRM;
    END;
  END LOOP;
  
  RAISE NOTICE 'Correção concluída. Corrigidos: %, Erros: %', v_fixed_count, v_error_count;
  RETURN QUERY SELECT v_fixed_count, v_error_count, v_orphaned_emails;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 1.3. Executar correção de usuários órfãos
SELECT * FROM fix_orphaned_auth_users();

-- =====================================================================
-- FASE 2: TRIGGER DE SINCRONIZAÇÃO AUTOMÁTICA
-- =====================================================================

-- 2.1. Função para sincronizar novos usuários automaticamente
CREATE OR REPLACE FUNCTION handle_new_user_signup()
RETURNS TRIGGER AS $$
BEGIN
  RAISE NOTICE 'Novo usuário detectado: %', NEW.email;
  
  -- Criar registro em public.users quando usuário se cadastra em auth.users
  INSERT INTO public.users (auth_id, email, nome, role, ativo, created_at)
  VALUES (
    NEW.id, 
    NEW.email, 
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name', 
      SPLIT_PART(NEW.email, '@', 1)
    ), 
    'piloto',  -- Role padrão
    true, 
    NOW()
  )
  ON CONFLICT (auth_id) DO UPDATE SET
    email = NEW.email,
    updated_at = NOW();
  
  RAISE NOTICE 'Usuário sincronizado com public.users: %', NEW.email;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'ERRO na sincronização do usuário %: %', NEW.email, SQLERRM;
  RETURN NEW; -- Não bloquear cadastro mesmo se sincronização falhar
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2.2. Criar trigger para sincronização automática
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user_signup();

-- =====================================================================
-- FASE 3: CORREÇÃO DAS FUNÇÕES RLS
-- =====================================================================

-- 3.1. Função otimizada para verificar autorização usando auth_id
CREATE OR REPLACE FUNCTION is_user_authorized(target_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  current_user_uuid UUID;
  current_user_role TEXT;
BEGIN
  -- Buscar UUID e role do usuário atual
  SELECT id, role INTO current_user_uuid, current_user_role
  FROM public.users 
  WHERE auth_id = auth.uid();
  
  -- Se não encontrou usuário, negar acesso
  IF current_user_uuid IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Admins têm acesso total
  IF current_user_role IN ('admin', 'meteo', 'tesouraria') THEN
    RETURN TRUE;
  END IF;
  
  -- Usuário pode acessar próprios dados
  IF current_user_uuid = target_user_id THEN
    RETURN TRUE;
  END IF;
  
  -- Verificar se é agência que pode ver piloto contratado
  IF current_user_role = 'agencia' THEN
    RETURN EXISTS (
      SELECT 1 FROM vinculos_agencia_piloto vap
      WHERE vap.agencia_id = current_user_uuid 
        AND vap.piloto_id = target_user_id
        AND vap.status = 'aceito'
    );
  END IF;
  
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3.2. Função para verificar se é admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users 
    WHERE auth_id = auth.uid() 
      AND role IN ('admin', 'meteo', 'tesouraria')
      AND ativo = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================================
-- FASE 4: POLÍTICAS RLS CORRIGIDAS
-- =====================================================================

-- 4.1. Política para tabela voos
DROP POLICY IF EXISTS "Usuários podem ver seus voos" ON voos;
CREATE POLICY "Usuários podem ver seus voos" ON voos
  FOR SELECT USING (
    is_user_authorized(piloto_id) OR 
    (agencia_id IS NOT NULL AND is_user_authorized(agencia_id)) OR
    is_admin()
  );

DROP POLICY IF EXISTS "Usuários podem criar voos" ON voos;
CREATE POLICY "Usuários podem criar voos" ON voos
  FOR INSERT WITH CHECK (
    is_user_authorized(piloto_id)
  );

DROP POLICY IF EXISTS "Usuários podem atualizar seus voos" ON voos;
CREATE POLICY "Usuários podem atualizar seus voos" ON voos
  FOR UPDATE USING (
    is_user_authorized(piloto_id) OR 
    (agencia_id IS NOT NULL AND is_user_authorized(agencia_id)) OR
    is_admin()
  );

DROP POLICY IF EXISTS "Usuários podem deletar seus voos" ON voos;
CREATE POLICY "Usuários podem deletar seus voos" ON voos
  FOR DELETE USING (
    is_user_authorized(piloto_id) OR is_admin()
  );

-- 4.2. Política para tabela permissoes
DROP POLICY IF EXISTS "Apenas admins podem ver permissões" ON permissoes;
CREATE POLICY "Apenas admins podem ver permissões" ON permissoes
  FOR ALL USING (is_admin());

-- 4.3. Política para checklist_itens
DROP POLICY IF EXISTS "Usuários podem gerenciar checklist" ON checklist_itens;
CREATE POLICY "Usuários podem gerenciar checklist" ON checklist_itens
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM voos v
      WHERE v.id = checklist_itens.voo_id
        AND (
          is_user_authorized(v.piloto_id) OR
          (v.agencia_id IS NOT NULL AND is_user_authorized(v.agencia_id)) OR
          is_admin()
        )
    )
  );

-- =====================================================================
-- FASE 5: TRIGGERS CORRIGIDOS
-- =====================================================================

-- 5.1. Trigger de checklist corrigido
CREATE OR REPLACE FUNCTION trigger_voos_criar_checklist()
RETURNS TRIGGER AS $$
DECLARE
  current_user_id UUID;
BEGIN
  -- Buscar ID do usuário atual na tabela users usando auth.uid()
  SELECT id INTO current_user_id 
  FROM public.users 
  WHERE auth_id = auth.uid();
  
  RAISE NOTICE 'Criando checklist para voo % por usuário %', NEW.id, current_user_id;
  
  -- Criar itens de checklist (sem foreign key obrigatória em preenchido_por)
  INSERT INTO checklist_itens (
    voo_id, bloco, categoria, item_texto, obrigatorio, preenchido_por
  ) VALUES
  -- Bloco 1: Pré-voo
  (NEW.id, 1, 'documentacao', 'Documentação da aeronave em ordem', true, current_user_id),
  (NEW.id, 1, 'documentacao', 'Licença de piloto válida', true, current_user_id),
  (NEW.id, 1, 'equipamentos', 'Envelope em boas condições', true, current_user_id),
  (NEW.id, 1, 'equipamentos', 'Cesto em boas condições', true, current_user_id),
  (NEW.id, 1, 'equipamentos', 'Queimador testado', true, current_user_id),
  (NEW.id, 1, 'equipamentos', 'Instrumentos funcionando', true, current_user_id),
  (NEW.id, 1, 'meteorologia', 'Condições meteorológicas favoráveis', true, current_user_id),
  (NEW.id, 1, 'seguranca', 'Briefing de segurança realizado', true, current_user_id),
  (NEW.id, 1, 'seguranca', 'Equipamentos de segurança verificados', true, current_user_id),
  
  -- Bloco 2: Durante o voo
  (NEW.id, 2, 'operacao', 'Decolagem segura realizada', true, current_user_id),
  (NEW.id, 2, 'operacao', 'Controle de altitude adequado', true, current_user_id),
  (NEW.id, 2, 'operacao', 'Comunicação com solo mantida', false, current_user_id),
  (NEW.id, 2, 'seguranca', 'Passageiros seguros durante o voo', true, current_user_id),
  (NEW.id, 2, 'operacao', 'Pouso seguro realizado', true, current_user_id),
  
  -- Bloco 3: Pós-voo
  (NEW.id, 3, 'operacao', 'Equipamentos recolhidos adequadamente', true, current_user_id),
  (NEW.id, 3, 'operacao', 'Área de pouso limpa', true, current_user_id),
  (NEW.id, 3, 'documentacao', 'Relatório de voo preenchido', true, current_user_id);

  RAISE NOTICE 'Checklist criado com sucesso para voo %', NEW.id;
  RETURN NEW;
  
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'ERRO ao criar checklist para voo %: %', NEW.id, SQLERRM;
  RETURN NEW; -- Não bloquear criação do voo
END;
$$ LANGUAGE plpgsql;

-- 5.2. Recriar trigger
DROP TRIGGER IF EXISTS trigger_voos_criar_checklist ON voos;
CREATE TRIGGER trigger_voos_criar_checklist
  AFTER INSERT ON voos
  FOR EACH ROW EXECUTE FUNCTION trigger_voos_criar_checklist();

-- =====================================================================
-- FASE 6: FUNÇÃO DE PERMISSÕES CORRIGIDA
-- =====================================================================

-- 6.1. Corrigir função get_user_combined_permissions
CREATE OR REPLACE FUNCTION get_user_combined_permissions(p_user_id UUID)
RETURNS TABLE(
  recurso TEXT,
  acao TEXT,
  permitido BOOLEAN,
  fonte TEXT,
  nivel_acesso TEXT,
  restricoes JSONB
) AS $$
BEGIN
  RAISE NOTICE 'Buscando permissões para usuário: %', p_user_id;
  
  RETURN QUERY
  WITH user_role AS (
    SELECT u.role
    FROM users u
    WHERE u.id = p_user_id
  ),
  role_permissions AS (
    SELECT 
      p.recurso,
      p.acao,
      p.permitido,
      'role'::TEXT as fonte,
      p.nivel_acesso,
      p.restricoes
    FROM permissoes p
    CROSS JOIN user_role ur
    WHERE p.role = ur.role
  ),
  direct_permissions AS (
    SELECT 
      up.recurso,
      up.acao,
      up.permitido,
      'user_specific'::TEXT as fonte,
      up.nivel_acesso,
      up.restricoes
    FROM user_permissions up
    WHERE up.user_id = p_user_id
    AND (up.data_expiracao IS NULL OR up.data_expiracao > NOW())
  )
  SELECT DISTINCT ON (rp.recurso, rp.acao)
    COALESCE(rp.recurso, dp.recurso) as recurso,
    COALESCE(rp.acao, dp.acao) as acao,
    COALESCE(dp.permitido, rp.permitido) as permitido,
    COALESCE(dp.fonte, rp.fonte) as fonte,
    COALESCE(dp.nivel_acesso, rp.nivel_acesso) as nivel_acesso,
    COALESCE(dp.restricoes, rp.restricoes) as restricoes
  FROM role_permissions rp
  FULL OUTER JOIN direct_permissions dp 
    ON rp.recurso = dp.recurso AND rp.acao = dp.acao
  WHERE rp.recurso IS NOT NULL OR dp.recurso IS NOT NULL
  ORDER BY rp.recurso, rp.acao, dp.permitido DESC NULLS LAST;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================================
-- FASE 7: PERMISSÕES E COMENTÁRIOS
-- =====================================================================

-- 7.1. Garantir permissões para todas as funções
GRANT EXECUTE ON FUNCTION fix_orphaned_auth_users() TO authenticated;
GRANT EXECUTE ON FUNCTION handle_new_user_signup() TO authenticated;
GRANT EXECUTE ON FUNCTION is_user_authorized(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION trigger_voos_criar_checklist() TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_combined_permissions(UUID) TO authenticated;

-- 7.2. Comentários para documentação
COMMENT ON FUNCTION fix_orphaned_auth_users() IS 'Corrige usuários órfãos - existem em auth.users mas não em public.users';
COMMENT ON FUNCTION handle_new_user_signup() IS 'Trigger automático para sincronizar novos usuários entre auth.users e public.users';
COMMENT ON FUNCTION is_user_authorized(UUID) IS 'Verifica se usuário atual pode acessar dados de outro usuário';
COMMENT ON FUNCTION is_admin() IS 'Verifica se usuário atual é administrador';

-- =====================================================================
-- FASE 8: VALIDAÇÃO FINAL
-- =====================================================================

-- 8.1. Verificar se correções funcionaram
DO $$
DECLARE
  orphaned_count INTEGER;
  rls_disabled_count INTEGER;
BEGIN
  -- Verificar usuários órfãos
  SELECT COUNT(*) INTO orphaned_count
  FROM auth.users au
  LEFT JOIN public.users pu ON pu.auth_id = au.id
  WHERE pu.auth_id IS NULL;
  
  -- Verificar RLS
  SELECT COUNT(*) INTO rls_disabled_count
  FROM pg_tables 
  WHERE schemaname = 'public' 
    AND tablename IN ('voos', 'permissoes')
    AND rowsecurity = false;
  
  RAISE NOTICE '=== RESULTADO DA CORREÇÃO ===';
  RAISE NOTICE 'Usuários órfãos restantes: %', orphaned_count;
  RAISE NOTICE 'Tabelas sem RLS: %', rls_disabled_count;
  
  IF orphaned_count = 0 AND rls_disabled_count = 0 THEN
    RAISE NOTICE '✅ CORREÇÃO CONCLUÍDA COM SUCESSO!';
  ELSE
    RAISE NOTICE '⚠️  ATENÇÃO: Ainda existem problemas a resolver';
  END IF;
END $$;