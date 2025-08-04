const { Client } = require('pg');
const fs = require('fs');

// Connection string para o Supabase
const connectionString = 'postgresql://postgres:4YJdnUrdatO3QhAH@db.elcbodhxzvoqpzamgown.supabase.co:5432/postgres';

async function analyzeDatabase() {
  const client = new Client({
    connectionString: connectionString,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    await client.connect();
    console.log('✅ Conectado ao banco Supabase!');

    const analysis = {
      timestamp: new Date().toISOString(),
      database_info: {},
      tables: {},
      functions: [],
      triggers: [],
      policies: [],
      extensions: [],
      indexes: []
    };

    // 1. Informações básicas do banco
    console.log('📊 Coletando informações básicas...');
    const dbInfo = await client.query(`
      SELECT 
        current_database() as database_name,
        current_user as current_user,
        version() as postgres_version
    `);
    analysis.database_info = dbInfo.rows[0];

    // 2. Listar todas as tabelas com detalhes
    console.log('📋 Analisando tabelas...');
    const tablesQuery = await client.query(`
      SELECT 
        t.table_name,
        t.table_type,
        obj_description(c.oid) as table_comment
      FROM information_schema.tables t
      LEFT JOIN pg_class c ON c.relname = t.table_name
      WHERE t.table_schema = 'public'
      AND t.table_type = 'BASE TABLE'
      ORDER BY t.table_name
    `);

    // Para cada tabela, obter colunas detalhadas
    for (const table of tablesQuery.rows) {
      const tableName = table.table_name;
      console.log(`  📄 Analisando tabela: ${tableName}`);

      // Colunas da tabela
      const columnsQuery = await client.query(`
        SELECT 
          c.column_name,
          c.data_type,
          c.is_nullable,
          c.column_default,
          c.character_maximum_length,
          c.numeric_precision,
          c.numeric_scale,
          col_description(pgc.oid, c.ordinal_position) as column_comment
        FROM information_schema.columns c
        LEFT JOIN pg_class pgc ON pgc.relname = c.table_name
        WHERE c.table_schema = 'public' 
        AND c.table_name = $1
        ORDER BY c.ordinal_position
      `, [tableName]);

      // Chaves primárias
      const primaryKeysQuery = await client.query(`
        SELECT kcu.column_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu 
          ON tc.constraint_name = kcu.constraint_name
        WHERE tc.table_schema = 'public'
        AND tc.table_name = $1
        AND tc.constraint_type = 'PRIMARY KEY'
      `, [tableName]);

      // Chaves estrangeiras
      const foreignKeysQuery = await client.query(`
        SELECT 
          kcu.column_name,
          ccu.table_name AS foreign_table_name,
          ccu.column_name AS foreign_column_name,
          tc.constraint_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu 
          ON tc.constraint_name = kcu.constraint_name
        JOIN information_schema.constraint_column_usage ccu 
          ON ccu.constraint_name = tc.constraint_name
        WHERE tc.table_schema = 'public'
        AND tc.table_name = $1
        AND tc.constraint_type = 'FOREIGN KEY'
      `, [tableName]);

      // Índices
      const indexesQuery = await client.query(`
        SELECT 
          i.relname as index_name,
          a.attname as column_name,
          ix.indisunique as is_unique,
          ix.indisprimary as is_primary
        FROM pg_class t
        JOIN pg_index ix ON t.oid = ix.indrelid
        JOIN pg_class i ON i.oid = ix.indexrelid
        JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = ANY(ix.indkey)
        WHERE t.relname = $1
        AND t.relkind = 'r'
      `, [tableName]);

      // Contar registros
      const countQuery = await client.query(`SELECT COUNT(*) as row_count FROM "${tableName}"`);

      analysis.tables[tableName] = {
        ...table,
        columns: columnsQuery.rows,
        primary_keys: primaryKeysQuery.rows,
        foreign_keys: foreignKeysQuery.rows,
        indexes: indexesQuery.rows,
        row_count: parseInt(countQuery.rows[0].row_count)
      };
    }

    // 3. Funções e procedures
    console.log('⚙️ Analisando funções...');
    const functionsQuery = await client.query(`
      SELECT 
        p.proname as function_name,
        pg_get_function_result(p.oid) as return_type,
        pg_get_function_arguments(p.oid) as arguments,
        obj_description(p.oid) as description,
        l.lanname as language
      FROM pg_proc p
      JOIN pg_namespace n ON p.pronamespace = n.oid
      JOIN pg_language l ON p.prolang = l.oid
      WHERE n.nspname = 'public'
      ORDER BY p.proname
    `);
    analysis.functions = functionsQuery.rows;

    // 4. Triggers
    console.log('🔄 Analisando triggers...');
    const triggersQuery = await client.query(`
      SELECT 
        t.trigger_name,
        t.event_manipulation,
        t.event_object_table,
        t.action_timing,
        t.action_statement
      FROM information_schema.triggers t
      WHERE t.trigger_schema = 'public'
      ORDER BY t.event_object_table, t.trigger_name
    `);
    analysis.triggers = triggersQuery.rows;

    // 5. Políticas RLS
    console.log('🔒 Analisando políticas RLS...');
    const policiesQuery = await client.query(`
      SELECT 
        schemaname,
        tablename,
        policyname,
        permissive,
        roles,
        cmd,
        qual,
        with_check
      FROM pg_policies
      WHERE schemaname = 'public'
      ORDER BY tablename, policyname
    `);
    analysis.policies = policiesQuery.rows;

    // 6. Extensões
    console.log('🔌 Analisando extensões...');
    const extensionsQuery = await client.query(`
      SELECT 
        extname as extension_name,
        extversion as version,
        extrelocatable as relocatable
      FROM pg_extension
      ORDER BY extname
    `);
    analysis.extensions = extensionsQuery.rows;

    // 7. Salvar análise completa
    const outputPath = './.trae/documents/analise-completa-banco-supabase.json';
    fs.writeFileSync(outputPath, JSON.stringify(analysis, null, 2));
    console.log(`\n✅ Análise completa salva em: ${outputPath}`);

    // 8. Gerar relatório em Markdown
    const markdownReport = generateMarkdownReport(analysis);
    const markdownPath = './.trae/documents/relatorio-banco-supabase-completo.md';
    fs.writeFileSync(markdownPath, markdownReport);
    console.log(`📄 Relatório em Markdown salvo em: ${markdownPath}`);

    console.log('\n🎉 Análise concluída com sucesso!');
    console.log(`📊 Total de tabelas: ${Object.keys(analysis.tables).length}`);
    console.log(`⚙️ Total de funções: ${analysis.functions.length}`);
    console.log(`🔄 Total de triggers: ${analysis.triggers.length}`);
    console.log(`🔒 Total de políticas RLS: ${analysis.policies.length}`);
    console.log(`🔌 Total de extensões: ${analysis.extensions.length}`);

  } catch (error) {
    console.error('❌ Erro ao analisar banco:', error.message);
    console.error('\n💡 Dicas para resolver:');
    console.error('1. Verifique se a senha está correta na connection string');
    console.error('2. Confirme se o projeto Supabase está ativo');
    console.error('3. Verifique as configurações de firewall/rede');
    console.error('4. Teste a conexão através do Supabase Dashboard');
  } finally {
    await client.end();
  }
}

function generateMarkdownReport(analysis) {
  let markdown = `# Análise Completa do Banco de Dados Supabase\n\n`;
  markdown += `**Projeto:** elcbodhxzvoqpzamgown\n`;
  markdown += `**Data da Análise:** ${analysis.timestamp}\n`;
  markdown += `**Banco:** ${analysis.database_info.database_name}\n`;
  markdown += `**Usuário:** ${analysis.database_info.current_user}\n`;
  markdown += `**Versão PostgreSQL:** ${analysis.database_info.postgres_version}\n\n`;

  // Resumo executivo
  markdown += `## 📊 Resumo Executivo\n\n`;
  markdown += `- **Tabelas:** ${Object.keys(analysis.tables).length}\n`;
  markdown += `- **Funções:** ${analysis.functions.length}\n`;
  markdown += `- **Triggers:** ${analysis.triggers.length}\n`;
  markdown += `- **Políticas RLS:** ${analysis.policies.length}\n`;
  markdown += `- **Extensões:** ${analysis.extensions.length}\n\n`;

  // Tabelas detalhadas
  markdown += `## 📋 Estrutura das Tabelas\n\n`;
  for (const [tableName, tableData] of Object.entries(analysis.tables)) {
    markdown += `### ${tableName}\n\n`;
    if (tableData.table_comment) {
      markdown += `**Descrição:** ${tableData.table_comment}\n\n`;
    }
    markdown += `**Registros:** ${tableData.row_count}\n\n`;
    
    markdown += `#### Colunas\n\n`;
    markdown += `| Coluna | Tipo | Nulo | Padrão | Comentário |\n`;
    markdown += `|--------|------|------|--------|------------|\n`;
    
    for (const col of tableData.columns) {
      const nullable = col.is_nullable === 'YES' ? '✅' : '❌';
      const defaultVal = col.column_default || '-';
      const comment = col.column_comment || '-';
      markdown += `| ${col.column_name} | ${col.data_type} | ${nullable} | ${defaultVal} | ${comment} |\n`;
    }
    
    if (tableData.primary_keys.length > 0) {
      markdown += `\n**Chaves Primárias:** ${tableData.primary_keys.map(pk => pk.column_name).join(', ')}\n`;
    }
    
    if (tableData.foreign_keys.length > 0) {
      markdown += `\n**Chaves Estrangeiras:**\n`;
      for (const fk of tableData.foreign_keys) {
        markdown += `- ${fk.column_name} → ${fk.foreign_table_name}.${fk.foreign_column_name}\n`;
      }
    }
    
    markdown += `\n---\n\n`;
  }

  // Funções
  if (analysis.functions.length > 0) {
    markdown += `## ⚙️ Funções e Procedures\n\n`;
    for (const func of analysis.functions) {
      markdown += `### ${func.function_name}\n\n`;
      markdown += `- **Argumentos:** ${func.arguments || 'Nenhum'}\n`;
      markdown += `- **Retorno:** ${func.return_type}\n`;
      markdown += `- **Linguagem:** ${func.language}\n`;
      if (func.description) {
        markdown += `- **Descrição:** ${func.description}\n`;
      }
      markdown += `\n`;
    }
  }

  // Triggers
  if (analysis.triggers.length > 0) {
    markdown += `## 🔄 Triggers\n\n`;
    markdown += `| Trigger | Tabela | Evento | Timing | Ação |\n`;
    markdown += `|---------|--------|--------|--------|------|\n`;
    for (const trigger of analysis.triggers) {
      markdown += `| ${trigger.trigger_name} | ${trigger.event_object_table} | ${trigger.event_manipulation} | ${trigger.action_timing} | ${trigger.action_statement} |\n`;
    }
    markdown += `\n`;
  }

  // Políticas RLS
  if (analysis.policies.length > 0) {
    markdown += `## 🔒 Políticas RLS (Row Level Security)\n\n`;
    for (const policy of analysis.policies) {
      markdown += `### ${policy.tablename}.${policy.policyname}\n\n`;
      markdown += `- **Comando:** ${policy.cmd}\n`;
      markdown += `- **Roles:** ${policy.roles ? policy.roles.join(', ') : 'Todos'}\n`;
      if (policy.qual) {
        markdown += `- **Condição:** \`${policy.qual}\`\n`;
      }
      if (policy.with_check) {
        markdown += `- **Verificação:** \`${policy.with_check}\`\n`;
      }
      markdown += `\n`;
    }
  }

  // Extensões
  if (analysis.extensions.length > 0) {
    markdown += `## 🔌 Extensões Instaladas\n\n`;
    markdown += `| Extensão | Versão | Relocável |\n`;
    markdown += `|----------|--------|-----------|\n`;
    for (const ext of analysis.extensions) {
      const relocatable = ext.relocatable ? '✅' : '❌';
      markdown += `| ${ext.extension_name} | ${ext.version} | ${relocatable} |\n`;
    }
    markdown += `\n`;
  }

  markdown += `## 🔗 Integração com o Código\n\n`;
  markdown += `Esta análise foi gerada automaticamente através de conexão direta com o banco PostgreSQL do Supabase.\n`;
  markdown += `Para mais detalhes sobre a integração com o código da aplicação, consulte os arquivos:\n\n`;
  markdown += `- \`src/integrations/supabase/\` - Configurações e tipos\n`;
  markdown += `- \`supabase/migrations/\` - Migrações do banco\n`;
  markdown += `- \`src/hooks/\` - Hooks personalizados\n`;
  markdown += `- \`.env.local\` - Variáveis de ambiente\n\n`;

  return markdown;
}

// Executar análise
if (require.main === module) {
  analyzeDatabase();
}

module.exports = { analyzeDatabase };