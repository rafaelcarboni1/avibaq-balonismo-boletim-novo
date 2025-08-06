-- Fix para constraint do checklist que estava impedindo criação de voos
-- Aplicar no Supabase SQL Editor

-- 1. Recrear a função criar_checklist_padrao com valores padrão válidos
CREATE OR REPLACE FUNCTION criar_checklist_padrao(p_voo_id UUID)
RETURNS VOID AS $$
BEGIN
  -- Bloco 1 - Antes do tombamento do cesto
  INSERT INTO checklist_itens (voo_id, bloco, item_numero, item_descricao, marcado, motivo_nao_marcado) VALUES
  (p_voo_id, 'bloco1', 1, 'Verificação de fixação e estrutura do queimador e tanques', false, 'Aguardando preenchimento'),
  (p_voo_id, 'bloco1', 2, 'Verificar os cabos/mosquetões do cesto', false, 'Aguardando preenchimento'),
  (p_voo_id, 'bloco1', 3, 'Verificar fitas de tanques bem ajustadas e presas; manter a presilha num local de acesso fácil para remoção rápida', false, 'Aguardando preenchimento'),
  (p_voo_id, 'bloco1', 4, 'Verificar válvulas do suspiro cheias', false, 'Aguardando preenchimento'),
  (p_voo_id, 'bloco1', 5, 'Garantir mangueiras com folgas para manobra necessária no queimador', false, 'Aguardando preenchimento'),
  (p_voo_id, 'bloco1', 6, 'Verificar mangueiras fora da borda do cesto ou em local não apropriado', false, 'Aguardando preenchimento'),
  (p_voo_id, 'bloco1', 7, 'Confirmar registros dos tanques devidamente fechados (linha líquida e linha vapor)', false, 'Aguardando preenchimento'),
  (p_voo_id, 'bloco1', 8, 'Verificar todas as conexões entre queimador e tanques bem fixadas e sem vazamento', false, 'Aguardando preenchimento'),
  (p_voo_id, 'bloco1', 9, 'Caso exista tanque auxiliar para inflagem, mantê-lo dentro do cockpit devidamente fixado', false, 'Aguardando preenchimento'),
  (p_voo_id, 'bloco1', 10, 'Verificar pressão do extintor 1 (ponteiro no verde)', false, 'Aguardando preenchimento'),
  (p_voo_id, 'bloco1', 11, 'Verificar pressão do extintor 2 (ponteiro no verde)', false, 'Aguardando preenchimento'),
  (p_voo_id, 'bloco1', 12, 'Conferir kit de primeiros socorros completo', false, 'Aguardando preenchimento'),
  (p_voo_id, 'bloco1', 13, 'Fazer primeiro acionamento do queimador (teste)', false, 'Aguardando preenchimento'),
  (p_voo_id, 'bloco1', 14, 'Esgotar (esvaziar) todo o sistema de gás após o teste', false, 'Aguardando preenchimento');

  -- Bloco 2 - Após tombamento do cesto para conexão com envelope
  INSERT INTO checklist_itens (voo_id, bloco, item_numero, item_descricao, marcado, motivo_nao_marcado) VALUES
  (p_voo_id, 'bloco2', 1, 'Conectar ancoragem em ponto fixo e resistente do veículo (preferir parte frontal, não carreta)', false, 'Aguardando preenchimento'),
  (p_voo_id, 'bloco2', 2, 'Usar sistema de desengate rápido apropriado ao tamanho do balão', false, 'Aguardando preenchimento'),
  (p_voo_id, 'bloco2', 3, 'Inspecionar cabos do envelope íntegros, sem desfiados, dobras ou entrelaço', false, 'Aguardando preenchimento'),
  (p_voo_id, 'bloco2', 4, 'Conectar cabos de forma ordenada, um de cada vez, revisando o anterior, iniciar pelos inferiores centrais', false, 'Aguardando preenchimento'),
  (p_voo_id, 'bloco2', 5, 'Garantir mosquetões fechados com meia volta aberta para não travar', false, 'Aguardando preenchimento'),
  (p_voo_id, 'bloco2', 6, 'Esticar o envelope no chão para checar integridade do tecido', false, 'Aguardando preenchimento'),
  (p_voo_id, 'bloco2', 7, 'Posicionar ventiladores, travar rodas; puxar cordinha para verificar rotação livre das pás', false, 'Aguardando preenchimento'),
  (p_voo_id, 'bloco2', 8, 'Colocar cone de segurança delimitando a área', false, 'Aguardando preenchimento'),
  (p_voo_id, 'bloco2', 9, 'Acionar ventiladores; atenção a cadarços, rádios, cachecóis', false, 'Aguardando preenchimento'),
  (p_voo_id, 'bloco2', 10, 'Orientar equipe de boca sobre cuidados, rajadas e procedimento de desligamento rápido a comando do piloto', false, 'Aguardando preenchimento'),
  (p_voo_id, 'bloco2', 11, 'Entrar no envelope, fechar tap, desobstruir cabos e cordins nas roldanas', false, 'Aguardando preenchimento'),
  (p_voo_id, 'bloco2', 12, 'Organizar e fixar cabos de tap e janelas de rotação no quadro ou cockpit', false, 'Aguardando preenchimento'),
  (p_voo_id, 'bloco2', 13, 'Aguardar inflagem de pelo menos 75% do envelope antes de começar a aquecer', false, 'Aguardando preenchimento');

  -- Bloco 3 - Após o balão em pé
  INSERT INTO checklist_itens (voo_id, bloco, item_numero, item_descricao, marcado, motivo_nao_marcado) VALUES
  (p_voo_id, 'bloco3', 1, 'Rever conexões bem apertadas e posicionadas', false, 'Aguardando preenchimento'),
  (p_voo_id, 'bloco3', 2, 'Verificar itens obrigatórios na mala de voo: água, manta anti-chama, luvas de couro, acendedores alternativos, canivete ou faca, alicate', false, 'Aguardando preenchimento'),
  (p_voo_id, 'bloco3', 3, 'Instalar instrumentos de voo', false, 'Aguardando preenchimento'),
  (p_voo_id, 'bloco3', 4, 'Chamar passageiros para embarque', false, 'Aguardando preenchimento'),
  (p_voo_id, 'bloco3', 5, 'Apresentar piloto e equipamento', false, 'Aguardando preenchimento'),
  (p_voo_id, 'bloco3', 6, 'Confirmar com todos os passageiros que entenderam a experiência', false, 'Aguardando preenchimento'),
  (p_voo_id, 'bloco3', 7, 'Repetir treinamento da posição de pouso (costas para o scoop, pernas flexionadas, mãos nas alças)', false, 'Aguardando preenchimento'),
  (p_voo_id, 'bloco3', 8, 'Informar na frequência 142.210 MHz a decolagem da aeronave, identificando o piloto no comando', false, 'Aguardando preenchimento'),
  (p_voo_id, 'bloco3', 9, 'Verificar condições de vento; abortar se ultrapassarem limite', false, 'Aguardando preenchimento');
