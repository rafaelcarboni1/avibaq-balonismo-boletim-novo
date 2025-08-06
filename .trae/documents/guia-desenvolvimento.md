# Guia de Desenvolvimento - Sistema AVIBAQ

**Versão:** 2.0\
**Data:** Janeiro 2025\
**Público-alvo:** Desenvolvedores, DevOps, QA\
**Nível:** Intermediário a Avançado

***

## 1. Visão Geral do Desenvolvimento

### 1.1 Filosofia de Desenvolvimento

O Sistema AVIBAQ segue os princípios de **desenvolvimento ágil** com foco em:

* **Segurança em primeiro lugar:** Toda funcionalidade deve ser segura por design

* **Offline-first:** Funcionalidades críticas devem funcionar sem conexão

* **Mobile-first:** Interface otimizada para dispositivos móveis

* **Testes automatizados:** Cobertura mínima de 80%

* **Documentação viva:** Código autodocumentado e specs atualizadas

### 1.2 Stack Tecnológico

#### Frontend

```json
{
  "framework": "Next.js 14.0+",
  "language": "TypeScript 5.0+",
  "styling": "Tailwind CSS 3.3+",
  "components": "shadcn/ui + Radix UI",
  "state": "Zustand + React Query",
  "forms": "React Hook Form + Zod",
  "pwa": "next-pwa",
  "testing": "Jest + React Testing Library + Playwright"
}
```

#### Backend

```json
{
  "platform": "Supabase (PostgreSQL + Auth + Storage)",
  "api": "Next.js API Routes",
  "auth": "Supabase Auth",
  "database": "PostgreSQL 15+ com RLS",
  "storage": "Supabase Storage",
  "email": "Resend",
  "push": "Web Push API"
}
```

#### DevOps

```json
{
  "hosting": "Vercel",
  "database": "Supabase Cloud",
  "monitoring": "Vercel Analytics + Sentry",
  "ci_cd": "GitHub Actions",
  "version_control": "Git + GitHub"
}
```

***

## 2. Configuração do Ambiente

### 2.1 Pré-requisitos

```bash
# Versões mínimas requeridas
node --version  # v18.17.0+
npm --version   # v9.0.0+
git --version   # v2.30.0+
```

### 2.2 Setup Inicial

```bash
# 1. Clone do repositório
git clone https://github.com/avibaq/sistema-balonismo.git
cd sistema-balonismo

# 2. Instalação de dependências
npm install

# 3. Configuração de variáveis de ambiente
cp .env.example .env.local

# 4. Setup do banco de dados
npm run db:setup

# 5. Iniciar desenvolvimento
npm run dev
```

### 2.3 Variáveis de Ambiente

```bash
# .env.local
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Resend (Email)
RESEND_API_KEY=re_your-api-key
NEXT_PUBLIC_FROM_EMAIL=noreply@avibaq.com.br

# Push Notifications
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your-vapid-public-key
VAPID_PRIVATE_KEY=your-vapid-private-key

# App Config
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME="Sistema AVIBAQ"

# Monitoring
SENTRY_DSN=your-sentry-dsn
NEXT_PUBLIC_VERCEL_ANALYTICS_ID=your-analytics-id
```

### 2.4 Estrutura de Pastas

```
avibaq-sistema/
├── .github/                 # GitHub Actions workflows
├── .next/                   # Build output (auto-generated)
├── .trae/                   # Documentação técnica
│   └── documents/
├── app/                     # Next.js App Router
│   ├── (auth)/             # Rotas de autenticação
│   ├── (dashboard)/        # Área logada
│   ├── api/                # API Routes
│   ├── globals.css         # Estilos globais
│   ├── layout.tsx          # Layout raiz
│   └── page.tsx            # Página inicial
├── components/             # Componentes React
│   ├── ui/                 # Componentes base (shadcn/ui)
│   ├── forms/              # Formulários específicos
│   ├── charts/             # Gráficos e visualizações
│   └── layout/             # Componentes de layout
├── hooks/                  # Custom React hooks
├── lib/                    # Utilitários e configurações
│   ├── supabase/          # Cliente Supabase
│   ├── validations/       # Schemas Zod
│   ├── utils.ts           # Funções utilitárias
│   └── constants.ts       # Constantes da aplicação
├── public/                 # Arquivos estáticos
│   ├── icons/             # Ícones PWA
│   ├── images/            # Imagens
│   └── sw.js              # Service Worker
├── stores/                 # Zustand stores
├── types/                  # Definições TypeScript
├── __tests__/             # Testes
│   ├── components/        # Testes de componentes
│   ├── pages/             # Testes E2E
│   └── utils/             # Testes de utilitários
├── supabase/              # Configurações Supabase
│   ├── migrations/        # Migrações SQL
│   ├── seed.sql          # Dados iniciais
│   └── config.toml       # Configuração local
├── package.json
├── tsconfig.json
├── tailwind.config.js
├── next.config.js
└── README.md
```

***

## 3. Padrões de Desenvolvimento

### 3.1 Convenções de Nomenclatura

```typescript
// Arquivos e pastas: kebab-case
components/flight-checklist/flight-checklist-item.tsx

// Componentes: PascalCase
export function FlightChecklistItem() {}

// Hooks: camelCase com prefixo 'use'
export function useFlightData() {}

// Constantes: SCREAMING_SNAKE_CASE
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

// Variáveis e funções: camelCase
const flightData = await getFlightById(id);

// Tipos e interfaces: PascalCase
interface FlightData {
  id: string;
  pilotId: string;
}

// Enums: PascalCase
enum FlightStatus {
  DRAFT = 'rascunho',
  PLANNED = 'planejado',
  IN_PROGRESS = 'em_andamento'
}
```

### 3.2 Estrutura de Componentes

