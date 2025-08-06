-- CORREÇÃO SIMPLES: Trigger sem usar coluna preenchido_por
-- Data: 31 de julho de 2025
-- Solução: Criar checklist sem referenciar colunas problemáticas

-- =====================================================================
-- VERSÃO SIMPLIFICADA DO TRIGGER (SEM preenchido_por)
-- =====================================================================

CREATE OR REPLACE FUNCTION trigger_voos_criar_checklist()
RETURNS TRIGGER AS $$
BEGIN
  -- Criar itens de checklist usando apenas as colunas essenciais
  INSERT INTO checklist_itens (
    voo_id,
    bloco,
    item_numero,
    item_descricao,
    marcado
  ) VALUES
  -- Bloco 1: Pré-voo (bloco1)
  (NEW.id, 'bloco1'::bloco_checklist, 1, 'Documentação da aeronave em ordem', false),
  (NEW.id, 'bloco1'::bloco_checklist, 2, 'Licença de piloto válida', false),
  (NEW.id, 'bloco1'::bloco_checklist, 3, 'Envelope em boas condições', false),
  (NEW.id, 'bloco1'::bloco_checklist, 4, 'Cesto em boas condições', false),
  (NEW.id, 'bloco1'::bloco_checklist, 5, 'Queimador testado', false),
  (NEW.id, 'bloco1'::bloco_checklist, 6, 'Instrumentos funcionando', false),
  (NEW.id, 'bloco1'::bloco_checklist, 7, 'Condições meteorológicas favoráveis', false),
  (NEW.id, 'bloco1'::bloco_checklist, 8, 'Briefing de segurança realizado', false),
  (NEW.id, 'bloco1'::bloco_checklist, 9, 'Equipamentos de segurança verificados', false),
  
  -- Bloco 2: Durante o voo (bloco2)
  (NEW.id, 'bloco2'::bloco_checklist, 1, 'Decolagem segura realizada', false),
  (NEW.id, 'bloco2'::bloco_checklist, 2, 'Controle de altitude adequado', false),
  (NEW.id, 'bloco2'::bloco_checklist, 3, 'Comunicação com solo mantida', false),
  (NEW.id, 'bloco2'::bloco_checklist, 4, 'Passageiros seguros durante o voo', false),
  (NEW.id, 'bloco2'::bloco_checklist, 5, 'Pouso seguro realizado', false),
  
  -- Bloco 3: Pós-voo (bloco3)
  (NEW.id, 'bloco3'::bloco_checklist, 1, 'Equipamentos recolhidos adequadamente', false),
  (NEW.id, 'bloco3'::bloco_checklist, 2, 'Área de pouso limpa e organizada', false),
  (NEW.id, 'bloco3'::bloco_checklist, 3, 'Relatório de voo preenchido', false),
  (NEW.id, 'bloco3'::bloco_checklist, 4, 'Ocorrências reportadas (se houver)', false);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================================
-- COMENTÁRIOS
-- =====================================================================

COMMENT ON FUNCTION trigger_voos_criar_checklist() IS 
  'Trigger simplificado que cria checklist básico sem referências problemáticas - versão funcional';

-- =====================================================================
-- RESUMO DESTA VERSÃO:
-- =====================================================================

-- ✅ Remove todas as referências à coluna preenchido_por
-- ✅ Remove lógica complexa de fallback por email  
-- ✅ Remove blocos try/catch que podem causar problemas
-- ✅ Usa somente colunas essenciais: voo_id, bloco, item_numero, item_descricao, marcado
-- ✅ Define marcado=false por padrão (usuário marca depois manualmente)
-- ✅ Mantém estrutura de 3 blocos conforme especificação
-- ✅ Usa enum bloco_checklist corretamente

-- Esta versão deve funcionar sem problemas de permissions ou foreign keys!