END;
$$ LANGUAGE plpgsql;

-- 2. Atualizar triggers para considerar "Aguardando preenchimento" como não preenchido
CREATE OR REPLACE FUNCTION trigger_checklist_update_status_voo()
RETURNS TRIGGER AS $$
DECLARE
  todos_bloco1_completos BOOLEAN;
  todos_bloco2_completos BOOLEAN;
  todos_bloco3_completos BOOLEAN;
  voo_status TEXT;
BEGIN
  -- IMPORTANTE: Só atualizar status se o item foi REALMENTE preenchido (não na criação inicial)
  -- Verificar se o item foi marcado como true OU recebeu um motivo (indicando preenchimento real)
  IF NEW.marcado = false AND (NEW.motivo_nao_marcado IS NULL OR NEW.motivo_nao_marcado = '' OR NEW.motivo_nao_marcado = 'Aguardando preenchimento') THEN
    -- Item ainda não foi preenchido, não fazer nada
    RETURN NEW;
  END IF;
  
  -- Verificar se todos os itens de cada bloco estão preenchidos
  SELECT 
    NOT EXISTS (
      SELECT 1 FROM checklist_itens 
      WHERE voo_id = NEW.voo_id AND bloco = 'bloco1'
      AND (marcado = false AND (motivo_nao_marcado IS NULL OR motivo_nao_marcado = '' OR motivo_nao_marcado = 'Aguardando preenchimento'))
    ),
    NOT EXISTS (
      SELECT 1 FROM checklist_itens 
      WHERE voo_id = NEW.voo_id AND bloco = 'bloco2'
      AND (marcado = false AND (motivo_nao_marcado IS NULL OR motivo_nao_marcado = '' OR motivo_nao_marcado = 'Aguardando preenchimento'))
    ),
    NOT EXISTS (
      SELECT 1 FROM checklist_itens 
      WHERE voo_id = NEW.voo_id AND bloco = 'bloco3'
      AND (marcado = false AND (motivo_nao_marcado IS NULL OR motivo_nao_marcado = '' OR motivo_nao_marcado = 'Aguardando preenchimento'))
    )
  INTO todos_bloco1_completos, todos_bloco2_completos, todos_bloco3_completos;
  
  -- Determinar novo status baseado no progresso
  IF todos_bloco3_completos THEN
    voo_status := 'checklist_concluido';
  ELSIF todos_bloco2_completos THEN
    voo_status := 'checklist_bloco2';
  ELSIF todos_bloco1_completos THEN
    voo_status := 'checklist_bloco1';
  ELSE
    -- Se ainda há itens pendentes, manter como planejado
    voo_status := 'planejado';
  END IF;
  
  -- Atualizar status do voo
  UPDATE voos 
  SET status = voo_status,
      updated_at = NOW()
  WHERE id = NEW.voo_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Atualizar trigger de validação para permitir "Aguardando preenchimento"
CREATE OR REPLACE FUNCTION trigger_checklist_validation()
RETURNS TRIGGER AS $$
BEGIN
  -- Definir usuário que preencheu se está sendo marcado agora
  IF NEW.marcado = true OR (NEW.motivo_nao_marcado IS NOT NULL AND NEW.motivo_nao_marcado != '' AND NEW.motivo_nao_marcado != 'Aguardando preenchimento') THEN
    NEW.preenchido_por = auth.uid();
  END IF;
  
  -- Validar que se não marcado, deve ter motivo (exceto "Aguardando preenchimento")
  IF NEW.marcado = false AND (NEW.motivo_nao_marcado IS NULL OR trim(NEW.motivo_nao_marcado) = '') THEN
    RAISE EXCEPTION 'Motivo é obrigatório quando item não é marcado';
  END IF;
  
  -- Se marcado, limpar motivo
  IF NEW.marcado = true THEN
    NEW.motivo_nao_marcado = NULL;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Atualizar itens existentes que possam estar com valor NULL
UPDATE checklist_itens 
SET motivo_nao_marcado = 'Aguardando preenchimento'
WHERE marcado = false AND (motivo_nao_marcado IS NULL OR motivo_nao_marcado = '');

COMMIT;