```typescript
// components/flight-checklist/flight-checklist.tsx
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { useFlightStore } from '@/stores/flight-store';
import { FlightChecklistItem } from './flight-checklist-item';
import type { ChecklistItem } from '@/types/flight';

interface FlightChecklistProps {
  flightId: string;
  readonly?: boolean;
  onComplete?: () => void;
}

export function FlightChecklist({ 
  flightId, 
  readonly = false, 
  onComplete 
}: FlightChecklistProps) {
  // 1. Hooks (useState, useEffect, custom hooks)
  const [currentBlock, setCurrentBlock] = useState(1);
  const { updateFlightStatus } = useFlightStore();
  
  // 2. Queries e mutations
  const { data: checklistItems, isLoading } = useQuery({
    queryKey: ['checklist', flightId],
    queryFn: () => getChecklistItems(flightId)
  });
  
  // 3. Effects
  useEffect(() => {
    if (checklistItems?.every(item => item.checked)) {
      onComplete?.();
    }
  }, [checklistItems, onComplete]);
  
  // 4. Event handlers
  const handleItemCheck = async (itemId: string, checked: boolean) => {
    // Implementation
  };
  
  // 5. Render conditions
  if (isLoading) {
    return <ChecklistSkeleton />;
  }
  
  // 6. Main render
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">
        Checklist de Segurança - Bloco {currentBlock}
      </h2>
      
      {checklistItems?.map((item) => (
        <FlightChecklistItem
          key={item.id}
          item={item}
          readonly={readonly}
          onCheck={handleItemCheck}
        />
      ))}
      
      <div className="flex justify-between">
        <Button 
          variant="outline" 
          onClick={() => setCurrentBlock(prev => Math.max(1, prev - 1))}
          disabled={currentBlock === 1}
        >
          Bloco Anterior
        </Button>
        
        <Button 
          onClick={() => setCurrentBlock(prev => Math.min(3, prev + 1))}
          disabled={currentBlock === 3}
        >
          Próximo Bloco
        </Button>
      </div>
    </div>
  );
}
```

### 3.3 Gerenciamento de Estado

#### Zustand Store

```typescript
// stores/flight-store.ts
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { Flight, FlightStatus } from '@/types/flight';

interface FlightState {
  // State
  currentFlight: Flight | null;
  flights: Flight[];
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setCurrentFlight: (flight: Flight | null) => void;
  updateFlightStatus: (flightId: string, status: FlightStatus) => Promise<void>;
  createFlight: (flightData: Partial<Flight>) => Promise<Flight>;
  loadFlights: () => Promise<void>;
  clearError: () => void;
}

export const useFlightStore = create<FlightState>()()
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        currentFlight: null,
        flights: [],
        isLoading: false,
        error: null,
        
        // Actions
        setCurrentFlight: (flight) => {
          set({ currentFlight: flight }, false, 'setCurrentFlight');
        },
        
        updateFlightStatus: async (flightId, status) => {
          set({ isLoading: true }, false, 'updateFlightStatus/start');
          
          try {
            const updatedFlight = await updateFlightStatusAPI(flightId, status);
            
            set((state) => ({
              flights: state.flights.map(f => 
                f.id === flightId ? { ...f, status } : f
              ),
              currentFlight: state.currentFlight?.id === flightId 
                ? { ...state.currentFlight, status } 
                : state.currentFlight,
              isLoading: false,
              error: null
            }), false, 'updateFlightStatus/success');
            
          } catch (error) {
            set({ 
              isLoading: false, 
              error: error.message 
            }, false, 'updateFlightStatus/error');
            throw error;
          }
        },
        
        createFlight: async (flightData) => {
          set({ isLoading: true }, false, 'createFlight/start');
          
          try {
            const newFlight = await createFlightAPI(flightData);
            
            set((state) => ({
              flights: [...state.flights, newFlight],
              currentFlight: newFlight,
              isLoading: false,
              error: null
            }), false, 'createFlight/success');
            
            return newFlight;
          } catch (error) {
            set({ 
              isLoading: false, 
              error: error.message 
            }, false, 'createFlight/error');
            throw error;
          }
        },
        
        loadFlights: async () => {
          set({ isLoading: true }, false, 'loadFlights/start');
          
          try {
            const flights = await getFlightsAPI();
            set({ 
              flights, 
              isLoading: false, 
              error: null 
            }, false, 'loadFlights/success');
          } catch (error) {
            set({ 
              isLoading: false, 
              error: error.message 
            }, false, 'loadFlights/error');
          }
        },
        
        clearError: () => {
          set({ error: null }, false, 'clearError');
        }
      }),
      {
        name: 'flight-store',
        partialize: (state) => ({ 
          currentFlight: state.currentFlight 
        })
      }
    ),
    {
      name: 'flight-store'
    }
  )
);
```

### 3.4 Validação com Zod

