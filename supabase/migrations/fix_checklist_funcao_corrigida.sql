-- =====================================================================
-- FUNÇÃO CORRIGIDA: CRIAR CHECKLIST AUTOMÁTICO
-- =====================================================================

CREATE OR REPLACE FUNCTION criar_checklist_padrao(p_voo_id UUID)
RETURNS VOID AS $$
DECLARE
    user_table_id UUID := NULL;
    user_email TEXT;
BEGIN
    RAISE NOTICE '[CHECKLIST] Iniciando criação para voo: %', p_voo_id;
    
    -- BUSCA DEFENSIVA DO USUÁRIO
    BEGIN
        -- Método 1: Buscar diretamente por auth_id
        SELECT id INTO user_table_id 
        FROM users 
        WHERE auth_id = auth.uid();
        
        RAISE NOTICE '[CHECKLIST] Busca por auth_id: % -> %', auth.uid(), user_table_id;
        
        -- Método 2: Se não encontrou, buscar por email
        IF user_table_id IS NULL THEN
            SELECT email INTO user_email FROM auth.users WHERE id = auth.uid();
            
            IF user_email IS NOT NULL THEN
                SELECT id INTO user_table_id FROM users WHERE email = user_email;
                RAISE NOTICE '[CHECKLIST] Busca por email: % -> %', user_email, user_table_id;
            END IF;
        END IF;
        
    EXCEPTION
        WHEN OTHERS THEN
            RAISE NOTICE '[CHECKLIST] Erro na busca de usuário: %', SQLERRM;
            user_table_id := NULL;
    END;
    
    -- CRIAR ITENS DO CHECKLIST
    INSERT INTO checklist_itens (
        voo_id, bloco, item_numero, item_descricao, marcado, 
        motivo_nao_marcado, marcado_por, preenchido_por, created_at
    ) VALUES
    -- BLOCO 1: Preparação e Verificações Iniciais
    (p_voo_id, 'bloco1', 1, 'Verificação de fixação e estrutura do queimador e tanques', false, 'Aguardando preenchimento', user_table_id, user_table_id, NOW()),
    (p_voo_id, 'bloco1', 2, 'Verificar os cabos/mosquetões do cesto', false, 'Aguardando preenchimento', user_table_id, user_table_id, NOW()),
    (p_voo_id, 'bloco1', 3, 'Verificar fitas de tanques bem ajustadas e presas', false, 'Aguardando preenchimento', user_table_id, user_table_id, NOW()),
    (p_voo_id, 'bloco1', 4, 'Verificar válvulas do suspiro cheias', false, 'Aguardando preenchimento', user_table_id, user_table_id, NOW()),
    (p_voo_id, 'bloco1', 5, 'Garantir mangueiras com folgas para manobra necessária', false, 'Aguardando preenchimento', user_table_id, user_table_id, NOW()),
    (p_voo_id, 'bloco1', 6, 'Verificar mangueiras fora da borda do cesto', false, 'Aguardando preenchimento', user_table_id, user_table_id, NOW()),
    (p_voo_id, 'bloco1', 7, 'Confirmar registros dos tanques devidamente fechados', false, 'Aguardando preenchimento', user_table_id, user_table_id, NOW()),
    (p_voo_id, 'bloco1', 8, 'Verificar conexões entre queimador e tanques', false, 'Aguardando preenchimento', user_table_id, user_table_id, NOW()),
    (p_voo_id, 'bloco1', 9, 'Verificar pressão do extintor 1 (ponteiro no verde)', false, 'Aguardando preenchimento', user_table_id, user_table_id, NOW()),
    (p_voo_id, 'bloco1', 10, 'Verificar pressão do extintor 2 (ponteiro no verde)', false, 'Aguardando preenchimento', user_table_id, user_table_id, NOW()),
    (p_voo_id, 'bloco1', 11, 'Conferir kit de primeiros socorros completo', false, 'Aguardando preenchimento', user_table_id, user_table_id, NOW()),
    (p_voo_id, 'bloco1', 12, 'Fazer primeiro acionamento do queimador (teste)', false, 'Aguardando preenchimento', user_table_id, user_table_id, NOW()),
    
    -- BLOCO 2: Preparação do Balão
    (p_voo_id, 'bloco2', 1, 'Conectar ancoragem em ponto fixo e resistente', false, 'Aguardando preenchimento', user_table_id, user_table_id, NOW()),
    (p_voo_id, 'bloco2', 2, 'Usar sistema de desengate rápido apropriado', false, 'Aguardando preenchimento', user_table_id, user_table_id, NOW()),
    (p_voo_id, 'bloco2', 3, 'Inspecionar cabos do envelope íntegros', false, 'Aguardando preenchimento', user_table_id, user_table_id, NOW()),
    (p_voo_id, 'bloco2', 4, 'Conectar cabos de forma ordenada', false, 'Aguardando preenchimento', user_table_id, user_table_id, NOW()),
    (p_voo_id, 'bloco2', 5, 'Garantir mosquetões fechados corretamente', false, 'Aguardando preenchimento', user_table_id, user_table_id, NOW()),
    (p_voo_id, 'bloco2', 6, 'Esticar envelope no chão para verificação', false, 'Aguardando preenchimento', user_table_id, user_table_id, NOW()),
    (p_voo_id, 'bloco2', 7, 'Posicionar ventiladores e travar rodas', false, 'Aguardando preenchimento', user_table_id, user_table_id, NOW()),
    (p_voo_id, 'bloco2', 8, 'Colocar cone de segurança delimitando área', false, 'Aguardando preenchimento', user_table_id, user_table_id, NOW()),
    
    -- BLOCO 3: Verificações Finais
    (p_voo_id, 'bloco3', 1, 'Rever conexões bem apertadas e posicionadas', false, 'Aguardando preenchimento', user_table_id, user_table_id, NOW()),
    (p_voo_id, 'bloco3', 2, 'Verificar itens obrigatórios na mala de voo', false, 'Aguardando preenchimento', user_table_id, user_table_id, NOW()),
    (p_voo_id, 'bloco3', 3, 'Instalar instrumentos de voo', false, 'Aguardando preenchimento', user_table_id, user_table_id, NOW()),
    (p_voo_id, 'bloco3', 4, 'Chamar passageiros para embarque', false, 'Aguardando preenchimento', user_table_id, user_table_id, NOW()),
    (p_voo_id, 'bloco3', 5, 'Apresentar piloto e equipamento', false, 'Aguardando preenchimento', user_table_id, user_table_id, NOW()),
    (p_voo_id, 'bloco3', 6, 'Repetir treinamento da posição de pouso', false, 'Aguardando preenchimento', user_table_id, user_table_id, NOW()),
    (p_voo_id, 'bloco3', 7, 'Informar decolagem na frequência 142.210 MHz', false, 'Aguardando preenchimento', user_table_id, user_table_id, NOW()),
    (p_voo_id, 'bloco3', 8, 'Verificar condições de vento', false, 'Aguardando preenchimento', user_table_id, user_table_id, NOW());
    
    RAISE NOTICE '[CHECKLIST] ✅ Criado checklist com 24 itens para voo % (usuário: %)', p_voo_id, user_table_id;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '[CHECKLIST] ❌ ERRO ao criar checklist: %', SQLERRM;
        -- Não falhar a criação do voo por causa do checklist
END;
$$ LANGUAGE plpgsql;

-- Recriar trigger
DROP TRIGGER IF EXISTS trigger_voos_criar_checklist ON voos;

CREATE TRIGGER trigger_voos_criar_checklist
    AFTER INSERT ON voos
    FOR EACH ROW
    EXECUTE FUNCTION criar_checklist_padrao(NEW.id);

RAISE NOTICE '✅ Trigger recriado com função corrigida';