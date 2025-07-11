/**
 * Sistema de sincronização offline para o módulo de voos
 * Gerencia a fila de sincronização e estratégias de conflito
 */

import { supabase } from '../../integrations/supabase/client';

export interface OfflineData {
  id: string;
  type: 'voo' | 'checklist' | 'anexo' | 'balao';
  action: 'create' | 'update' | 'delete';
  data: any;
  timestamp: number;
  attempts: number;
  lastError?: string;
}

export interface SyncResult {
  success: boolean;
  error?: string;
  conflicts?: any[];
}

class SyncManager {
  private isOnline: boolean = typeof navigator !== 'undefined' ? navigator.onLine : false;
  private syncQueue: OfflineData[] = [];
  private isSupported: boolean = false;
  private maxRetries: number = 3;
  private retryDelay: number = 5000; // 5 segundos

  constructor() {
    // Só inicializar no lado do cliente
    if (typeof window !== 'undefined') {
      this.initializeOfflineStorage();
      this.setupEventListeners();
      this.checkSupport();
    }
  }

  private checkSupport(): void {
    if (typeof window === 'undefined') {
      this.isSupported = false;
      return;
    }
    
    this.isSupported = (
      'serviceWorker' in navigator &&
      'indexedDB' in window &&
      'localStorage' in window
    );
  }

  private initializeOfflineStorage(): void {
    if (typeof window === 'undefined') return;
    
    // Recuperar dados da fila do localStorage
    const stored = localStorage.getItem('avibaq_sync_queue');
    if (stored) {
      try {
        this.syncQueue = JSON.parse(stored);
      } catch (error) {
        console.error('Erro ao recuperar fila de sincronização:', error);
        this.syncQueue = [];
      }
    }
  }

  private setupEventListeners(): void {
    // Monitorar status de conectividade
    window.addEventListener('online', () => {
      this.isOnline = true;
      console.log('🔄 Conexão restaurada, iniciando sincronização...');
      this.processSyncQueue();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      console.log('📡 Modo offline ativado');
    });

    // Sincronizar quando a página for recarregada
    window.addEventListener('beforeunload', () => {
      this.saveQueueToStorage();
    });
  }

