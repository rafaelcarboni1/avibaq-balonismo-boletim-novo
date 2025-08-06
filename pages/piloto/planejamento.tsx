import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { PlusIcon, CalendarIcon, ClockIcon, MapPinIcon, UsersIcon, CheckIcon, HomeIcon } from '@heroicons/react/24/outline';
import { EnhancedDashboardLayout } from '../../src/components/magicui/enhanced-dashboard-layout';
import { MagicCard } from '../../src/components/magicui/magic-card';
import { BentoGrid, BentoGridItem } from '../../src/components/magicui/bento-grid';
import { supabase } from '../../src/integrations/supabase/client';
import { useUser } from '../../src/hooks/useUser';
import { useToast } from '../../src/hooks/use-toast';
import { formatDateSafe } from '../../src/utils/dateUtils';

interface Balao {
  id: string;
  prefixo: string;
  volume_m3: number;
  nome_batismo: string | null;
  ativo: boolean;
}

interface BalaoSelecionado {
  balao_id: string;
  balao: Balao;
  adultos_previstos: number;
  criancas_previstas: number;
}

interface VooFormData {
  data_voo: string;
  periodo: 'manha' | 'tarde';
  horario_previsto: string;
  local_decolagem_previsto: string;
  observacoes_planejamento: string;
}