```typescript
// lib/validations/flight.ts
import { z } from 'zod';

// Schema base
export const flightSchema = z.object({
  id: z.string().uuid().optional(),
  data_voo: z.date({
    required_error: "Data do voo é obrigatória",
    invalid_type_error: "Data inválida"
  }),
  periodo: z.enum(['manha', 'tarde'], {
    required_error: "Período é obrigatório"
  }),
  piloto_id: z.string().uuid("ID do piloto inválido").optional(),
  agencia_id: z.string().uuid("ID da agência inválido").optional(),
  local_decolagem: z.string()
    .min(3, "Local deve ter pelo menos 3 caracteres")
    .max(255, "Local muito longo"),
  local_pouso_previsto: z.string()
    .min(3, "Local deve ter pelo menos 3 caracteres")
    .max(255, "Local muito longo"),
  horario_previsto_decolagem: z.string()
    .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Formato de hora inválido (HH:MM)"),
  horario_previsto_pouso: z.string()
    .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Formato de hora inválido (HH:MM)"),
  qtd_passageiros_prevista: z.number()
    .int("Quantidade deve ser um número inteiro")
    .min(0, "Quantidade não pode ser negativa")
    .max(20, "Máximo 20 passageiros por voo"),
  observacoes: z.string().max(1000, "Observações muito longas").optional()
});

// Schema para criação (campos obrigatórios)
export const createFlightSchema = flightSchema.omit({ id: true });

// Schema para atualização (campos opcionais)
export const updateFlightSchema = flightSchema.partial().extend({
  id: z.string().uuid("ID inválido")
});

// Schema para checklist
export const checklistItemSchema = z.object({
  id: z.string().uuid().optional(),
  voo_id: z.string().uuid("ID do voo inválido"),
  bloco: z.number().int().min(1).max(3),
  item_nome: z.string().min(1, "Nome do item é obrigatório"),
  marcado: z.boolean().default(false),
  observacoes: z.string().max(500, "Observações muito longas").optional()
});

// Tipos TypeScript derivados
export type Flight = z.infer<typeof flightSchema>;
export type CreateFlightData = z.infer<typeof createFlightSchema>;
export type UpdateFlightData = z.infer<typeof updateFlightSchema>;
export type ChecklistItem = z.infer<typeof checklistItemSchema>;

// Validação customizada
export const validateFlightConflict = (flight: CreateFlightData) => {
  const errors: string[] = [];
  
  // Validar se data não é no passado
  if (flight.data_voo < new Date()) {
    errors.push("Data do voo não pode ser no passado");
  }
  
  // Validar horários
  const decolagem = new Date(`2000-01-01T${flight.horario_previsto_decolagem}`);
  const pouso = new Date(`2000-01-01T${flight.horario_previsto_pouso}`);
  
  if (pouso <= decolagem) {
    errors.push("Horário de pouso deve ser posterior ao de decolagem");
  }
  
  return errors;
};
```

### 3.5 API Routes

```typescript
// app/api/flights/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { createFlightSchema } from '@/lib/validations/flight';
import { z } from 'zod';

// GET /api/flights
export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Verificar autenticação
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    if (authError || !session) {
      return NextResponse.json(
        { error: 'Não autorizado' }, 
        { status: 401 }
      );
    }
    
    // Parâmetros de query
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status');
    
    // Query base
    let query = supabase
      .from('voos')
      .select(`
        *,
        piloto:users!piloto_id(nome),
        agencia:users!agencia_id(nome),
        voos_baloes(
          balao:baloes(prefixo, modelo)
        )
      `)
      .order('data_voo', { ascending: false })
      .range((page - 1) * limit, page * limit - 1);
    
    // Filtros
    if (status) {
      query = query.eq('status', status);
    }
    
    const { data: flights, error, count } = await query;
    
    if (error) {
      console.error('Erro ao buscar voos:', error);
      return NextResponse.json(
        { error: 'Erro interno do servidor' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      flights,
      pagination: {
        page,
        limit,
        total: count || 0,
        pages: Math.ceil((count || 0) / limit)
      }
    });
    
  } catch (error) {
    console.error('Erro não tratado:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// POST /api/flights
export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Verificar autenticação
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    if (authError || !session) {
      return NextResponse.json(
        { error: 'Não autorizado' }, 
        { status: 401 }
      );
    }
    
    // Validar dados de entrada
    const body = await request.json();
    const validationResult = createFlightSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Dados inválidos',
          details: validationResult.error.format()
        },
        { status: 400 }
      );
    }
    
    const flightData = validationResult.data;
    
    // Validações de negócio
    const businessErrors = validateFlightConflict(flightData);
    if (businessErrors.length > 0) {
      return NextResponse.json(
        { 
          error: 'Validação de negócio falhou',
          details: businessErrors
        },
        { status: 422 }
      );
    }
    
    // Criar voo
    const { data: flight, error } = await supabase
      .from('voos')
      .insert({
        ...flightData,
        created_by: session.user.id,
        status: 'rascunho'
      })
      .select()
      .single();
    
    if (error) {
      console.error('Erro ao criar voo:', error);
      return NextResponse.json(
        { error: 'Erro ao criar voo' },
        { status: 500 }
      );
    }
    
    return NextResponse.json(flight, { status: 201 });
    
  } catch (error) {
    console.error('Erro não tratado:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
```

***

## 4. Funcionalidades Offline

### 4.1 Service Worker

```javascript
// public/sw.js
const CACHE_NAME = 'avibaq-v1';
const STATIC_CACHE = 'avibaq-static-v1';
const DYNAMIC_CACHE = 'avibaq-dynamic-v1';

// Arquivos para cache estático
const STATIC_FILES = [
  '/',
  '/offline',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
];

// Install event
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        return cache.addAll(STATIC_FILES);
      })
  );
  self.skipWaiting();
});

// Activate event
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - Network First para APIs, Cache First para estáticos
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // API requests - Network First
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache successful responses
          if (response.status === 200) {
            const responseClone = response.clone();
            caches.open(DYNAMIC_CACHE)
              .then((cache) => {
                cache.put(request, responseClone);
              });
          }
          return response;
        })
        .catch(() => {
          // Fallback to cache
          return caches.match(request)
            .then((cachedResponse) => {
              if (cachedResponse) {
                return cachedResponse;
              }
              // Return offline page for navigation requests
              if (request.mode === 'navigate') {
                return caches.match('/offline');
              }
              return new Response('Offline', { status: 503 });
            });
        })
    );
    return;
  }
  
  // Static files - Cache First
  event.respondWith(
    caches.match(request)
      .then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        
        return fetch(request)
          .then((response) => {
            // Cache successful responses
            if (response.status === 200) {
              const responseClone = response.clone();
              caches.open(DYNAMIC_CACHE)
                .then((cache) => {
                  cache.put(request, responseClone);
                });
            }
            return response;
          });
      })
      .catch(() => {
        // Fallback for navigation requests
        if (request.mode === 'navigate') {
          return caches.match('/offline');
        }
        return new Response('Offline', { status: 503 });
      })
  );
});

// Background sync for offline data
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-offline-data') {
    event.waitUntil(
      syncOfflineData()
    );
  }
});

// Push notifications
self.addEventListener('push', (event) => {
  const options = {
    body: event.data?.text() || 'Nova notificação AVIBAQ',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    vibrate: [200, 100, 200],
    data: {
      url: '/dashboard'
    },
    actions: [
      {
        action: 'open',
        title: 'Abrir',
        icon: '/icons/open.png'
      },
      {
        action: 'close',
        title: 'Fechar',
        icon: '/icons/close.png'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification('Sistema AVIBAQ', options)
  );
});

// Notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  if (event.action === 'open' || !event.action) {
    event.waitUntil(
      clients.openWindow(event.notification.data.url || '/dashboard')
    );
  }
});

// Sync offline data function
async function syncOfflineData() {
  try {
    // Get offline data from IndexedDB
    const offlineData = await getOfflineData();
    
    for (const item of offlineData) {
      try {
        // Sync each item
        await fetch('/api/sync', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(item)
        });
        
        // Remove from offline storage
        await removeOfflineData(item.id);
      } catch (error) {
        console.error('Erro ao sincronizar item:', error);
      }
    }
  } catch (error) {
    console.error('Erro na sincronização:', error);
  }
}
```

