-- Script para corrigir nomes das colunas nas funções
-- Execute este SQL no dashboard do Supabase

-- Primeiro remover triggers que dependem das funções
DROP TRIGGER IF EXISTS trigger_checklist_validation ON checklist_itens;

-- Agora remover funções existentes
DROP FUNCTION IF EXISTS criar_checklist_padrao(uuid);
DROP FUNCTION IF EXISTS trigger_checklist_validation();

-- Recriar função com nomes corretos das colunas
CREATE OR REPLACE FUNCTION criar_checklist_padrao(p_voo_id UUID)
RETURNS VOID AS $$
BEGIN
  -- Bloco 1 - Antes do tombamento do cesto
  INSERT INTO checklist_itens (voo_id, bloco, item_numero, descricao) VALUES
  (p_voo_id, 1, 1, 'Verificação de fixação e estrutura do queimador e tanques'),
  (p_voo_id, 1, 2, 'Verificar os cabos/mosquetões do cesto'),
  (p_voo_id, 1, 3, 'Verificar fitas de tanques bem ajustadas e presas; manter a presilha num local de acesso fácil para remoção rápida'),
  (p_voo_id, 1, 4, 'Verificar válvulas do suspiro cheias'),
  (p_voo_id, 1, 5, 'Garantir mangueiras com folgas para manobra necessária no queimador'),
  (p_voo_id, 1, 6, 'Verificar mangueiras fora da borda do cesto ou em local não apropriado'),
  (p_voo_id, 1, 7, 'Confirmar registros dos tanques devidamente fechados (linha líquida e linha vapor)'),
  (p_voo_id, 1, 8, 'Verificar todas as conexões entre queimador e tanques bem fixadas e sem vazamento'),
  (p_voo_id, 1, 9, 'Caso exista tanque auxiliar para inflagem, mantê-lo dentro do cockpit devidamente fixado'),
  (p_voo_id, 1, 10, 'Verificar pressão do extintor 1 (ponteiro no verde)'),
  (p_voo_id, 1, 11, 'Verificar pressão do extintor 2 (ponteiro no verde)'),
  (p_voo_id, 1, 12, 'Conferir kit de primeiros socorros completo'),
  (p_voo_id, 1, 13, 'Fazer primeiro acionamento do queimador (teste)'),
  (p_voo_id, 1, 14, 'Esgotar (esvaziar) todo o sistema de gás após o teste');

  -- Bloco 2 - Após tombamento do cesto para conexão com envelope
  INSERT INTO checklist_itens (voo_id, bloco, item_numero, descricao) VALUES
  (p_voo_id, 2, 1, 'Conectar ancoragem em ponto fixo e resistente do veículo (preferir parte frontal, não carreta)'),
  (p_voo_id, 2, 2, 'Usar sistema de desengate rápido apropriado ao tamanho do balão'),
  (p_voo_id, 2, 3, 'Inspecionar cabos do envelope íntegros, sem desfiados, dobras ou entrelaço'),
  (p_voo_id, 2, 4, 'Conectar cabos de forma ordenada, um de cada vez, revisando o anterior, iniciar pelos inferiores centrais'),
  (p_voo_id, 2, 5, 'Garantir mosquetões fechados com meia volta aberta para não travar'),
  (p_voo_id, 2, 6, 'Esticar o envelope no chão para checar integridade do tecido'),
  (p_voo_id, 2, 7, 'Posicionar ventiladores, travar rodas; puxar cordinha para verificar rotação livre das pás'),
  (p_voo_id, 2, 8, 'Colocar cone de segurança delimitando a área'),
  (p_voo_id, 2, 9, 'Acionar ventiladores; atenção a cadarços, rádios, cachecóis'),
  (p_voo_id, 2, 10, 'Orientar equipe de boca sobre cuidados, rajadas e procedimento de desligamento rápido a comando do piloto'),
  (p_voo_id, 2, 11, 'Entrar no envelope, fechar tap, desobstruir cabos e cordins nas roldanas'),
  (p_voo_id, 2, 12, 'Organizar e fixar cabos de tap e janelas de rotação no quadro ou cockpit'),
  (p_voo_id, 2, 13, 'Aguardar inflagem de pelo menos 75% do envelope antes de começar a aquecer');

  -- Bloco 3 - Após o balão em pé
  INSERT INTO checklist_itens (voo_id, bloco, item_numero, descricao) VALUES
  (p_voo_id, 3, 1, 'Rever conexões bem apertadas e posicionadas'),
  (p_voo_id, 3, 2, 'Verificar itens obrigatórios na mala de voo: água, manta anti-chama, luvas de couro, acendedores alternativos, canivete ou faca, alicate'),
  (p_voo_id, 3, 3, 'Instalar instrumentos de voo'),
  (p_voo_id, 3, 4, 'Chamar passageiros para embarque'),
  (p_voo_id, 3, 5, 'Apresentar piloto e equipamento'),
  (p_voo_id, 3, 6, 'Confirmar com todos os passageiros que entenderam a experiência'),
  (p_voo_id, 3, 7, 'Repetir treinamento da posição de pouso (costas para o scoop, pernas flexionadas, mãos nas alças)'),
  (p_voo_id, 3, 8, 'Informar na frequência 142.210 MHz a decolagem da aeronave, identificando o piloto no comando'),
  (p_voo_id, 3, 9, 'Verificar condições de vento; abortar se ultrapassarem limite');
END;
$$ LANGUAGE plpgsql;

-- Função para validar preenchimento do checklist COM NOMES CORRETOS
CREATE OR REPLACE FUNCTION trigger_checklist_validation()
RETURNS TRIGGER AS $$
BEGIN
  -- Atualizar timestamp
  NEW.updated_at = NOW();
  
  -- Se está marcando/desmarcando, registrar timestamp e usuário
  IF OLD.marcado IS DISTINCT FROM NEW.marcado OR OLD.motivo_nao_marcado IS DISTINCT FROM NEW.motivo_nao_marcado THEN
    NEW.marcado_em = NOW();
    NEW.marcado_por = auth.uid();
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

-- Recriar trigger
CREATE TRIGGER trigger_checklist_validation
  BEFORE UPDATE ON checklist_itens
  FOR EACH ROW
  EXECUTE FUNCTION trigger_checklist_validation();