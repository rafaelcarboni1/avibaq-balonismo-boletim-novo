# Módulo de Voos - Documento de Implementação

## Visão Geral

O módulo de voos é responsável pelo gerenciamento completo dos voos de balão, incluindo planejamento, execução de checklist, anexos e finalização. Este documento detalha a implementação completa do módulo com foco na integração perfeita entre frontend e backend.

## Estrutura do Banco de Dados

### Tabelas Principais

#### 1. `voos`
- **Propósito**: Tabela principal para armazenar informações dos voos
- **Colunas principais**:
  - `id` (UUID): Identificador único
  - `data_voo` (DATE): Data do voo
  - `periodo` (periodo_tipo): manhã/tarde
  - `piloto_id` (UUID): Referência ao piloto
  - `agencia_id` (UUID): Referência à agência (opcional)
  - `status` (voo_status): Status atual do voo
  - `observacoes` (TEXT): Observações gerais

#### 2. `voos_baloes`
- **Propósito**: Relacionamento N:N entre voos e balões
- **Colunas principais**:
  - `voo_id` (UUID): Referência ao voo
  - `balao_id` (UUID): Referência ao balão
  - `posicao_ordem` (INTEGER): Ordem dos balões no voo

#### 3. `checklist_itens`
- **Propósito**: Itens do checklist de segurança por voo
- **Colunas principais**:
  - `voo_id` (UUID): Referência ao voo
  - `bloco` (checklist_bloco): bloco1/bloco2
  - `item_nome` (TEXT): Nome do item
  - `preenchido` (BOOLEAN): Se foi preenchido
  - `valor` (TEXT): Valor preenchido

#### 4. `voos_anexos` ✅ **CRIADA**
- **Propósito**: Anexos dos voos (track-logs, fotos, regulamentos)
- **Colunas principais**:
  - `id` (UUID): Identificador único
  - `voo_id` (UUID): Referência ao voo
  - `tipo` (tipo_anexo): track_log/foto_voo/regulamento_assinado
  - `nome_arquivo` (TEXT): Nome único no storage
  - `nome_original` (TEXT): Nome original do arquivo
  - `url_storage` (TEXT): Caminho no Supabase Storage
  - `tamanho_bytes` (BIGINT): Tamanho do arquivo
  - `mime_type` (TEXT): Tipo MIME
  - `publico` (BOOLEAN): Se é público
  - `metadata` (JSONB): Metadados adicionais

### Enums

```sql
-- Status do voo
voo_status: 'rascunho', 'planejado', 'checklist_bloco1', 'checklist_bloco2', 'checklist_concluido', 'finalizado', 'cancelado'

-- Período do voo
periodo_tipo: 'manha', 'tarde'

-- Blocos do checklist
checklist_bloco: 'bloco1', 'bloco2'

-- Tipos de anexo
tipo_anexo: 'track_log', 'foto_voo', 'regulamento_assinado'
```

## Fluxo de Estados do Voo

```
rascunho → planejado → checklist_bloco1 → checklist_bloco2 → checklist_concluido → finalizado
    ↓           ↓              ↓                ↓                    ↓
 cancelado   cancelado      cancelado        cancelado          cancelado
```

## API Endpoints

### Voos

#### `GET /api/voos`
- **Propósito**: Listar voos com filtros
- **Parâmetros**:
  - `data_inicio` (opcional): Data inicial
  - `data_fim` (opcional): Data final
  - `status` (opcional): Status do voo
  - `piloto_id` (opcional): ID do piloto
  - `page` (opcional): Página (padrão: 1)
  - `limit` (opcional): Limite por página (padrão: 20)

#### `POST /api/voos`
- **Propósito**: Criar novo voo
- **Body**:
```json
{
  "data_voo": "2024-01-15",
  "periodo": "manha",
  "piloto_id": "uuid",
  "agencia_id": "uuid", // opcional
  "baloes_ids": ["uuid1", "uuid2"],
  "observacoes": "string"
}
```

