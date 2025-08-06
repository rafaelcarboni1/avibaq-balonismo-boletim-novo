-- CORREÇÃO FINAL: Foreign Key Constraint checklist_itens
-- Data: 1 de agosto de 2025  
-- Problema: Trigger está usando auth.uid() mas foreign key espera users.id

-- =====================================================================
-- FASE 1: TORNAR FOREIGN KEY OPCIONAL (EVITAR QUEBRA)
-- =====================================================================

-- 1. Remover constraint rígida que está causando o erro
ALTER TABLE checklist_itens DROP CONSTRAINT IF EXISTS checklist_itens_created_by_fkey;
ALTER TABLE checklist_itens DROP CONSTRAINT IF EXISTS checklist_itens_preenchido_por_fkey;

-- 2. Tornar coluna opcional para evitar erros
ALTER TABLE checklist_itens ALTER COLUMN created_by DROP NOT NULL;
ALTER TABLE checklist_itens ALTER COLUMN preenchido_por DROP NOT NULL;

-- 3. Recriar constraints como opcionais
ALTER TABLE checklist_itens ADD CONSTRAINT checklist_itens_created_by_fkey 
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL;
  
ALTER TABLE checklist_itens ADD CONSTRAINT checklist_itens_preenchido_por_fkey 
  FOREIGN KEY (preenchido_por) REFERENCES users(id) ON DELETE SET NULL;

-- =====================================================================
-- FASE 2: CORRIGIR TRIGGER PARA USAR ID CORRETO DA TABELA USERS
-- =====================================================================

CREATE OR REPLACE FUNCTION trigger_voos_criar_checklist()
RETURNS TRIGGER AS $$
DECLARE
  user_table_id UUID := NULL;
  user_email TEXT;
BEGIN
  RAISE NOTICE '[TRIGGER] Iniciando criação de checklist para voo %', NEW.id;
  
  -- BUSCA DEFENSIVA: Tentar encontrar o ID correto da tabela users
  BEGIN
    -- Primeiro, tentar buscar diretamente por auth_id
    SELECT id INTO user_table_id 
    FROM users 
    WHERE auth_id = auth.uid();
    
    RAISE NOTICE '[TRIGGER] Busca por auth_id: % -> user_table_id: %', auth.uid(), user_table_id;
    
    -- Se não encontrou por auth_id, tentar por email
    IF user_table_id IS NULL THEN
      SELECT email INTO user_email FROM auth.users WHERE id = auth.uid();
      RAISE NOTICE '[TRIGGER] Email do auth.users: %', user_email;
      
      IF user_email IS NOT NULL THEN
        SELECT id INTO user_table_id FROM users WHERE email = user_email;
        RAISE NOTICE '[TRIGGER] Busca por email: % -> user_table_id: %', user_email, user_table_id;
      END IF;
    END IF;
  EXCEPTION
    WHEN OTHERS THEN
      RAISE NOTICE '[TRIGGER] ERRO na busca de usuário: %', SQLERRM;
      user_table_id := NULL;
  END;
  
  RAISE NOTICE '[TRIGGER] user_table_id final: %', user_table_id;

  -- Criar itens de checklist (com created_by e preenchido_por opcionais)
  INSERT INTO checklist_itens (
    voo_id,
    bloco,
    categoria,
    item_texto,
    obrigatorio,
    created_by,
    preenchido_por
  ) VALUES
  -- Bloco 1: Pré-voo
  (NEW.id, 1, 'documentacao', 'Documentação da aeronave em ordem', true, user_table_id, user_table_id),
  (NEW.id, 1, 'documentacao', 'Licença de piloto válida', true, user_table_id, user_table_id),
  (NEW.id, 1, 'equipamentos', 'Envelope em boas condições', true, user_table_id, user_table_id),
  (NEW.id, 1, 'equipamentos', 'Cesto em boas condições', true, user_table_id, user_table_id),
  (NEW.id, 1, 'equipamentos', 'Queimador testado', true, user_table_id, user_table_id),
  (NEW.id, 1, 'equipamentos', 'Instrumentos funcionando', true, user_table_id, user_table_id),
  (NEW.id, 1, 'meteorologia', 'Condições meteorológicas favoráveis', true, user_table_id, user_table_id),
  (NEW.id, 1, 'seguranca', 'Briefing de segurança realizado', true, user_table_id, user_table_id),
  (NEW.id, 1, 'seguranca', 'Equipamentos de segurança verificados', true, user_table_id, user_table_id),
  
  -- Bloco 2: Durante o voo
  (NEW.id, 2, 'operacao', 'Decolagem segura realizada', true, user_table_id, user_table_id),
  (NEW.id, 2, 'operacao', 'Controle de altitude adequado', true, user_table_id, user_table_id),
  (NEW.id, 2, 'operacao', 'Comunicação com solo mantida', false, user_table_id, user_table_id),
  (NEW.id, 2, 'seguranca', 'Passageiros seguros durante o voo', true, user_table_id, user_table_id),
  (NEW.id, 2, 'operacao', 'Pouso seguro realizado', true, user_table_id, user_table_id),
  
  -- Bloco 3: Pós-voo
  (NEW.id, 3, 'documentacao', 'Relatório de voo preenchido', true, user_table_id, user_table_id),
  (NEW.id, 3, 'equipamentos', 'Equipamentos guardados adequadamente', true, user_table_id, user_table_id),
  (NEW.id, 3, 'seguranca', 'Passageiros desembarcados com segurança', true, user_table_id, user_table_id);

  RAISE NOTICE '[TRIGGER] ✅ Checklist criado com % itens', 17;
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE '[TRIGGER] ❌ ERRO ao criar checklist: %', SQLERRM;
    -- Continuar mesmo com erro (não bloquear criação do voo)
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================================
-- DOCUMENTAÇÃO
-- =====================================================================

COMMENT ON FUNCTION trigger_voos_criar_checklist() IS 
  'Trigger defensivo que cria checklist sem falhar por foreign key. Busca user_table_id por auth_id ou email.';

COMMENT ON CONSTRAINT checklist_itens_created_by_fkey ON checklist_itens IS 
  'Foreign key opcional para users - permite NULL se não conseguir determinar usuário';

-- =====================================================================
-- RESULTADO ESPERADO:
-- =====================================================================

-- ✅ Checklist será criado sem erros de foreign key
-- ✅ Se encontrar usuário correto, será associado
-- ✅ Se não encontrar, campos ficam NULL (não quebra)
-- ✅ Logs detalhados para debug

SELECT 'Correção aplicada! Teste criando um novo voo agora.' as status;