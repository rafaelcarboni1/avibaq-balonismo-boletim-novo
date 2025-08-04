-- CORREÇÃO DO TRIGGER: checklist_itens com estrutura correta
-- Data: 31 de julho de 2025
-- Problema: Trigger usando colunas inexistentes (categoria, item_texto, obrigatorio)

-- =====================================================================
-- ETAPA 1: CORRIGIR FOREIGN KEY E TORNAR COLUNA OPCIONAL
-- =====================================================================

-- 1. Remover constraint foreign key que está causando o erro
ALTER TABLE checklist_itens DROP CONSTRAINT IF EXISTS checklist_itens_preenchido_por_fkey;

-- 2. Tornar a coluna preenchido_por opcional (pode ser NULL)
ALTER TABLE checklist_itens ALTER COLUMN preenchido_por DROP NOT NULL;

-- 3. Recriar constraint como opcional (permite NULL)
ALTER TABLE checklist_itens ADD CONSTRAINT checklist_itens_preenchido_por_fkey 
  FOREIGN KEY (preenchido_por) REFERENCES users(id) ON DELETE SET NULL;

-- =====================================================================
-- ETAPA 2: CORRIGIR TRIGGER COM ESTRUTURA CORRETA DA TABELA
-- =====================================================================

-- Estrutura REAL da tabela checklist_itens:
-- - voo_id, bloco, item_numero, item_descricao, marcado, motivo_nao_marcado, preenchido_em, preenchido_por

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

  -- Criar itens de checklist usando a estrutura CORRETA da tabela
  INSERT INTO checklist_itens (
    voo_id,
    bloco,
    item_numero,
    item_descricao,
    marcado,
    preenchido_por
  ) VALUES
  -- Bloco 1: Pré-voo (bloco1)
  (NEW.id, 'bloco1'::bloco_checklist, 1, 'Documentação da aeronave em ordem', false, user_table_id),
  (NEW.id, 'bloco1'::bloco_checklist, 2, 'Licença de piloto válida', false, user_table_id),
  (NEW.id, 'bloco1'::bloco_checklist, 3, 'Envelope em boas condições', false, user_table_id),
  (NEW.id, 'bloco1'::bloco_checklist, 4, 'Cesto em boas condições', false, user_table_id),
  (NEW.id, 'bloco1'::bloco_checklist, 5, 'Queimador testado', false, user_table_id),
  (NEW.id, 'bloco1'::bloco_checklist, 6, 'Instrumentos funcionando', false, user_table_id),
  (NEW.id, 'bloco1'::bloco_checklist, 7, 'Condições meteorológicas favoráveis', false, user_table_id),
  (NEW.id, 'bloco1'::bloco_checklist, 8, 'Briefing de segurança realizado', false, user_table_id),
  (NEW.id, 'bloco1'::bloco_checklist, 9, 'Equipamentos de segurança verificados', false, user_table_id),
  
  -- Bloco 2: Durante o voo (bloco2)
  (NEW.id, 'bloco2'::bloco_checklist, 1, 'Decolagem segura realizada', false, user_table_id),
  (NEW.id, 'bloco2'::bloco_checklist, 2, 'Controle de altitude adequado', false, user_table_id),
  (NEW.id, 'bloco2'::bloco_checklist, 3, 'Comunicação com solo mantida', false, user_table_id),
  (NEW.id, 'bloco2'::bloco_checklist, 4, 'Passageiros seguros durante o voo', false, user_table_id),
  (NEW.id, 'bloco2'::bloco_checklist, 5, 'Pouso seguro realizado', false, user_table_id),
  
  -- Bloco 3: Pós-voo (bloco3)
  (NEW.id, 'bloco3'::bloco_checklist, 1, 'Equipamentos recolhidos adequadamente', false, user_table_id),
  (NEW.id, 'bloco3'::bloco_checklist, 2, 'Área de pouso limpa e organizada', false, user_table_id),
  (NEW.id, 'bloco3'::bloco_checklist, 3, 'Relatório de voo preenchido', false, user_table_id),
  (NEW.id, 'bloco3'::bloco_checklist, 4, 'Ocorrências reportadas (se houver)', false, user_table_id);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================================
-- ETAPA 3: COMENTÁRIOS E DOCUMENTAÇÃO
-- =====================================================================

COMMENT ON FUNCTION trigger_voos_criar_checklist() IS 
  'Trigger que cria automaticamente itens de checklist para novos voos - versão corrigida com estrutura real da tabela';

COMMENT ON COLUMN checklist_itens.preenchido_por IS 
  'ID do usuário na tabela users - pode ser NULL se não conseguir determinar o usuário';

-- =====================================================================
-- RESUMO DA CORREÇÃO:
-- =====================================================================

-- ✅ Remove constraint rígida que causava erro
-- ✅ Torna preenchido_por opcional (NULL permitido)
-- ✅ Recriar constraint opcional com ON DELETE SET NULL
-- ✅ Trigger corrigido usando estrutura REAL da tabela:
--     - voo_id, bloco, item_numero, item_descricao, marcado, preenchido_por
-- ✅ Usa enum bloco_checklist corretamente ('bloco1', 'bloco2', 'bloco3')
-- ✅ Define marcado=false por padrão (usuário marca depois)
-- ✅ Trigger defensivo que não falha se não encontrar usuário

-- Agora a criação de checklist funcionará corretamente!