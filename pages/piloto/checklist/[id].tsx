import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { CheckCircleIcon, XCircleIcon, ExclamationTriangleIcon, ArrowLeftIcon, ArrowRightIcon, CheckIcon, CloudArrowUpIcon } from '@heroicons/react/24/outline';
import { EnhancedDashboardLayout } from '../../../src/components/magicui/enhanced-dashboard-layout';
import { MagicCard } from '../../../src/components/magicui/magic-card';
import { supabase } from '../../../src/integrations/supabase/client';
import { useUser } from '../../../src/hooks/useUser';
import { useToast } from '../../../src/hooks/use-toast';
import { formatDateSafe } from '../../../src/utils/dateUtils';
import { useQueryClient } from '@tanstack/react-query';

interface ChecklistItem {
  id: string;
  bloco: number;
  item_numero: number;
  item_descricao: string;  // Corrigido: usar item_descricao para compatibilidade com Supabase
  marcado: boolean;
  motivo_nao_marcado: string | null;  // VOLTANDO ao original
  marcado_em: string | null;          // VOLTANDO ao original  
  marcado_por: string | null;         // MANTÉM marcado_por (pode existir)
}

interface Voo {
  id: string;
  data_voo: string;
  periodo: 'manha' | 'tarde';
  horario_previsto: string;
  local_decolagem_previsto: string;
  status: string;
  adultos_previstos: number;
  criancas_previstas: number;
  observacoes_planejamento: string | null;
}

interface VooComBaloes extends Voo {
  baloes: Array<{
    id: string;
    prefixo: string;
    nome_batismo: string | null;
    volume_m3: number;
    adultos_previstos: number;
    criancas_previstas: number;
  }>;
}

const CHECKLIST_ITEMS = {
  bloco1: [
    'Verificação de fixação e estrutura do queimador e tanques',
    'Verificar os cabos/mosquetões do cesto',
    'Verificar fitas de tanques bem ajustadas e presas; manter a presilha num local de acesso fácil para remoção rápida',
    'Verificar válvulas do suspiro cheias',
    'Garantir mangueiras com folgas para manobra necessária no queimador',
    'Verificar mangueiras fora da borda do cesto ou em local não apropriado',
    'Confirmar registros dos tanques devidamente fechados (linha líquida e linha vapor)',
    'Verificar todas as conexões entre queimador e tanques bem fixadas e sem vazamento',
    'Caso exista tanque auxiliar para inflagem, mantê-lo dentro do cockpit devidamente fixado',
    'Verificar pressão do extintor 1 (ponteiro no verde)',
    'Verificar pressão do extintor 2 (ponteiro no verde)',
    'Conferir kit de primeiros socorros completo',
    'Fazer primeiro acionamento do queimador (teste)',
    'Esgotar (esvaziar) todo o sistema de gás após o teste'
  ],
  bloco2: [
    'Conectar ancoragem em ponto fixo e resistente do veículo (preferir parte frontal, não carreta)',
    'Usar sistema de desengate rápido apropriado ao tamanho do balão',
    'Inspecionar cabos do envelope íntegros, sem desfiados, dobras ou entrelaço',
    'Conectar cabos de forma ordenada, um de cada vez, revisando o anterior, iniciar pelos inferiores centrais',
    'Garantir mosquetões fechados com meia volta aberta para não travar',
    'Esticar o envelope no chão para checar integridade do tecido',
    'Posicionar ventiladores, travar rodas; puxar cordinha para verificar rotação livre das pás',
    'Colocar cone de segurança delimitando a área',
    'Acionar ventiladores; atenção a cadarços, rádios, cachecóis',
    'Orientar equipe de boca sobre cuidados, rajadas e procedimento de desligamento rápido a comando do piloto',
    'Entrar no envelope, fechar tap, desobstruir cabos e cordins nas roldanas',
    'Organizar e fixar cabos de tap e janelas de rotação no quadro ou cockpit',
    'Aguardar inflagem de pelo menos 75% do envelope antes de começar a aquecer'
  ],
  bloco3: [
    'Rever conexões bem apertadas e posicionadas',
    'Verificar itens obrigatórios na mala de voo: água, manta anti-chama, luvas de couro, acendedores alternativos, canivete ou faca, alicate',
    'Instalar instrumentos de voo',
    'Chamar passageiros para embarque',
    'Apresentar piloto e equipamento',
    'Confirmar com todos os passageiros que entenderam a experiência',
    'Repetir treinamento da posição de pouso (costas para o scoop, pernas flexionadas, mãos nas alças)',
    'Informar na frequência 142.210 MHz a decolagem da aeronave, identificando o piloto no comando',
    'Verificar condições de vento; abortar se ultrapassarem limite'
  ]
};