### 4.2 Offline Storage Hook

```typescript
// hooks/use-offline-storage.ts
import { useState, useEffect } from 'react';
import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface OfflineDB extends DBSchema {
  flights: {
    key: string;
    value: {
      id: string;
      data: any;
      operation: 'CREATE' | 'UPDATE' | 'DELETE';
      timestamp: number;
      synced: boolean;
    };
  };
  checklists: {
    key: string;
    value: {
      id: string;
      flightId: string;
      data: any;
      operation: 'CREATE' | 'UPDATE' | 'DELETE';
      timestamp: number;
      synced: boolean;
    };
  };
}

class OfflineStorageManager {
  private db: IDBPDatabase<OfflineDB> | null = null;
  
  async init() {
    if (this.db) return this.db;
    
    this.db = await openDB<OfflineDB>('avibaq-offline', 1, {
      upgrade(db) {
        // Flights store
        if (!db.objectStoreNames.contains('flights')) {
          const flightsStore = db.createObjectStore('flights', { keyPath: 'id' });
          flightsStore.createIndex('synced', 'synced');
          flightsStore.createIndex('timestamp', 'timestamp');
        }
        
        // Checklists store
        if (!db.objectStoreNames.contains('checklists')) {
          const checklistsStore = db.createObjectStore('checklists', { keyPath: 'id' });
          checklistsStore.createIndex('flightId', 'flightId');
          checklistsStore.createIndex('synced', 'synced');
          checklistsStore.createIndex('timestamp', 'timestamp');
        }
      }
    });
    
    return this.db;
  }
  
  async saveFlight(flight: any, operation: 'CREATE' | 'UPDATE' | 'DELETE') {
    const db = await this.init();
    
    await db.put('flights', {
      id: flight.id || crypto.randomUUID(),
      data: flight,
      operation,
      timestamp: Date.now(),
      synced: false
    });
  }
  
  async saveChecklist(checklist: any, operation: 'CREATE' | 'UPDATE' | 'DELETE') {
    const db = await this.init();
    
    await db.put('checklists', {
      id: checklist.id || crypto.randomUUID(),
      flightId: checklist.flightId,
      data: checklist,
      operation,
      timestamp: Date.now(),
      synced: false
    });
  }
  
  async getUnsyncedData() {
    const db = await this.init();
    
    const [flights, checklists] = await Promise.all([
      db.getAllFromIndex('flights', 'synced', false),
      db.getAllFromIndex('checklists', 'synced', false)
    ]);
    
    return { flights, checklists };
  }
  
  async markAsSynced(store: 'flights' | 'checklists', id: string) {
    const db = await this.init();
    const item = await db.get(store, id);
    
    if (item) {
      item.synced = true;
      await db.put(store, item);
    }
  }
  
  async clearSyncedData() {
    const db = await this.init();
    
    const tx = db.transaction(['flights', 'checklists'], 'readwrite');
    
    const [flightsSynced, checklistsSynced] = await Promise.all([
      tx.objectStore('flights').index('synced').getAllKeys(true),
      tx.objectStore('checklists').index('synced').getAllKeys(true)
    ]);
    
    await Promise.all([
      ...flightsSynced.map(key => tx.objectStore('flights').delete(key)),
      ...checklistsSynced.map(key => tx.objectStore('checklists').delete(key))
    ]);
    
    await tx.done;
  }
}

const offlineStorage = new OfflineStorageManager();

export function useOfflineStorage() {
  const [isOnline, setIsOnline] = useState(true);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'error'>('idle');
  const [pendingCount, setPendingCount] = useState(0);
  
  useEffect(() => {
    // Monitor online status
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    setIsOnline(navigator.onLine);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  useEffect(() => {
    // Auto-sync when coming online
    if (isOnline && syncStatus === 'idle') {
      syncData();
    }
  }, [isOnline]);
  
  useEffect(() => {
    // Update pending count
    updatePendingCount();
  }, [syncStatus]);
  
  const saveOffline = async (data: any, type: 'flight' | 'checklist', operation: 'CREATE' | 'UPDATE' | 'DELETE') => {
    try {
      if (type === 'flight') {
        await offlineStorage.saveFlight(data, operation);
      } else {
        await offlineStorage.saveChecklist(data, operation);
      }
      
      updatePendingCount();
      
      // Register background sync
      if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
        const registration = await navigator.serviceWorker.ready;
        await registration.sync.register('sync-offline-data');
      }
    } catch (error) {
      console.error('Erro ao salvar offline:', error);
      throw error;
    }
  };
  
  const syncData = async () => {
    if (!isOnline || syncStatus === 'syncing') return;
    
    setSyncStatus('syncing');
    
    try {
      const unsyncedData = await offlineStorage.getUnsyncedData();
      
      // Sync flights
      for (const item of unsyncedData.flights) {
        try {
          await fetch('/api/sync/flights', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              data: item.data,
              operation: item.operation
            })
          });
          
          await offlineStorage.markAsSynced('flights', item.id);
        } catch (error) {
          console.error('Erro ao sincronizar voo:', error);
        }
      }
      
      // Sync checklists
      for (const item of unsyncedData.checklists) {
        try {
          await fetch('/api/sync/checklists', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              data: item.data,
              operation: item.operation
            })
          });
          
          await offlineStorage.markAsSynced('checklists', item.id);
        } catch (error) {
          console.error('Erro ao sincronizar checklist:', error);
        }
      }
      
      setSyncStatus('idle');
      updatePendingCount();
      
    } catch (error) {
      console.error('Erro na sincronização:', error);
      setSyncStatus('error');
    }
  };
  
  const updatePendingCount = async () => {
    try {
      const unsyncedData = await offlineStorage.getUnsyncedData();
      setPendingCount(unsyncedData.flights.length + unsyncedData.checklists.length);
    } catch (error) {
      console.error('Erro ao contar dados pendentes:', error);
    }
  };
  
  return {
    isOnline,
    syncStatus,
    pendingCount,
    saveOffline,
    syncData,
    clearSyncedData: offlineStorage.clearSyncedData.bind(offlineStorage)
  };
}
```

