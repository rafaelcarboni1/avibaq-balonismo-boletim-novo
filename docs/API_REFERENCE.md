# API Reference - Sistema AVIBAQ

## Visão Geral

Esta documentação descreve as APIs disponíveis no sistema AVIBAQ, incluindo endpoints Next.js e integração com Supabase.

## Autenticação

O sistema utiliza Supabase Auth para autenticação. Todas as requisições para endpoints protegidos devem incluir o token de acesso.

```javascript
// Header de autenticação
Authorization: Bearer <access_token>
```

## Endpoints da API

### 1. Envio de Boletim Automático

#### `POST /api/send-boletim`

Envia boletim meteorológico para todos os assinantes ativos.

**Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{} // Corpo vazio
```

**Response:**
```json
{
  "success": true
}
```

**Erros:**
- `405` - Método não permitido
- `500` - Erro interno do servidor
- `404` - Nenhum boletim encontrado para o dia seguinte

**Funcionalidade:**
1. Busca assinantes ativos na base
2. Procura boletins do dia seguinte
3. Monta template HTML do e-mail
4. Envia e-mail para cada assinante via Resend
5. Inclui link de descadastro único por assinante

### 2. Cadastro de Assinante

#### `POST /api/join`

Cadastra novo assinante na lista de e-mails.

**Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "nome": "João Silva",
  "email": "joao@email.com",
  "eh_piloto": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "Assinante cadastrado com sucesso"
}
```

**Erros:**
- `400` - Dados inválidos
- `409` - E-mail já cadastrado
- `500` - Erro interno do servidor

### 3. Teste de Envio

#### `POST /api/test-send-boletim`

Endpoint para teste de envio de boletim (desenvolvimento).

**Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "email": "teste@email.com" // Opcional, padrão usa todos os assinantes
}
```

**Response:**
```json
{
  "success": true,
  "message": "Boletim enviado com sucesso"
}
```

## Integração com Supabase

### Tabelas Principais

#### 1. Boletins

**Operações disponíveis:**
- `SELECT` - Público (todos podem ler)
- `INSERT/UPDATE/DELETE` - Apenas usuários autenticados

**Exemplo de Query:**
```javascript
// Buscar boletim do dia
const { data, error } = await supabase
  .from('boletins')
  .select('*')
  .eq('data', '2025-01-09')
  .eq('periodo', 'manha')
  .single();
```

#### 2. Assinantes

**Operações disponíveis:**
- `SELECT` - Apenas admins
- `INSERT` - Público (cadastro)
- `UPDATE` - Próprio usuário ou admin

**Exemplo de Query:**
```javascript
// Cadastrar assinante
const { data, error } = await supabase
  .from('assinantes')
  .insert({
    nome: 'João Silva',
    email: 'joao@email.com',
    eh_piloto: true
  });
```

#### 3. Membros

**Operações disponíveis:**
- `SELECT/UPDATE/DELETE` - Apenas admins
- `INSERT` - Público (cadastro)

**Exemplo de Query:**
```javascript
// Buscar membros ativos
const { data, error } = await supabase
  .from('membros')
  .select('*')
  .eq('status', 'ativo')
  .order('nome_completo');
```

#### 4. Usuários Admin

**Operações disponíveis:**
- `SELECT` - Apenas usuários autenticados
- `UPDATE` - Próprio usuário
- `INSERT/DELETE` - Apenas super admin

**Exemplo de Query:**
```javascript
// Buscar usuário por email
const { data, error } = await supabase
  .from('usuarios_admin')
  .select('*')
  .eq('email', 'admin@avibaq.org')
  .single();
```

## Políticas de Segurança (RLS)

### Boletins
```sql
-- Leitura pública
CREATE POLICY "Boletins são públicos para leitura" ON boletins
  FOR SELECT USING (true);

-- Escrita apenas para autenticados
CREATE POLICY "Apenas admins podem criar boletins" ON boletins
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
```

### Assinantes
```sql
-- Admins podem ver todos
CREATE POLICY "Admins podem ver todos os assinantes" ON assinantes
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Qualquer um pode se cadastrar
CREATE POLICY "Qualquer um pode se inscrever" ON assinantes
  FOR INSERT WITH CHECK (true);
```

### Membros
```sql
-- Apenas admins podem ver
CREATE POLICY "Apenas admins podem ver membros" ON membros
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Qualquer um pode se inscrever
CREATE POLICY "Qualquer um pode se inscrever" ON membros
  FOR INSERT WITH CHECK (true);
```

## Storage (Arquivos)

### Bucket: `boletim-media`

**Estrutura:**
```
boletim-media/
├── {boletim_id}/
│   ├── audio_1.mp3
│   ├── audio_2.wav
│   ├── foto_1.jpg
│   └── foto_2.png
```

**Operações:**
```javascript
// Upload de arquivo
const { data, error } = await supabase.storage
  .from('boletim-media')
  .upload(`${boletimId}/audio_1.mp3`, file);

