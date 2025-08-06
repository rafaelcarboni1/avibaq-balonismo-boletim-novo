-- Migração para inserir dados de teste
-- Criada em: 2025-01-11
-- Descrição: Seeds para teste do módulo de voos

-- Verificar se estamos em ambiente de desenvolvimento
-- Esta migração só deve ser executada em desenvolvimento/teste

-- Inserir membros de teste (pilotos e agências)
INSERT INTO membros (id, nome_completo, email, telefone, tipo, cpf, cnpj, nome_empresa, status, pagamento_inscricao, user_id, endereco, cidade, estado) VALUES 
-- Pilotos
('11111111-1111-1111-1111-111111111111', 'João Silva Piloto', 'joao.piloto@avibaq.test', '(48) 99999-1111', 'piloto', '12345678901', NULL, NULL, 'ativo', 'ok', NULL, 'Rua das Flores, 123', 'Praia Grande', 'SC'),
('22222222-2222-2222-2222-222222222222', 'Maria Santos Piloto', 'maria.piloto@avibaq.test', '(48) 99999-2222', 'piloto', '23456789012', NULL, NULL, 'ativo', 'ok', NULL, 'Av. Central, 456', 'Florianópolis', 'SC'),
('33333333-3333-3333-3333-333333333333', 'Pedro Costa Piloto', 'pedro.piloto@avibaq.test', '(48) 99999-3333', 'piloto', '34567890123', NULL, NULL, 'ativo', 'ok', NULL, 'Rua do Mar, 789', 'Balneário Camboriú', 'SC'),

-- Agências
('44444444-4444-4444-4444-444444444444', 'Ana Ferreira', 'contato@voosmagicos.test', '(48) 99999-4444', 'agencia', NULL, '12345678000123', 'Voos Mágicos Ltda', 'ativo', 'ok', NULL, 'Rua Comercial, 100', 'Praia Grande', 'SC'),
('55555555-5555-5555-5555-555555555555', 'Carlos Oliveira', 'admin@balaoaventura.test', '(48) 99999-5555', 'agencia', NULL, '23456789000134', 'Balão Aventura S.A.', 'ativo', 'ok', NULL, 'Av. Turismo, 200', 'Florianópolis', 'SC')

ON CONFLICT (id) DO NOTHING;

-- Inserir balões de teste
INSERT INTO baloes (id, prefixo, volume_m3, nome_batismo, proprietario_id, ativo) VALUES 
-- Balões dos pilotos
('aa111111-1111-1111-1111-111111111111', 'PT-ABC', 2200, 'Esperança', '11111111-1111-1111-1111-111111111111', true),
('aa222222-2222-2222-2222-222222222222', 'PT-DEF', 1800, 'Liberdade', '22222222-2222-2222-2222-222222222222', true),
('aa333333-3333-3333-3333-333333333333', 'PT-GHI', 2400, 'Sonho Azul', '33333333-3333-3333-3333-333333333333', true),

-- Balões das agências
('aa444444-4444-4444-4444-444444444444', 'PT-JKL', 2000, 'Vento Sul', '44444444-4444-4444-4444-444444444444', true),
('aa555555-5555-5555-5555-555555555555', 'PT-MNO', 2600, 'Estrela Dalva', '44444444-4444-4444-4444-444444444444', true),
('aa666666-6666-6666-6666-666666666666', 'PT-PQR', 1600, 'Gaivota', '55555555-5555-5555-5555-555555555555', true),
('aa777777-7777-7777-7777-777777777777', 'PT-STU', 2200, 'Condor', '55555555-5555-5555-5555-555555555555', true)

ON CONFLICT (id) DO NOTHING;

-- Inserir vínculos entre agências e pilotos
INSERT INTO vinculos_agencia_piloto (id, agencia_id, piloto_id, status, observacoes) VALUES 
('bb111111-1111-1111-1111-111111111111', '44444444-4444-4444-4444-444444444444', '11111111-1111-1111-1111-111111111111', 'aceito', 'Piloto experiente, ótima parceria'),
('bb222222-2222-2222-2222-222222222222', '44444444-4444-4444-4444-444444444444', '22222222-2222-2222-2222-222222222222', 'aceito', 'Excelente piloto para voos comerciais'),
('bb333333-3333-3333-3333-333333333333', '55555555-5555-5555-5555-555555555555', '33333333-3333-3333-3333-333333333333', 'aceito', 'Especialista em voos panorâmicos'),
('bb444444-4444-4444-4444-444444444444', '55555555-5555-5555-5555-555555555555', '11111111-1111-1111-1111-111111111111', 'pendente', 'Convite para voos de fim de semana')

ON CONFLICT (id) DO NOTHING;

