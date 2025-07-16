import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { PlusIcon, PencilIcon, TrashIcon, EyeIcon } from '@heroicons/react/24/outline';
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

export default function MeusBaloes() {
  const router = useRouter();
  const { user, loading: userLoading } = useUser();
  const { toast } = useToast();
  
  const [baloes, setBaloes] = useState<Balao[]>([]);
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

  // Verificar se usuário está autenticado e é piloto
  useEffect(() => {
    if (!userLoading) {
      if (!user) {
        router.push('/piloto/login');
        return;
      }
      // Só redireciona se o role estiver carregado E for diferente de piloto
      if (user.role && user.role !== 'piloto') {
        console.log('[MeusBaloes] Redirecionando - role:', user.role);
        router.push('/');
        return;
      }
    }
  }, [user, userLoading, router]);

  // Carregar balões quando o usuário estiver disponível
  useEffect(() => {
    if (user && user.role === 'piloto') {
      carregarBaloes();
      return;
    }
  }, [user, userLoading, router]);

  // Carregar balões do piloto
  useEffect(() => {
    if (user) {
      carregarBaloes();
    }
  }, [user]);

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

      // Buscar balões do piloto
      const { data, error } = await supabase
        .from('baloes')
        .select('*')
        .eq('proprietario_id', membro.id)
        .order('created_at', { ascending: false });

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setSubmitting(true);

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
        } else if (result.error.message.includes('formato PP-XXX')) {
          toast({
            title: "Erro",
            description: "Prefixo deve seguir o formato PP-XXX (ex: PT-ABC)",
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

      // Recarregar lista e fechar modal
      await carregarBaloes();
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
        toast({
          title: "Erro",
          description: "Erro ao excluir balão",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Sucesso",
        description: "Balão excluído com sucesso",
        variant: "default"
      });

      await carregarBaloes();
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

      await carregarBaloes();
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

  if (userLoading || loading) {
    return (
      <EnhancedDashboardLayout title="Meus Balões" loading={true}>
        <div>Carregando...</div>
      </EnhancedDashboardLayout>
    );
  }

  return (
    <EnhancedDashboardLayout title="Meus Balões">
      <div className="space-y-6">
        {/* Estatísticas */}
        <BentoGrid className="grid-cols-1 md:grid-cols-3 gap-4">
          <BentoGridItem className="bg-white border border-blue-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-600">Total de Balões</p>
                  <div className="flex items-center gap-2">
                    <NumberTicker value={baloes.length} className="text-2xl font-semibold text-gray-800" />
                    <span className="text-sm text-blue-600">
                      ({baloesAtivos.length} ativos)
                    </span>
                  </div>
                </div>
                <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center">
                  <EyeIcon className="h-6 w-6 text-blue-500" />
                </div>
              </div>
            </div>
          </BentoGridItem>

          <BentoGridItem className="bg-white border border-green-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-600">Volume Total</p>
                  <div className="flex items-center gap-2">
                    <NumberTicker 
                      value={volumeTotal} 
                      className="text-2xl font-semibold text-gray-800" 
                    />
                    <span className="text-sm text-green-600">m³</span>
                  </div>
                </div>
                <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center">
                  <div className="w-6 h-6 rounded-full bg-green-500"></div>
                </div>
              </div>
            </div>
          </BentoGridItem>

          <BentoGridItem className="bg-white border border-purple-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-600">Volume Médio</p>
                  <div className="flex items-center gap-2">
                    <NumberTicker 
                      value={baloesAtivos.length > 0 ? Math.round(volumeTotal / baloesAtivos.length) : 0} 
                      className="text-2xl font-semibold text-gray-800" 
                    />
                    <span className="text-sm text-purple-600">m³</span>
                  </div>
                </div>
                <div className="w-12 h-12 bg-purple-50 rounded-full flex items-center justify-center">
                  <div className="w-6 h-6 bg-purple-500 transform rotate-45"></div>
                </div>
              </div>
            </div>
          </BentoGridItem>
        </BentoGrid>

        {/* Botão Adicionar */}
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Meus Balões</h2>
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-primary text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-primary/90 transition-colors"
          >
            <PlusIcon className="h-5 w-5" />
            Adicionar Balão
          </button>
        </div>

        {/* Lista de Balões */}
        {baloes.length === 0 && !loading && (
          <div className="bg-white rounded-xl p-12 text-center">
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center">
                <EyeIcon className="h-10 w-10 text-blue-400" />
              </div>
              <h3 className="text-xl font-medium text-gray-800">Nenhum balão cadastrado</h3>
              <p className="text-gray-600 max-w-md">
                Cadastre seu primeiro balão para começar a registrar voos.
              </p>
              <button
                onClick={() => {
                  setEditingBalao(null);
                  setFormData({
                    prefixo: '',
                    volume_m3: 2000,
                    nome_batismo: '',
                    observacoes: ''
                  });
                  setIsModalOpen(true);
                }}
                className="mt-4 bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2"
              >
                <PlusIcon className="h-5 w-5" />
                Cadastrar Primeiro Balão
              </button>
            </div>
          </div>
        )}

        {/* Balões Ativos */}
        {baloesAtivos.length > 0 && (
          <div>
            <h3 className="text-lg font-medium mb-3 text-green-700">Balões Ativos</h3>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {baloesAtivos.map((balao) => (
                <BalaoCard
                  key={balao.id}
                  balao={balao}
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
            <h3 className="text-lg font-medium mb-3 text-gray-500">Balões Inativos</h3>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {baloesInativos.map((balao) => (
                <BalaoCard
                  key={balao.id}
                  balao={balao}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onToggleStatus={handleToggleStatus}
                />
              ))}
            </div>
          </div>
        )}

        {/* Modal de Cadastro/Edição */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-gray-500 bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-md w-full p-6 space-y-4">
              <h3 className="text-xl font-semibold">
                {editingBalao ? 'Editar Balão' : 'Adicionar Balão'}
              </h3>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Prefixo * (formato: PT-ABC)
                  </label>
                  <input
                    type="text"
                    value={formData.prefixo}
                    onChange={(e) => setFormData({ ...formData, prefixo: e.target.value })}
                    placeholder="PT-ABC"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                    pattern="[A-Z]{2}-[A-Z0-9]{3}"
                    title="Formato deve ser PP-XXX (ex: PT-ABC)"
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
                    placeholder="Informações adicionais sobre o balão..."
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
                    {submitting ? 'Salvando...' : (editingBalao ? 'Atualizar' : 'Cadastrar')}
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

// Componente para Card do Balão
function BalaoCard({ 
  balao, 
  onEdit, 
  onDelete, 
  onToggleStatus 
}: { 
  balao: Balao; 
  onEdit: (balao: Balao) => void;
  onDelete: (balao: Balao) => void;
  onToggleStatus: (balao: Balao) => void;
}) {
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
            {balao.ativo ? 'Ativo' : 'Inativo'}
          </div>
        </div>

        <div className="space-y-1">
          <p className="text-sm">
            <span className="font-medium">Volume:</span> {balao.volume_m3.toLocaleString()} m³
          </p>
          {balao.observacoes && (
            <p className="text-sm text-gray-600">
              <span className="font-medium">Observações:</span> {balao.observacoes}
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