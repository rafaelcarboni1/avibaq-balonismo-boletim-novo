/**
 * Sistema de armazenamento offline usando IndexedDB e localStorage
 * Gerencia dados locais para funcionamento offline
 */

export interface StoredItem {
  id: string;
  type: string;
  data: any;
  lastModified: number;
  synced: boolean;
}

class OfflineStorage {
  private dbName = 'AVIBAQ_Offline';
  private dbVersion = 1;
  private db: IDBDatabase | null = null;

  constructor() {
    // Só inicializar no lado do cliente
    if (typeof window !== 'undefined') {
      this.initDB();
    }
  }

  private async initDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => {
        console.error('Erro ao abrir IndexedDB:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log('💾 IndexedDB iniciado com sucesso');
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Store para voos
        if (!db.objectStoreNames.contains('voos')) {
          const voosStore = db.createObjectStore('voos', { keyPath: 'id' });
          voosStore.createIndex('synced', 'synced', { unique: false });
          voosStore.createIndex('lastModified', 'lastModified', { unique: false });
        }

        // Store para checklist
        if (!db.objectStoreNames.contains('checklist')) {
          const checklistStore = db.createObjectStore('checklist', { keyPath: 'id' });
          checklistStore.createIndex('voo_id', 'data.voo_id', { unique: false });
          checklistStore.createIndex('synced', 'synced', { unique: false });
        }

        // Store para balões
        if (!db.objectStoreNames.contains('baloes')) {
          const baloesStore = db.createObjectStore('baloes', { keyPath: 'id' });
          baloesStore.createIndex('proprietario_id', 'data.proprietario_id', { unique: false });
          baloesStore.createIndex('synced', 'synced', { unique: false });
        }

        // Store para anexos (metadados)
        if (!db.objectStoreNames.contains('anexos')) {
          const anexosStore = db.createObjectStore('anexos', { keyPath: 'id' });
          anexosStore.createIndex('voo_id', 'data.voo_id', { unique: false });
          anexosStore.createIndex('synced', 'synced', { unique: false });
        }

        console.log('💾 IndexedDB estrutura criada');
      };
    });
  }

  /**
   * Salva um item no armazenamento offline
   */
  public async save(storeName: string, item: any, synced: boolean = false): Promise<void> {
    if (!this.db) {
      await this.initDB();
    }

    const storedItem: StoredItem = {
      id: item.id || crypto.randomUUID(),
      type: storeName,
      data: item,
      lastModified: Date.now(),
      synced
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(storedItem);

      request.onsuccess = () => {
        console.log(`💾 Item salvo offline: ${storeName}/${storedItem.id}`);
        resolve();
      };

      request.onerror = () => {
        console.error('Erro ao salvar item offline:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Recupera um item por ID
   */
  public async get(storeName: string, id: string): Promise<StoredItem | null> {
    if (!this.db) {
      await this.initDB();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(id);

      request.onsuccess = () => {
        resolve(request.result || null);
      };

      request.onerror = () => {
        console.error('Erro ao recuperar item:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Recupera todos os itens de um store
   */
  public async getAll(storeName: string, syncedOnly: boolean = false): Promise<StoredItem[]> {
    if (!this.db) {
      await this.initDB();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      
      let request: IDBRequest;
      if (syncedOnly) {
        const index = store.index('synced');
        request = index.getAll(IDBKeyRange.only(true));
      } else {
        request = store.getAll();
      }

      request.onsuccess = () => {
        resolve(request.result || []);
      };

      request.onerror = () => {
        console.error('Erro ao recuperar itens:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Recupera itens por voo_id (para checklist e anexos)
   */
  public async getByVooId(storeName: string, vooId: string): Promise<StoredItem[]> {
    if (!this.db) {
      await this.initDB();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const index = store.index('voo_id');
      const request = index.getAll(vooId);

      request.onsuccess = () => {
        resolve(request.result || []);
      };

      request.onerror = () => {
        console.error('Erro ao recuperar itens por voo_id:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Marca um item como sincronizado
   */
  public async markAsSynced(storeName: string, id: string): Promise<void> {
    if (!this.db) {
      await this.initDB();
    }

    const item = await this.get(storeName, id);
    if (item) {
      item.synced = true;
      item.lastModified = Date.now();
      await this.save(storeName, item.data, true);
    }
  }

  /**
   * Remove um item do armazenamento
   */
  public async remove(storeName: string, id: string): Promise<void> {
    if (!this.db) {
      await this.initDB();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(id);

      request.onsuccess = () => {
        console.log(`🗑️ Item removido do offline: ${storeName}/${id}`);
        resolve();
      };

      request.onerror = () => {
        console.error('Erro ao remover item:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Limpa todos os dados de um store
   */
  public async clear(storeName: string): Promise<void> {
    if (!this.db) {
      await this.initDB();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.clear();

      request.onsuccess = () => {
        console.log(`🧹 Store ${storeName} limpo`);
        resolve();
      };

      request.onerror = () => {
        console.error('Erro ao limpar store:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Retorna estatísticas do armazenamento offline
   */
  public async getStats(): Promise<any> {
    const stores = ['voos', 'checklist', 'baloes', 'anexos'];
    const stats: any = {};

    for (const store of stores) {
      const allItems = await this.getAll(store);
      const syncedItems = await this.getAll(store, true);
      
      stats[store] = {
        total: allItems.length,
        synced: syncedItems.length,
        pending: allItems.length - syncedItems.length
      };
    }

    return stats;
  }

  /**
   * Backup simples para localStorage (fallback)
   */
  public saveToLocalStorage(key: string, data: any): void {
    try {
      localStorage.setItem(`avibaq_${key}`, JSON.stringify({
        data,
        timestamp: Date.now()
      }));
    } catch (error) {
      console.error('Erro ao salvar no localStorage:', error);
    }
  }

  /**
   * Recupera do localStorage
   */
  public getFromLocalStorage(key: string): any {
    try {
      const stored = localStorage.getItem(`avibaq_${key}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        return parsed.data;
      }
    } catch (error) {
      console.error('Erro ao recuperar do localStorage:', error);
    }
    return null;
  }
}

// Instância singleton do armazenamento offline
export const offlineStorage = new OfflineStorage();