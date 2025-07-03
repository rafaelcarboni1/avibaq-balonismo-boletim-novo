const { createClient } = require('@supabase/supabase-js');

// Dados do seu projeto:
const SUPABASE_URL = 'https://elcbodhxzvoqpzamgown.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVsY2JvZGh4enZvcXB6YW1nb3duIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTMwNDc4MCwiZXhwIjoyMDY2ODgwNzgwfQ.UfTwpvPuw4ffuPHS9UPBIMNYPOuSmde8WxnN4FXVSAs';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function criarUsuario() {
  const { data, error } = await supabase.auth.admin.createUser({
    email: 'rafaeldacunhacarboni@gmail.com',
    password: 'Rafinha885@',
    email_confirm: true,
  });

  if (error) {
    console.error('Erro ao criar usuário:', error.message);
  } else {
    console.log('Usuário criado com sucesso:', data.user.email);
  }
}

criarUsuario(); 