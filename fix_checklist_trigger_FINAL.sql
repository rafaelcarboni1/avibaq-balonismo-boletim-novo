-- CORREÇÃO DEFINITIVA DO TRIGGER DE CHECKLIST
-- Problema: trigger usa auth.uid() que aponta para auth.users, mas foreign key aponta para public.users
-- Data: 04 de agosto de 2025

-- =====================================================================
-- CORRIGIR TRIGGER DE VALIDAÇÃO DO CHECKLIST
-- =====================================================================

-- Substitui o trigger problemático por versão corrigida que usa conversão de ID
CREATE OR REPLACE FUNCTION trigger_checklist_validation()
RETURNS TRIGGER AS $$
DECLARE
  user_table_id UUID;
  user_email TEXT;
BEGIN
  -- Atualizar timestamp
  NEW.updated_at = NOW();
  
  -- Se está marcando/desmarcando, registrar timestamp e usuário CORRETO
  IF OLD.marcado IS DISTINCT FROM NEW.marcado OR OLD.motivo_nao_marcado IS DISTINCT FROM NEW.motivo_nao_marcado THEN
    NEW.preenchido_em = NOW();
    
    -- CORREÇÃO CRÍTICA: Converter auth.uid() para users.id correto
    -- Primeiro: tentar busca direta por ID
    SELECT id INTO user_table_id FROM users WHERE id = auth.uid();
    
    IF user_table_id IS NOT NULL THEN
      NEW.preenchido_por = user_table_id;
    ELSE
      -- Fallback: buscar por email se não encontrou por ID direto
      SELECT email INTO user_email FROM auth.users WHERE id = auth.uid();
      
      IF user_email IS NOT NULL THEN
        SELECT id INTO user_table_id FROM users WHERE email = user_email;
        
        IF user_table_id IS NOT NULL THEN
          NEW.preenchido_por = user_table_id;
        ELSE
          -- Se não conseguir identificar o usuário, deixar NULL ao invés de falhar
          RAISE WARNING 'Não foi possível identificar usuário para preenchido_por: auth_id=%, email=%', auth.uid(), user_email;
          NEW.preenchido_por = NULL;
        END IF;
      ELSE
        RAISE WARNING 'Não foi possível obter email para auth.uid(): %', auth.uid();
        NEW.preenchido_por = NULL;
      END IF;
    END IF;
  END IF;
  
  -- Validar que se não marcado, deve ter motivo (exceto estado inicial)
  IF NEW.marcado = false AND (
    NEW.motivo_nao_marcado IS NULL OR 
    trim(NEW.motivo_nao_marcado) = '' OR 
    trim(NEW.motivo_nao_marcado) = 'Aguardando preenchimento'
  ) THEN
    RAISE EXCEPTION 'Motivo é obrigatório quando item não é marcado';
  END IF;
  
  -- Se marcado, limpar motivo
  IF NEW.marcado = true THEN
    NEW.motivo_nao_marcado = NULL;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================================
-- TAMBÉM CORRIGIR O TRIGGER DE CRIAÇÃO DE CHECKLIST AUTOMÁTICO
-- =====================================================================

-- Este trigger também pode ter o mesmo problema
CREATE OR REPLACE FUNCTION trigger_voos_criar_checklist()
RETURNS TRIGGER AS $$
DECLARE
  user_table_id UUID;
  user_email TEXT;