#### `GET /api/voos/:id`
- **Propósito**: Obter detalhes de um voo específico
- **Retorna**: Voo completo com balões, checklist e anexos

#### `PUT /api/voos/:id`
- **Propósito**: Atualizar voo
- **Body**: Campos a serem atualizados

#### `DELETE /api/voos/:id`
- **Propósito**: Deletar voo (apenas se status = 'rascunho')

### Checklist

#### `GET /api/voos/:id/checklist`
- **Propósito**: Obter checklist do voo
- **Retorna**: Itens agrupados por bloco

#### `PUT /api/voos/:id/checklist`
- **Propósito**: Atualizar itens do checklist
- **Body**:
```json
{
  "itens": [
    {
      "id": "uuid",
      "preenchido": true,
      "valor": "OK"
    }
  ]
}
```

#### `POST /api/voos/:id/checklist/finalizar-bloco`
- **Propósito**: Finalizar um bloco do checklist
- **Body**:
```json
{
  "bloco": "bloco1" // ou "bloco2"
}
```

### Anexos

#### `GET /api/voos/:id/anexos`
- **Propósito**: Listar anexos do voo
- **Parâmetros**:
  - `tipo` (opcional): Filtrar por tipo

#### `POST /api/voos/:id/anexos/upload`
- **Propósito**: Upload de anexo
- **Content-Type**: `multipart/form-data`
- **Fields**:
  - `file`: Arquivo
  - `tipo`: Tipo do anexo
  - `publico`: Boolean (opcional, padrão: false)

#### `GET /api/anexos/:id/download`
- **Propósito**: Download seguro de anexo
- **Retorna**: URL assinada ou stream do arquivo

#### `DELETE /api/anexos/:id`
- **Propósito**: Deletar anexo

## Componentes Frontend

### Estrutura de Pastas
```
src/
├── components/
│   └── voos/
│       ├── VoosList.tsx
│       ├── VooForm.tsx
│       ├── VooDetails.tsx
│       ├── ChecklistForm.tsx
│       ├── AnexosUpload.tsx
│       └── AnexosGallery.tsx
├── pages/
│   └── voos/
│       ├── index.tsx
│       ├── novo.tsx
│       └── [id].tsx
├── hooks/
│   └── useVoos.ts
├── types/
│   └── voos.ts
└── utils/
    └── voos.ts
```

### Tipos TypeScript

```typescript
// types/voos.ts
export type VooStatus = 
  | 'rascunho'
  | 'planejado'
  | 'checklist_bloco1'
  | 'checklist_bloco2'
  | 'checklist_concluido'
  | 'finalizado'
  | 'cancelado';

export type PeriodoTipo = 'manha' | 'tarde';

export type ChecklistBloco = 'bloco1' | 'bloco2';

export type TipoAnexo = 'track_log' | 'foto_voo' | 'regulamento_assinado';

export interface Voo {
  id: string;
  data_voo: string;
  periodo: PeriodoTipo;
  piloto_id: string;
  agencia_id?: string;
  status: VooStatus;
  observacoes?: string;
  created_at: string;
  updated_at: string;
  
  // Relacionamentos
  piloto: Membro;
  agencia?: Membro;
  baloes: Balao[];
  checklist_itens: ChecklistItem[];
  anexos: VooAnexo[];
}

export interface ChecklistItem {
  id: string;
  voo_id: string;
  bloco: ChecklistBloco;
  item_nome: string;
  preenchido: boolean;
  valor?: string;
  obrigatorio: boolean;
}

export interface VooAnexo {
  id: string;
  voo_id: string;
  tipo: TipoAnexo;
  nome_arquivo: string;
  nome_original: string;
  url_storage: string;
  tamanho_bytes: number;
  mime_type: string;
  publico: boolean;
  uploaded_em: string;
  uploaded_por?: string;
  metadata: Record<string, any>;
  
  // Campos calculados
  tamanho_formatado: string;
  tipo_descricao: string;
}
```

