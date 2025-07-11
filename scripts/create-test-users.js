/**
 * Script para criar usuários de teste no Supabase
 * 
 * Este script cria os usuários de teste necessários para testar o módulo de voos
 * Usa o service_role_key para ter privilégios administrativos
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Variáveis de ambiente SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórias');
  process.exit(1);
}

// Cliente com privilégios administrativos
const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Usuários de teste para criar
const testUsers = [
  {
    email: 'joao.piloto@avibaq.test',
    password: 'teste123',
    role: 'piloto',
    name: 'João Silva Piloto'
  },
  {
    email: 'maria.piloto@avibaq.test',
    password: 'teste123',
    role: 'piloto',
    name: 'Maria Santos Piloto'
  },
  {
    email: 'pedro.piloto@avibaq.test',
    password: 'teste123',
    role: 'piloto',
    name: 'Pedro Costa Piloto'
  },
  {
    email: 'contato@voosmagicos.test',
    password: 'teste123',
    role: 'agencia',
    name: 'Ana Ferreira (Voos Mágicos)'
  },
  {
    email: 'admin@balaoaventura.test',
    password: 'teste123',
    role: 'agencia',
    name: 'Carlos Oliveira (Balão Aventura)'
  }
];

async function createTestUsers() {
  console.log('🚀 Iniciando criação de usuários de teste...\n');

  for (const user of testUsers) {
    try {
      console.log(`📧 Criando usuário: ${user.email}`);
      
      // Tentar criar usuário diretamente (se já existir, receberemos um erro)

      // Criar usuário
      const { data, error } = await supabase.auth.admin.createUser({
        email: user.email,
        password: user.password,
        email_confirm: true, // Marcar email como confirmado automaticamente
        user_metadata: {
          name: user.name,
          role: user.role
        }
      });

      if (error) {
        console.error(`   ❌ Erro ao criar ${user.email}:`, error.message);
        continue;
      }

      console.log(`   ✅ Usuário criado com sucesso!`);

      // Adicionar ou atualizar na tabela users customizada
      const { error: userTableError } = await supabase
        .from('users')
        .upsert({
          email: user.email,
          role: user.role,
          primeira_senha: false
        }, {
          onConflict: 'email'
        });

      if (userTableError) {
        console.error(`   ⚠️  Erro ao atualizar tabela users:`, userTableError.message);
      } else {
        console.log(`   ✅ Dados atualizados na tabela users`);
      }

      // Atualizar user_id na tabela membros
      if (data.user?.id) {
        const { error: membroError } = await supabase
          .from('membros')
          .update({ user_id: data.user.id })
          .eq('email', user.email);

        if (membroError) {
          console.error(`   ⚠️  Erro ao vincular com membro:`, membroError.message);
        } else {
          console.log(`   ✅ Usuário vinculado ao membro correspondente`);
        }
      }

    } catch (error) {
      console.error(`   ❌ Erro inesperado ao criar ${user.email}:`, error.message);
    }

    console.log(''); // Linha em branco para separar usuários
  }

  console.log('🎉 Processo de criação de usuários concluído!');
  console.log('\n📋 Credenciais de teste:');
  console.log('========================');
  
  testUsers.forEach(user => {
    console.log(`${user.role.toUpperCase()}: ${user.email} / ${user.password}`);
  });

  console.log('\n🔗 URLs de teste:');
  console.log('==================');
  console.log('Pilotos: http://localhost:3000/piloto/login');
  console.log('Agências: http://localhost:3000/agencia/login');
}

async function checkDatabase() {
  console.log('🔍 Verificando estrutura do banco de dados...\n');

  try {
    // Verificar se tabela users existe
    const { data: usersTable, error: usersError } = await supabase
      .from('users')
      .select('email, role')
      .limit(1);

    if (usersError) {
      console.error('❌ Tabela users não encontrada:', usersError.message);
      console.log('   💡 Execute as migrações primeiro: npx supabase db push');
      return false;
    }

    // Verificar se tabela membros existe  
    const { data: membrosTable, error: membrosError } = await supabase
      .from('membros')
      .select('id, email')
      .limit(1);

    if (membrosError) {
      console.error('❌ Tabela membros não encontrada:', membrosError.message);
      console.log('   💡 Execute as migrações primeiro: npx supabase db push');
      return false;
    }

    console.log('✅ Estrutura do banco de dados está correta');
    return true;

  } catch (error) {
    console.error('❌ Erro ao verificar banco de dados:', error.message);
    return false;
  }
}

async function main() {
  console.log('🧪 Script de Criação de Usuários de Teste - Módulo de Voos\n');
  
  // Verificar estrutura do banco
  const dbOk = await checkDatabase();
  if (!dbOk) {
    console.log('\n🛑 Pare aqui e execute as migrações antes de continuar.');
    process.exit(1);
  }

  console.log(''); // Linha em branco
  
  // Criar usuários
  await createTestUsers();
  
  console.log('\n🚀 Agora você pode testar o sistema de login!');
}

main().catch(console.error);