BEGIN
  -- Tentar identificar o user_id correto para preenchido_por (opcional na criação)
  SELECT id INTO user_table_id FROM users WHERE id = auth.uid();
  
  IF user_table_id IS NULL THEN
    -- Fallback por email
    SELECT email INTO user_email FROM auth.users WHERE id = auth.uid();
    IF user_email IS NOT NULL THEN
      SELECT id INTO user_table_id FROM users WHERE email = user_email;
    END IF;
  END IF;

  -- Criar itens de checklist padrão
  INSERT INTO checklist_itens (
    voo_id,
    bloco,
    item_numero,
    item_descricao,
    marcado,
    motivo_nao_marcado,
    preenchido_por
  ) VALUES
  -- Bloco 1: Pré-voo
  (NEW.id, 1, 1, 'Verificação de fixação e estrutura do queimador e tanques', false, 'Aguardando preenchimento', user_table_id),
  (NEW.id, 1, 2, 'Verificar os cabos/mosquetões do cesto', false, 'Aguardando preenchimento', user_table_id),
  (NEW.id, 1, 3, 'Verificar fitas de tanques bem ajustadas e presas; manter a presilha num local de acesso fácil para remoção rápida', false, 'Aguardando preenchimento', user_table_id),
  (NEW.id, 1, 4, 'Verificar válvulas do suspiro cheias', false, 'Aguardando preenchimento', user_table_id),
  (NEW.id, 1, 5, 'Garantir mangueiras com folgas para manobra necessária no queimador', false, 'Aguardando preenchimento', user_table_id),
  (NEW.id, 1, 6, 'Verificar mangueiras fora da borda do cesto ou em local não apropriado', false, 'Aguardando preenchimento', user_table_id),
  (NEW.id, 1, 7, 'Confirmar registros dos tanques devidamente fechados (linha líquida e linha vapor)', false, 'Aguardando preenchimento', user_table_id),
  (NEW.id, 1, 8, 'Verificar todas as conexões entre queimador e tanques bem fixadas e sem vazamento', false, 'Aguardando preenchimento', user_table_id),
  (NEW.id, 1, 9, 'Caso exista tanque auxiliar para inflagem, mantê-lo dentro do cockpit devidamente fixado', false, 'Aguardando preenchimento', user_table_id),
  (NEW.id, 1, 10, 'Verificar pressão do extintor 1 (ponteiro no verde)', false, 'Aguardando preenchimento', user_table_id),
  (NEW.id, 1, 11, 'Verificar pressão do extintor 2 (ponteiro no verde)', false, 'Aguardando preenchimento', user_table_id),
  (NEW.id, 1, 12, 'Conferir kit de primeiros socorros completo', false, 'Aguardando preenchimento', user_table_id),
  (NEW.id, 1, 13, 'Fazer primeiro acionamento do queimador (teste)', false, 'Aguardando preenchimento', user_table_id),
  (NEW.id, 1, 14, 'Esgotar (esvaziar) todo o sistema de gás após o teste', false, 'Aguardando preenchimento', user_table_id),
  
  -- Bloco 2: Durante inflagem
  (NEW.id, 2, 1, 'Conectar ancoragem em ponto fixo e resistente do veículo', false, 'Aguardando preenchimento', user_table_id),
  (NEW.id, 2, 2, 'Usar sistema de desengate rápido apropriado ao tamanho do balão', false, 'Aguardando preenchimento', user_table_id),
  (NEW.id, 2, 3, 'Inspecionar cabos do envelope íntegros, sem desfiados, dobras ou entrelaço', false, 'Aguardando preenchimento', user_table_id),
  (NEW.id, 2, 4, 'Conectar cabos de forma ordenada, um de cada vez, revisando o anterior', false, 'Aguardando preenchimento', user_table_id),
  (NEW.id, 2, 5, 'Garantir mosquetões fechados com meia volta aberta para não travar', false, 'Aguardando preenchimento', user_table_id),
  (NEW.id, 2, 6, 'Esticar o envelope no chão para checar integridade do tecido', false, 'Aguardando preenchimento', user_table_id),
  (NEW.id, 2, 7, 'Posicionar ventiladores, travar rodas; verificar rotação livre das pás', false, 'Aguardando preenchimento', user_table_id),
  (NEW.id, 2, 8, 'Colocar cone de segurança delimitando a área', false, 'Aguardando preenchimento', user_table_id),
  (NEW.id, 2, 9, 'Acionar ventiladores; atenção a cadarços, rádios, cachecóis', false, 'Aguardando preenchimento', user_table_id),
  (NEW.id, 2, 10, 'Orientar equipe sobre cuidados, rajadas e desligamento rápido', false, 'Aguardando preenchimento', user_table_id),
  (NEW.id, 2, 11, 'Entrar no envelope, fechar tap, desobstruir cabos nas roldanas', false, 'Aguardando preenchimento', user_table_id),
  (NEW.id, 2, 12, 'Organizar e fixar cabos de tap e janelas de rotação', false, 'Aguardando preenchimento', user_table_id),
  (NEW.id, 2, 13, 'Aguardar inflagem de pelo menos 75% antes de aquecer', false, 'Aguardando preenchimento', user_table_id),
  
  -- Bloco 3: Após balão em pé
  (NEW.id, 3, 1, 'Rever conexões bem apertadas e posicionadas', false, 'Aguardando preenchimento', user_table_id),
  (NEW.id, 3, 2, 'Verificar itens obrigatórios na mala de voo', false, 'Aguardando preenchimento', user_table_id),
  (NEW.id, 3, 3, 'Instalar instrumentos de voo', false, 'Aguardando preenchimento', user_table_id),
  (NEW.id, 3, 4, 'Chamar passageiros para embarque', false, 'Aguardando preenchimento', user_table_id),
  (NEW.id, 3, 5, 'Apresentar piloto e equipamento', false, 'Aguardando preenchimento', user_table_id),
  (NEW.id, 3, 6, 'Confirmar entendimento da experiência com passageiros', false, 'Aguardando preenchimento', user_table_id),
  (NEW.id, 3, 7, 'Repetir treinamento da posição de pouso', false, 'Aguardando preenchimento', user_table_id),
  (NEW.id, 3, 8, 'Informar decolagem na frequência 142.210 MHz', false, 'Aguardando preenchimento', user_table_id),
  (NEW.id, 3, 9, 'Verificar condições de vento; abortar se ultrapassarem limite', false, 'Aguardando preenchimento', user_table_id);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================================
-- COMENTÁRIOS E VALIDAÇÃO
-- =====================================================================

COMMENT ON FUNCTION trigger_checklist_validation() IS 'Trigger corrigido que converte auth.uid() para users.id correto';
COMMENT ON FUNCTION trigger_voos_criar_checklist() IS 'Trigger corrigido para criação de checklist com IDs corretos';

-- =====================================================================
-- VERIFICAÇÃO PÓS-APLICAÇÃO
-- =====================================================================

-- Esta query deve retornar 0 se a correção funcionou:
-- SELECT COUNT(*) FROM checklist_itens WHERE preenchido_por IS NOT NULL AND NOT EXISTS (SELECT 1 FROM users WHERE id = checklist_itens.preenchido_por);

-- Script concluído - triggers corrigidos para usar IDs corretos da tabela users