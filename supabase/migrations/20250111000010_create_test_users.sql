-- Migração para criar usuários de teste
-- Criada em: 2025-01-11
-- Descrição: Cria usuários de teste para login e vincula com membros

-- Inserir usuários de teste na tabela users
INSERT INTO users (email, role, primeira_senha) VALUES 
-- Pilotos de teste
('joao.piloto@avibaq.test', 'piloto', false),
('maria.piloto@avibaq.test', 'piloto', false),
('pedro.piloto@avibaq.test', 'piloto', false),

-- Agências de teste
('contato@voosmagicos.test', 'agencia', false),
('admin@balaoaventura.test', 'agencia', false)

ON CONFLICT (email) DO UPDATE SET
role = EXCLUDED.role,
primeira_senha = EXCLUDED.primeira_senha;

-- Função auxiliar para criar usuários no auth.users via API
-- NOTA: Esta função precisa ser executada manualmente pelo administrador
-- usando o dashboard do Supabase ou API, pois requer privilégios de service_role

-- Comentário com instruções para o administrador:
/*
Para completar a configuração dos usuários de teste, execute no dashboard do Supabase:

1. Vá para Authentication > Users
2. Crie os seguintes usuários com senha "teste123":

- joao.piloto@avibaq.test (senha: teste123)
- maria.piloto@avibaq.test (senha: teste123)
- pedro.piloto@avibaq.test (senha: teste123)
- contato@voosmagicos.test (senha: teste123)
- admin@balaoaventura.test (senha: teste123)

OU use este SQL no SQL Editor com privilégios de service_role:

SELECT auth.sign_up('joao.piloto@avibaq.test', 'teste123', jsonb_build_object('confirm_email', true));
SELECT auth.sign_up('maria.piloto@avibaq.test', 'teste123', jsonb_build_object('confirm_email', true));
SELECT auth.sign_up('pedro.piloto@avibaq.test', 'teste123', jsonb_build_object('confirm_email', true));
SELECT auth.sign_up('contato@voosmagicos.test', 'teste123', jsonb_build_object('confirm_email', true));
SELECT auth.sign_up('admin@balaoaventura.test', 'teste123', jsonb_build_object('confirm_email', true));

3. Após criar os usuários, execute o UPDATE abaixo para vincular user_id
*/

-- Comentário sobre vinculação de user_id
COMMENT ON TABLE users IS 'Tabela de usuários customizada. Usuários de teste devem ser criados manualmente via dashboard do Supabase';

-- Trigger para vincular automaticamente user_id quando usuário faz login
CREATE OR REPLACE FUNCTION vincular_user_id_membro()
RETURNS TRIGGER AS $$
BEGIN
  -- Atualizar user_id no membro correspondente quando usuário faz login
  UPDATE membros 
  SET user_id = NEW.id 
  WHERE email = NEW.email 
  AND user_id IS NULL;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger na tabela auth.users para vincular automaticamente
-- NOTA: Este trigger só funciona se executado com privilégios corretos
-- DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
-- CREATE TRIGGER on_auth_user_created
--   AFTER INSERT ON auth.users
--   FOR EACH ROW EXECUTE FUNCTION vincular_user_id_membro();

-- Log da migração
INSERT INTO logs_atividade (acao, detalhes) VALUES 
('create_test_users', jsonb_build_object(
  'usuarios_teste_preparados', 5,
  'piloto_usuarios', 3,
  'agencia_usuarios', 2,
  'observacao', 'Usuários devem ser criados manualmente via dashboard',
  'data_criacao', NOW()
));