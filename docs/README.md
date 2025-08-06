# Documentação do Sistema AVIBAQ

## Índice da Documentação

Este diretório contém a documentação técnica completa do Sistema AVIBAQ - Associação de Pilotos e Empresas de Balonismo.

### 📋 Documentos Disponíveis

1. **[ESPECIFICACAO_COMPLETA.md](./ESPECIFICACAO_COMPLETA.md)**
   - Documentação técnica completa e detalhada
   - Arquitetura do sistema
   - Estrutura do banco de dados
   - Funcionalidades em profundidade
   - Configuração e deploy

2. **[GUIA_DESENVOLVEDOR.md](./GUIA_DESENVOLVEDOR.md)**
   - Guia prático para desenvolvedores
   - Configuração do ambiente
   - Padrões de desenvolvimento
   - Comandos úteis
   - Troubleshooting

3. **[API_REFERENCE.md](./API_REFERENCE.md)**
   - Documentação completa da API
   - Endpoints disponíveis
   - Integração com Supabase
   - Exemplos de uso
   - Tratamento de erros

4. **[regras-gerais.md](./regras-gerais.md)**
   - Informações de acesso administrativo
   - Credenciais do sistema
   - Estado atual do banco de dados
   - Políticas de segurança
   - Testes realizados

### 🎯 O que é o Sistema AVIBAQ?

O Sistema AVIBAQ é uma aplicação web desenvolvida para a Associação de Pilotos e Empresas de Balonismo de Praia Grande/SC. O sistema tem como objetivo principal:

- **Fornecer boletins meteorológicos diários** com informações sobre condições de voo
- **Promover a segurança** no balonismo através de informações meteorológicas confiáveis
- **Gerenciar membros** da associação (pilotos e empresas)
- **Automatizar comunicação** via e-mail para a comunidade

### 🛠️ Tecnologias Principais

- **Frontend**: Next.js 14, React 18, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **E-mail**: Resend API
- **Deploy**: Vercel
- **Componentes**: shadcn/ui, Radix UI

### 🚀 Funcionalidades Principais

1. **Boletins Meteorológicos**
   - Visualização de boletins diários
   - Sistema de bandeiras (verde, amarela, vermelha)
   - Upload de áudios e fotos
   - Envio automático por e-mail

2. **Gestão de Membros**
   - Cadastro de pilotos e empresas
   - Controle de status e pagamentos
   - Dashboard administrativo

3. **Sistema de Assinantes**
   - Cadastro público para receber boletins
   - Descadastro automático
   - Segmentação por tipo de usuário

4. **Área Administrativa**
   - Autenticação e autorização
   - Diferentes níveis de acesso
   - Logs de atividades

### 📖 Como Usar Esta Documentação

#### Para Desenvolvedores Iniciantes
1. Leia a [Especificação Completa](./ESPECIFICACAO_COMPLETA.md) para entender o sistema
2. Siga o [Guia do Desenvolvedor](./GUIA_DESENVOLVEDOR.md) para configurar o ambiente
3. Consulte a [API Reference](./API_REFERENCE.md) para integrações

#### Para Desenvolvedores Experientes
1. Consulte a [API Reference](./API_REFERENCE.md) para endpoints e integração
2. Use o [Guia do Desenvolvedor](./GUIA_DESENVOLVEDOR.md) para comandos específicos
3. Refira-se à [Especificação Completa](./ESPECIFICACAO_COMPLETA.md) para arquitetura detalhada

#### Para Gestores de Projeto
1. Leia a [Especificação Completa](./ESPECIFICACAO_COMPLETA.md) para entender as funcionalidades detalhadas
2. Consulte as [Regras Gerais](./regras-gerais.md) para informações de acesso e status
3. Use para planejamento e tomada de decisões técnicas

### 🔧 Configuração Rápida

Para começar rapidamente:

```bash
# 1. Instalar dependências
npm install

# 2. Configurar variáveis de ambiente
cp .env.example .env.local

# 3. Executar migrações
npx supabase db push

# 4. Iniciar desenvolvimento
npm run dev
```

### 📝 Contribuindo para a Documentação

Para manter a documentação atualizada:

1. Sempre documente mudanças significativas
2. Atualize exemplos de código quando necessário
3. Mantenha a data de última atualização
4. Siga o padrão de formatação Markdown

### 🆘 Suporte e Contato

- **Repositório**: [Link do repositório GitHub]
- **E-mail**: contato@avibaq.org
- **Issues**: Use o sistema de issues do GitHub
- **Wiki**: Documentação adicional na wiki do projeto

### 📊 Status da Documentação

| Documento | Status | Última Atualização |
|-----------|--------|-------------------|
| ESPECIFICACAO_COMPLETA.md | ✅ Completo | Jan 2025 |
| GUIA_DESENVOLVEDOR.md | ✅ Completo | Jan 2025 |
| API_REFERENCE.md | ✅ Completo | Jan 2025 |
| regras-gerais.md | ✅ Completo | Jan 2025 |

### 🔄 Versionamento

A documentação segue o versionamento semântico:
- **Major**: Mudanças significativas na arquitetura
- **Minor**: Novas funcionalidades ou endpoints
- **Patch**: Correções e melhorias na documentação

**Versão Atual**: 1.0.0

---

*Esta documentação foi gerada automaticamente e é mantida pela equipe de desenvolvimento do Sistema AVIBAQ.*