-- CORREÇÃO EMERGENCIAL: Foreign Key Constraint checklist_itens
-- Data: 31 de julho de 2025  
-- Problema: Trigger está tentando usar user_id inexistente como foreign key

-- =====================================================================
-- SOLUÇÃO RÁPIDA: TORNAR preenchido_por OPCIONAL
-- =====================================================================

-- 1. Remover constraint foreign key que está causando o erro
ALTER TABLE checklist_itens DROP CONSTRAINT IF EXISTS checklist_itens_preenchido_por_fkey;

-- 2. Tornar a coluna preenchido_por opcional (pode ser NULL)
ALTER TABLE checklist_itens ALTER COLUMN preenchido_por DROP NOT NULL;

-- 3. Recriar constraint como opcional (permite NULL)
ALTER TABLE checklist_itens ADD CONSTRAINT checklist_itens_preenchido_por_fkey 
  FOREIGN KEY (preenchido_por) REFERENCES users(id) ON DELETE SET NULL;

-- 4. Atualizar trigger para ser mais defensivo
CREATE OR REPLACE FUNCTION trigger_voos_criar_checklist()
RETURNS TRIGGER AS $$
DECLARE
  user_table_id UUID := NULL;
  user_email TEXT;
BEGIN
  -- Tentar identificar o user_id para preenchido_por (defensivo)
  BEGIN
    SELECT id INTO user_table_id FROM users WHERE id = auth.uid();
    
    IF user_table_id IS NULL THEN
      -- Fallback por email
      SELECT email INTO user_email FROM auth.users WHERE id = auth.uid();
      IF user_email IS NOT NULL THEN
        SELECT id INTO user_table_id FROM users WHERE email = user_email;
      END IF;
    END IF;
  EXCEPTION
    WHEN OTHERS THEN
      -- Se houver qualquer erro, continuar com user_table_id = NULL
      user_table_id := NULL;
  END;

  -- Criar itens de checklist (preenchido_por pode ser NULL)
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
-- COMENTÁRIOS E DOCUMENTAÇÃO
-- =====================================================================

COMMENT ON COLUMN checklist_itens.preenchido_por IS 
  'ID do usuário na tabela users - pode ser NULL se não conseguir determinar o usuário';

COMMENT ON CONSTRAINT checklist_itens_preenchido_por_fkey ON checklist_itens IS 
  'Foreign key opcional para users - permite NULL para casos onde não conseguimos determinar o usuário';

-- =====================================================================
-- RESUMO DA CORREÇÃO:
-- =====================================================================

-- ✅ Remove constraint rígida que causava erro
-- ✅ Torna preenchido_por opcional (NULL permitido)
-- ✅ Recriar constraint opcional com ON DELETE SET NULL
-- ✅ Trigger defensivo que não falha se não encontrar usuário
-- ✅ Mantém funcionalidade mas previne erros de foreign key

-- Agora a criação de checklist não vai falhar por problemas de foreign key!