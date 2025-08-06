-- CORREÇÃO FINAL DO TRIGGER DE CHECKLIST
-- Data: 1 de agosto de 2025
-- Problema: Trigger usa auth.uid() mas foreign key espera users.id

-- =====================================================================
-- CORRIGIR TRIGGER PARA USAR ID CORRETO DA TABELA USERS
-- =====================================================================

CREATE OR REPLACE FUNCTION trigger_voos_criar_checklist()
RETURNS TRIGGER AS $$
DECLARE
  user_table_id UUID := NULL;
  user_email TEXT;
BEGIN
  RAISE NOTICE '[TRIGGER] Iniciando criação de checklist para voo %', NEW.id;
  
  -- BUSCA DEFENSIVA: Encontrar o ID correto da tabela users
  BEGIN
    -- Primeiro: tentar buscar por auth_id (método otimizado)
    SELECT id INTO user_table_id 
    FROM users 
    WHERE auth_id = auth.uid();
    
    RAISE NOTICE '[TRIGGER] Busca por auth_id: % -> user_table_id: %', auth.uid(), user_table_id;
    
    -- Se não encontrou por auth_id, tentar por email (fallback)
    IF user_table_id IS NULL THEN
      -- Buscar email no auth.users
      SELECT email INTO user_email FROM auth.users WHERE id = auth.uid();
      RAISE NOTICE '[TRIGGER] Email do auth.users: %', user_email;
      
      IF user_email IS NOT NULL THEN
        -- Buscar ID na tabela users por email
        SELECT id INTO user_table_id FROM users WHERE email = user_email;
        RAISE NOTICE '[TRIGGER] Busca por email: % -> user_table_id: %', user_email, user_table_id;
      END IF;
    END IF;
    
  EXCEPTION
    WHEN OTHERS THEN
      RAISE NOTICE '[TRIGGER] ERRO na busca de usuário: %', SQLERRM;
      user_table_id := NULL;
  END;
  
  RAISE NOTICE '[TRIGGER] user_table_id final para foreign key: %', user_table_id;

  -- Criar itens de checklist usando o ID correto da tabela users
  INSERT INTO checklist_itens (
    voo_id,
    bloco,
    categoria,
    item_texto,
    obrigatorio,
    created_by,
    preenchido_por
  ) VALUES
  -- Bloco 1: Preparação e Verificações Iniciais
  (NEW.id, 1, 'documentacao', 'Verificação de Registro e estrutura do equipamento e limpeza', true, user_table_id, user_table_id),
  (NEW.id, 1, 'documentacao', 'Verificar os cabos/componentes do cesto', true, user_table_id, user_table_id),
  (NEW.id, 1, 'equipamentos', 'Verificar fitas de tanques tem ajudadas e presas; manter a presilha num local de acesso fácil para remoção rápida', true, user_table_id, user_table_id),
  (NEW.id, 1, 'equipamentos', 'Verificar válvulas do sistema Chelsa', true, user_table_id, user_table_id),
  
  -- Bloco 2: Preparação do Balão  
  (NEW.id, 2, 'operacao', 'Decolagem segura realizada', true, user_table_id, user_table_id),
  (NEW.id, 2, 'operacao', 'Controle de altitude adequado', true, user_table_id, user_table_id),
  (NEW.id, 2, 'operacao', 'Comunicação com solo mantida', false, user_table_id, user_table_id),
  (NEW.id, 2, 'seguranca', 'Passageiros seguros durante o voo', true, user_table_id, user_table_id),
  
  -- Bloco 3: Verificações Finais e Decolagem
  (NEW.id, 3, 'documentacao', 'Relatório de voo preenchido', true, user_table_id, user_table_id),
  (NEW.id, 3, 'equipamentos', 'Equipamentos guardados adequadamente', true, user_table_id, user_table_id),
  (NEW.id, 3, 'seguranca', 'Passageiros desembarcados com segurança', true, user_table_id, user_table_id);

  RAISE NOTICE '[TRIGGER] ✅ Checklist criado com sucesso usando user_table_id: %', user_table_id;
  RETURN NEW;
  
EXCEPTION
  WHEN foreign_key_violation THEN
    RAISE NOTICE '[TRIGGER] ❌ ERRO Foreign Key: user_table_id % não existe na tabela users', user_table_id;
    RAISE NOTICE '[TRIGGER] 🔧 Criando checklist sem associação de usuário (campos NULL)';
    
    -- Tentar criar checklist sem associação de usuário
    INSERT INTO checklist_itens (voo_id, bloco, categoria, item_texto, obrigatorio) VALUES
    (NEW.id, 1, 'documentacao', 'Verificação de Registro e estrutura do equipamento e limpeza', true),
    (NEW.id, 1, 'documentacao', 'Verificar os cabos/componentes do cesto', true),
    (NEW.id, 1, 'equipamentos', 'Verificar fitas de tanques tem ajudadas e presas', true),
    (NEW.id, 2, 'operacao', 'Decolagem segura realizada', true),
    (NEW.id, 2, 'operacao', 'Controle de altitude adequado', true),
    (NEW.id, 3, 'documentacao', 'Relatório de voo preenchido', true);
    
    RAISE NOTICE '[TRIGGER] ✅ Checklist criado sem associação de usuário';
    RETURN NEW;
    
  WHEN OTHERS THEN
    RAISE NOTICE '[TRIGGER] ❌ ERRO GERAL ao criar checklist: %', SQLERRM;
    -- Continuar mesmo com erro (não bloquear criação do voo)
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================================
-- DOCUMENTAÇÃO E COMENTÁRIOS
-- =====================================================================

COMMENT ON FUNCTION trigger_voos_criar_checklist() IS 
  'Trigger que cria checklist usando ID correto da tabela users. Busca por auth_id primeiro, depois por email. Se falhar, cria sem associação.';

-- =====================================================================
-- RESULTADO ESPERADO:
-- =====================================================================

-- ✅ Trigger vai buscar ID correto da tabela users (não auth.uid())
-- ✅ Se encontrar usuário, associa corretamente  
-- ✅ Se não encontrar, cria checklist sem associação (não quebra)
-- ✅ Logs detalhados para debug
-- ✅ Não bloqueia criação de voos

SELECT '✅ Trigger corrigido! Teste criando um novo voo agora.' as status;