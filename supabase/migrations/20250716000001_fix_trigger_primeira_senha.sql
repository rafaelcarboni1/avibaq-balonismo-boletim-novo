-- Migração: Corrigir trigger para definir primeira_senha=false em cadastros normais
-- Data: 2025-07-16
-- Objetivo: Usuários que se cadastram via formulário não devem ter primeira_senha=true

-- Remover trigger anterior
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Remover função anterior
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Função corrigida que define primeira_senha=false para cadastros normais
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  -- Inserir com primeira_senha=false para cadastros normais
  INSERT INTO public.users (id, nome, email, role, username, primeira_senha, created_at)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nome', NEW.email), -- usar email como fallback para nome
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'piloto'),
    COALESCE(NEW.raw_user_meta_data->>'username', SPLIT_PART(NEW.email, '@', 1)), -- usar parte do email como username
    false, -- primeira_senha=false para cadastros normais
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

-- Recrear o trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Comentário: Esta versão define primeira_senha=false para usuários que se cadastram normalmente