export default function ChecklistVoo() {
  const router = useRouter();
  const { id } = router.query;
  const { user, loading: userLoading } = useUser();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [voo, setVoo] = useState<VooComBaloes | null>(null);
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentBloco, setCurrentBloco] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [autoSaving, setAutoSaving] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [savingDraft, setSavingDraft] = useState(false);

  // Verificar se usuário está autenticado e é piloto
  useEffect(() => {
    if (!userLoading && (!user || user.role !== 'piloto')) {
      router.push('/login');
      return;
    }
  }, [user, userLoading]); // Removido router das dependências

  // LIMPAR CACHE e força reload quando user muda
  useEffect(() => {
    if (user?.users_table_id) {
      console.log('[ChecklistVoo] 🔥 FORÇA LIMPEZA DE CACHE - user mudou:', user.users_table_id);
      queryClient.invalidateQueries();
      queryClient.clear();
    }
  }, [user?.users_table_id, queryClient]);

  // Carregar dados do voo e checklist
  useEffect(() => {
    if (id && user?.users_table_id) {
      console.log('[ChecklistVoo] 🔄 CARREGANDO COM users_table_id:', user.users_table_id);
      carregarVoo();
      carregarChecklist();
      loadDraftFromStorage();
    }
  }, [id, user?.users_table_id]); // Mudou user para user?.users_table_id

  // Monitorar status de conexão
  useEffect(() => {
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

  // Auto-save no localStorage
  useEffect(() => {
    if (checklistItems.length > 0 && id) {
      const timeoutId = setTimeout(() => {
        saveDraftToStorage();
      }, 1000);

      return () => clearTimeout(timeoutId);
    }
  }, [checklistItems, id]);

  const carregarVoo = async () => {
    try {
      if (!id) return;

      // Buscar dados do voo com balões
      const { data: vooData, error: vooError } = await supabase
        .from('vw_voos_com_baloes')
        .select('*')
        .eq('voo_id', id)
        .single();

      if (vooError) {
        console.error('Erro ao carregar voo:', vooError);
        toast({
          title: "Erro",
          description: "Voo não encontrado",
          variant: "destructive"
        });
        router.push('/piloto/dashboard');
        return;
      }

      // Verificar se o piloto tem acesso a este voo (primeiro por user_id, depois por email como fallback)
      let membro = null;
      let membroError = null;

      console.log('[Checklist] Verificando acesso para usuário:', { userId: user?.users_table_id, authId: user?.id, email: user?.email });

      // Tentar primeiro por user_id
      const { data: membroPorId, error: errorPorId } = await supabase
        .from('membros')
        .select('id, user_id')
        .eq('user_id', user?.users_table_id)
        .eq('tipo', 'piloto')
        .single();

      if (membroPorId && !errorPorId) {
        membro = membroPorId;
        console.log('[Checklist] Membro encontrado por user_id:', membro.id);
      } else {
        console.log('[Checklist] Membro não encontrado por user_id, tentando por email:', user?.email);
        
        // Fallback: buscar por email se user_id não funcionou
        const { data: membroPorEmail, error: errorPorEmail } = await supabase
          .from('membros')
          .select('id, user_id')
          .eq('email', user?.email)
          .eq('tipo', 'piloto')
          .single();

        if (membroPorEmail && !errorPorEmail) {
          membro = membroPorEmail;
          console.log('[Checklist] Membro encontrado por email. User_id atual:', membroPorEmail.user_id);
          
          // Se encontrou por email mas user_id está null, tentar atualizar
          if (!membroPorEmail.user_id && user?.users_table_id) {
            console.log('[Checklist] Tentando vincular user_id ao membro...');
            await supabase
              .from('membros')
              .update({ user_id: user.users_table_id })
              .eq('id', membroPorEmail.id);
            console.log('[Checklist] Vinculação user_id tentada');
          }
        } else {
          membroError = errorPorEmail || errorPorId;
        }
      }

      if (membroError || !membro || vooData.piloto_id !== membro.id) {
        console.error('[Checklist] Erro ao buscar membro ou acesso negado:', { 
          errorPorId, 
          errorPorEmail: membroError, 
          userEmail: user?.email, 
          userId: user?.users_table_id,
          vooPilotoId: vooData.piloto_id,
          membroId: membro?.id
        });
        
        toast({
          title: "Acesso negado",
          description: membroError ? "Piloto não encontrado no sistema. Entre em contato com o administrador." : "Você não tem permissão para acessar este voo",
          variant: "destructive"
        });
        router.push('/piloto/dashboard');
        return;
      }

      console.log('[Checklist] Acesso autorizado para piloto:', membro.id);

      // Buscar balões do voo
      const { data: baloesData, error: baloesError } = await supabase
        .from('voos_baloes')
        .select(`
          *,
          baloes (
            id,
            prefixo,
            nome_batismo,
            volume_m3
          )
        `)
        .eq('voo_id', id);

      if (baloesError) {
        console.error('Erro ao carregar balões:', baloesError);
      }

      const baloes = baloesData?.map(vb => ({
        id: vb.baloes.id,
        prefixo: vb.baloes.prefixo,
        nome_batismo: vb.baloes.nome_batismo,
        volume_m3: vb.baloes.volume_m3,
        adultos_previstos: vb.adultos_previstos,
        criancas_previstas: vb.criancas_previstas
      })) || [];

      setVoo({
        id: vooData.voo_id,
        data_voo: vooData.data_voo,
        periodo: vooData.periodo,
        horario_previsto: vooData.horario_previsto,
        local_decolagem_previsto: vooData.local_decolagem_previsto,
        status: vooData.voo_status,
        adultos_previstos: vooData.adultos_previstos,
        criancas_previstas: vooData.criancas_previstas,
        observacoes_planejamento: vooData.observacoes_planejamento,
        baloes
      });

    } catch (error) {
      console.error('Erro:', error);
      toast({
        title: "Erro",
        description: "Erro inesperado ao carregar voo",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const carregarChecklist = async () => {
    try {
      if (!id) return;

      console.log('[carregarChecklist] 🔍 Tentando carregar checklist para voo:', id);
      
      const { data, error } = await supabase
        .from('checklist_itens')
        .select('*')
        .eq('voo_id', id)
        .order('bloco, item_numero');
        
      console.log('[carregarChecklist] 🔍 Resultado da query:', { data, error });

      if (error) {
        console.error('Erro ao carregar checklist:', error);
        // Se não existir checklist, criar automaticamente
        await criarChecklistAutomatico();
        return;
      }

      setChecklistItems(data || []);
    } catch (error) {
      console.error('Erro:', error);
    }
  };

  const criarChecklistAutomatico = async () => {
    try {
      if (!id) return;

      const itensParaCriar: any[] = [];

      // Criar itens para todos os blocos
      Object.entries(CHECKLIST_ITEMS).forEach(([bloco, items]) => {
        const blocoNum = bloco === 'bloco1' ? 1 : bloco === 'bloco2' ? 2 : 3;
        items.forEach((descricao, index) => {
          itensParaCriar.push({
            voo_id: id,
            bloco: blocoNum,
            item_numero: index + 1,
            item_descricao: descricao,  // Corrigido: usar item_descricao em vez de descricao
            marcado: false,
            motivo_nao_marcado: null
          });
        });
      });

      const { data, error } = await supabase
        .from('checklist_itens')
        .insert(itensParaCriar)
        .select('*');

      if (error) {
        console.error('Erro ao criar checklist:', error);
        return;
      }

      setChecklistItems(data || []);
    } catch (error) {
      console.error('Erro:', error);
    }
  };

  const handleItemChange = async (itemId: string, marcado: boolean, motivo?: string) => {
    console.log('[Checklist] Iniciando atualização:', { itemId, marcado, motivo, user: user?.users_table_id });
    
    // VALIDAÇÃO CRÍTICA: Verificar se usuário está autenticado E tem users_table_id válido
    if (!user) {
      console.error('[Checklist] ❌ Usuário não logado');
      toast({
        title: "Erro de autenticação",
        description: "Você precisa estar logado para usar o checklist.",
        variant: "destructive"
      });
      router.push('/login');
      return;
    }

    if (!user.users_table_id) {
      console.error('[Checklist] ❌ users_table_id é null - usuário não existe na tabela users:', {
        authId: user.id,
        email: user.email,
        users_table_id: user.users_table_id
      });
      toast({
        title: "Erro de dados do usuário",
        description: "Seu perfil não foi encontrado no sistema. Entre em contato com o administrador.",
        variant: "destructive"
      });
      return;
    }

    console.log('[Checklist] ✅ Validação passou - users_table_id:', user.users_table_id);

    // PREPARAR DADOS PARA ATUALIZAÇÃO
    const updateData: any = {
      marcado,
      marcado_em: new Date().toISOString(),
      marcado_por: user.users_table_id,
      updated_at: new Date().toISOString()
    };

    // LÓGICA DO MOTIVO
    if (!marcado && motivo?.trim()) {
      updateData.motivo_nao_marcado = motivo.trim();
    } else if (marcado) {
      updateData.motivo_nao_marcado = null;
    }

    console.log('[Checklist] Dados para atualização:', updateData);

    // ATUALIZAR ESTADO LOCAL PRIMEIRO (OTIMISTIC UPDATE)
    const itemAnterior = checklistItems.find(item => item.id === itemId);
    
    setChecklistItems(items => 
      items.map(item => 
        item.id === itemId 
          ? { ...item, ...updateData }
          : item
      )
    );

    // SALVAR NO SERVIDOR SE ONLINE
    if (isOnline) {
      try {
        setAutoSaving(true);
        console.log('[Checklist] Enviando para Supabase...');

        const { data, error } = await supabase
          .from('checklist_itens')
          .update(updateData)
          .eq('id', itemId)
          .select('*');

        if (error) {
          console.error('[Checklist] ❌ Erro do Supabase:', error);
          
          // REVERTER ESTADO LOCAL EM CASO DE ERRO
          if (itemAnterior) {
            setChecklistItems(items => 
              items.map(item => 
                item.id === itemId ? itemAnterior : item
              )
            );
          }
          
          // MOSTRAR ERRO ESPECÍFICO
          let errorMessage = "Erro desconhecido";
          if (error.message.includes('foreign key')) {
            errorMessage = "Erro de autenticação. Faça login novamente.";
          } else if (error.message.includes('violates')) {
            errorMessage = "Dados inválidos. Verifique os campos preenchidos.";
          } else {
            errorMessage = error.message;
          }
          
          toast({
            title: "Erro ao salvar item",
            description: errorMessage,
            variant: "destructive"
          });
          return;
        }

        console.log('[Checklist] ✅ Item atualizado com sucesso:', data);
        
        // CONFIRMAR SUCESSO
        toast({
          title: "Item atualizado",
          description: marcado ? "Item marcado como concluído" : "Motivo registrado",
          variant: "default"
        });
        
      } catch (error) {
        console.error('[Checklist] ❌ Erro inesperado:', error);
        
        // REVERTER ESTADO LOCAL
        if (itemAnterior) {
          setChecklistItems(items => 
            items.map(item => 
              item.id === itemId ? itemAnterior : item
            )
          );
        }
        
        toast({
          title: "Erro inesperado",
          description: "Tente novamente em alguns instantes",
          variant: "destructive"
        });
      } finally {
        setAutoSaving(false);
      }
    } else {
      // MODO OFFLINE
      console.log('[Checklist] Modo offline - salvando localmente');
      saveDraftToStorage();
      
      toast({
        title: "Modo offline",
        description: "Item salvo localmente. Será sincronizado quando voltar online.",
        variant: "default"
      });
    }
  };

  // Funções de salvamento offline
  const saveDraftToStorage = () => {
    if (!id || checklistItems.length === 0) return;

    try {
      const draftData = {
        checklistItems,
        currentBloco,
        timestamp: new Date().toISOString(),
        vooId: id
      };

      localStorage.setItem(`checklist_draft_${id}`, JSON.stringify(draftData));
    } catch (error) {
      console.error('Erro ao salvar rascunho:', error);
    }
  };

  const loadDraftFromStorage = () => {
    if (!id) return;

    try {
      const draftData = localStorage.getItem(`checklist_draft_${id}`);
      if (!draftData) return;

      const parsed = JSON.parse(draftData);
      const draftAge = new Date().getTime() - new Date(parsed.timestamp).getTime();
      const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 dias

      if (draftAge > maxAge) {
        localStorage.removeItem(`checklist_draft_${id}`);
        return;
      }

      // Só carregar se não temos dados do servidor ainda
      if (checklistItems.length === 0 && parsed.checklistItems) {
        setChecklistItems(parsed.checklistItems);
        setCurrentBloco(parsed.currentBloco || 1);
        
        toast({
          title: "Rascunho carregado",
          description: "Dados salvos localmente foram restaurados.",
          variant: "default"
        });
      }
    } catch (error) {
      console.error('Erro ao carregar rascunho:', error);
    }
  };

  const clearDraftFromStorage = () => {
    if (!id) return;
    localStorage.removeItem(`checklist_draft_${id}`);
  };

  const handleSaveDraft = async () => {
    if (!id || !user) return;

    try {
      setSavingDraft(true);

      if (isOnline) {
        // Salvar no servidor se online
        const { error } = await supabase
          .from('voos')
          .update({ 
            status: 'checklist_em_andamento',
            updated_at: new Date().toISOString()
          })
          .eq('id', id);

        if (error) {
          console.error('Erro ao salvar rascunho:', error);
          toast({
            title: "Erro",
            description: "Erro ao salvar rascunho no servidor",
            variant: "destructive"
          });
          return;
        }

        clearDraftFromStorage();
        
        toast({
          title: "Rascunho salvo",
          description: "Checklist salvo como rascunho com sucesso",
          variant: "default"
        });
      } else {
        // Salvar apenas localmente se offline
        saveDraftToStorage();
        
        toast({
          title: "Rascunho salvo offline",
          description: "Checklist salvo localmente. Será sincronizado quando voltar online.",
          variant: "default"
        });
      }

    } catch (error) {
      console.error('Erro:', error);
      toast({
        title: "Erro",
        description: "Erro inesperado ao salvar rascunho",
        variant: "destructive"
      });
    } finally {
      setSavingDraft(false);
    }
  };

  const handleBlocoComplete = async () => {
    try {
      setSubmitting(true);

      const itensBloco = checklistItems.filter(item => item.bloco === currentBloco);
      const itensNaoMarcados = itensBloco.filter(item => !item.marcado);

      // Verificar se todos os itens não marcados têm motivo
      const semMotivo = itensNaoMarcados.filter(item => !item.motivo_nao_marcado?.trim());
      
      if (semMotivo.length > 0) {
        toast({
          title: "Checklist incompleto",
          description: "Todos os itens não marcados devem ter um motivo obrigatório",
          variant: "destructive"
        });
        return;
      }

      // Atualizar status do voo
      let novoStatus = '';
      if (currentBloco === 1) {
        novoStatus = 'checklist_bloco1';
      } else if (currentBloco === 2) {
        novoStatus = 'checklist_bloco2';
      } else if (currentBloco === 3) {
        novoStatus = 'checklist_concluido';
      }

      const { error } = await supabase
        .from('voos')
        .update({ status: novoStatus })
        .eq('id', id);

      if (error) {
        console.error('Erro ao atualizar status:', error);
        toast({
          title: "Erro",
          description: "Erro ao atualizar status do voo",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Bloco concluído",
        description: `Bloco ${currentBloco} do checklist foi concluído com sucesso`,
        variant: "default"
      });

      // Avançar para próximo bloco ou finalizar
      if (currentBloco === 1) {
        setCurrentBloco(2);
      } else if (currentBloco === 2) {
        setCurrentBloco(3);
      } else {
        // Checklist concluído, limpar rascunho e redirecionar
        clearDraftFromStorage();
        router.push('/piloto/dashboard');
      }

    } catch (error) {
      console.error('Erro:', error);
      toast({
        title: "Erro",
        description: "Erro inesperado",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  const getItemsBloco = (bloco: number) => {
    return checklistItems.filter(item => item.bloco === bloco);
  };

  const getBlocoProgress = (bloco: number) => {
    const items = getItemsBloco(bloco);
    if (items.length === 0) return 0;
    
    const marcados = items.filter(item => item.marcado);
    return Math.round((marcados.length / items.length) * 100);
  };

  const canCompleteBloco = (bloco: number) => {
    const items = getItemsBloco(bloco);
    return items.every(item => item.marcado || item.motivo_nao_marcado?.trim());
  };

  const getBlocoTitle = (bloco: number) => {
    switch (bloco) {
      case 1: return 'Bloco 1 - Preparação e Verificações Iniciais';
      case 2: return 'Bloco 2 - Preparação do Balão';
      case 3: return 'Bloco 3 - Verificações Finais e Decolagem';
      default: return '';
    }
  };

  if (userLoading || loading) {
    return (
      <EnhancedDashboardLayout title="Checklist de Voo" loading={true}>
        <div>Carregando...</div>
      </EnhancedDashboardLayout>
    );
  }

  if (!voo) {
    return (
      <EnhancedDashboardLayout title="Checklist de Voo">
        <div>Voo não encontrado</div>
      </EnhancedDashboardLayout>
    );
  }

  return (
    <EnhancedDashboardLayout title="Checklist de Segurança">
      <div className="space-y-6">
        {/* Header com informações do voo */}
        <MagicCard className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-semibold">Checklist de Segurança</h2>
              <p className="text-gray-600">
                {formatDateSafe(voo.data_voo)} - {voo.periodo === 'manha' ? 'Manhã' : 'Tarde'}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">Status:</p>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                voo.status === 'checklist_concluido' 
                  ? 'bg-green-100 text-green-800'
                  : 'bg-yellow-100 text-yellow-800'
              }`}>
                {voo.status === 'checklist_concluido' ? 'Concluído' : 'Em andamento'}
              </span>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Local:</span>
              <p className="font-medium">{voo.local_decolagem_previsto}</p>
            </div>
            <div>
              <span className="text-gray-600">Horário:</span>
              <p className="font-medium">{voo.horario_previsto}</p>
            </div>
            <div>
              <span className="text-gray-600">Passageiros:</span>
              <p className="font-medium">{voo.adultos_previstos + voo.criancas_previstas} total</p>
            </div>
          </div>

          {voo.baloes.length > 0 && (
            <div className="mt-4">
              <span className="text-gray-600 text-sm">Balões:</span>
              <div className="flex flex-wrap gap-2 mt-1">
                {voo.baloes.map(balao => (
                  <span key={balao.id} className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">
                    {balao.prefixo}
                    {balao.nome_batismo && ` (${balao.nome_batismo})`}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Indicadores de status */}
          <div className="mt-4 flex flex-wrap gap-4 text-sm">
            {autoSaving && (
              <div className="text-blue-600 flex items-center gap-2">
                <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                Salvando automaticamente...
              </div>
            )}
            
            {!isOnline && (
              <div className="text-amber-600 flex items-center gap-2">
                <div className="h-2 w-2 bg-amber-600 rounded-full"></div>
                Modo offline - dados salvos localmente
              </div>
            )}
            
            {isOnline && !autoSaving && (
              <div className="text-green-600 flex items-center gap-2">
                <div className="h-2 w-2 bg-green-600 rounded-full animate-pulse"></div>
                Salvamento automático ativo
              </div>
            )}
          </div>
        </MagicCard>

        {/* Navegação entre blocos */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="grid md:grid-cols-3 gap-4">
            {[1, 2, 3].map((bloco, index) => {
              const progress = getBlocoProgress(bloco);
              const isActive = currentBloco === bloco;
              const isCompleted = progress === 100;
              
              return (
                <button
                  key={bloco}
                  onClick={() => setCurrentBloco(bloco)}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    isActive 
                      ? 'border-primary bg-primary/10' 
                      : isCompleted
                      ? 'border-green-300 bg-green-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold">Bloco {bloco}</span>
                    {isCompleted && <CheckCircleIcon className="h-5 w-5 text-green-600" />}
                  </div>
                  <div className="text-sm text-gray-600 mb-2">
                    {getBlocoTitle(bloco).split(' - ')[1]}
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all ${
                        isCompleted ? 'bg-green-500' : 'bg-primary'
                      }`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <div className="text-xs text-gray-500 mt-1">{progress}% concluído</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Checklist do bloco atual */}
        <MagicCard className="p-6">
          <h3 className="text-lg font-semibold mb-6">{getBlocoTitle(currentBloco)}</h3>
          
          <div className="space-y-4">
            {getItemsBloco(currentBloco).map((item) => (
              <ChecklistItemComponent
                key={item.id}
                item={item}
                onChange={handleItemChange}
              />
            ))}
          </div>

          <div className="flex justify-between items-center mt-8 pt-6 border-t">
            <button
              onClick={() => router.push('/piloto/dashboard')}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              <ArrowLeftIcon className="h-4 w-4" />
              Voltar ao Dashboard
            </button>

            <div className="flex gap-3">
              <button
                onClick={handleSaveDraft}
                disabled={savingDraft}
                className="flex items-center gap-2 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {savingDraft ? (
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                ) : (
                  <CloudArrowUpIcon className="h-4 w-4" />
                )}
                {savingDraft ? 'Salvando...' : 'Salvar como Rascunho'}
              </button>

              <button
                onClick={handleBlocoComplete}
                disabled={!canCompleteBloco(currentBloco) || submitting}
                className="flex items-center gap-2 bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Salvando...' : (
                  <>
                    {currentBloco === 3 ? 'Finalizar Checklist' : 'Concluir Bloco'}
                    {currentBloco !== 3 && <ArrowRightIcon className="h-4 w-4" />}
                    {currentBloco === 3 && <CheckIcon className="h-4 w-4" />}
                  </>
                )}
              </button>
            </div>
          </div>
        </MagicCard>
      </div>
    </EnhancedDashboardLayout>
  );
}

// Componente para cada item do checklist
interface ChecklistItemComponentProps {
  item: ChecklistItem;
  onChange: (itemId: string, marcado: boolean, motivo?: string) => void;
}

function ChecklistItemComponent({ item, onChange }: ChecklistItemComponentProps) {
  const [showMotivoInput, setShowMotivoInput] = useState(false);
  const [motivo, setMotivo] = useState(item.motivo_nao_marcado || '');

  const handleCheckChange = (checked: boolean) => {
    if (checked) {
      onChange(item.id, true);
      setShowMotivoInput(false);
    } else {
      setShowMotivoInput(true);
    }
  };

  const handleMotivoSave = () => {
    if (motivo.trim()) {
      onChange(item.id, false, motivo.trim());
      setShowMotivoInput(false);
    }
  };

  const handleMotivoCancel = () => {
    setMotivo(item.motivo_nao_marcado || '');
    setShowMotivoInput(false);
  };

  return (
    <div className={`border rounded-lg p-4 transition-all ${
      item.marcado 
        ? 'border-green-300 bg-green-50' 
        : item.motivo_nao_marcado
        ? 'border-amber-300 bg-amber-50'
        : 'border-gray-200'
    }`}>
      <div className="flex items-start gap-3">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <input
            type="checkbox"
            checked={item.marcado}
            onChange={(e) => handleCheckChange(e.target.checked)}
            className="h-5 w-5 text-primary focus:ring-primary border-gray-300 rounded"
            disabled={showMotivoInput}
          />
          <span className={`${item.marcado ? 'line-through text-gray-600' : ''}`}>
            {item.item_descricao}
          </span>
        </div>
        
        <div className="flex items-center gap-1">
          {item.marcado && <CheckCircleIcon className="h-5 w-5 text-green-600" />}
          {!item.marcado && item.motivo_nao_marcado && (
            <ExclamationTriangleIcon className="h-5 w-5 text-amber-600" />
          )}
          {!item.marcado && !item.motivo_nao_marcado && !showMotivoInput && (
            <XCircleIcon className="h-5 w-5 text-gray-400" />
          )}
        </div>
      </div>

      {/* Motivo existente */}
      {!showMotivoInput && item.motivo_nao_marcado && (
        <div className="mt-3 p-3 bg-amber-100 rounded-lg">
          <p className="text-sm text-amber-800">
            <strong>Motivo:</strong> {item.motivo_nao_marcado}
          </p>
          <button
            onClick={() => setShowMotivoInput(true)}
            className="text-xs text-amber-700 underline mt-1 hover:text-amber-900"
          >
            Editar motivo
          </button>
        </div>
      )}

      {/* Input de motivo */}
      {showMotivoInput && (
        <div className="mt-3 space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Motivo obrigatório para não marcação:
            </label>
            <textarea
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Explique o motivo pelo qual este item não pode ser marcado..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              rows={2}
              autoFocus
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleMotivoSave}
              disabled={!motivo.trim()}
              className="bg-primary text-white px-3 py-1 rounded text-sm hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Salvar Motivo
            </button>
            <button
              onClick={handleMotivoCancel}
              className="bg-gray-200 text-gray-700 px-3 py-1 rounded text-sm hover:bg-gray-300"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}