***

## 5. Testes

### 5.1 Configuração de Testes

```javascript
// jest.config.js
const nextJest = require('next/jest');

const createJestConfig = nextJest({
  dir: './'
});

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/$1'
  },
  collectCoverageFrom: [
    'app/**/*.{js,jsx,ts,tsx}',
    'components/**/*.{js,jsx,ts,tsx}',
    'lib/**/*.{js,jsx,ts,tsx}',
    'hooks/**/*.{js,jsx,ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  }
};

module.exports = createJestConfig(customJestConfig);
```

```javascript
// jest.setup.js
import '@testing-library/jest-dom';
import { TextEncoder, TextDecoder } from 'util';

// Polyfills
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  observe() { return null; }
  disconnect() { return null; }
  unobserve() { return null; }
};

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  observe() { return null; }
  disconnect() { return null; }
  unobserve() { return null; }
};

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn()
  }))
});
```

### 5.2 Testes de Componentes

```typescript
// __tests__/components/flight-checklist.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { FlightChecklist } from '@/components/flight-checklist/flight-checklist';
import { useFlightStore } from '@/stores/flight-store';
import { getChecklistItems } from '@/lib/api/checklist';

// Mocks
jest.mock('@/stores/flight-store');
jest.mock('@/lib/api/checklist');

const mockUseFlightStore = useFlightStore as jest.MockedFunction<typeof useFlightStore>;
const mockGetChecklistItems = getChecklistItems as jest.MockedFunction<typeof getChecklistItems>;

// Test data
const mockChecklistItems = [
  {
    id: '1',
    voo_id: 'flight-1',
    bloco: 1,
    item_nome: 'Verificar documentação',
    marcado: false,
    ordem: 1
  },
  {
    id: '2',
    voo_id: 'flight-1',
    bloco: 1,
    item_nome: 'Inspeção visual',
    marcado: true,
    ordem: 2
  }
];

// Test wrapper
const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  });
  
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('FlightChecklist', () => {
  beforeEach(() => {
    mockUseFlightStore.mockReturnValue({
      updateFlightStatus: jest.fn()
    });
    
    mockGetChecklistItems.mockResolvedValue(mockChecklistItems);
  });
  
  afterEach(() => {
    jest.clearAllMocks();
  });
  
  it('should render checklist items', async () => {
    render(
      <TestWrapper>
        <FlightChecklist flightId="flight-1" />
      </TestWrapper>
    );
    
    await waitFor(() => {
      expect(screen.getByText('Verificar documentação')).toBeInTheDocument();
      expect(screen.getByText('Inspeção visual')).toBeInTheDocument();
    });
  });
  
  it('should handle item check', async () => {
    const mockOnComplete = jest.fn();
    
    render(
      <TestWrapper>
        <FlightChecklist 
          flightId="flight-1" 
          onComplete={mockOnComplete}
        />
      </TestWrapper>
    );
    
    await waitFor(() => {
      expect(screen.getByText('Verificar documentação')).toBeInTheDocument();
    });
    
    // Click on unchecked item
    const checkbox = screen.getByRole('checkbox', { name: /verificar documentação/i });
    fireEvent.click(checkbox);
    
    // Verify the item was checked
    await waitFor(() => {
      expect(checkbox).toBeChecked();
    });
  });
  
  it('should call onComplete when all items are checked', async () => {
    const mockOnComplete = jest.fn();
    
    // Mock all items as checked
    mockGetChecklistItems.mockResolvedValue(
      mockChecklistItems.map(item => ({ ...item, marcado: true }))
    );
    
    render(
      <TestWrapper>
        <FlightChecklist 
          flightId="flight-1" 
          onComplete={mockOnComplete}
        />
      </TestWrapper>
    );
    
    await waitFor(() => {
      expect(mockOnComplete).toHaveBeenCalled();
    });
  });
  
  it('should be readonly when readonly prop is true', async () => {
    render(
      <TestWrapper>
        <FlightChecklist flightId="flight-1" readonly />
      </TestWrapper>
    );
    
    await waitFor(() => {
      const checkboxes = screen.getAllByRole('checkbox');
      checkboxes.forEach(checkbox => {
        expect(checkbox).toBeDisabled();
      });
    });
  });
  
  it('should navigate between blocks', async () => {
    render(
      <TestWrapper>
        <FlightChecklist flightId="flight-1" />
      </TestWrapper>
    );
    
    await waitFor(() => {
      expect(screen.getByText('Checklist de Segurança - Bloco 1')).toBeInTheDocument();
    });
    
    // Click next block
    const nextButton = screen.getByText('Próximo Bloco');
    fireEvent.click(nextButton);
    
    expect(screen.getByText('Checklist de Segurança - Bloco 2')).toBeInTheDocument();
  });
});
```

### 5.3 Testes E2E

