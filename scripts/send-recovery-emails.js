/**
 * Script para enviar emails de recovery para usuários migrados
 * Usa a API do Resend para enviar emails com os links de redefinição
 */

import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const resendKey = process.env.RESEND_API_KEY;

if (!supabaseUrl || !serviceRoleKey || !resendKey) {
  console.error('❌ Variáveis de ambiente necessárias não encontradas');
  console.log('Necessário: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, RESEND_API_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const resend = new Resend(resendKey);

console.log('📧 ENVIANDO EMAILS DE RECOVERY - AVIBAQ');
console.log('======================================\n');

try {
  // Buscar usuários que foram migrados recentemente (últimas 24h)
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

  console.log(`📊 Encontrados ${users.length} usuários migrados recentemente\n`);

  if (users.length === 0) {
    console.log('ℹ️  Nenhum usuário encontrado para envio de email');
    process.exit(0);
  }

  const results = { success: 0, errors: 0, errorDetails: [] };

  for (const user of users) {
    const displayName = user.nome || user.razao_social || user.nome_fantasia || 'Usuário AVIBAQ';
    console.log(`📧 Enviando para: ${displayName} (${user.email})`);

    try {
      // Gerar novo link de recovery
      const { data: recoveryData, error: recoveryError } = await supabase.auth.admin.generateLink({
        type: 'recovery',
        email: user.email,
        options: {
          redirectTo: 'https://avibaq-balonismo-boletim-novo.vercel.app/redefinir-senha'
        }
      });

      if (recoveryError) {
        console.error(`   ❌ Erro ao gerar link:`, recoveryError.message);
        results.errors++;
        results.errorDetails.push({ email: user.email, error: recoveryError.message });
        continue;
      }

      const recoveryLink = recoveryData?.properties?.action_link;
      if (!recoveryLink) {
        console.error(`   ❌ Link de recovery não gerado`);
        results.errors++;
        results.errorDetails.push({ email: user.email, error: 'Link não gerado' });
        continue;
      }

      // Definir saudação baseada no tipo de usuário
      const userType = user.role === 'piloto' ? 'Piloto' : 'Agência';
      const dashboardUrl = user.role === 'piloto' 
        ? 'https://avibaq-balonismo-boletim-novo.vercel.app/piloto/login'
        : 'https://avibaq-balonismo-boletim-novo.vercel.app/agencia/login';

      // Enviar email
      const { data: emailData, error: emailError } = await resend.emails.send({
        from: 'AVIBAQ Sistema <noreply@avibaq.org>',
        to: [user.email],
        subject: `🔐 Acesso ao Sistema AVIBAQ - Definir sua senha`,
        html: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #3b82f6, #8b5cf6); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center; }
        .content { background: #f8fafc; padding: 30px; border-radius: 0 0 10px 10px; }
        .button { display: inline-block; background: #3b82f6; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
        .warning { background: #fef3c7; border: 1px solid #f59e0b; padding: 15px; border-radius: 8px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #666; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎈 AVIBAQ</h1>
            <p>Associação de Pilotos e Empresas de Balonismo</p>
        </div>
        
        <div class="content">
            <h2>Olá, ${displayName}!</h2>
            
            <p>Seu acesso ao Sistema AVIBAQ foi criado com sucesso! Você está registrado como <strong>${userType}</strong> em nossa plataforma.</p>
            
            <p><strong>📋 Para acessar o sistema, você precisa definir sua senha:</strong></p>
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="${recoveryLink}" class="button">
                    🔐 Definir Minha Senha
                </a>
            </div>
            
            <div class="warning">
                <strong>⚠️ IMPORTANTE:</strong>
                <ul>
                    <li>Este link é válido por 24 horas</li>
                    <li>Após definir a senha, acesse: <a href="${dashboardUrl}">${dashboardUrl}</a></li>
                    <li>Use o email <strong>${user.email}</strong> para fazer login</li>
                </ul>
            </div>
            
            <h3>🎯 O que você pode fazer no sistema:</h3>
            ${user.role === 'piloto' ? `
            <ul>
                <li>📊 Acompanhar boletins meteorológicos</li>
                <li>✈️ Gerenciar seus balões registrados</li>
                <li>📋 Realizar checklists de segurança</li>
                <li>📝 Registrar relatórios pós-voo</li>
                <li>👤 Atualizar perfil e dados pessoais</li>
            </ul>
            ` : `
            <ul>
                <li>📊 Dashboard de gestão da agência</li>
                <li>👥 Gerenciar pilotos vinculados</li>
                <li>✈️ Controlar frota de balões</li>
                <li>📋 Acompanhar operações de voo</li>
                <li>🏢 Atualizar dados empresariais</li>
            </ul>
            `}
            
            <p>Se você tiver qualquer dúvida, entre em contato conosco.</p>
            
            <p><strong>Bem-vindo(a) ao Sistema AVIBAQ!</strong><br>
            Equipe AVIBAQ</p>
        </div>
    </div>
    
    <div class="footer">
        <p>AVIBAQ - Associação de Pilotos e Empresas de Balonismo<br>
        Praia Grande/SC - Brasil</p>
    </div>
</body>
</html>
        `
      });

      if (emailError) {
        console.error(`   ❌ Erro ao enviar email:`, emailError.message);
        results.errors++;
        results.errorDetails.push({ email: user.email, error: emailError.message });
        continue;
      }

      console.log(`   ✅ Email enviado com sucesso! ID: ${emailData.id}`);
      results.success++;

    } catch (error) {
      console.error(`   ❌ Erro inesperado:`, error.message);
      results.errors++;
      results.errorDetails.push({ email: user.email, error: error.message });
    }

    // Pequena pausa para não sobrecarregar a API
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  // Resumo final
  console.log('\n🎉 ENVIO DE EMAILS CONCLUÍDO!');
  console.log('============================');
  console.log(`📧 Total processado: ${users.length} usuários`);
  console.log(`✅ Emails enviados: ${results.success}`);
  console.log(`❌ Erros: ${results.errors}\n`);

  if (results.errors > 0) {
    console.log('📋 DETALHES DOS ERROS:');
    console.log('=====================');
    results.errorDetails.forEach((item, index) => {
      console.log(`${index + 1}. ${item.email}: ${item.error}`);
    });
    console.log('');
  }

  console.log('💡 PRÓXIMOS PASSOS:');
  console.log('==================');
  console.log('1. Os usuários receberão o email em alguns minutos');
  console.log('2. Eles devem clicar no link para definir a senha');
  console.log('3. Após definir a senha, poderão acessar o sistema');
  console.log('4. Monitore logs de login para verificar sucesso\n');

} catch (error) {
  console.error('❌ Erro fatal:', error.message);
} finally {
  console.log('🔄 Finalizando processo...');
  process.exit(0);
}