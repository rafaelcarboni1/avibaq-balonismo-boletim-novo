-- Script para atualizar apenas as funções e triggers do checklist
-- Execute este SQL no dashboard do Supabase

-- Função para popular checklist automaticamente quando voo é criado
CREATE OR REPLACE FUNCTION criar_checklist_padrao(p_voo_id UUID)
RETURNS VOID AS $$
BEGIN
  -- Bloco 1 - Antes do tombamento do cesto
  INSERT INTO checklist_itens (voo_id, bloco, item_numero, item_descricao) VALUES
  (p_voo_id, 'bloco1', 1, 'Verificação de fixação e estrutura do queimador e tanques'),
  (p_voo_id, 'bloco1', 2, 'Verificar os cabos/mosquetões do cesto'),
  (p_voo_id, 'bloco1', 3, 'Verificar fitas de tanques bem ajustadas e presas; manter a presilha num local de acesso fácil para remoção rápida'),
  (p_voo_id, 'bloco1', 4, 'Verificar válvulas do suspiro cheias'),
  (p_voo_id, 'bloco1', 5, 'Garantir mangueiras com folgas para manobra necessária no queimador'),
  (p_voo_id, 'bloco1', 6, 'Verificar mangueiras fora da borda do cesto ou em local não apropriado'),
  (p_voo_id, 'bloco1', 7, 'Confirmar registros dos tanques devidamente fechados (linha líquida e linha vapor)'),
  (p_voo_id, 'bloco1', 8, 'Verificar todas as conexões entre queimador e tanques bem fixadas e sem vazamento'),
  (p_voo_id, 'bloco1', 9, 'Caso exista tanque auxiliar para inflagem, mantê-lo dentro do cockpit devidamente fixado'),
  (p_voo_id, 'bloco1', 10, 'Verificar pressão do extintor 1 (ponteiro no verde)'),
  (p_voo_id, 'bloco1', 11, 'Verificar pressão do extintor 2 (ponteiro no verde)'),
  (p_voo_id, 'bloco1', 12, 'Conferir kit de primeiros socorros completo'),
  (p_voo_id, 'bloco1', 13, 'Fazer primeiro acionamento do queimador (teste)'),
  (p_voo_id, 'bloco1', 14, 'Esgotar (esvaziar) todo o sistema de gás após o teste');

  -- Bloco 2 - Após tombamento do cesto para conexão com envelope
  INSERT INTO checklist_itens (voo_id, bloco, item_numero, item_descricao) VALUES
  (p_voo_id, 'bloco2', 1, 'Conectar ancoragem em ponto fixo e resistente do veículo (preferir parte frontal, não carreta)'),
  (p_voo_id, 'bloco2', 2, 'Usar sistema de desengate rápido apropriado ao tamanho do balão'),
  (p_voo_id, 'bloco2', 3, 'Inspecionar cabos do envelope íntegros, sem desfiados, dobras ou entrelaço'),
  (p_voo_id, 'bloco2', 4, 'Conectar cabos de forma ordenada, um de cada vez, revisando o anterior, iniciar pelos inferiores centrais'),
  (p_voo_id, 'bloco2', 5, 'Garantir mosquetões fechados com meia volta aberta para não travar'),
  (p_voo_id, 'bloco2', 6, 'Esticar o envelope no chão para checar integridade do tecido'),
  (p_voo_id, 'bloco2', 7, 'Posicionar ventiladores, travar rodas; puxar cordinha para verificar rotação livre das pás'),
  (p_voo_id, 'bloco2', 8, 'Colocar cone de segurança delimitando a área'),
  (p_voo_id, 'bloco2', 9, 'Acionar ventiladores; atenção a cadarços, rádios, cachecóis'),
  (p_voo_id, 'bloco2', 10, 'Orientar equipe de boca sobre cuidados, rajadas e procedimento de desligamento rápido a comando do piloto'),
  (p_voo_id, 'bloco2', 11, 'Entrar no envelope, fechar tap, desobstruir cabos e cordins nas roldanas'),
  (p_voo_id, 'bloco2', 12, 'Organizar e fixar cabos de tap e janelas de rotação no quadro ou cockpit'),
  (p_voo_id, 'bloco2', 13, 'Aguardar inflagem de pelo menos 75% do envelope antes de começar a aquecer');

  -- Bloco 3 - Após o balão em pé
  INSERT INTO checklist_itens (voo_id, bloco, item_numero, item_descricao) VALUES
  (p_voo_id, 'bloco3', 1, 'Rever conexões bem apertadas e posicionadas'),
  (p_voo_id, 'bloco3', 2, 'Verificar itens obrigatórios na mala de voo: água, manta anti-chama, luvas de couro, acendedores alternativos, canivete ou faca, alicate'),
  (p_voo_id, 'bloco3', 3, 'Instalar instrumentos de voo'),
  (p_voo_id, 'bloco3', 4, 'Chamar passageiros para embarque'),
  (p_voo_id, 'bloco3', 5, 'Apresentar piloto e equipamento'),
  (p_voo_id, 'bloco3', 6, 'Confirmar com todos os passageiros que entenderam a experiência'),
  (p_voo_id, 'bloco3', 7, 'Repetir treinamento da posição de pouso (costas para o scoop, pernas flexionadas, mãos nas alças)'),
  (p_voo_id, 'bloco3', 8, 'Informar na frequência 142.210 MHz a decolagem da aeronave, identificando o piloto no comando'),
  (p_voo_id, 'bloco3', 9, 'Verificar condições de vento; abortar se ultrapassarem limite');