```typescript
// __tests__/e2e/flight-creation.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Flight Creation Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.fill('[data-testid="email"]', 'pilot@test.com');
    await page.fill('[data-testid="password"]', 'password123');
    await page.click('[data-testid="login-button"]');
    
    // Wait for redirect to dashboard
    await page.waitForURL('/dashboard');
  });
  
  test('should create a new flight successfully', async ({ page }) => {
    // Navigate to flight creation
    await page.click('[data-testid="new-flight-button"]');
    await page.waitForURL('/flights/new');
    
    // Fill flight form
    await page.fill('[data-testid="flight-date"]', '2024-12-31');
    await page.selectOption('[data-testid="flight-period"]', 'manha');
    await page.fill('[data-testid="takeoff-location"]', 'Campo de Santana');
    await page.fill('[data-testid="landing-location"]', 'Parque Lage');
    await page.fill('[data-testid="takeoff-time"]', '06:00');
    await page.fill('[data-testid="landing-time"]', '08:00');
    await page.fill('[data-testid="passengers-count"]', '4');
    
    // Submit form
    await page.click('[data-testid="create-flight-button"]');
    
    // Verify success
    await expect(page.locator('[data-testid="success-message"]'))
      .toContainText('Voo criado com sucesso');
    
    // Verify redirect to flight details
    await page.waitForURL(/\/flights\/[a-f0-9-]+/);
    
    // Verify flight data is displayed
    await expect(page.locator('[data-testid="flight-date"]'))
      .toContainText('31/12/2024');
    await expect(page.locator('[data-testid="flight-period"]'))
      .toContainText('Manhã');
  });
  
  test('should complete checklist flow', async ({ page }) => {
    // Create a flight first
    await page.goto('/flights/new');
    await page.fill('[data-testid="flight-date"]', '2024-12-31');
    await page.selectOption('[data-testid="flight-period"]', 'manha');
    await page.fill('[data-testid="takeoff-location"]', 'Campo de Santana');
    await page.fill('[data-testid="landing-location"]', 'Parque Lage');
    await page.fill('[data-testid="takeoff-time"]', '06:00');
    await page.fill('[data-testid="landing-time"]', '08:00');
    await page.fill('[data-testid="passengers-count"]', '4');
    await page.click('[data-testid="create-flight-button"]');
    
    // Wait for flight details page
    await page.waitForURL(/\/flights\/[a-f0-9-]+/);
    
    // Start checklist
    await page.click('[data-testid="start-checklist-button"]');
    
    // Complete Block 1
    const block1Items = page.locator('[data-testid^="checklist-item-1-"]');
    const block1Count = await block1Items.count();
    
    for (let i = 0; i < block1Count; i++) {
      await block1Items.nth(i).click();
    }
    
    // Verify Block 1 completion
    await expect(page.locator('[data-testid="block-1-status"]'))
      .toContainText('Completo');
    
    // Move to Block 2
    await page.click('[data-testid="next-block-button"]');
    
    // Complete Block 2
    const block2Items = page.locator('[data-testid^="checklist-item-2-"]');
    const block2Count = await block2Items.count();
    
    for (let i = 0; i < block2Count; i++) {
      await block2Items.nth(i).click();
    }
    
    // Move to Block 3
    await page.click('[data-testid="next-block-button"]');
    
    // Complete Block 3
    const block3Items = page.locator('[data-testid^="checklist-item-3-"]');
    const block3Count = await block3Items.count();
    
    for (let i = 0; i < block3Count; i++) {
      await block3Items.nth(i).click();
    }
    
    // Verify checklist completion
    await expect(page.locator('[data-testid="checklist-status"]'))
      .toContainText('Checklist Concluído');
    
    // Verify flight status update
    await expect(page.locator('[data-testid="flight-status"]'))
      .toContainText('checklist_concluido');
  });
  
  test('should work offline', async ({ page, context }) => {
    // Go offline
    await context.setOffline(true);
    
    // Try to create a flight offline
    await page.goto('/flights/new');
    
    // Verify offline indicator
    await expect(page.locator('[data-testid="offline-indicator"]'))
      .toBeVisible();
    
    // Fill and submit form
    await page.fill('[data-testid="flight-date"]', '2024-12-31');
    await page.selectOption('[data-testid="flight-period"]', 'manha');
    await page.fill('[data-testid="takeoff-location"]', 'Campo de Santana');
    await page.fill('[data-testid="landing-location"]', 'Parque Lage');
    await page.fill('[data-testid="takeoff-time"]', '06:00');
    await page.fill('[data-testid="landing-time"]', '08:00');
    await page.fill('[data-testid="passengers-count"]', '4');
    
    await page.click('[data-testid="create-flight-button"]');
    
    // Verify offline save message
    await expect(page.locator('[data-testid="offline-save-message"]'))
      .toContainText('Dados salvos offline');
    
    // Go back online
    await context.setOffline(false);
    
    // Wait for sync
    await page.waitForTimeout(2000);
    
    // Verify sync success
    await expect(page.locator('[data-testid="sync-status"]'))
      .toContainText('Sincronizado');
  });
});
```

***

## 6. Deploy e CI/CD

### 6.1 GitHub Actions

