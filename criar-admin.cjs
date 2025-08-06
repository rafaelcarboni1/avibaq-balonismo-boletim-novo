const { createClient } = require('@supabase/supabase-js');

// Substitua pelos seus dados:
const SUPABASE_URL = 'https://elcbodhxzvoqpzamgown.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVsY2JvZGh4enZvcXB6YW1nb3duIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTMwNDc4MCwiZXhwIjoyMDY2ODgwNzgwfQ.UfTwpvPuw4ffuPHS9UPBIMNYPOuSmde8WxnN4FXVSAs'; // NUNCA use a anon key aqui!
const EMAIL = 'admin@teste.com';
const SENHA = 'Teste123!';
const NOME = 'Administrador';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function criarAdmin() {
  // 1. Cria usuário no Auth
  const { data: userData, error: userError } = await supabase.auth.admin.createUser({
    email: EMAIL,
    password: SENHA,
    email_confirm: true,
  });

  if (userError) {
    console.error('Erro ao criar usuário no Auth:', userError.message);
    process.exit(1);
  }

  const user = userData.user;
  console.log('Usuário criado no Auth:', user.id, user.email);

  // 2. Insere na tabela users
  const { error: dbError } = await supabase.from('users').insert({
    id: user.id,
    email: EMAIL,
    nome: NOME,
    perfil: 'administrador',
    ativo: true,
    senha_hash: 'supabase', // não é usada, só precisa ser preenchida
  });

  if (dbError) {
    console.error('Erro ao inserir na tabela users:', dbError.message);
    process.exit(1);
  }

  console.log('Usuário admin criado com sucesso!');
}

criarAdmin(); 