// Gerar URL assinada
const { data, error } = await supabase.storage
  .from('boletim-media')
  .createSignedUrl(path, 60 * 60 * 24 * 7); // 7 dias
```

## Helpers e Utilitários

### 1. getDashboardStats

```javascript
import { getDashboardStats } from '@/helpers/getDashboardStats';

const stats = await getDashboardStats();
// Retorna estatísticas do dashboard
```

### 2. getAssociadosEmDia

```javascript
import { getAssociadosEmDia } from '@/helpers/getAssociadosEmDia';

const associados = await getAssociadosEmDia();
// Retorna membros com mensalidade em dia
```

## Hooks Customizados

### 1. useUser

```javascript
import { useUser } from '@/hooks/useUser';

const { user, role, loading } = useUser();
```

**Retorna:**
- `user` - Dados do usuário autenticado
- `role` - Papel do usuário (admin, meteo, tesouraria)
- `loading` - Estado de carregamento

### 2. use-toast

```javascript
import { useToast } from '@/hooks/use-toast';

const { toast } = useToast();

// Exibir notificação
toast({
  title: "Sucesso",
  description: "Operação realizada com sucesso",
  variant: "default" // "default" | "destructive"
});
```

## Cron Jobs

### Envio Automático de Boletins

**Configuração (vercel.json):**
```json
{
  "crons": [
    {
      "path": "/api/send-boletim",
      "schedule": "0 22 * * *"
    }
  ]
}
```

**Funcionamento:**
- Executa diariamente às 22:00 (horário de Brasília)
- Busca boletins do dia seguinte
- Envia para todos os assinantes ativos
- Registra logs de envio

## Exemplos de Uso

### 1. Buscar Boletim Atual

```javascript
async function fetchBoletimAtual() {
  const hoje = new Date().toISOString().split('T')[0];
  
  const { data, error } = await supabase
    .from('boletins')
    .select('*')
    .gte('data', hoje)
    .order('data', { ascending: true })
    .order('periodo', { ascending: true })
    .limit(1);
    
  return data?.[0] || null;
}
```

### 2. Cadastrar Membro

```javascript
async function cadastrarMembro(dadosMembro) {
  const { data, error } = await supabase
    .from('membros')
    .insert({
      nome_completo: dadosMembro.nome,
      email: dadosMembro.email,
      telefone: dadosMembro.telefone,
      tipo: dadosMembro.tipo,
      cpf: dadosMembro.cpf,
      cnpj: dadosMembro.cnpj
    });
    
  if (error) throw error;
  return data;
}
```

### 3. Criar Boletim com Mídia

```javascript
async function criarBoletim(dadosBoletim, arquivos) {
  // 1. Inserir boletim
  const { data: boletim, error } = await supabase
    .from('boletins')
    .insert(dadosBoletim)
    .select()
    .single();
    
  if (error) throw error;
  
  // 2. Upload de arquivos
  const audioUrls = [];
  const fotoUrls = [];
  
  for (const arquivo of arquivos.audios) {
    const { data } = await supabase.storage
      .from('boletim-media')
      .upload(`${boletim.id}/audio_${Date.now()}.mp3`, arquivo);
      
    if (data) {
      const { data: signed } = await supabase.storage
        .from('boletim-media')
        .createSignedUrl(data.path, 60 * 60 * 24 * 7);
      audioUrls.push(signed.signedUrl);
    }
  }
  
  // 3. Atualizar boletim com URLs
  await supabase
    .from('boletins')
    .update({
      audios_urls: audioUrls,
      fotos_urls: fotoUrls
    })
    .eq('id', boletim.id);
    
  return boletim;
}
```

## Tratamento de Erros

### Padrão de Resposta de Erro

```json
{
  "error": "Descrição do erro",
  "code": "CODIGO_ERRO",
  "details": "Detalhes adicionais"
}
```

### Códigos de Erro Comuns

- `23505` - Violação de constraint unique (e-mail já existe)
- `23503` - Violação de foreign key
- `42501` - Permissão negada (RLS)
- `P0001` - Erro de política de segurança

## Rate Limiting

### Limites por Endpoint

- `/api/send-boletim` - 1 requisição por minuto
- `/api/join` - 5 requisições por minuto por IP
- Endpoints admin - 100 requisições por minuto

### Headers de Rate Limit

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 99
X-RateLimit-Reset: 1642694400
```

## Webhook Support

### Eventos Disponíveis

- `boletim.created` - Novo boletim criado
- `membro.approved` - Membro aprovado
- `email.sent` - E-mail enviado com sucesso

### Configuração

```javascript
// Registrar webhook
const webhook = await supabase
  .from('webhooks')
  .insert({
    url: 'https://exemplo.com/webhook',
    events: ['boletim.created'],
    secret: 'webhook-secret'
  });
```

---

*Última atualização: Janeiro 2025*