-- Inserir voos de teste (passado, presente e futuro)
INSERT INTO voos (id, data_voo, periodo, piloto_id, agencia_id, status, horario_previsto, local_decolagem_previsto, adultos_previstos, criancas_previstas, observacoes_planejamento) VALUES 
-- Voos passados (finalizados)
('cc111111-1111-1111-1111-111111111111', CURRENT_DATE - 7, 'manha', '11111111-1111-1111-1111-111111111111', '44444444-4444-4444-4444-444444444444', 'finalizado', '07:00', 'Campo de Voo Central', 4, 2, 'Voo turístico manhã'),
('cc222222-2222-2222-2222-222222222222', CURRENT_DATE - 5, 'tarde', '22222222-2222-2222-2222-222222222222', NULL, 'finalizado', '16:00', 'Fazenda do Vento', 2, 0, 'Voo particular casal'),
('cc333333-3333-3333-3333-333333333333', CURRENT_DATE - 3, 'manha', '33333333-3333-3333-3333-333333333333', '55555555-5555-5555-5555-555555555555', 'cancelado', '06:30', 'Vale dos Balões', 6, 3, 'Voo familiar cancelado por vento'),

-- Voos de hoje
('cc444444-4444-4444-4444-444444444444', CURRENT_DATE, 'manha', '11111111-1111-1111-1111-111111111111', NULL, 'checklist_bloco2', '07:30', 'Campo Principal', 2, 1, 'Voo matinal em andamento'),
('cc555555-5555-5555-5555-555555555555', CURRENT_DATE, 'tarde', '22222222-2222-2222-2222-222222222222', '44444444-4444-4444-4444-444444444444', 'planejado', '17:00', 'Pista Norte', 4, 0, 'Voo comercial tarde'),

-- Voos futuros
('cc666666-6666-6666-6666-666666666666', CURRENT_DATE + 1, 'manha', '33333333-3333-3333-3333-333333333333', '55555555-5555-5555-5555-555555555555', 'rascunho', '06:00', 'Campo Nascente', 8, 4, 'Grande voo familiar'),
('cc777777-7777-7777-7777-777777777777', CURRENT_DATE + 2, 'tarde', '11111111-1111-1111-1111-111111111111', NULL, 'planejado', '16:30', 'Colina Verde', 2, 0, 'Voo romântico'),
('cc888888-8888-8888-8888-888888888888', CURRENT_DATE + 3, 'manha', '22222222-2222-2222-2222-222222222222', '44444444-4444-4444-4444-444444444444', 'rascunho', '07:00', 'Base Central', 6, 2, 'Voo turístico grupo')

ON CONFLICT (id) DO NOTHING;

-- Inserir relações voos-balões
INSERT INTO voos_baloes (voo_id, balao_id, adultos_previstos, criancas_previstas, adultos_transportados, criancas_transportadas) VALUES 
-- Voo finalizado 1 (usou 2 balões)
('cc111111-1111-1111-1111-111111111111', 'aa111111-1111-1111-1111-111111111111', 3, 1, 3, 1),
('cc111111-1111-1111-1111-111111111111', 'aa444444-4444-4444-4444-444444444444', 1, 1, 1, 1),

-- Voo finalizado 2 (balão individual)
('cc222222-2222-2222-2222-222222222222', 'aa222222-2222-2222-2222-222222222222', 2, 0, 2, 0),

-- Voo cancelado (tinha 1 balão planejado)
('cc333333-3333-3333-3333-333333333333', 'aa666666-6666-6666-6666-666666666666', 6, 3, NULL, NULL),

-- Voo de hoje em andamento
('cc444444-4444-4444-4444-444444444444', 'aa111111-1111-1111-1111-111111111111', 2, 1, NULL, NULL),

-- Voo de hoje planejado
('cc555555-5555-5555-5555-555555555555', 'aa222222-2222-2222-2222-222222222222', 4, 0, NULL, NULL),

-- Voos futuros
('cc666666-6666-6666-6666-666666666666', 'aa777777-7777-7777-7777-777777777777', 4, 2),
('cc666666-6666-6666-6666-666666666666', 'aa666666-6666-6666-6666-666666666666', 4, 2),
('cc777777-7777-7777-7777-777777777777', 'aa111111-1111-1111-1111-111111111111', 2, 0),
('cc888888-8888-8888-8888-888888888888', 'aa444444-4444-4444-4444-444444444444', 3, 1),
('cc888888-8888-8888-8888-888888888888', 'aa555555-5555-5555-5555-555555555555', 3, 1)

ON CONFLICT (voo_id, balao_id) DO NOTHING;

-- Atualizar dados pós-voo para voos finalizados
UPDATE voos SET 
  adultos_transportados = 4, 
  criancas_transportadas = 2,
  local_pouso = 'Campo de Pouso Sul',
  duracao_minutos = 45,
  altitude_maxima = 1200,
  observacoes_pos_voo = 'Voo excelente, condições perfeitas'