```yaml
# .github/workflows/ci.yml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

env:
  NODE_VERSION: '18'
  VERCEL_ORG_ID: ${{ secrets.VERCEL_ORG_ID }}
  VERCEL_PROJECT_ID: ${{ secrets.VERCEL_PROJECT_ID }}

jobs:
  test:
    name: Test
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout
        uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run linting
        run: npm run lint
      
      - name: Run type checking
        run: npm run type-check
      
      - name: Run unit tests
        run: npm run test:coverage
      
      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3
        with:
          file: ./coverage/lcov.info
          flags: unittests
          name: codecov-umbrella
      
      - name: Build application
        run: npm run build
        env:
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.NEXT_PUBLIC_SUPABASE_URL }}
          NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.NEXT_PUBLIC_SUPABASE_ANON_KEY }}
  
  e2e:
    name: E2E Tests
    runs-on: ubuntu-latest
    needs: test
    
    steps:
      - name: Checkout
        uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Install Playwright
        run: npx playwright install --with-deps
      
      - name: Run E2E tests
        run: npm run test:e2e
        env:
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.NEXT_PUBLIC_SUPABASE_URL }}
          NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.NEXT_PUBLIC_SUPABASE_ANON_KEY }}
      
      - name: Upload E2E results
        uses: actions/upload-artifact@v3
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 30
  
  deploy-preview:
    name: Deploy Preview
    runs-on: ubuntu-latest
    needs: [test, e2e]
    if: github.event_name == 'pull_request'
    
    steps:
      - name: Checkout
        uses: actions/checkout@v4
      
      - name: Install Vercel CLI
        run: npm install --global vercel@latest
      
      - name: Pull Vercel Environment Information
        run: vercel pull --yes --environment=preview --token=${{ secrets.VERCEL_TOKEN }}
      
      - name: Build Project Artifacts
        run: vercel build --token=${{ secrets.VERCEL_TOKEN }}
      
      - name: Deploy Project Artifacts to Vercel
        run: vercel deploy --prebuilt --prod --token=${{ secrets.VERCEL_TOKEN }}
      
      - name: Run smoke tests
        run: npm run test:smoke
        env:
          SMOKE_TEST_URL: https://avibaq.com.br
```

### 6.2 Scripts de Deploy

```json
// package.json scripts
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "lint:fix": "next lint --fix",
    "type-check": "tsc --noEmit",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:smoke": "playwright test --grep @smoke",
    "db:generate-types": "supabase gen types typescript --local > types/supabase.ts",
    "db:reset": "supabase db reset",
    "db:seed": "supabase db seed",
    "db:migrate": "supabase migration up",
    "vercel:pull": "vercel env pull .env.local",
    "vercel:deploy": "vercel --prod"
  }
}
```

---

## 7. Monitoramento e Observabilidade

### 7.1 Configuração do Sentry

```typescript
// lib/sentry.ts
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  debug: process.env.NODE_ENV === 'development',
  
  beforeSend(event, hint) {
    // Filter out known non-critical errors
    if (event.exception) {
      const error = hint.originalException;
      if (error && error.message?.includes('ResizeObserver loop limit exceeded')) {
        return null;
      }
    }
    return event;
  },
  
  beforeSendTransaction(event) {
    // Sample transactions based on operation
    if (event.transaction === '/api/health') {
      return Math.random() < 0.01 ? event : null;
    }
    return event;
  }
});
```

### 7.2 Health Check Endpoint

```typescript
// app/api/health/route.ts
import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function GET() {
  const startTime = Date.now();
  const checks = {
    database: false,
    storage: false,
    auth: false
  };
  
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Database check
    try {
      const { error } = await supabase.from('users').select('count').limit(1);
      checks.database = !error;
    } catch (error) {
      console.error('Database health check failed:', error);
    }
    
    // Storage check
    try {
      const { error } = await supabase.storage.listBuckets();
      checks.storage = !error;
    } catch (error) {
      console.error('Storage health check failed:', error);
    }
    
    // Auth check
    try {
      const { error } = await supabase.auth.getSession();
      checks.auth = !error;
    } catch (error) {
      console.error('Auth health check failed:', error);
    }
    
    const responseTime = Date.now() - startTime;
    const isHealthy = Object.values(checks).every(Boolean);
    
    return NextResponse.json({
      status: isHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      responseTime,
      checks,
      version: process.env.npm_package_version || '1.0.0'
    }, {
      status: isHealthy ? 200 : 503
    });
    
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: error.message
    }, {
      status: 500
    });
  }
}
```

---

## 8. Segurança

### 8.1 Middleware de Segurança

```typescript
// middleware.ts
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Rate limiting store (in production, use Redis)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

function rateLimit(ip: string, limit: number = 100, windowMs: number = 60000) {
  const now = Date.now();
  const key = `${ip}:${Math.floor(now / windowMs)}`;
  
  const current = rateLimitStore.get(key) || { count: 0, resetTime: now + windowMs };
  current.count++;
  
  rateLimitStore.set(key, current);
  
  // Cleanup old entries
  for (const [k, v] of rateLimitStore.entries()) {
    if (v.resetTime < now) {
      rateLimitStore.delete(k);
    }
  }
  
  return current.count <= limit;
}

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  
  // Security headers
  res.headers.set('X-Frame-Options', 'DENY');
  res.headers.set('X-Content-Type-Options', 'nosniff');
  res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  
  // CSP header
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://vercel.live",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https: blob:",
    "font-src 'self' data:",
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
    "media-src 'self' https://*.supabase.co"
  ].join('; ');
  
  res.headers.set('Content-Security-Policy', csp);
  
  // Rate limiting for API routes
  if (req.nextUrl.pathname.startsWith('/api/')) {
    const ip = req.ip || req.headers.get('x-forwarded-for') || 'unknown';
    
    if (!rateLimit(ip)) {
      return NextResponse.json(
        { error: 'Too many requests' },
        { status: 429 }
      );
    }
  }
  
  // Auth check for protected routes
  const protectedPaths = ['/dashboard', '/flights', '/admin'];
  const isProtectedPath = protectedPaths.some(path => 
    req.nextUrl.pathname.startsWith(path)
  );
  
  if (isProtectedPath) {
    const supabase = createMiddlewareClient({ req, res });
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      const redirectUrl = new URL('/login', req.url);
      redirectUrl.searchParams.set('redirect', req.nextUrl.pathname);
      return NextResponse.redirect(redirectUrl);
    }
  }
  
  return res;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
```

---

## 9. Performance

### 9.1 Otimizações de Bundle

