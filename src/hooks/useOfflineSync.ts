import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../integrations/supabase/client';
import { useUser } from './useUser';

interface OfflineItem {
  id: string;
  tipo_dados: 'voo' | 'checklist' | 'anexo' | 'balao' | 'vinculo';
  operacao: 'CREATE' | 'UPDATE' | 'DELETE';
  dados_json: any;
  temp_id: string;
  status: 'pendente' | 'sincronizando' | 'sincronizado' | 'erro' | 'conflito';
  tentativas_sync: number;
  ultimo_erro?: string;
  created_at: string;
}

interface OfflineStats {
  total_itens: number;
  pendentes: number;
  sincronizando: number;
  sincronizados: number;
  com_erro: number;
  conflitos: number;
}

export function useOfflineSync() {
  const { user } = useUser();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);
  const [offlineStats, setOfflineStats] = useState<OfflineStats>({
    total_itens: 0,
    pendentes: 0,
    sincronizando: 0,
    sincronizados: 0,
    com_erro: 0,
    conflitos: 0
  });
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  
  // Monitorar status de conexão
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      if (user) {
        syncPendingItems();
      }
    };
    
    const handleOffline = () => {
      setIsOnline(false);
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [user]);

  // Carregar estatísticas offline
  const loadOfflineStats = useCallback(async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('vw_stats_sincronizacao')
        .select('*')
        .eq('user_id', user.users_table_id || user.id)
        .single();
      
      if (error && error.code !== 'PGRST116') {
        console.error('Erro ao carregar estatísticas offline:', error);
        return;
      }
      
      if (data) {
        setOfflineStats({
          total_itens: data.total_itens || 0,
          pendentes: data.pendentes || 0,
          sincronizando: data.sincronizando || 0,
          sincronizados: data.sincronizados || 0,
          com_erro: data.com_erro || 0,
          conflitos: data.conflitos || 0
        });
      }
    } catch (error) {
      console.error('Erro ao carregar estatísticas offline:', error);
    }
  }, [user]);

  // Sincronizar itens pendentes
  const syncPendingItems = useCallback(async () => {
    if (!user || !isOnline || isSyncing) return;
    
    try {
      setIsSyncing(true);
      
      // Buscar itens pendentes para sincronização
      const { data: pendingItems, error } = await supabase
        .rpc('processar_fila_sincronizacao', {
          p_user_id: user.users_table_id || user.id,
          p_limite: 10
        });
      
      if (error) {
        console.error('Erro ao buscar itens pendentes:', error);
        return;
      }
      
      if (!pendingItems || pendingItems.length === 0) {
        setLastSyncTime(new Date());
        return;
      }
      
      // Processar cada item
      for (const item of pendingItems) {
        try {
          await processOfflineItem(item);
        } catch (error) {
          console.error(`Erro ao processar item ${item.item_id}:`, error);
          
          // Marcar como erro
          await supabase.rpc('marcar_erro_sincronizacao', {
            p_item_id: item.item_id,
            p_erro: error.message,
            p_erro_detalhado: { 
              error: error.message, 
              stack: error.stack,
              timestamp: new Date().toISOString()
            }
          });
        }
      }
      
      setLastSyncTime(new Date());
      await loadOfflineStats();
      
    } catch (error) {
      console.error('Erro geral na sincronização:', error);
    } finally {
      setIsSyncing(false);
    }
  }, [user, isOnline, isSyncing]);

  // Processar item offline individual
  const processOfflineItem = async (item: any) => {
    const { tipo_dados, operacao, dados_json, temp_id, item_id } = item;
    
    switch (tipo_dados) {
      case 'voo':
        await processVooOffline(operacao, dados_json, temp_id, item_id);
        break;
      case 'checklist':
        await processChecklistOffline(operacao, dados_json, temp_id, item_id);
        break;
      case 'anexo':
        await processAnexoOffline(operacao, dados_json, temp_id, item_id);
        break;
      case 'balao':
        await processBalaoOffline(operacao, dados_json, temp_id, item_id);
        break;
      case 'vinculo':
        await processVinculoOffline(operacao, dados_json, temp_id, item_id);
        break;
      default:
        throw new Error(`Tipo de dados não suportado: ${tipo_dados}`);
    }
  };

  // Processar voo offline
  const processVooOffline = async (operacao: string, dados: any, tempId: string, itemId: string) => {
    switch (operacao) {
      case 'CREATE':
        const { data: vooData, error: vooError } = await supabase
          .from('voos')
          .insert([dados])
          .select()
          .single();
        
        if (vooError) throw vooError;
        
        await supabase.rpc('marcar_sincronizado', {
          p_item_id: itemId,
          p_real_id: vooData.id
        });
        break;
        
      case 'UPDATE':
        const { error: updateError } = await supabase
          .from('voos')
          .update(dados)
          .eq('id', dados.id);
        
        if (updateError) throw updateError;
        
        await supabase.rpc('marcar_sincronizado', {
          p_item_id: itemId,
          p_real_id: dados.id
        });
        break;
        
      case 'DELETE':
        const { error: deleteError } = await supabase
          .from('voos')
          .delete()
          .eq('id', dados.id);
        
        if (deleteError) throw deleteError;
        
        await supabase.rpc('marcar_sincronizado', {
          p_item_id: itemId,
          p_real_id: dados.id
        });
        break;
        
      default:
        throw new Error(`Operação não suportada para voo: ${operacao}`);
    }
  };

  // Processar checklist offline
  const processChecklistOffline = async (operacao: string, dados: any, tempId: string, itemId: string) => {
    switch (operacao) {
      case 'UPDATE':
        const { error } = await supabase
          .from('checklist_itens')
          .update(dados)
          .eq('id', dados.id);
        
        if (error) throw error;
        
        await supabase.rpc('marcar_sincronizado', {
          p_item_id: itemId,
          p_real_id: dados.id
        });
        break;
        
      default:
        throw new Error(`Operação não suportada para checklist: ${operacao}`);
    }
  };

  // Processar anexo offline
  const processAnexoOffline = async (operacao: string, dados: any, tempId: string, itemId: string) => {
    switch (operacao) {
      case 'CREATE':
        const { data: anexoData, error } = await supabase
          .from('voos_anexos')
          .insert([dados])
          .select()
          .single();
        
        if (error) throw error;
        
        await supabase.rpc('marcar_sincronizado', {
          p_item_id: itemId,
          p_real_id: anexoData.id
        });
        break;
        
      default:
        throw new Error(`Operação não suportada para anexo: ${operacao}`);
    }
  };

  // Processar balão offline
  const processBalaoOffline = async (operacao: string, dados: any, tempId: string, itemId: string) => {
    switch (operacao) {
      case 'CREATE':
        const { data: balaoData, error } = await supabase
          .from('baloes')
          .insert([dados])
          .select()
          .single();
        
        if (error) throw error;
        
        await supabase.rpc('marcar_sincronizado', {
          p_item_id: itemId,
          p_real_id: balaoData.id
        });
        break;
        
      default:
        throw new Error(`Operação não suportada para balão: ${operacao}`);
    }
  };

  // Processar vínculo offline
  const processVinculoOffline = async (operacao: string, dados: any, tempId: string, itemId: string) => {
    switch (operacao) {
      case 'CREATE':
        const { data: vinculoData, error } = await supabase
          .from('vinculos_agencia_piloto')
          .insert([dados])
          .select()
          .single();
        
        if (error) throw error;
        
        await supabase.rpc('marcar_sincronizado', {
          p_item_id: itemId,
          p_real_id: vinculoData.id
        });
        break;
        
      default:
        throw new Error(`Operação não suportada para vínculo: ${operacao}`);
    }
  };

  // Salvar dados offline
  const saveOffline = async (
    tipo: 'voo' | 'checklist' | 'anexo' | 'balao' | 'vinculo',
    operacao: 'CREATE' | 'UPDATE' | 'DELETE',
    dados: any,
    tempId?: string
  ) => {
    if (!user) return null;
    
    const finalTempId = tempId || generateTempId();
    
    try {
      const { data, error } = await supabase
        .from('dados_offline')
        .insert([{
          user_id: user.users_table_id || user.id,  // CORREÇÃO: usar ID da tabela users
          tipo_dados: tipo,
          operacao,
          dados_json: dados,
          temp_id: finalTempId
        }])
        .select()
        .single();
      
      if (error) throw error;
      
      // Tentar sincronizar se online
      if (isOnline && !isSyncing) {
        setTimeout(() => syncPendingItems(), 1000);
      }
      
      await loadOfflineStats();
      
      return data;
      
    } catch (error) {
      console.error('Erro ao salvar dados offline:', error);
      throw error;
    }
  };

  // Gerar ID temporário
  const generateTempId = () => {
    return 'temp_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  };

  // Resolver conflito
  const resolveConflict = async (itemId: string, useServerData: boolean = false) => {
    if (!user) return false;
    
    try {
      const { data, error } = await supabase.rpc('resolver_conflito', {
        p_item_id: itemId,
        p_usar_servidor: useServerData
      });
      
      if (error) throw error;
      
      await loadOfflineStats();
      
      if (!useServerData) {
        // Se escolheu dados do cliente, tentar sincronizar novamente
        setTimeout(() => syncPendingItems(), 1000);
      }
      
      return data;
      
    } catch (error) {
      console.error('Erro ao resolver conflito:', error);
      return false;
    }
  };

  // Carregar estatísticas quando componente carrega
  useEffect(() => {
    if (user) {
      loadOfflineStats();
    }
  }, [user, loadOfflineStats]);

  // Sincronizar automaticamente quando voltar online
  useEffect(() => {
    if (isOnline && user && offlineStats.pendentes > 0) {
      syncPendingItems();
    }
  }, [isOnline, user, offlineStats.pendentes]);

  // Limpar dados sincronizados antigos (executar periodicamente)
  const cleanupOldSyncData = async () => {
    if (!user) return;
    
    try {
      await supabase.rpc('limpar_dados_sincronizados', {
        p_dias_retencao: 7
      });
      
      await loadOfflineStats();
    } catch (error) {
      console.error('Erro ao limpar dados sincronizados:', error);
    }
  };

  return {
    isOnline,
    isSyncing,
    offlineStats,
    lastSyncTime,
    saveOffline,
    syncPendingItems,
    resolveConflict,
    cleanupOldSyncData,
    loadOfflineStats
  };
}