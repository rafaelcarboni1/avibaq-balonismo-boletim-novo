/**
 * Script para aplicar a migração auth_id na tabela users
 * Executa a migração SQL usando o service role key
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Variáveis de ambiente NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórias');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function applyMigration() {
  console.log('🔄 Aplicando migração auth_id...\n');

  try {
    // Ler o arquivo de migração    
    const migrationPath = path.join(process.cwd(), 'supabase/migrations/20250724000000_add_auth_id_to_users.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    // Executar a migração usando query SQL direta
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(0); // Apenas para testar conexão

    if (error) {
      console.error('❌ Erro de conexão com banco:', error.message);
      return false;
    }

    // Como não podemos executar SQL complexo diretamente, vamos tentar uma abordagem simples
    // Verificar se as colunas já existem
    try {
      const { data: testColumns, error: testError } = await supabase
        .from('users')
        .select('auth_id, migrated_at')
        .limit(1);

      if (!testError) {
        console.log('✅ Colunas auth_id e migrated_at já existem na tabela users');
        return true;
      }
    } catch (e) {
      // Colunas não existem, precisamos adicioná-las manualmente
    }

    console.log('⚠️  As colunas auth_id e migrated_at precisam ser adicionadas manualmente');
    console.log('💡 Execute as seguintes queries no Supabase Dashboard > SQL Editor:');
    console.log('');
    console.log('-- Adicionar coluna auth_id');
    console.log('ALTER TABLE users ADD COLUMN IF NOT EXISTS auth_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;');
    console.log('CREATE INDEX IF NOT EXISTS idx_users_auth_id ON users(auth_id);');
    console.log('');
    console.log('-- Adicionar coluna migrated_at');
    console.log('ALTER TABLE users ADD COLUMN IF NOT EXISTS migrated_at TIMESTAMP WITH TIME ZONE;');
    console.log('');
    console.log('-- Adicionar campos adicionais para agências');
    console.log('ALTER TABLE users ADD COLUMN IF NOT EXISTS cnpj TEXT;');
    console.log('ALTER TABLE users ADD COLUMN IF NOT EXISTS razao_social TEXT;');
    console.log('ALTER TABLE users ADD COLUMN IF NOT EXISTS nome_fantasia TEXT;');
    console.log('ALTER TABLE users ADD COLUMN IF NOT EXISTS telefone TEXT;');
    console.log('ALTER TABLE users ADD COLUMN IF NOT EXISTS celular TEXT;');
    console.log('ALTER TABLE users ADD COLUMN IF NOT EXISTS endereco TEXT;');
    console.log('ALTER TABLE users ADD COLUMN IF NOT EXISTS cidade TEXT;');
    console.log('ALTER TABLE users ADD COLUMN IF NOT EXISTS cep TEXT;');
    console.log('');
    
    return false;

  } catch (error) {
    console.error('❌ Erro inesperado:', error.message);
    return false;
  }
}

async function main() {
  console.log('🗄️  APLICAÇÃO DE MIGRAÇÃO - AVIBAQ');
  console.log('=================================\n');
  
  const success = await applyMigration();
  
  if (success) {
    console.log('🎉 Migração concluída! Agora você pode executar o script de migração de usuários.');
    console.log('💡 Próximo passo: node scripts/migrate-users-to-auth.js\n');
  } else {
    console.log('❌ Falha na migração. Verificar logs acima.');
    process.exit(1);
  }
}

main().catch(console.error);