### Hook Principal

```typescript
// hooks/useVoos.ts
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import type { Voo, VooStatus } from '@/types/voos';

export function useVoos() {
  const [voos, setVoos] = useState<Voo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchVoos = async (filters?: {
    data_inicio?: string;
    data_fim?: string;
    status?: VooStatus;
    piloto_id?: string;
  }) => {
    try {
      setLoading(true);
      let query = supabase
        .from('voos')
        .select(`
          *,
          piloto:membros!piloto_id(*),
          agencia:membros!agencia_id(*),
          baloes:voos_baloes(balao:baloes(*)),
          checklist_itens(*),
          anexos:voos_anexos(*)
        `);

      if (filters?.data_inicio) {
        query = query.gte('data_voo', filters.data_inicio);
      }
      if (filters?.data_fim) {
        query = query.lte('data_voo', filters.data_fim);
      }
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.piloto_id) {
        query = query.eq('piloto_id', filters.piloto_id);
      }

      const { data, error } = await query.order('data_voo', { ascending: false });

      if (error) throw error;
      setVoos(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar voos');
    } finally {
      setLoading(false);
    }
  };

  const createVoo = async (vooData: Partial<Voo>) => {
    try {
      const { data, error } = await supabase
        .from('voos')
        .insert(vooData)
        .select()
        .single();

      if (error) throw error;
      await fetchVoos(); // Recarregar lista
      return data;
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Erro ao criar voo');
    }
  };

  const updateVoo = async (id: string, updates: Partial<Voo>) => {
    try {
      const { data, error } = await supabase
        .from('voos')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      await fetchVoos(); // Recarregar lista
      return data;
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Erro ao atualizar voo');
    }
  };

  const deleteVoo = async (id: string) => {
    try {
      const { error } = await supabase
        .from('voos')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await fetchVoos(); // Recarregar lista
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Erro ao deletar voo');
    }
  };

  useEffect(() => {
    fetchVoos();
  }, []);

  return {
    voos,
    loading,
    error,
    fetchVoos,
    createVoo,
    updateVoo,
    deleteVoo
  };
}
```

## Validações e Regras de Negócio

### Validações de Status
1. **rascunho → planejado**: Deve ter pelo menos 1 balão associado
2. **planejado → checklist_bloco1**: Voo deve estar na data/período correto
3. **checklist_bloco1 → checklist_bloco2**: Todos os itens obrigatórios do bloco1 preenchidos
4. **checklist_bloco2 → checklist_concluido**: Todos os itens obrigatórios do bloco2 preenchidos
5. **checklist_concluido → finalizado**: Deve ter pelo menos 1 anexo de track-log

### Validações de Anexos
1. **track_log**: Formatos GPX, KML, IGC (máx. 10MB)
2. **foto_voo**: Formatos JPEG, PNG, WebP (máx. 5MB)
3. **regulamento_assinado**: Formato PDF (máx. 20MB)

### Permissões
1. **Piloto**: Pode ver/editar seus próprios voos
2. **Agência**: Pode ver/editar voos onde é a agência
3. **Admin**: Pode ver/editar todos os voos

## Próximos Passos

1. ✅ **Criar tabela voos_anexos** - CONCLUÍDO
2. 🔄 **Implementar componentes React**
3. 🔄 **Criar API endpoints**
4. 🔄 **Implementar upload de arquivos**
5. 🔄 **Criar testes unitários**
6. 🔄 **Documentar API**

## Considerações Técnicas

### Performance
- Usar paginação para listas de voos
- Implementar cache para dados frequentemente acessados
- Otimizar queries com índices apropriados

### Segurança
- Validar uploads no frontend e backend
- Usar URLs assinadas para downloads
- Implementar rate limiting para uploads

### UX/UI
- Feedback visual para uploads em progresso
- Validação em tempo real nos formulários
- Estados de loading apropriados
- Mensagens de erro claras

Este documento será atualizado conforme a implementação progride.