END;
$$ LANGUAGE plpgsql;

-- Trigger para criar checklist automaticamente quando voo é criado
CREATE OR REPLACE FUNCTION trigger_criar_checklist_automatico()
RETURNS TRIGGER AS $$
BEGIN
  -- Criar checklist padrão para o novo voo
  PERFORM criar_checklist_padrao(NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recriar trigger se não existir
DROP TRIGGER IF EXISTS trigger_voos_criar_checklist ON voos;
CREATE TRIGGER trigger_voos_criar_checklist
  AFTER INSERT ON voos
  FOR EACH ROW
  EXECUTE FUNCTION trigger_criar_checklist_automatico();

-- Função CORRIGIDA para atualizar status do voo baseado no progresso do checklist
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
  IF NEW.marcado = false AND (NEW.motivo_nao_marcado IS NULL OR NEW.motivo_nao_marcado = '') THEN
    -- Item ainda não foi preenchido, não fazer nada
    RETURN NEW;
  END IF;
  
  -- Verificar se todos os itens de cada bloco estão preenchidos
  SELECT 
    NOT EXISTS (
      SELECT 1 FROM checklist_itens 
      WHERE voo_id = NEW.voo_id AND bloco = 'bloco1' 
      AND (marcado = false AND (motivo_nao_marcado IS NULL OR motivo_nao_marcado = ''))
    ),
    NOT EXISTS (
      SELECT 1 FROM checklist_itens 
      WHERE voo_id = NEW.voo_id AND bloco = 'bloco2' 
      AND (marcado = false AND (motivo_nao_marcado IS NULL OR motivo_nao_marcado = ''))
    ),
    NOT EXISTS (
      SELECT 1 FROM checklist_itens 
      WHERE voo_id = NEW.voo_id AND bloco = 'bloco3' 
      AND (marcado = false AND (motivo_nao_marcado IS NULL OR motivo_nao_marcado = ''))
    )
  INTO todos_bloco1_completos, todos_bloco2_completos, todos_bloco3_completos;
  
  -- Obter status atual do voo
  SELECT status INTO voo_status FROM voos WHERE id = NEW.voo_id;
  
  -- Atualizar status baseado no progresso apenas se voo não está rascunho
  -- Voos em rascunho devem ser explicitamente movidos para 'planejado' antes do checklist
  IF voo_status = 'rascunho' THEN
    -- Não alterar status automaticamente para voos em rascunho
    RETURN NEW;
  END IF;
  
  -- Atualizar status baseado no progresso
  IF todos_bloco3_completos AND voo_status NOT IN ('finalizado', 'cancelado') THEN
    UPDATE voos SET status = 'checklist_concluido', updated_at = NOW() WHERE id = NEW.voo_id;
  ELSIF todos_bloco2_completos AND voo_status = 'checklist_bloco1' THEN
    UPDATE voos SET status = 'checklist_bloco2', updated_at = NOW() WHERE id = NEW.voo_id;
  ELSIF todos_bloco1_completos AND voo_status = 'planejado' THEN
    UPDATE voos SET status = 'checklist_bloco1', updated_at = NOW() WHERE id = NEW.voo_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recriar trigger se não existir
DROP TRIGGER IF EXISTS trigger_checklist_update_status_voo ON checklist_itens;
CREATE TRIGGER trigger_checklist_update_status_voo
  AFTER UPDATE ON checklist_itens
  FOR EACH ROW
  WHEN (OLD.marcado IS DISTINCT FROM NEW.marcado OR OLD.motivo_nao_marcado IS DISTINCT FROM NEW.motivo_nao_marcado)
  EXECUTE FUNCTION trigger_checklist_update_status_voo();

-- Função para validar preenchimento do checklist
CREATE OR REPLACE FUNCTION trigger_checklist_validation()
RETURNS TRIGGER AS $$
BEGIN
  -- Atualizar timestamp e usuário
  NEW.updated_at = NOW();
  
  -- Se está marcando/desmarcando, registrar timestamp e usuário
  IF OLD.marcado IS DISTINCT FROM NEW.marcado OR OLD.motivo_nao_marcado IS DISTINCT FROM NEW.motivo_nao_marcado THEN
    NEW.preenchido_em = NOW();
    NEW.preenchido_por = auth.uid();
  END IF;
  
  -- Validar que se não marcado, deve ter motivo
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

-- Recriar trigger se não existir
DROP TRIGGER IF EXISTS trigger_checklist_validation ON checklist_itens;
CREATE TRIGGER trigger_checklist_validation
  BEFORE UPDATE ON checklist_itens
  FOR EACH ROW
  EXECUTE FUNCTION trigger_checklist_validation();