  private saveQueueToStorage(): void {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.setItem('avibaq_sync_queue', JSON.stringify(this.syncQueue));
    } catch (error) {
      console.error('Erro ao salvar fila de sincronização:', error);
    }
  }

  /**
   * Adiciona um item à fila de sincronização
   */
  public addToQueue(item: Omit<OfflineData, 'id' | 'timestamp' | 'attempts'>): string {
    const id = crypto.randomUUID();
    const offlineItem: OfflineData = {
      ...item,
      id,
      timestamp: Date.now(),
      attempts: 0
    };

    this.syncQueue.push(offlineItem);
    this.saveQueueToStorage();

    // Se estiver online, tentar sincronizar imediatamente
    if (this.isOnline) {
      this.processSyncQueue();
    }

    return id;
  }

  /**
   * Processa a fila de sincronização
   */
  public async processSyncQueue(): Promise<void> {
    if (!this.isOnline || this.syncQueue.length === 0) {
      return;
    }

    console.log(`🔄 Processando ${this.syncQueue.length} itens na fila de sincronização`);

    const itemsToProcess = [...this.syncQueue];
    
    for (const item of itemsToProcess) {
      try {
        const result = await this.syncItem(item);
        
        if (result.success) {
          // Remove da fila se sincronizou com sucesso
          this.removeFromQueue(item.id);
          console.log(`✅ Item ${item.id} sincronizado: ${item.type} ${item.action}`);
        } else {
          // Incrementa tentativas e reagenda se não excedeu limite
          item.attempts++;
          item.lastError = result.error;
          
          if (item.attempts >= this.maxRetries) {
            console.error(`❌ Item ${item.id} falhou após ${this.maxRetries} tentativas:`, result.error);
            this.removeFromQueue(item.id);
          } else {
            console.warn(`⚠️ Tentativa ${item.attempts}/${this.maxRetries} falhou para ${item.id}:`, result.error);
            // Reagendar para tentar novamente
            setTimeout(() => this.processSyncQueue(), this.retryDelay * item.attempts);
          }
        }
      } catch (error) {
        console.error(`Erro inesperado ao sincronizar item ${item.id}:`, error);
        item.attempts++;
        item.lastError = error.message;
      }
    }

    this.saveQueueToStorage();
  }

  /**
   * Sincroniza um item específico com o servidor
   */
  private async syncItem(item: OfflineData): Promise<SyncResult> {
    try {
      switch (item.type) {
        case 'voo':
          return await this.syncVoo(item);
        case 'checklist':
          return await this.syncChecklist(item);
        case 'anexo':
          return await this.syncAnexo(item);
        case 'balao':
          return await this.syncBalao(item);
        default:
          return { success: false, error: `Tipo não suportado: ${item.type}` };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  private async syncVoo(item: OfflineData): Promise<SyncResult> {
    const { action, data } = item;

    switch (action) {
      case 'create':
        const { error: createError } = await supabase
          .from('voos')
          .insert(data);
        return { success: !createError, error: createError?.message };

      case 'update':
        const { error: updateError } = await supabase
          .from('voos')
          .update(data)
          .eq('id', data.id);
        return { success: !updateError, error: updateError?.message };

      case 'delete':
        const { error: deleteError } = await supabase
          .from('voos')
          .delete()
          .eq('id', data.id);
        return { success: !deleteError, error: deleteError?.message };

      default:
        return { success: false, error: `Ação não suportada: ${action}` };
    }
  }

  private async syncChecklist(item: OfflineData): Promise<SyncResult> {
    const { action, data } = item;

    switch (action) {
      case 'update':
        const { error } = await supabase
          .from('checklist_itens')
          .update(data)
          .eq('id', data.id);
        return { success: !error, error: error?.message };

      default:
        return { success: false, error: `Ação não suportada para checklist: ${action}` };
    }
  }

  private async syncAnexo(item: OfflineData): Promise<SyncResult> {
    const { action, data } = item;

    switch (action) {
      case 'create':
        const { error } = await supabase
          .from('voos_anexos')
          .insert(data);
        return { success: !error, error: error?.message };

      default:
        return { success: false, error: `Ação não suportada para anexo: ${action}` };
    }
  }

  private async syncBalao(item: OfflineData): Promise<SyncResult> {
    const { action, data } = item;

    switch (action) {
      case 'create':
        const { error: createError } = await supabase
          .from('baloes')
          .insert(data);
        return { success: !createError, error: createError?.message };

      case 'update':
        const { error: updateError } = await supabase
          .from('baloes')
          .update(data)
          .eq('id', data.id);
        return { success: !updateError, error: updateError?.message };

      default:
        return { success: false, error: `Ação não suportada para balão: ${action}` };
    }
  }

  private removeFromQueue(id: string): void {
    this.syncQueue = this.syncQueue.filter(item => item.id !== id);
  }

  /**
   * Limpa a fila de sincronização
   */
  public clearQueue(): void {
    this.syncQueue = [];
    this.saveQueueToStorage();
  }

  /**
   * Retorna informações sobre o status da sincronização
   */
  public getStatus() {
    return {
      isOnline: this.isOnline,
      isSupported: this.isSupported,
      queueLength: this.syncQueue.length,
      pendingItems: this.syncQueue.map(item => ({
        id: item.id,
        type: item.type,
        action: item.action,
        attempts: item.attempts,
        lastError: item.lastError
      }))
    };
  }

  /**
   * Força uma tentativa de sincronização
   */
  public async forcSync(): Promise<void> {
    if (this.isOnline) {
      await this.processSyncQueue();
    } else {
      throw new Error('Sem conexão com a internet');
    }
  }
}

// Instância singleton do gerenciador de sincronização
export const syncManager = new SyncManager();