export default function PlanejamentoVoo() {
  const router = useRouter();
  const { user, loading: userLoading } = useUser();
  const { toast } = useToast();
  
  const [baloes, setBaloes] = useState<Balao[]>([]);
  const [baloesIndisponiveis, setBaloesIndisponiveis] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [step, setStep] = useState(1); // 1: Dados básicos, 2: Seleção de balões, 3: Passageiros, 4: Confirmação
  
  const [formData, setFormData] = useState<VooFormData>({
    data_voo: '',
    periodo: 'manha',
    horario_previsto: '07:00',
    local_decolagem_previsto: '',
    observacoes_planejamento: ''
  });
  
  const [baloesSelecionados, setBaloesSelecionados] = useState<BalaoSelecionado[]>([]);
  const [submitting, setSubmitting] = useState(false);

  // Verificar se usuário está autenticado e é piloto
  useEffect(() => {
    if (!userLoading) {
      if (!user) {
        router.push('/piloto/login');
        return;
      }
      // Só redireciona se o role estiver carregado E for diferente de piloto
      if (user.role && user.role !== 'piloto') {
        console.log('[Planejamento] Redirecionando - role:', user.role);
        router.push('/');
        return;
      }
    }
  }, [user, userLoading]); // Removido router das dependências

  // Carregar balões do piloto
  useEffect(() => {
    if (user) {
      carregarBaloes();
    }
  }, [user]);

  // Verificar disponibilidade quando data/período mudam
  useEffect(() => {
    if (formData.data_voo && formData.periodo) {
      verificarDisponibilidade();
    }
  }, [formData.data_voo, formData.periodo]);

  const carregarBaloes = async () => {
    try {
      setLoading(true);
      
      // Buscar membro associado ao usuário (primeiro por user_id, depois por email como fallback)
      let membro = null;
      let membroError = null;

      console.log('[Planejamento] Carregando balões para usuário:', { userId: user?.id, email: user?.email });

      // Tentar primeiro por user_id
      const { data: membroPorId, error: errorPorId } = await supabase
        .from('membros')
        .select('id, user_id')
        .eq('user_id', user?.id)
        .eq('tipo', 'piloto')
        .single();

      if (membroPorId && !errorPorId) {
        membro = membroPorId;
        console.log('[Planejamento] Membro encontrado por user_id:', membro.id);
      } else {
        console.log('[Planejamento] Membro não encontrado por user_id, tentando por email:', user?.email);
        
        // Fallback: buscar por email se user_id não funcionou
        const { data: membroPorEmail, error: errorPorEmail } = await supabase
          .from('membros')
          .select('id, user_id')
          .eq('email', user?.email)
          .eq('tipo', 'piloto')
          .single();

        if (membroPorEmail && !errorPorEmail) {
          membro = membroPorEmail;
          console.log('[Planejamento] Membro encontrado por email. User_id atual:', membroPorEmail.user_id);
          
          // Se encontrou por email mas user_id está null, tentar atualizar
          if (!membroPorEmail.user_id && user?.id) {
            console.log('[Planejamento] Tentando vincular user_id ao membro...');
            await supabase
              .from('membros')
              .update({ user_id: user.id })
              .eq('id', membroPorEmail.id);
            console.log('[Planejamento] Vinculação user_id tentada');
          }
        } else {
          membroError = errorPorEmail || errorPorId;
        }
      }

      if (membroError || !membro) {
        console.error('[Planejamento] Erro ao buscar membro:', { 
          errorPorId, 
          errorPorEmail: membroError, 
          userEmail: user?.email, 
          userId: user?.id 
        });
        
        toast({
          title: "Erro",
          description: "Piloto não encontrado no sistema. Entre em contato com o administrador.",
          variant: "destructive"
        });
        return;
      }

      // Buscar balões ativos do piloto
      const { data, error } = await supabase
        .from('baloes')
        .select('*')
        .eq('proprietario_id', membro.id)
        .eq('ativo', true)
        .order('prefixo');

      if (error) {
        console.error('Erro ao carregar balões:', error);
        toast({
          title: "Erro",
          description: "Erro ao carregar balões",
          variant: "destructive"
        });
        return;
      }

      setBaloes(data || []);
    } catch (error) {
      console.error('Erro:', error);
      toast({
        title: "Erro",
        description: "Erro inesperado ao carregar balões",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const verificarDisponibilidade = async () => {
    try {
      // Buscar voos já agendados para a data/período
      const { data: voosExistentes, error } = await supabase
        .from('voos')
        .select(`
          id,
          voos_baloes(balao_id)
        `)
        .eq('data_voo', formData.data_voo)
        .eq('periodo', formData.periodo)
        .in('status', ['rascunho', 'planejado', 'checklist_bloco1', 'checklist_bloco2', 'checklist_concluido']);

      if (error) {
        console.error('Erro ao verificar disponibilidade:', error);
        return;
      }

      const baloesOcupados = voosExistentes?.flatMap(voo => 
        voo.voos_baloes?.map(vb => vb.balao_id) || []
      ).filter(Boolean) || [];
      setBaloesIndisponiveis(baloesOcupados);
    } catch (error) {
      console.error('Erro:', error);
    }
  };

  const handleSubmit = async () => {
    try {
      setSubmitting(true);

      if (baloesSelecionados.length === 0) {
        toast({
          title: "Erro",
          description: "Selecione pelo menos um balão",
          variant: "destructive"
        });
        return;
      }

      // Buscar membro associado ao usuário (primeiro por user_id, depois por email como fallback)
      let membro = null;
      let membroError = null;

      console.log('[Planejamento] Submit - Buscando membro para usuário:', { userId: user?.id, email: user?.email });

      // Tentar primeiro por user_id
      const { data: membroPorId, error: errorPorId } = await supabase
        .from('membros')
        .select('id, user_id')
        .eq('user_id', user?.id)
        .eq('tipo', 'piloto')
        .single();

      if (membroPorId && !errorPorId) {
        membro = membroPorId;
        console.log('[Planejamento] Submit - Membro encontrado por user_id:', membro.id);
      } else {
        console.log('[Planejamento] Submit - Membro não encontrado por user_id, tentando por email:', user?.email);
        
        // Fallback: buscar por email se user_id não funcionou
        const { data: membroPorEmail, error: errorPorEmail } = await supabase
          .from('membros')
          .select('id, user_id')
          .eq('email', user?.email)
          .eq('tipo', 'piloto')
          .single();

        if (membroPorEmail && !errorPorEmail) {
          membro = membroPorEmail;
          console.log('[Planejamento] Submit - Membro encontrado por email. User_id atual:', membroPorEmail.user_id);
          
          // Se encontrou por email mas user_id está null, tentar atualizar
          if (!membroPorEmail.user_id && user?.id) {
            console.log('[Planejamento] Submit - Tentando vincular user_id ao membro...');
            await supabase
              .from('membros')
              .update({ user_id: user.id })
              .eq('id', membroPorEmail.id);
            console.log('[Planejamento] Submit - Vinculação user_id tentada');
          }
        } else {
          membroError = errorPorEmail || errorPorId;
        }
      }

      if (membroError || !membro) {
        console.error('[Planejamento] Submit - Erro ao buscar membro:', { 
          errorPorId, 
          errorPorEmail: membroError, 
          userEmail: user?.email, 
          userId: user?.id 
        });
        
        toast({
          title: "Erro",
          description: "Piloto não encontrado no sistema. Entre em contato com o administrador.",
          variant: "destructive"
        });
        return;
      }

      // Calcular totais
      const totalAdultos = baloesSelecionados.reduce((sum, b) => sum + b.adultos_previstos, 0);
      const totalCriancas = baloesSelecionados.reduce((sum, b) => sum + b.criancas_previstas, 0);

      // Criar voo
      const { data: voo, error: vooError } = await supabase
        .from('voos')
        .insert([{
          data_voo: formData.data_voo,
          periodo: formData.periodo,
          horario_previsto: formData.horario_previsto,
          local_decolagem_previsto: formData.local_decolagem_previsto,
          piloto_id: membro.id,
          agencia_id: null, // Voo individual
          status: 'rascunho',
          adultos_previstos: totalAdultos,
          criancas_previstas: totalCriancas,
          observacoes_planejamento: formData.observacoes_planejamento.trim() || null,
          created_by: (user as any)?.users_table_id || null
        }])
        .select()
        .single();

      if (vooError) {
        console.error('Erro ao criar voo:', vooError);
        
        if (vooError.code === '23505') {
          toast({
            title: "Erro",
            description: "Você já tem um voo planejado para esta data e período",
            variant: "destructive"
          });
        } else {
          toast({
            title: "Erro",
            description: "Erro ao criar voo",
            variant: "destructive"
          });
        }
        return;
      }

      // Associar balões ao voo
      const voosBaloesData = baloesSelecionados.map(bs => ({
        voo_id: voo.id,
        balao_id: bs.balao_id,
        adultos_previstos: bs.adultos_previstos,
        criancas_previstas: bs.criancas_previstas
      }));

      const { error: baloesError } = await supabase
        .from('voos_baloes')
        .insert(voosBaloesData);

      if (baloesError) {
        console.error('Erro ao associar balões:', baloesError);
        toast({
          title: "Erro",
          description: "Erro ao associar balões ao voo",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Sucesso",
        description: "Voo planejado com sucesso! Checklist será criado automaticamente.",
        variant: "default"
      });

      // Redirecionar para lista de voos ou dashboard
      router.push('/piloto/dashboard');

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

  const handleAddBalao = (balao: Balao) => {
    if (baloesIndisponiveis.includes(balao.id)) {
      toast({
        title: "Balão indisponível",
        description: "Este balão já está sendo usado em outro voo no mesmo período",
        variant: "destructive"
      });
      return;
    }

    if (baloesSelecionados.find(bs => bs.balao_id === balao.id)) {
      toast({
        title: "Balão já selecionado",
        description: "Este balão já foi adicionado ao voo",
        variant: "destructive"
      });
      return;
    }

    const capacidadeEstimada = Math.floor(balao.volume_m3 / 300);
    setBaloesSelecionados([...baloesSelecionados, {
      balao_id: balao.id,
      balao,
      adultos_previstos: Math.min(4, capacidadeEstimada),
      criancas_previstas: 0
    }]);
  };

  const handleRemoveBalao = (balaoId: string) => {
    setBaloesSelecionados(baloesSelecionados.filter(bs => bs.balao_id !== balaoId));
  };

  const handleUpdatePassageiros = (balaoId: string, field: 'adultos_previstos' | 'criancas_previstas', value: number) => {
    setBaloesSelecionados(baloesSelecionados.map(bs => 
      bs.balao_id === balaoId ? { ...bs, [field]: Math.max(0, value) } : bs
    ));
  };

  const canProceedToStep2 = formData.data_voo && formData.local_decolagem_previsto.trim();
  const canProceedToStep3 = baloesSelecionados.length > 0;
  const totalPassageiros = baloesSelecionados.reduce((sum, b) => sum + b.adultos_previstos + b.criancas_previstas, 0);

  // Definir data mínima (hoje)
  const hoje = new Date().toISOString().split('T')[0];

  // Helper para navegar entre etapas
  const handleNextStep = () => {
    if (step === 1) {
      if (canProceedToStep2) {
        setStep(2);
      } else {
        toast({
          title: "Erro",
          description: "Preencha todos os campos obrigatórios da Etapa 1.",
          variant: "destructive"
        });
      }
    } else if (step === 2) {
      if (canProceedToStep3) {
        setStep(3);
      } else {
        toast({
          title: "Erro",
          description: "Selecione pelo menos um balão para prosseguir.",
          variant: "destructive"
        });
      }
    } else if (step === 3) {
      if (totalPassageiros > 0) {
        setStep(4);
      } else {
        toast({
          title: "Erro",
          description: "Defina a quantidade de passageiros para prosseguir.",
          variant: "destructive"
        });
      }
    }
  };

  // Renderizar wizard de planejamento
  const renderWizard = () => {
    return (
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        {/* Passos */}
        <div className="px-8 py-6 border-b border-gray-200/50">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">Planejamento de Voo - Piloto</h2>
            <div className="flex items-center">
              {[1, 2, 3, 4].map((s) => (
                <React.Fragment key={s}>
                  <div className={`relative flex items-center justify-center w-8 h-8 rounded-full ${
                    s === step ? 'bg-primary text-white' : 
                    s < step ? 'bg-green-500 text-white' : 
                    'bg-gray-200 text-gray-500'
                  }`}>
                    {s < step ? (
                      <CheckIcon className="h-5 w-5" />
                    ) : (
                      <span className="text-sm font-medium">{s}</span>
                    )}
                  </div>
                  {s < 4 && (
                    <div className={`h-0.5 flex-1 ${
                      s < step ? 'bg-green-500' : 'bg-gray-200'
                    }`}></div>
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>

        {/* Conteúdo */}
        <div className="px-8 py-6 bg-white">
          <div className="max-w-3xl mx-auto">
            {step === 1 && renderDadosBasicos()}
            {step === 2 && renderSelecaoBaloes()}
            {step === 3 && renderPassageiros()}
            {step === 4 && renderConfirmacao()}
          </div>
        </div>

        {/* Botões */}
        <div className="px-8 py-6 bg-gray-50 border-t border-gray-200/50 flex justify-between">
          <div className="max-w-3xl mx-auto w-full flex justify-between">
            <button
              type="button"
              onClick={() => setStep(step - 1)}
              disabled={step === 1 || submitting}
              className="px-5 py-2 rounded-lg border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Voltar
            </button>
            <button
              type="button"
              onClick={step === 4 ? handleSubmit : handleNextStep}
              disabled={submitting}
              className={`px-5 py-2 rounded-lg text-white bg-primary hover:bg-primary2 disabled:opacity-50 disabled:cursor-not-allowed ${
                submitting ? 'opacity-70' : ''
              }`}
            >
              {step === 4 ? 'Finalizar' : 'Continuar'}
              {submitting && <span className="ml-2 inline-block animate-spin">⟳</span>}
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Renderizar passo 1: Dados básicos
  const renderDadosBasicos = () => {
    return (
      <div className="space-y-6">
        <h3 className="text-xl font-medium text-gray-900">Dados Básicos do Voo</h3>

        {/* Data do Voo */}
        <div className="space-y-2">
          <label htmlFor="data_voo" className="block text-sm font-medium text-gray-700">
            Data do Voo *
          </label>
          <div className="flex items-center rounded-lg border border-gray-300 overflow-hidden bg-white">
            <span className="pl-3 text-gray-500">
              <CalendarIcon className="h-5 w-5" />
            </span>
            <input
              type="date"
              id="data_voo"
              value={formData.data_voo}
              onChange={(e) => setFormData({...formData, data_voo: (e.target as HTMLInputElement).value})}
              min={new Date().toISOString().split('T')[0]}
              required
              className="w-full p-3 bg-white text-gray-900 focus:ring-0 focus:outline-none border-0"
            />
          </div>
        </div>

        {/* Período */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Período *
          </label>
          <div className="flex space-x-4">
            <label className="flex items-center">
              <input
                type="radio"
                value="manha"
                checked={formData.periodo === 'manha'}
                onChange={() => setFormData({...formData, periodo: 'manha'})}
                className="h-5 w-5 text-primary border-gray-300 focus:ring-primary"
              />
              <span className="ml-2 text-gray-900">Manhã</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                value="tarde"
                checked={formData.periodo === 'tarde'}
                onChange={() => setFormData({...formData, periodo: 'tarde'})}
                className="h-5 w-5 text-primary border-gray-300 focus:ring-primary"
              />
              <span className="ml-2 text-gray-900">Tarde</span>
            </label>
          </div>
        </div>

        {/* Horário Previsto */}
        <div className="space-y-2">
          <label htmlFor="horario_previsto" className="block text-sm font-medium text-gray-700">
            Horário Previsto *
          </label>
          <div className="flex items-center rounded-lg border border-gray-300 overflow-hidden bg-white">
            <span className="pl-3 text-gray-500">
              <ClockIcon className="h-5 w-5" />
            </span>
            <input
              type="time"
              id="horario_previsto"
              value={formData.horario_previsto}
              onChange={(e) => setFormData({...formData, horario_previsto: (e.target as HTMLInputElement).value})}
              required
              className="w-full p-3 bg-white text-gray-900 focus:ring-0 focus:outline-none border-0"
            />
          </div>
        </div>

        {/* Local de Decolagem */}
        <div className="space-y-2">
          <label htmlFor="local_decolagem" className="block text-sm font-medium text-gray-700">
            Local de Decolagem *
          </label>
          <div className="flex items-center rounded-lg border border-gray-300 overflow-hidden bg-white">
            <span className="pl-3 text-gray-500">
              <MapPinIcon className="h-5 w-5" />
            </span>
            <input
              type="text"
              id="local_decolagem"
              value={formData.local_decolagem_previsto}
              onChange={(e) => setFormData({...formData, local_decolagem_previsto: (e.target as HTMLInputElement).value})}
              placeholder="Ex: Campo Central, Fazenda do Vento..."
              required
              className="w-full p-3 bg-white text-gray-900 focus:ring-0 focus:outline-none border-0"
            />
          </div>
        </div>

        {/* Observações */}
        <div className="space-y-2">
          <label htmlFor="observacoes" className="block text-sm font-medium text-gray-700">
            Observações do Planejamento
          </label>
          <textarea
            id="observacoes"
            value={formData.observacoes_planejamento}
            onChange={(e) => setFormData({...formData, observacoes_planejamento: (e.target as HTMLTextAreaElement).value})}
            placeholder="Informações adicionais sobre o voo, condições especiais, etc..."
            rows={4}
            className="w-full p-3 rounded-lg border border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-primary focus:border-transparent"
          ></textarea>
        </div>
      </div>
    );
  };

  // Renderizar passo 2: Seleção de Balões
  const renderSelecaoBaloes = () => {
    return (
      <div className="space-y-4">
        <MagicCard className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <PlusIcon className="h-5 w-5 text-primary" />
            Selecionar Balões
          </h3>
          
          {baloes.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">Você não possui balões ativos cadastrados.</p>
              <button
                onClick={() => router.push('/piloto/meus-baloes')}
                className="mt-4 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
              >
                Cadastrar Balão
              </button>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {baloes.map((balao) => {
                const indisponivel = baloesIndisponiveis.includes(balao.id);
                const selecionado = baloesSelecionados.find(bs => bs.balao_id === balao.id);
                const capacidadeEstimada = Math.floor(balao.volume_m3 / 300);

                return (
                  <div
                    key={balao.id}
                    className={`border rounded-lg p-4 cursor-pointer transition-all ${
                      indisponivel 
                        ? 'border-red-200 bg-red-50 opacity-60 cursor-not-allowed' 
                        : selecionado
                        ? 'border-green-300 bg-green-50 ring-2 ring-green-200'
                        : 'border-gray-200 hover:border-primary hover:bg-blue-50'
                    }`}
                    onClick={() => !indisponivel && !selecionado && handleAddBalao(balao)}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-semibold">{balao.prefixo}</h4>
                        {balao.nome_batismo && (
                          <p className="text-sm text-gray-600">{balao.nome_batismo}</p>
                        )}
                        <p className="text-sm text-gray-600">{balao.volume_m3.toLocaleString()} m³</p>
                        <p className="text-sm text-gray-600">
                          Capacidade est.: {capacidadeEstimada} passageiros
                        </p>
                      </div>
                      {indisponivel && (
                        <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
                          Indisponível
                        </span>
                      )}
                      {selecionado && (
                        <CheckIcon className="h-5 w-5 text-green-600" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </MagicCard>

        {/* Balões Selecionados */}
        {baloesSelecionados.length > 0 && (
          <MagicCard className="p-6">
            <h4 className="font-semibold mb-4">Balões Selecionados ({baloesSelecionados.length})</h4>
            <div className="space-y-3">
              {baloesSelecionados.map((bs) => (
                <div key={bs.balao_id} className="flex items-center justify-between bg-white border border-gray-200 p-3 rounded-lg">
                  <div>
                    <span className="font-medium">{bs.balao.prefixo}</span>
                    {bs.balao.nome_batismo && (
                      <span className="text-gray-600 ml-2">({bs.balao.nome_batismo})</span>
                    )}
                    <span className="text-sm text-gray-600 ml-2">
                      {bs.balao.volume_m3.toLocaleString()} m³
                    </span>
                  </div>
                  <button
                    onClick={() => handleRemoveBalao(bs.balao_id)}
                    className="text-red-600 hover:text-red-800 px-2 py-1 text-sm"
                  >
                    Remover
                  </button>
                </div>
              ))}
            </div>
          </MagicCard>
        )}
      </div>
    );
  };

  // Renderizar passo 3: Passageiros
  const renderPassageiros = () => {
    return (
      <div className="space-y-4">
        <MagicCard className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <UsersIcon className="h-5 w-5 text-primary" />
            Distribuição de Passageiros
          </h3>
          
          <div className="space-y-4">
            {baloesSelecionados.map((bs) => {
              const capacidadeEstimada = Math.floor(bs.balao.volume_m3 / 300);
              
              return (
                <div key={bs.balao_id} className="border border-gray-200 rounded-lg p-4">
                  <h4 className="font-semibold mb-3">
                    {bs.balao.prefixo}
                    {bs.balao.nome_batismo && ` (${bs.balao.nome_batismo})`}
                    <span className="text-sm text-gray-600 font-normal ml-2">
                      Capacidade estimada: {capacidadeEstimada} passageiros
                    </span>
                  </h4>
                  
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Adultos Previstos
                      </label>
                      <input
                        type="number"
                        value={bs.adultos_previstos}
                        onChange={(e) => handleUpdatePassageiros(bs.balao_id, 'adultos_previstos', parseInt((e.target as HTMLInputElement).value) || 0)}
                        min="0"
                        max={capacidadeEstimada}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Crianças Previstas
                      </label>
                      <input
                        type="number"
                        value={bs.criancas_previstas}
                        onChange={(e) => handleUpdatePassageiros(bs.balao_id, 'criancas_previstas', parseInt((e.target as HTMLInputElement).value) || 0)}
                        min="0"
                        max={Math.max(0, capacidadeEstimada - bs.adultos_previstos)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                  </div>
                  
                  <div className="mt-2 text-sm text-gray-600">
                    Total neste balão: {bs.adultos_previstos + bs.criancas_previstas} passageiros
                    {(bs.adultos_previstos + bs.criancas_previstas) > capacidadeEstimada && (
                      <span className="text-red-600 ml-2">⚠️ Acima da capacidade estimada</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          
          {/* Resumo Total */}
          <div className="bg-blue-50 p-4 rounded-lg mt-4">
            <h4 className="font-semibold text-blue-900">Resumo Total do Voo</h4>
            <div className="grid md:grid-cols-3 gap-4 mt-2 text-sm">
              <div>
                <span className="text-blue-700">Balões:</span>
                <span className="font-medium ml-2">{baloesSelecionados.length}</span>
              </div>
              <div>
                <span className="text-blue-700">Adultos:</span>
                <span className="font-medium ml-2">{baloesSelecionados.reduce((sum, b) => sum + b.adultos_previstos, 0)}</span>
              </div>
              <div>
                <span className="text-blue-700">Crianças:</span>
                <span className="font-medium ml-2">{baloesSelecionados.reduce((sum, b) => sum + b.criancas_previstas, 0)}</span>
              </div>
            </div>
            <div className="mt-2 pt-2 border-t border-blue-200">
              <span className="text-blue-700">Total de passageiros:</span>
              <span className="font-bold ml-2 text-lg">{totalPassageiros}</span>
            </div>
          </div>
        </MagicCard>

        <div className="flex justify-between">
          <button
            onClick={() => setStep(2)}
            className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Voltar
          </button>
          <button
            onClick={() => setStep(4)}
            className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary/90 transition-colors"
          >
            Próximo: Confirmar
          </button>
        </div>
      </div>
    );
  };

  // Renderizar passo 4: Confirmação
  const renderConfirmacao = () => {
    return (
      <div className="space-y-4">
        <MagicCard className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <CheckIcon className="h-5 w-5 text-primary" />
            Confirmação do Planejamento
          </h3>
          
          {/* Preview do Voo */}
          <div className="bg-white border border-gray-200 p-6 rounded-lg space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold text-gray-700">Dados do Voo</h4>
                <div className="mt-2 space-y-1 text-sm">
                  <p><strong>Data:</strong> {formatDateSafe(formData.data_voo)}</p>
                  <p><strong>Período:</strong> {formData.periodo === 'manha' ? 'Manhã' : 'Tarde'}</p>
                  <p><strong>Horário:</strong> {formData.horario_previsto}</p>
                  <p><strong>Local:</strong> {formData.local_decolagem_previsto}</p>
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold text-gray-700">Resumo de Passageiros</h4>
                <div className="mt-2 space-y-1 text-sm">
                  <p><strong>Balões:</strong> {baloesSelecionados.length}</p>
                  <p><strong>Adultos:</strong> {baloesSelecionados.reduce((sum, b) => sum + b.adultos_previstos, 0)}</p>
                  <p><strong>Crianças:</strong> {baloesSelecionados.reduce((sum, b) => sum + b.criancas_previstas, 0)}</p>
                  <p><strong>Total:</strong> {totalPassageiros} passageiros</p>
                </div>
              </div>
            </div>

            {formData.observacoes_planejamento && (
              <div>
                <h4 className="font-semibold text-gray-700">Observações</h4>
                <p className="mt-1 text-sm text-gray-600">{formData.observacoes_planejamento}</p>
              </div>
            )}

            <div>
              <h4 className="font-semibold text-gray-700">Balões e Distribuição</h4>
              <div className="mt-2 space-y-2">
                {baloesSelecionados.map((bs) => (
                  <div key={bs.balao_id} className="bg-white p-3 rounded border">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">
                        {bs.balao.prefixo}
                        {bs.balao.nome_batismo && ` (${bs.balao.nome_batismo})`}
                      </span>
                      <span className="text-sm text-gray-600">
                        {bs.adultos_previstos} adultos + {bs.criancas_previstas} crianças = {bs.adultos_previstos + bs.criancas_previstas} passageiros
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-yellow-50 p-4 rounded-lg mt-4">
            <h4 className="font-semibold text-yellow-800">⚠️ Importante</h4>
            <ul className="mt-2 text-sm text-yellow-700 space-y-1">
              <li>• O voo será criado como rascunho e poderá ser editado até o início do checklist</li>
              <li>• O checklist de segurança será criado automaticamente</li>
              <li>• Certifique-se de que todos os dados estão corretos antes de confirmar</li>
              <li>• Este planejamento deve ser feito até 22h do dia anterior ao voo</li>
            </ul>
          </div>
        </MagicCard>

        <div className="flex justify-between">
          <button
            onClick={() => setStep(3)}
            className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Voltar
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {submitting ? 'Criando...' : 'Confirmar e Criar Voo'}
            <CheckIcon className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  };

  if (userLoading || loading) {
    return (
      <EnhancedDashboardLayout title="Planejamento de Voo" loading={true}>
        <div>Carregando...</div>
      </EnhancedDashboardLayout>
    );
  }

  return (
    <EnhancedDashboardLayout
      title="Planejamento de Voo"
      breadcrumbs={[
        { label: 'Dashboard', href: '/piloto/dashboard', icon: HomeIcon },
        { label: 'Planejamento de Voo' }
      ]}
    >
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : (
        renderWizard()
      )}
    </EnhancedDashboardLayout>
  );
}