```javascript
// next.config.js
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development'
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    optimizePackageImports: ['@radix-ui/react-icons', 'lucide-react']
  },
  
  // Bundle analyzer
  ...(process.env.ANALYZE === 'true' && {
    webpack: (config) => {
      config.plugins.push(
        new (require('@next/bundle-analyzer'))({
          enabled: true
        })
      );
      return config;
    }
  }),
  
  // Image optimization
  images: {
    domains: ['*.supabase.co'],
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60 * 60 * 24 * 30 // 30 days
  },
  
  // Compression
  compress: true,
  
  // Headers for caching
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, must-revalidate'
          }
        ]
      },
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable'
          }
        ]
      }
    ];
  }
};

module.exports = withPWA(nextConfig);
```

### 9.2 Lazy Loading e Code Splitting

```typescript
// components/lazy-components.ts
import dynamic from 'next/dynamic';
import { ComponentType } from 'react';

// Lazy load heavy components
export const FlightChart = dynamic(
  () => import('./charts/flight-chart').then(mod => mod.FlightChart),
  {
    loading: () => <div className="animate-pulse bg-gray-200 h-64 rounded" />,
    ssr: false
  }
);

export const WeatherMap = dynamic(
  () => import('./weather/weather-map').then(mod => mod.WeatherMap),
  {
    loading: () => <div className="animate-pulse bg-gray-200 h-96 rounded" />,
    ssr: false
  }
);

export const AdminPanel = dynamic(
  () => import('./admin/admin-panel').then(mod => mod.AdminPanel),
  {
    loading: () => <div>Carregando painel administrativo...</div>
  }
);

// HOC for lazy loading with error boundary
export function withLazyLoading<T extends object>(
  importFn: () => Promise<{ default: ComponentType<T> }>,
  fallback?: ComponentType
) {
  return dynamic(importFn, {
    loading: fallback || (() => <div>Carregando...</div>),
    ssr: false
  });
}
```

---

## 10. Troubleshooting

### 10.1 Problemas Comuns

#### Erro de Hydration
```typescript
// Solução: useEffect para componentes client-side only
import { useEffect, useState } from 'react';

export function ClientOnlyComponent() {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  if (!mounted) {
    return <div>Carregando...</div>;
  }
  
  return (
    <div>
      {/* Conteúdo que só funciona no cliente */}
    </div>
  );
}
```

#### Problemas de RLS no Supabase
```sql
-- Debug RLS policies
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE schemaname = 'public';

-- Verificar policies ativas
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE schemaname = 'public';
```

#### Performance Issues
```typescript
// Debug de queries lentas
const debugQuery = async (queryFn: () => Promise<any>, label: string) => {
  const start = performance.now();
  const result = await queryFn();
  const end = performance.now();
  
  console.log(`[${label}] Query took ${end - start}ms`);
  
  if (end - start > 1000) {
    console.warn(`[${label}] Slow query detected!`);
  }
  
  return result;
};

// Uso
const flights = await debugQuery(
  () => supabase.from('voos').select('*'),
  'Load Flights'
);
```

### 10.2 Logs e Debug

```typescript
// lib/logger.ts
type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  userId?: string;
  metadata?: Record<string, any>;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';
  
  private log(level: LogLevel, message: string, metadata?: Record<string, any>) {
    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      metadata
    };
    
    // Console output in development
    if (this.isDevelopment) {
      console[level](entry);
    }
    
    // Send to external service in production
    if (!this.isDevelopment && level !== 'debug') {
      this.sendToExternalService(entry);
    }
  }
  
  debug(message: string, metadata?: Record<string, any>) {
    this.log('debug', message, metadata);
  }
  
  info(message: string, metadata?: Record<string, any>) {
    this.log('info', message, metadata);
  }
  
  warn(message: string, metadata?: Record<string, any>) {
    this.log('warn', message, metadata);
  }
  
  error(message: string, error?: Error, metadata?: Record<string, any>) {
    this.log('error', message, {
      ...metadata,
      error: error?.message,
      stack: error?.stack
    });
  }
  
  private async sendToExternalService(entry: LogEntry) {
    // Implement external logging service
    // e.g., Sentry, LogRocket, etc.
  }
}

export const logger = new Logger();
```

---

## 11. Conclusão

Este guia fornece uma base sólida para o desenvolvimento do Sistema AVIBAQ. Lembre-se de:

- **Seguir os padrões estabelecidos** para manter consistência
- **Escrever testes** para todas as funcionalidades críticas
- **Documentar mudanças** importantes no código
- **Monitorar performance** em produção
- **Manter segurança** como prioridade máxima

### Recursos Adicionais

- [Documentação Next.js](https://nextjs.org/docs)
- [Documentação Supabase](https://supabase.com/docs)
- [Documentação TypeScript](https://www.typescriptlang.org/docs/)
- [Guia de Testes React](https://testing-library.com/docs/react-testing-library/intro/)
- [Playwright Documentation](https://playwright.dev/)

---

**Documento mantido pela equipe de desenvolvimento AVIBAQ**  
**Última atualização:** Janeiro 2025  
**Próxima revisão:** Abril 2025 Project Artifacts to Vercel
        id: deploy
        run: |
          url=$(vercel deploy --prebuilt --token=${{ secrets.VERCEL_TOKEN }})
          echo "preview_url=$url" >> $GITHUB_OUTPUT
      
      - name: Comment PR
        uses: actions/github-script@v6
        with:
          script: |
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: `🚀 Preview deployed to: ${{ steps.deploy.outputs.preview_url }}`
            })
  
  deploy-production:
    name: Deploy Production
    runs-on: ubuntu-latest
    needs: [test, e2e]
    if: github.ref == 'refs/heads/main'
    
    steps:
      - name: Checkout
        uses: actions/checkout@v4
      
      - name: Install Vercel CLI
        run: npm install --global vercel@latest
      
      - name: Pull Vercel Environment Information
        run: vercel pull --yes --environment=production --token=${{ secrets.VERCEL_TOKEN }}
      
      - name: Build Project Artifacts
        run: vercel build --prod --token=${{ secrets.VERCEL_TOKEN }}
      
      - name: Deploy
```

