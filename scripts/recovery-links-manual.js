/**
 * Script para gerar arquivo de texto com todos os links de recovery
 * Para casos onde você prefere enviar manualmente ou usar outro sistema de email
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Variáveis de ambiente necessárias não encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

console.log('📄 GERANDO ARQUIVO COM LINKS DE RECOVERY');
console.log('=======================================\n');

try {
  // Buscar usuários migrados recentemente
  const twentyFourHoursAgo = new Date();
  twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

  const { data: users, error: usersError } = await supabase
    .from('users')
    .select('email, nome, razao_social, nome_fantasia, role')
    .in('role', ['piloto', 'agencia'])
    .not('auth_id', 'is', null)
    .gte('migrated_at', twentyFourHoursAgo.toISOString());

  if (usersError) {
    console.error('❌ Erro ao buscar usuários:', usersError.message);
    process.exit(1);
  }

  console.log(`📊 Processando ${users.length} usuários...\n`);

  let fileContent = `# LINKS DE RECOVERY - SISTEMA AVIBAQ
# Gerado em: ${new Date().toLocaleString('pt-BR')}
# Total de usuários: ${users.length}

==================================================
INSTRUÇÕES PARA ENVIO MANUAL DE EMAILS
==================================================

Copie e cole o template abaixo para cada usuário, substituindo:
- [NOME] pelo nome do usuário
- [EMAIL] pelo email do usuário  
- [LINK] pelo link de recovery gerado
- [TIPO] por "Piloto" ou "Agência"

TEMPLATE DE EMAIL:
--------------------------------------------------
Assunto: 🔐 Acesso ao Sistema AVIBAQ - Definir sua senha

Olá [NOME]!

Seu acesso ao Sistema AVIBAQ foi criado com sucesso! Você está registrado como [TIPO] em nossa plataforma.

Para acessar o sistema, clique no link abaixo para definir sua senha:
[LINK]

⚠️ IMPORTANTE:
- Este link é válido por 24 horas
- Use o email [EMAIL] para fazer login
- Após definir a senha, acesse seu painel em:
  Pilotos: https://avibaq-balonismo-boletim-novo.vercel.app/piloto/login
  Agências: https://avibaq-balonismo-boletim-novo.vercel.app/agencia/login

Bem-vindo(a) ao Sistema AVIBAQ!
Equipe AVIBAQ

==================================================
DADOS DOS USUÁRIOS E LINKS
==================================================

`;

  for (let i = 0; i < users.length; i++) {
    const user = users[i];
    const displayName = user.nome || user.razao_social || user.nome_fantasia || 'Nome não definido';
    const userType = user.role === 'piloto' ? 'Piloto' : 'Agência';
    
    console.log(`🔗 [${i + 1}/${users.length}] Gerando link para: ${displayName}`);
    
    try {
      // Gerar link de recovery
      const { data: recoveryData, error: recoveryError } = await supabase.auth.admin.generateLink({
        type: 'recovery',
        email: user.email,
        options: {
          redirectTo: 'https://avibaq-balonismo-boletim-novo.vercel.app/redefinir-senha'
        }
      });

      if (recoveryError) {
        console.error(`   ❌ Erro: ${recoveryError.message}`);
        fileContent += `ERRO - ${displayName} (${user.email}): ${recoveryError.message}\n\n`;
        continue;
      }

      const recoveryLink = recoveryData?.properties?.action_link;
      if (!recoveryLink) {
        console.error(`   ❌ Link não gerado`);
        fileContent += `ERRO - ${displayName} (${user.email}): Link não gerado\n\n`;
        continue;
      }

      // Adicionar ao arquivo
      fileContent += `${i + 1}. ${displayName} (${userType})
   Email: ${user.email}
   Link: ${recoveryLink}
   
   EMAIL PERSONALIZADO:
   -------------------
   Assunto: 🔐 Acesso ao Sistema AVIBAQ - Definir sua senha
   
   Olá ${displayName}!
   
   Seu acesso ao Sistema AVIBAQ foi criado como ${userType}.
   
   Clique aqui para definir sua senha:
   ${recoveryLink}
   
   Use o email ${user.email} para fazer login.
   
   Bem-vindo(a) ao Sistema AVIBAQ!
   
==================================================

`;

      console.log(`   ✅ Link gerado com sucesso`);
      
    } catch (error) {
      console.error(`   ❌ Erro inesperado: ${error.message}`);
      fileContent += `ERRO - ${displayName} (${user.email}): ${error.message}\n\n`;
    }
  }

  // Adicionar instruções finais
  fileContent += `
==================================================
RESUMO E INSTRUÇÕES FINAIS
==================================================

Total de usuários processados: ${users.length}

COMO USAR ESTE ARQUIVO:
1. Copie o "EMAIL PERSONALIZADO" de cada usuário
2. Envie por email ou WhatsApp para cada um
3. Aguarde eles clicarem no link e definirem a senha
4. Teste o login de alguns usuários

LINKS VÁLIDOS POR: 24 horas

Gerado em: ${new Date().toLocaleString('pt-BR')}
`;

  // Salvar arquivo
  const fileName = `recovery-links-${new Date().toISOString().split('T')[0]}.txt`;
  fs.writeFileSync(fileName, fileContent, 'utf8');

  console.log(`\n📄 Arquivo gerado: ${fileName}`);
  console.log('✅ Todos os links e templates foram salvos!\n');
  
  console.log('💡 COMO USAR:');
  console.log('=============');
  console.log(`1. Abra o arquivo: ${fileName}`);
  console.log('2. Copie o email personalizado de cada usuário');
  console.log('3. Envie por email, WhatsApp ou outro meio');
  console.log('4. Os usuários clicam no link para definir senha\n');

} catch (error) {
  console.error('❌ Erro fatal:', error.message);
} finally {
  console.log('🔄 Processo finalizado!');
  process.exit(0);
}