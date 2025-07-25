import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { PlusIcon, PencilIcon, TrashIcon, EyeIcon, UsersIcon, BuildingOfficeIcon } from '@heroicons/react/24/outline';
import { EnhancedDashboardLayout } from '../../src/components/magicui/enhanced-dashboard-layout';
import { MagicCard } from '../../src/components/magicui/magic-card';
import { NumberTicker } from '../../src/components/magicui/number-ticker';
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
  observacoes: string | null;
  created_at: string;
  updated_at: string;
}

interface BalaoFormData {
  prefixo: string;
  volume_m3: number;
  nome_batismo: string;
  observacoes: string;
}

interface VooCount {
  balao_prefixo: string;
  total_voos: number;
}

export default function Frota() {
  const router = useRouter();
  const { user, loading: userLoading } = useUser();
  const { toast } = useToast();
  
  const [baloes, setBaloes] = useState<Balao[]>([]);
  const [vooStats, setVooStats] = useState<VooCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBalao, setEditingBalao] = useState<Balao | null>(null);
  const [formData, setFormData] = useState<BalaoFormData>({
    prefixo: '',
    volume_m3: 2000,
    nome_batismo: '',
    observacoes: ''
  });
  const [submitting, setSubmitting] = useState(false);

  // Verificar se usuário está autenticado e é agência
  useEffect(() => {
    if (!userLoading) {
      if (!user) {
        router.push('/agencia/login');
        return;
      }
      if (user.role && user.role !== 'agencia') {
        console.log('[AgenciaFrota] Redirecionando - role:', user.role);
        router.push('/');
        return;
      }
    }
  }, [user, userLoading, router]);

  // Carregar balões da agência
  useEffect(() => {
    if (user) {
      carregarDados();
    }
  }, [user]);

  const carregarDados = async () => {
    try {
      setLoading(true);
      
      // Buscar membro associado ao usuário
      const { data: membro, error: membroError } = await supabase
        .from('membros')
        .select('id')
        .eq('user_id', user?.id)
        .eq('tipo', 'agencia')
        .single();

      if (membroError || !membro) {
        toast({
          title: "Erro",
          description: "Agência não encontrada no sistema",
          variant: "destructive"
        });
        return;
      }

      // Buscar balões da agência
      const { data: baloesData, error: baloesError } = await supabase
        .from('baloes')
        .select('*')
        .eq('proprietario_id', membro.id)
        .order('created_at', { ascending: false });

      if (baloesError) {
        console.error('Erro ao carregar balões:', baloesError);
        toast({
          title: "Erro",
          description: "Erro ao carregar balões",
          variant: "destructive"
        });
        return;
      }

      setBaloes(baloesData || []);

      // Buscar estatísticas de voos por balão
      if (baloesData && baloesData.length > 0) {
        const { data: statsData, error: statsError } = await supabase
          .from('vw_voos_com_baloes')
          .select('balao_prefixo, voo_id')
          .in('balao_id', baloesData.map(b => b.id))
          .not('voo_id', 'is', null);

        if (!statsError && statsData) {
          // Agrupar voos por balão
          const voosPorBalao = statsData.reduce((acc, item) => {
            const prefixo = item.balao_prefixo;
            acc[prefixo] = (acc[prefixo] || 0) + 1;
            return acc;
          }, {} as Record<string, number>);

          const statsArray = Object.entries(voosPorBalao).map(([prefixo, total]) => ({
            balao_prefixo: prefixo,
            total_voos: total
          }));

          setVooStats(statsArray);
        }
      }

    } catch (error) {
      console.error('Erro:', error);
      toast({
        title: "Erro",
        description: "Erro inesperado ao carregar dados",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setSubmitting(true);

      // Buscar membro associado ao usuário
      const { data: membro, error: membroError } = await supabase
        .from('membros')
        .select('id')
        .eq('user_id', user?.id)
        .eq('tipo', 'agencia')
        .single();

      if (membroError || !membro) {
        toast({
          title: "Erro",
          description: "Agência não encontrada no sistema",
          variant: "destructive"
        });
        return;
      }

      // Preparar dados do balão
      const balaoData = {
        prefixo: formData.prefixo.toUpperCase(),
        volume_m3: formData.volume_m3,
        nome_batismo: formData.nome_batismo.trim() || null,
        observacoes: formData.observacoes.trim() || null,
        proprietario_id: membro.id,
        ativo: true
      };

      let result;

      if (editingBalao) {
        // Atualizar balão existente
        result = await supabase
          .from('baloes')
          .update(balaoData)
          .eq('id', editingBalao.id)
          .select()
          .single();
      } else {
        // Criar novo balão
        result = await supabase
          .from('baloes')
          .insert([balaoData])
          .select()
          .single();
      }

      if (result.error) {
        console.error('Erro ao salvar balão:', result.error);
        
        if (result.error.code === '23505') {
          toast({
            title: "Erro",
            description: "Já existe um balão com este prefixo",
            variant: "destructive"
          });
        } else if (result.error.message.includes('formato PT-XXX, BR-XXX ou PP-XXX')) {
          toast({
            title: "Erro",
            description: "Prefixo deve seguir o formato PT-XXX, BR-XXX ou PP-XXX (ex: PT-ABC, BR-FORT1, PP-123)",
            variant: "destructive"
          });
        } else {
          toast({
            title: "Erro",
            description: "Erro ao salvar balão",
            variant: "destructive"
          });
        }
        return;
      }

      toast({
        title: "Sucesso",
        description: `Balão ${editingBalao ? 'atualizado' : 'cadastrado'} com sucesso`,
        variant: "default"
      });

      // Recarregar dados e fechar modal
      await carregarDados();
      handleCloseModal();

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

  const handleEdit = (balao: Balao) => {
    setEditingBalao(balao);
    setFormData({
      prefixo: balao.prefixo,
      volume_m3: balao.volume_m3,
      nome_batismo: balao.nome_batismo || '',
      observacoes: balao.observacoes || ''
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (balao: Balao) => {
    if (!confirm(`Tem certeza que deseja excluir o balão ${balao.prefixo}?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('baloes')
        .delete()
        .eq('id', balao.id);

      if (error) {
        console.error('Erro ao excluir balão:', error);
        
        if (error.code === '23503') {
          toast({
            title: "Erro",
            description: "Não é possível excluir balão que possui voos registrados",
            variant: "destructive"
          });
        } else {
          toast({
            title: "Erro",
            description: "Erro ao excluir balão",
            variant: "destructive"
          });
        }
        return;
      }

      toast({
        title: "Sucesso",
        description: "Balão excluído com sucesso",
        variant: "default"
      });

      await carregarDados();
    } catch (error) {
      console.error('Erro:', error);
      toast({
        title: "Erro",
        description: "Erro inesperado",
        variant: "destructive"
      });
    }
  };

  const handleToggleStatus = async (balao: Balao) => {
    try {
      const { error } = await supabase
        .from('baloes')
        .update({ ativo: !balao.ativo })
        .eq('id', balao.id);

      if (error) {
        console.error('Erro ao alterar status:', error);
        toast({
          title: "Erro",
          description: "Erro ao alterar status do balão",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Sucesso",
        description: `Balão ${!balao.ativo ? 'ativado' : 'desativado'} com sucesso`,
        variant: "default"
      });

      await carregarDados();
    } catch (error) {
      console.error('Erro:', error);
      toast({
        title: "Erro",
        description: "Erro inesperado",
        variant: "destructive"
      });
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingBalao(null);
    setFormData({
      prefixo: '',
      volume_m3: 2000,
      nome_batismo: '',
      observacoes: ''
    });
  };

  const baloesAtivos = baloes.filter(b => b.ativo);
  const baloesInativos = baloes.filter(b => b.ativo === false);
  const volumeTotal = baloesAtivos.reduce((sum, b) => sum + b.volume_m3, 0);
  const capacidadeMaxima = baloesAtivos.reduce((sum, b) => sum + Math.floor(b.volume_m3 / 300), 0); // Estimativa de passageiros

  // Dados para gráfico de distribuição de volumes
  const volumeChartData = baloes.map(b => ({
    name: b.prefixo,
    value: b.volume_m3,
    color: b.ativo ? '#3b82f6' : '#94a3b8'
  }));

  // Dados para gráfico de voos por balão
  const vooChartData = vooStats.map(stat => ({
    name: stat.balao_prefixo,
    value: stat.total_voos
  }));

  if (userLoading || loading) {
    return (
      <EnhancedDashboardLayout title="Gestão da Frota" loading={true}>
        <div>Carregando...</div>
      </EnhancedDashboardLayout>
    );
  }

  return (
    <EnhancedDashboardLayout title="Gestão da Frota">
      <div className="space-y-6">
        {/* Estatísticas */}
        <BentoGrid className="grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <BentoGridItem className="bg-white border border-blue-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-600">Total da Frota</p>
                  <div className="flex items-center gap-2">
                    <NumberTicker value={baloes.length} className="text-2xl font-semibold text-gray-800" />
                    <span className="text-sm text-blue-600">balões</span>
                  </div>
                </div>
                <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center">
                  <BuildingOfficeIcon className="h-6 w-6 text-blue-500" />
                </div>
              </div>
            </div>
          </BentoGridItem>

          <BentoGridItem className="bg-white border border-green-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-600">Balões Ativos</p>
                  <div className="flex items-center gap-2">
                    <NumberTicker value={baloesAtivos.length} className="text-2xl font-semibold text-gray-800" />
                    <span className="text-sm text-green-600">operacionais</span>
                  </div>
                </div>
                <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center">
                  <EyeIcon className="h-6 w-6 text-green-500" />
                </div>
              </div>
            </div>
          </BentoGridItem>

          <BentoGridItem className="bg-white border border-purple-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-600">Volume Total</p>
                  <div className="flex items-center gap-2">
                    <NumberTicker value={volumeTotal} className="text-2xl font-semibold text-gray-800" />
                    <span className="text-sm text-purple-600">m³</span>
                  </div>
                </div>
                <div className="w-12 h-12 bg-purple-50 rounded-full flex items-center justify-center">
                  <div className="w-6 h-6 rounded-full bg-purple-500"></div>
                </div>
              </div>
            </div>
          </BentoGridItem>

          <BentoGridItem className="bg-white border border-orange-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-orange-600">Capacidade Est.</p>
                  <div className="flex items-center gap-2">
                    <NumberTicker value={capacidadeMaxima} className="text-2xl font-semibold text-gray-800" />
                    <span className="text-sm text-orange-600">passageiros</span>
                  </div>
                </div>
                <div className="w-12 h-12 bg-orange-50 rounded-full flex items-center justify-center">
                  <UsersIcon className="h-6 w-6 text-orange-500" />
                </div>
              </div>
            </div>
          </BentoGridItem>
        </BentoGrid>

        {/* Estatísticas da Frota */}
        {baloes.length > 0 && (
          <BentoGrid className="grid-cols-1 lg:grid-cols-2 gap-6">
            <BentoGridItem className="p-6">
              <h3 className="text-lg font-semibold mb-4">Resumo da Frota</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total de Balões:</span>
                  <span className="font-semibold">{baloes.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Balões Ativos:</span>
                  <span className="font-semibold text-green-600">{baloesAtivos.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Balões Inativos:</span>
                  <span className="font-semibold text-gray-600">{baloesInativos.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Volume Total:</span>
                  <span className="font-semibold">{baloes.reduce((sum, b) => sum + b.volume_m3, 0).toLocaleString()} m³</span>
                </div>
              </div>
            </BentoGridItem>

            {vooStats.length > 0 && (
              <BentoGridItem className="p-6">
                <h3 className="text-lg font-semibold mb-4">Estatísticas de Voos</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total de Voos:</span>
                    <span className="font-semibold">{vooStats.reduce((sum, s) => sum + s.total_voos, 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Balão Mais Usado:</span>
                    <span className="font-semibold">
                      {vooStats.length > 0 ? vooStats.sort((a, b) => b.total_voos - a.total_voos)[0]?.balao_prefixo : 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Média por Balão:</span>
                    <span className="font-semibold">
                      {vooStats.length > 0 ? Math.round(vooStats.reduce((sum, s) => sum + s.total_voos, 0) / vooStats.length) : 0} voos
                    </span>
                  </div>
                </div>
              </BentoGridItem>
            )}
          </BentoGrid>
        )}

        {/* Botão Adicionar */}
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Frota de Balões</h2>
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-primary text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-primary/90 transition-colors"
          >
            <PlusIcon className="h-5 w-5" />
            Adicionar Balão
          </button>
        </div>

        {/* Lista de Balões */}
        {baloes.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center">
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center">
                <BuildingOfficeIcon className="h-10 w-10 text-blue-400" />
              </div>
              <h3 className="text-xl font-medium text-gray-800">Nenhum balão na frota</h3>
              <p className="text-gray-600 max-w-md">
                Adicione balões à sua frota para começar a operar voos comerciais.
              </p>
              <button
                onClick={() => setIsModalOpen(true)}
                className="mt-4 bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2"
              >
                <PlusIcon className="h-5 w-5" />
                Adicionar Primeiro Balão
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Balões Ativos */}
            {baloesAtivos.length > 0 && (
              <div>
                <h3 className="text-lg font-medium mb-3 text-green-700">Frota Ativa</h3>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {baloesAtivos.map((balao) => (
                    <FrotaBalaoCard
                      key={balao.id}
                      balao={balao}
                      vooCount={vooStats.find(s => s.balao_prefixo === balao.prefixo)?.total_voos || 0}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                      onToggleStatus={handleToggleStatus}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Balões Inativos */}
            {baloesInativos.length > 0 && (
              <div>
                <h3 className="text-lg font-medium mb-3 text-gray-500">Frota Inativa</h3>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {baloesInativos.map((balao) => (
                    <FrotaBalaoCard
                      key={balao.id}
                      balao={balao}
                      vooCount={vooStats.find(s => s.balao_prefixo === balao.prefixo)?.total_voos || 0}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                      onToggleStatus={handleToggleStatus}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Modal de Cadastro/Edição */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-gray-500 bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-md w-full p-6 space-y-4">
              <h3 className="text-xl font-semibold">
                {editingBalao ? 'Editar Balão da Frota' : 'Adicionar Balão à Frota'}
              </h3>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Prefixo * (formato: PT-ABC, BR-FORT1 ou PP-123)
                  </label>
                  <input
                    type="text"
                    value={formData.prefixo}
                    onChange={(e) => setFormData({ ...formData, prefixo: e.target.value })}
                    placeholder="PT-ABC, BR-FORT1 ou PP-123"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                    pattern="(PT|BR|PP)-[A-Z0-9]{3,4}"
                    title="Formato deve ser PT-XXX, BR-XXX ou PP-XXX (ex: PT-ABC, BR-FORT1, PP-123)"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Volume (m³) *
                  </label>
                  <input
                    type="number"
                    value={formData.volume_m3}
                    onChange={(e) => setFormData({ ...formData, volume_m3: parseInt(e.target.value) })}
                    min="500"
                    max="10000"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Nome de Batismo (opcional)
                  </label>
                  <input
                    type="text"
                    value={formData.nome_batismo}
                    onChange={(e) => setFormData({ ...formData, nome_batismo: e.target.value })}
                    placeholder="Ex: Esperança, Liberdade..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Observações (opcional)
                  </label>
                  <textarea
                    value={formData.observacoes}
                    onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Informações técnicas, manutenção, etc..."
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
                  >
                    {submitting ? 'Salvando...' : (editingBalao ? 'Atualizar' : 'Adicionar')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </EnhancedDashboardLayout>
  );
}

// Componente para Card do Balão da Frota
function FrotaBalaoCard({ 
  balao, 
  vooCount,
  onEdit, 
  onDelete, 
  onToggleStatus 
}: { 
  balao: Balao; 
  vooCount: number;
  onEdit: (balao: Balao) => void;
  onDelete: (balao: Balao) => void;
  onToggleStatus: (balao: Balao) => void;
}) {
  const capacidadeEstimada = Math.floor(balao.volume_m3 / 300); // Estimativa baseada no volume

  return (
    <MagicCard className={`p-4 ${balao.ativo ? 'border-green-200' : 'border-gray-300 opacity-80'}`}>
      <div className="space-y-3">
        <div className="flex items-start justify-between">
          <div>
            <h4 className="font-semibold text-lg">{balao.prefixo}</h4>
            {balao.nome_batismo && (
              <p className="text-sm text-gray-600">{balao.nome_batismo}</p>
            )}
          </div>
          <div className={`px-2 py-1 rounded-full text-xs font-medium ${
            balao.ativo 
              ? 'bg-green-100 text-green-800' 
              : 'bg-gray-50 text-gray-500'
          }`}>
            {balao.ativo ? 'Operacional' : 'Inativo'}
          </div>
        </div>

        <div className="space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="font-medium">Volume:</span>
            <span>{balao.volume_m3.toLocaleString()} m³</span>
          </div>
          <div className="flex justify-between">
            <span className="font-medium">Capacidade est.:</span>
            <span>{capacidadeEstimada} passageiros</span>
          </div>
          <div className="flex justify-between">
            <span className="font-medium">Total de voos:</span>
            <span className="font-semibold text-blue-600">{vooCount}</span>
          </div>
          {balao.observacoes && (
            <p className="text-sm text-gray-600 mt-2">
              <span className="font-medium">Obs:</span> {balao.observacoes}
            </p>
          )}
        </div>

        <div className="flex gap-2 pt-2">
          <button
            onClick={() => onEdit(balao)}
            className="flex-1 bg-blue-50 text-blue-700 px-3 py-2 rounded-lg text-sm hover:bg-blue-100 transition-colors flex items-center justify-center gap-2"
          >
            <PencilIcon className="h-4 w-4" />
            Editar
          </button>
          
          <button
            onClick={() => onToggleStatus(balao)}
            className={`flex-1 px-3 py-2 rounded-lg text-sm transition-colors ${
              balao.ativo
                ? 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100'
                : 'bg-green-50 text-green-700 hover:bg-green-100'
            }`}
          >
            {balao.ativo ? 'Desativar' : 'Ativar'}
          </button>
          
          <button
            onClick={() => onDelete(balao)}
            className="bg-red-50 text-red-700 px-3 py-2 rounded-lg text-sm hover:bg-red-100 transition-colors"
          >
            <TrashIcon className="h-4 w-4" />
          </button>
        </div>
      </div>
    </MagicCard>
  );
}