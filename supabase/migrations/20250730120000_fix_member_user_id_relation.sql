-- Migração para corrigir vinculação entre membros e usuários
-- Criada em: 2025-07-30
-- Descrição: Vincula membros existentes aos usuários por email e corrige função

-- 1. Vincular membros existentes aos usuários pelo email
UPDATE membros 
SET user_id = u.id
FROM users u 
WHERE membros.email = u.email 
AND membros.user_id IS NULL;

-- 2. Verificar quantos membros foram vinculados
DO $$
DECLARE
    vinculados_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO vinculados_count 
    FROM membros m 
    JOIN users u ON m.email = u.email 
    WHERE m.user_id = u.id;
    
    RAISE NOTICE 'Total de membros vinculados aos usuários: %', vinculados_count;
END $$;

-- 3. Corrigir/recriar a função de vinculação automática
CREATE OR REPLACE FUNCTION vincular_user_id_membro()
RETURNS TRIGGER AS $$
BEGIN
  -- Atualizar user_id no membro correspondente quando usuário faz login/é criado
  UPDATE membros 
  SET user_id = NEW.id 
  WHERE email = NEW.email 
  AND user_id IS NULL;
  
  -- Log para debug
  RAISE NOTICE 'Função vincular_user_id_membro executada para email: %', NEW.email;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Criar trigger na tabela users (não auth.users) para vincular quando usuário é criado
DROP TRIGGER IF EXISTS on_user_created_vincular_membro ON users;
CREATE TRIGGER on_user_created_vincular_membro
  AFTER INSERT ON users
  FOR EACH ROW EXECUTE FUNCTION vincular_user_id_membro();

-- 5. Verificar se existem membros sem user_id que deveriam ter
DO $$
DECLARE
    sem_vinculo_count INTEGER;
    membro_record RECORD;
BEGIN
    -- Contar membros ativos sem vinculação
    SELECT COUNT(*) INTO sem_vinculo_count 
    FROM membros m 
    WHERE m.user_id IS NULL 
    AND m.status = 'ativo'
    AND EXISTS (SELECT 1 FROM users u WHERE u.email = m.email);
    
    IF sem_vinculo_count > 0 THEN
        RAISE NOTICE 'ATENÇÃO: % membros ativos ainda sem vinculação user_id', sem_vinculo_count;
        
        -- Listar os membros sem vinculação
        FOR membro_record IN 
            SELECT m.nome_completo, m.email, m.tipo
            FROM membros m 
            WHERE m.user_id IS NULL 
            AND m.status = 'ativo'
            AND EXISTS (SELECT 1 FROM users u WHERE u.email = m.email)
        LOOP
            RAISE NOTICE '- %: % (%)', membro_record.nome_completo, membro_record.email, membro_record.tipo;
        END LOOP;
    ELSE
        RAISE NOTICE 'Todos os membros ativos estão vinculados corretamente!';
    END IF;
END $$;

-- 6. Adicionar constraint para garantir integridade (comentado para não quebrar dados existentes)
-- ALTER TABLE membros ADD CONSTRAINT fk_membros_user_id 
--   FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;

-- 7. Criar índice para performance
CREATE INDEX IF NOT EXISTS idx_membros_user_id ON membros(user_id);

-- 8. Log da migração
INSERT INTO logs_atividade (acao, detalhes) VALUES 
('fix_member_user_id_relation', jsonb_build_object(
  'descricao', 'Corrigida vinculação entre membros e usuários',
  'membros_vinculados', (SELECT COUNT(*) FROM membros WHERE user_id IS NOT NULL),
  'data_criacao', NOW()
));

-- 9. Verificação final - mostrar estatísticas
DO $$
DECLARE
    total_membros INTEGER;
    membros_vinculados INTEGER;
    pilotos_vinculados INTEGER;
    agencias_vinculadas INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_membros FROM membros WHERE status = 'ativo';
    SELECT COUNT(*) INTO membros_vinculados FROM membros WHERE user_id IS NOT NULL AND status = 'ativo';
    SELECT COUNT(*) INTO pilotos_vinculados FROM membros WHERE user_id IS NOT NULL AND tipo = 'piloto' AND status = 'ativo';
    SELECT COUNT(*) INTO agencias_vinculadas FROM membros WHERE user_id IS NOT NULL AND tipo = 'agencia' AND status = 'ativo';
    
    RAISE NOTICE '=== ESTATÍSTICAS FINAIS ===';
    RAISE NOTICE 'Total membros ativos: %', total_membros;
    RAISE NOTICE 'Membros vinculados: %', membros_vinculados;
    RAISE NOTICE 'Pilotos vinculados: %', pilotos_vinculados;
    RAISE NOTICE 'Agências vinculadas: %', agencias_vinculadas;
    RAISE NOTICE '========================';
END $$;