WHERE id = 'cc111111-1111-1111-1111-111111111111';

UPDATE voos SET 
  adultos_transportados = 2, 
  criancas_transportadas = 0,
  local_pouso = 'Pista de Terra',
  duracao_minutos = 35,
  altitude_maxima = 800,
  observacoes_pos_voo = 'Voo romântico, vista incrível do pôr do sol'
WHERE id = 'cc222222-2222-2222-2222-222222222222';

-- Atualizar voo cancelado
UPDATE voos SET 
  motivo_cancelamento = 'vento',
  observacoes_cancelamento = 'Ventos acima de 15 km/h, segurança em primeiro lugar',
  cancelado_em = NOW() - INTERVAL '3 days'
WHERE id = 'cc333333-3333-3333-3333-333333333333';

-- Inserir alguns anexos de exemplo para voos finalizados
INSERT INTO voos_anexos (id, voo_id, tipo, nome_arquivo, nome_original, url_storage, tamanho_bytes, mime_type, publico, metadata) VALUES 
('dd111111-1111-1111-1111-111111111111', 'cc111111-1111-1111-1111-111111111111', 'foto_voo', 'foto_decolagem_20250104_070530.jpg', 'decolagem_manhã.jpg', 'voos-anexos/cc111111-1111-1111-1111-111111111111/foto_voo/foto_decolagem_20250104_070530.jpg', 2048576, 'image/jpeg', true, '{"resolucao": "1920x1080", "camera": "iPhone 14"}'),
('dd222222-2222-2222-2222-222222222222', 'cc111111-1111-1111-1111-111111111111', 'track_log', 'track_voo_20250104_070530.gpx', 'track_completo.gpx', 'voos-anexos/cc111111-1111-1111-1111-111111111111/track_log/track_voo_20250104_070530.gpx', 45678, 'application/gpx+xml', false, '{"pontos": 156, "distancia_km": 12.5}'),
('dd333333-3333-3333-3333-333333333333', 'cc222222-2222-2222-2222-222222222222', 'regulamento_assinado', 'regulamento_assinado_20250106.pdf', 'termo_responsabilidade.pdf', 'voos-anexos/cc222222-2222-2222-2222-222222222222/regulamento_assinado/regulamento_assinado_20250106.pdf', 1024000, 'application/pdf', false, '{"paginas": 3, "assinado": true}')

ON CONFLICT (id) DO NOTHING;

-- Criar função para popular checklist de voos de teste específicos
DO $$
DECLARE
    voo_record RECORD;
BEGIN
    -- Popular checklist para voos que ainda não têm (evita duplicatas)
    FOR voo_record IN 
        SELECT v.id 
        FROM voos v 
        WHERE NOT EXISTS (
            SELECT 1 FROM checklist_itens ci WHERE ci.voo_id = v.id
        )
    LOOP
        PERFORM criar_checklist_padrao(voo_record.id);
    END LOOP;
END $$;

-- Simular progresso do checklist para voo em andamento
-- Marcar bloco 1 como completo
UPDATE checklist_itens SET 
  marcado = true,
  preenchido_em = NOW() - INTERVAL '2 hours'
WHERE voo_id = 'cc444444-4444-4444-4444-444444444444' 
AND bloco = 'bloco1';

-- Marcar metade do bloco 2 como completo
UPDATE checklist_itens SET 
  marcado = true,
  preenchido_em = NOW() - INTERVAL '1 hour'
WHERE voo_id = 'cc444444-4444-4444-4444-444444444444' 
AND bloco = 'bloco2'
AND item_numero <= 7;

-- Marcar alguns itens como não aplicáveis com motivo
UPDATE checklist_itens SET 
  marcado = false,
  motivo_nao_marcado = 'Não aplicável - balão sem tanque auxiliar',
  preenchido_em = NOW() - INTERVAL '2 hours'
WHERE voo_id = 'cc444444-4444-4444-4444-444444444444' 
AND bloco = 'bloco1'
AND item_numero = 9;

-- Marcar todos os checklists como completos para voos finalizados
UPDATE checklist_itens SET 
  marcado = true,
  preenchido_em = NOW() - INTERVAL '7 days'
WHERE voo_id IN ('cc111111-1111-1111-1111-111111111111', 'cc222222-2222-2222-2222-222222222222');

-- Comentário sobre os dados de teste
COMMENT ON COLUMN membros.email IS 'E-mails de teste terminam com .test para identificação';

-- Log da criação dos dados de teste
INSERT INTO logs_atividade (acao, detalhes) VALUES 
('seed_dados_teste', jsonb_build_object(
  'membros_inseridos', 5,
  'baloes_inseridos', 7,
  'vinculos_inseridos', 4,
  'voos_inseridos', 8,
  'anexos_inseridos', 3,
  'data_criacao', NOW()
));