-- Migração: Corrigir trigger para criação automática de perfil de usuário
-- Data: 2025-07-15
-- Objetivo: Resolver problemas de campos NULL e compatibilidade do trigger

-- Primeiro, remover o trigger anterior se existir
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Remover a função anterior se existir
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Função corrigida que será chamada pelo trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  -- Inserir com valores padrão para campos que podem ser NULL
  INSERT INTO public.users (id, nome, email, role, username, created_at)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nome', NEW.email), -- usar email como fallback para nome
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'piloto'),
    COALESCE(NEW.raw_user_meta_data->>'username', SPLIT_PART(NEW.email, '@', 1)), -- usar parte do email como username
    NOW()
  );
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log do erro para debug (aparecerá nos logs do Supabase)
    RAISE LOG 'Erro no trigger handle_new_user: %', SQLERRM;
    RETURN NEW; -- Continua mesmo com erro para não bloquear o signup
END;
$$;

-- Trigger corrigido que chama a função após cada novo usuário ser criado no auth
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Comentário: Esta versão corrigida trata campos NULL e usa EXECUTE FUNCTION
-- em vez de EXECUTE PROCEDURE para melhor compatibilidade