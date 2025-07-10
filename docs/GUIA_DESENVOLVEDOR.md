# Guia do Desenvolvedor - Sistema AVIBAQ

## Visão Geral

O Sistema AVIBAQ é uma aplicação web para gerenciamento de boletins meteorológicos da Associação de Pilotos e Empresas de Balonismo. Este guia fornece informações técnicas para desenvolvedores que irão trabalhar no projeto.

## Configuração do Ambiente de Desenvolvimento

### Pré-requisitos
- Node.js 18+ 
- npm ou yarn
- Conta no Supabase
- Conta no Resend (para envio de e-mails)

### Instalação

1. Clone o repositório:
```bash
git clone [URL_DO_REPOSITORIO]
cd avibaq-balonismo-boletim
```

2. Instale as dependências:
```bash
npm install
```

3. Configure as variáveis de ambiente:
```bash
cp .env.example .env.local
```

Preencha as variáveis no arquivo `.env.local`:
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Resend
RESEND_API_KEY=your-resend-api-key

# URLs
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

4. Execute as migrações do banco:
```bash
npx supabase db push
```

5. Inicie o servidor de desenvolvimento:
```bash
npm run dev
```

## Estrutura do Projeto

### Páginas Principais
- `/` - Página inicial com boletim do dia
- `/admin/dashboard` - Dashboard administrativo
- `/admin/boletins` - Gerenciamento de boletins
- `/admin/associados` - Gerenciamento de membros
- `/historico` - Histórico de boletins
- `/membros` - Lista pública de membros

### Componentes Principais
- `BoletimCard` - Exibe informações do boletim
- `AssinantesForm` - Formulário de cadastro de assinantes
- `DashboardLayout` - Layout da área administrativa
- `ProtectedRoute` - Proteção de rotas administrativas

### Hooks Customizados
- `useUser` - Gerenciamento de autenticação
- `use-toast` - Notificações do sistema

## Fluxos de Desenvolvimento

### 1. Adicionar Nova Funcionalidade

1. Criar branch feature:
```bash
git checkout -b feature/nova-funcionalidade
```

2. Desenvolver a funcionalidade
3. Criar testes (se aplicável)
4. Commit e push:
```bash
git add .
git commit -m "feat: adiciona nova funcionalidade"
git push origin feature/nova-funcionalidade
```

5. Criar Pull Request

### 2. Modificar Banco de Dados

1. Criar nova migração:
```bash
npx supabase migration new nome_da_migracao
```

2. Editar arquivo SQL em `supabase/migrations/`
3. Aplicar migração:
```bash
npx supabase db push
```

### 3. Adicionar Novo Componente

1. Criar arquivo em `src/components/`
2. Seguir padrão do shadcn/ui
3. Adicionar tipos TypeScript
4. Documentar props e uso

## Boas Práticas

### Código
- Use TypeScript para tipagem
- Siga padrões do ESLint/Prettier
- Componentes funcionais com hooks
- Nomes descritivos para variáveis e funções

### Banco de Dados
- Sempre use migrações para mudanças
- Ative RLS em novas tabelas
- Use índices para queries frequentes
- Documente mudanças significativas

### Segurança
- Sempre valide inputs
- Use RLS para controle de acesso
- Não exponha chaves sensíveis
- Sanitize dados antes de salvar

## Comandos Úteis

```bash
# Desenvolvimento
npm run dev              # Inicia servidor de desenvolvimento
npm run build           # Build para produção
npm run start           # Inicia servidor de produção
npm run lint            # Executa linter

# Supabase
npx supabase start      # Inicia Supabase local
npx supabase stop       # Para Supabase local
npx supabase db reset   # Reseta banco local
npx supabase gen types  # Gera tipos TypeScript
```

## Troubleshooting

### Problemas Comuns

1. **Erro de autenticação Supabase**
   - Verifique as variáveis de ambiente
   - Confirme se o projeto Supabase está ativo

2. **Erro de CORS**
   - Adicione domínio nas configurações do Supabase
   - Verifique headers de requisições

3. **Erro de build**
   - Limpe cache: `rm -rf .next node_modules`
   - Reinstale dependências: `npm install`

4. **Erro de e-mail**
   - Verifique configuração do Resend
   - Confirme domínio verificado

## Deploy

### Vercel (Recomendado)

1. Conecte repositório no Vercel
2. Configure variáveis de ambiente
3. Deploy automático em cada push

### Configuração de Produção

```env
# Variáveis para produção
NEXT_PUBLIC_SUPABASE_URL=https://prod-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=prod-anon-key
SUPABASE_SERVICE_ROLE_KEY=prod-service-role-key
RESEND_API_KEY=prod-resend-key
NEXT_PUBLIC_SITE_URL=https://avibaq.org
```

## Monitoramento

### Logs
- Supabase Dashboard para queries
- Vercel Analytics para performance
- Resend Dashboard para e-mails

### Métricas Importantes
- Tempo de resposta das páginas
- Taxa de entrega de e-mails
- Uso de recursos do banco
- Erros JavaScript no cliente

## Contribuição

### Processo
1. Fork do repositório
2. Criar branch feature
3. Desenvolver e testar
4. Criar Pull Request
5. Code review
6. Merge após aprovação

### Padrões de Commit
```
feat: nova funcionalidade
fix: correção de bug
docs: documentação
style: formatação
refactor: refatoração
test: testes
chore: manutenção
```

## Recursos Adicionais

- [Documentação Next.js](https://nextjs.org/docs)
- [Documentação Supabase](https://supabase.com/docs)
- [Documentação Tailwind CSS](https://tailwindcss.com/docs)
- [Documentação shadcn/ui](https://ui.shadcn.com)

## Suporte

Para dúvidas técnicas:
- Criar issue no repositório
- Contatar equipe de desenvolvimento
- E-mail: contato@avibaq.org

---

*Última atualização: Janeiro 2025*