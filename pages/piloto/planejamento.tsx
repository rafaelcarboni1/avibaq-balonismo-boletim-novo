import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { PlusIcon, CalendarIcon, ClockIcon, MapPinIcon, UsersIcon, CheckIcon } from '@heroicons/react/24/outline';
import { EnhancedDashboardLayout } from '../../src/components/magicui/enhanced-dashboard-layout';
import { MagicCard } from '../../src/components/magicui/magic-card';
import { BentoGrid, BentoGridItem } from '../../src/components/magicui/bento-grid';
import { supabase } from '../../src/integrations/supabase/client';
import { useUser } from '../../src/hooks/useUser';
import { useToast } from '../../src/hooks/use-toast';

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
    if (!userLoading && (!user || user.role !== 'piloto')) {
      router.push('/login');
      return;
    }
  }, [user, userLoading, router]);

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
      
      // Buscar membro associado ao usuário
      const { data: membro, error: membroError } = await supabase
        .from('membros')
        .select('id')
        .eq('user_id', user?.id)
        .eq('tipo', 'piloto')
        .single();

      if (membroError || !membro) {
        toast({
          title: "Erro",
          description: "Piloto não encontrado no sistema",
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
        .from('vw_voos_com_baloes')
        .select('balao_id')
        .eq('data_voo', formData.data_voo)
        .eq('periodo', formData.periodo)
        .in('voo_status', ['rascunho', 'planejado', 'checklist_bloco1', 'checklist_bloco2', 'checklist_concluido']);

      if (error) {
        console.error('Erro ao verificar disponibilidade:', error);
        return;
      }

      const baloesOcupados = voosExistentes?.map(v => v.balao_id).filter(Boolean) || [];
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

      // Buscar membro associado ao usuário
      const { data: membro, error: membroError } = await supabase
        .from('membros')
        .select('id')
        .eq('user_id', user?.id)
        .eq('tipo', 'piloto')
        .single();

      if (membroError || !membro) {
        toast({
          title: "Erro",
          description: "Piloto não encontrado no sistema",
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
          created_by: user?.id
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

  if (userLoading || loading) {
    return (
      <EnhancedDashboardLayout title="Planejamento de Voo" loading={true}>
        <div>Carregando...</div>
      </EnhancedDashboardLayout>
    );
  }

  return (
    <EnhancedDashboardLayout title="Planejar Novo Voo">
      <div className="space-y-6">
        {/* Header com progresso */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Planejamento de Voo - Dia Anterior</h2>
            <div className="text-sm text-gray-500">
              Etapa {step} de 4
            </div>
          </div>
          
          {/* Indicador de progresso */}
          <div className="flex items-center space-x-4">
            {[1, 2, 3, 4].map((stepNum) => (
              <div key={stepNum} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  stepNum <= step ? 'bg-primary text-white' : 'bg-gray-200 text-gray-500'
                }`}>
                  {stepNum < step ? <CheckIcon className="h-4 w-4" /> : stepNum}
                </div>
                {stepNum < 4 && (
                  <div className={`w-12 h-1 mx-2 ${
                    stepNum < step ? 'bg-primary' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Etapa 1: Dados Básicos */}
        {step === 1 && (
          <MagicCard className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <CalendarIcon className="h-5 w-5 text-primary" />
              Dados Básicos do Voo
            </h3>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Data do Voo *
                </label>
                <input
                  type="date"
                  value={formData.data_voo}
                  onChange={(e) => setFormData({ ...formData, data_voo: e.target.value })}
                  min={hoje}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Período *
                </label>
                <select
                  value={formData.periodo}
                  onChange={(e) => setFormData({ ...formData, periodo: e.target.value as 'manha' | 'tarde' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="manha">Manhã</option>
                  <option value="tarde">Tarde</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Horário Previsto *
                </label>
                <input
                  type="time"
                  value={formData.horario_previsto}
                  onChange={(e) => setFormData({ ...formData, horario_previsto: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Local de Decolagem *
                </label>
                <input
                  type="text"
                  value={formData.local_decolagem_previsto}
                  onChange={(e) => setFormData({ ...formData, local_decolagem_previsto: e.target.value })}
                  placeholder="Ex: Campo Central, Fazenda do Vento..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium mb-1">
                Observações do Planejamento
              </label>
              <textarea
                value={formData.observacoes_planejamento}
                onChange={(e) => setFormData({ ...formData, observacoes_planejamento: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Informações adicionais sobre o voo, condições especiais, etc..."
              />
            </div>

            <div className="flex justify-end mt-6">
              <button
                onClick={() => setStep(2)}
                disabled={!canProceedToStep2}
                className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Próximo: Selecionar Balões
              </button>
            </div>
          </MagicCard>
        )}

        {/* Etapa 2: Seleção de Balões */}
        {step === 2 && (
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
                    <div key={bs.balao_id} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
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

            <div className="flex justify-between">
              <button
                onClick={() => setStep(1)}
                className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Voltar
              </button>
              <button
                onClick={() => setStep(3)}
                disabled={!canProceedToStep3}
                className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Próximo: Definir Passageiros
              </button>
            </div>
          </div>
        )}

        {/* Etapa 3: Passageiros */}
        {step === 3 && (
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
                            onChange={(e) => handleUpdatePassageiros(bs.balao_id, 'adultos_previstos', parseInt(e.target.value) || 0)}
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
                            onChange={(e) => handleUpdatePassageiros(bs.balao_id, 'criancas_previstas', parseInt(e.target.value) || 0)}
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
        )}

        {/* Etapa 4: Confirmação */}
        {step === 4 && (
          <div className="space-y-4">
            <MagicCard className="p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <CheckIcon className="h-5 w-5 text-primary" />
                Confirmação do Planejamento
              </h3>
              
              {/* Preview do Voo */}
              <div className="bg-gray-50 p-6 rounded-lg space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold text-gray-700">Dados do Voo</h4>
                    <div className="mt-2 space-y-1 text-sm">
                      <p><strong>Data:</strong> {new Date(formData.data_voo).toLocaleDateString('pt-BR')}</p>
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
        )}
      </div>
    </EnhancedDashboardLayout>
  );
}