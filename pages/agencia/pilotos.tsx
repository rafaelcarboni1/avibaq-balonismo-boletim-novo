import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { PlusIcon, UserPlusIcon, CheckIcon, XMarkIcon, ClockIcon, UsersIcon, PaperAirplaneIcon } from '@heroicons/react/24/outline';
import { EnhancedDashboardLayout } from '../../src/components/magicui/enhanced-dashboard-layout';
import { MagicCard } from '../../src/components/magicui/magic-card';
import { NumberTicker } from '../../src/components/magicui/number-ticker';
import { BentoGrid, BentoGridItem } from '../../src/components/magicui/bento-grid';
import { supabase } from '../../src/integrations/supabase/client';
import { useUser } from '../../src/hooks/useUser';
import { useToast } from '../../src/hooks/use-toast';

interface Piloto {
  id: string;
  nome_completo: string;
  email: string;
  telefone: string;
  status: string;
}

interface Vinculo {
  id: string;
  agencia_id: string;
  piloto_id: string;
  status: 'pendente' | 'aceito' | 'recusado';
  observacoes: string | null;
  convite_enviado_em: string;
  respondido_em: string | null;
  piloto: Piloto;
}

interface ConviteFormData {
  piloto_email: string;
  observacoes: string;
}

export default function GestãoPilotos() {
  const router = useRouter();
  const { user, loading: userLoading } = useUser();
  const { toast } = useToast();
  
  const [vinculos, setVinculos] = useState<Vinculo[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<ConviteFormData>({
    piloto_email: '',
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
        router.push('/');
        return;
      }
    }
  }, [user, userLoading, router]);

  // Carregar vínculos da agência
  useEffect(() => {
    if (user) {
      carregarVinculos();
    }
  }, [user]);

  const carregarVinculos = async () => {
    try {
      setLoading(true);
      
      // Buscar membro associado ao usuário (agência)
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

      // Buscar vínculos da agência com dados dos pilotos
      const { data, error } = await supabase
        .from('vinculos_agencia_piloto')
        .select(`
          *,
          piloto:membros!vinculos_agencia_piloto_piloto_id_fkey (
            id,
            nome_completo,
            email,
            telefone,
            status
          )
        `)
        .eq('agencia_id', membro.id)
        .order('convite_enviado_em', { ascending: false });

      if (error) {
        console.error('Erro ao carregar vínculos:', error);
        toast({
          title: "Erro",
          description: "Erro ao carregar vínculos com pilotos",
          variant: "destructive"
        });
        return;
      }

      setVinculos(data || []);
    } catch (error) {
      console.error('Erro:', error);
      toast({
        title: "Erro",
        description: "Erro inesperado ao carregar vínculos",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEnviarConvite = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setSubmitting(true);

      // Buscar membro associado ao usuário (agência)
      const { data: agencia, error: agenciaError } = await supabase
        .from('membros')
        .select('id')
        .eq('user_id', user?.id)
        .eq('tipo', 'agencia')
        .single();

      if (agenciaError || !agencia) {
        toast({
          title: "Erro",
          description: "Agência não encontrada no sistema",
          variant: "destructive"
        });
        return;
      }

      // Buscar piloto pelo e-mail
      const { data: piloto, error: pilotoError } = await supabase
        .from('membros')
        .select('id, nome_completo, status')
        .eq('email', formData.piloto_email.toLowerCase().trim())
        .eq('tipo', 'piloto')
        .single();

      if (pilotoError || !piloto) {
        toast({
          title: "Erro",
          description: "Piloto não encontrado ou e-mail incorreto",
          variant: "destructive"
        });
        return;
      }

      if (piloto.status !== 'ativo') {
        toast({
          title: "Erro",
          description: "Piloto deve estar ativo para receber convites",
          variant: "destructive"
        });
        return;
      }

      // Verificar se já existe vínculo
      const { data: vinculoExistente } = await supabase
        .from('vinculos_agencia_piloto')
        .select('id, status')
        .eq('agencia_id', agencia.id)
        .eq('piloto_id', piloto.id)
        .single();

      if (vinculoExistente) {
        const statusMsg = vinculoExistente.status === 'pendente' ? 'pendente' :
                         vinculoExistente.status === 'aceito' ? 'já aceito' : 'recusado';
        toast({
          title: "Erro",
          description: `Já existe um convite ${statusMsg} para este piloto`,
          variant: "destructive"
        });
        return;
      }

      // Criar novo vínculo
      const { error: vinculoError } = await supabase
        .from('vinculos_agencia_piloto')
        .insert([{
          agencia_id: agencia.id,
          piloto_id: piloto.id,
          status: 'pendente',
          observacoes: formData.observacoes.trim() || null
        }]);

      if (vinculoError) {
        console.error('Erro ao criar vínculo:', vinculoError);
        toast({
          title: "Erro",
          description: "Erro ao enviar convite",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Sucesso",
        description: `Convite enviado para ${piloto.nome_completo}`,
        variant: "default"
      });

      // Recarregar lista e fechar modal
      await carregarVinculos();
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

  const handleCancelarConvite = async (vinculo: Vinculo) => {
    if (!confirm(`Tem certeza que deseja cancelar o convite para ${vinculo.piloto.nome_completo}?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('vinculos_agencia_piloto')
        .delete()
        .eq('id', vinculo.id);

      if (error) {
        console.error('Erro ao cancelar convite:', error);
        toast({
          title: "Erro",
          description: "Erro ao cancelar convite",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Sucesso",
        description: "Convite cancelado com sucesso",
        variant: "default"
      });

      await carregarVinculos();
    } catch (error) {
      console.error('Erro:', error);
      toast({
        title: "Erro",
        description: "Erro inesperado",
        variant: "destructive"
      });
    }
  };

  const handleRemoverVinculo = async (vinculo: Vinculo) => {
    if (!confirm(`Tem certeza que deseja remover ${vinculo.piloto.nome_completo} da sua equipe?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('vinculos_agencia_piloto')
        .delete()
        .eq('id', vinculo.id);

      if (error) {
        console.error('Erro ao remover vínculo:', error);
        toast({
          title: "Erro",
          description: "Erro ao remover piloto",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Sucesso",
        description: "Piloto removido da equipe",
        variant: "default"
      });

      await carregarVinculos();
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
    setFormData({
      piloto_email: '',
      observacoes: ''
    });
  };

  const vinculosPendentes = vinculos.filter(v => v.status === 'pendente');
  const vinculosAceitos = vinculos.filter(v => v.status === 'aceito');
  const vinculosRecusados = vinculos.filter(v => v.status === 'recusado');

  if (userLoading || loading) {
    return (
      <EnhancedDashboardLayout title="Gestão de Pilotos" loading={true}>
        <div>Carregando...</div>
      </EnhancedDashboardLayout>
    );
  }

  return (
    <EnhancedDashboardLayout title="Gestão de Pilotos">
      <div className="space-y-6">
        {/* Estatísticas */}
        <BentoGrid className="grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <BentoGridItem className="bg-white border border-blue-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-600">Total de Vínculos</p>
                  <NumberTicker value={vinculos.length} className="text-2xl font-semibold text-gray-800" />
                </div>
                <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center">
                  <UsersIcon className="h-6 w-6 text-blue-500" />
                </div>
              </div>
            </div>
          </BentoGridItem>

          <BentoGridItem className="bg-white border border-green-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-600">Pilotos Ativos</p>
                  <NumberTicker value={vinculosAceitos.length} className="text-2xl font-semibold text-gray-800" />
                </div>
                <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center">
                  <CheckIcon className="h-6 w-6 text-green-500" />
                </div>
              </div>
            </div>
          </BentoGridItem>

          <BentoGridItem className="bg-white border border-yellow-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-yellow-600">Pendentes</p>
                  <NumberTicker value={vinculosPendentes.length} className="text-2xl font-semibold text-gray-800" />
                </div>
                <div className="w-12 h-12 bg-yellow-50 rounded-full flex items-center justify-center">
                  <ClockIcon className="h-6 w-6 text-yellow-500" />
                </div>
              </div>
            </div>
          </BentoGridItem>

          <BentoGridItem className="bg-white border border-red-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-red-600">Recusados</p>
                  <NumberTicker value={vinculosRecusados.length} className="text-2xl font-semibold text-gray-800" />
                </div>
                <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center">
                  <XMarkIcon className="h-6 w-6 text-red-500" />
                </div>
              </div>
            </div>
          </BentoGridItem>
        </BentoGrid>

        {/* Botão Convidar */}
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Equipe de Pilotos</h2>
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-primary text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-primary/90 transition-colors"
          >
            <UserPlusIcon className="h-5 w-5" />
            Convidar Piloto
          </button>
        </div>

        {/* Lista de Vínculos */}
        {vinculos.length === 0 ? (
          <MagicCard className="p-8 text-center">
            <div className="space-y-4">
              <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto">
                <UsersIcon className="h-8 w-8 text-blue-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-800">Nenhum piloto vinculado</h3>
              <p className="text-gray-500">Convide pilotos para formar sua equipe e expandir suas operações.</p>
              <button
                onClick={() => setIsModalOpen(true)}
                className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary/90 transition-colors"
              >
                Convidar Primeiro Piloto
              </button>
            </div>
          </MagicCard>
        ) : (
          <div className="space-y-6">
            {/* Pilotos Ativos */}
            {vinculosAceitos.length > 0 && (
              <div>
                <h3 className="text-lg font-medium mb-3 text-green-700 flex items-center gap-2">
                  <CheckIcon className="h-5 w-5" />
                  Pilotos da Equipe ({vinculosAceitos.length})
                </h3>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {vinculosAceitos.map((vinculo) => (
                    <PilotoCard
                      key={vinculo.id}
                      vinculo={vinculo}
                      onRemover={handleRemoverVinculo}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Convites Pendentes */}
            {vinculosPendentes.length > 0 && (
              <div>
                <h3 className="text-lg font-medium mb-3 text-yellow-700 flex items-center gap-2">
                  <ClockIcon className="h-5 w-5" />
                  Convites Pendentes ({vinculosPendentes.length})
                </h3>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {vinculosPendentes.map((vinculo) => (
                    <ConvitePendenteCard
                      key={vinculo.id}
                      vinculo={vinculo}
                      onCancelar={handleCancelarConvite}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Convites Recusados */}
            {vinculosRecusados.length > 0 && (
              <div>
                <h3 className="text-lg font-medium mb-3 text-red-700 flex items-center gap-2">
                  <XMarkIcon className="h-5 w-5" />
                  Convites Recusados ({vinculosRecusados.length})
                </h3>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {vinculosRecusados.map((vinculo) => (
                    <ConviteRecusadoCard
                      key={vinculo.id}
                      vinculo={vinculo}
                      onRemover={handleRemoverVinculo}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Modal de Convite */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-gray-500 bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-md w-full p-6 space-y-4">
              <h3 className="text-xl font-semibold flex items-center gap-2">
                <PaperAirplaneIcon className="h-6 w-6 text-primary" />
                Convidar Piloto
              </h3>
              
              <form onSubmit={handleEnviarConvite} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    E-mail do Piloto *
                  </label>
                  <input
                    type="email"
                    value={formData.piloto_email}
                    onChange={(e) => setFormData({ ...formData, piloto_email: e.target.value })}
                    placeholder="piloto@email.com"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    O piloto deve estar cadastrado e ativo na AVIBAQ
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Mensagem do Convite (opcional)
                  </label>
                  <textarea
                    value={formData.observacoes}
                    onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Descreva sua proposta de parceria..."
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
                    className="flex-1 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {submitting ? (
                      'Enviando...'
                    ) : (
                      <>
                        <PaperAirplaneIcon className="h-4 w-4" />
                        Enviar Convite
                      </>
                    )}
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

// Componente para Piloto Ativo
function PilotoCard({ 
  vinculo, 
  onRemover 
}: { 
  vinculo: Vinculo;
  onRemover: (vinculo: Vinculo) => void;
}) {
  return (
    <MagicCard className="p-4 border-green-200">
      <div className="space-y-3">
        <div className="flex items-start justify-between">
          <div>
            <h4 className="font-semibold text-lg">{vinculo.piloto.nome_completo}</h4>
            <p className="text-sm text-gray-600">{vinculo.piloto.email}</p>
            <p className="text-sm text-gray-600">{vinculo.piloto.telefone}</p>
          </div>
          <div className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
            Ativo
          </div>
        </div>

        {vinculo.observacoes && (
          <p className="text-sm text-gray-600">
            <span className="font-medium">Observações:</span> {vinculo.observacoes}
          </p>
        )}

        <div className="text-xs text-gray-500">
          Vinculado em: {new Date(vinculo.respondido_em || vinculo.convite_enviado_em).toLocaleDateString('pt-BR')}
        </div>

        <button
          onClick={() => onRemover(vinculo)}
          className="w-full bg-red-50 text-red-700 px-3 py-2 rounded-lg text-sm hover:bg-red-100 transition-colors"
        >
          Remover da Equipe
        </button>
      </div>
    </MagicCard>
  );
}

// Componente para Convite Pendente
function ConvitePendenteCard({ 
  vinculo, 
  onCancelar 
}: { 
  vinculo: Vinculo;
  onCancelar: (vinculo: Vinculo) => void;
}) {
  return (
    <MagicCard className="p-4 border-yellow-200">
      <div className="space-y-3">
        <div className="flex items-start justify-between">
          <div>
            <h4 className="font-semibold text-lg">{vinculo.piloto.nome_completo}</h4>
            <p className="text-sm text-gray-600">{vinculo.piloto.email}</p>
            <p className="text-sm text-gray-600">{vinculo.piloto.telefone}</p>
          </div>
          <div className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            Pendente
          </div>
        </div>

        {vinculo.observacoes && (
          <p className="text-sm text-gray-600">
            <span className="font-medium">Mensagem:</span> {vinculo.observacoes}
          </p>
        )}

        <div className="text-xs text-gray-500">
          Enviado em: {new Date(vinculo.convite_enviado_em).toLocaleDateString('pt-BR')}
        </div>

        <button
          onClick={() => onCancelar(vinculo)}
          className="w-full bg-orange-50 text-orange-700 px-3 py-2 rounded-lg text-sm hover:bg-orange-100 transition-colors"
        >
          Cancelar Convite
        </button>
      </div>
    </MagicCard>
  );
}

// Componente para Convite Recusado
function ConviteRecusadoCard({ 
  vinculo, 
  onRemover 
}: { 
  vinculo: Vinculo;
  onRemover: (vinculo: Vinculo) => void;
}) {
  return (
    <MagicCard className="p-4 border-red-200 opacity-80">
      <div className="space-y-3">
        <div className="flex items-start justify-between">
          <div>
            <h4 className="font-semibold text-lg">{vinculo.piloto.nome_completo}</h4>
            <p className="text-sm text-gray-600">{vinculo.piloto.email}</p>
          </div>
          <div className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
            Recusado
          </div>
        </div>

        <div className="text-xs text-gray-500">
          Recusado em: {vinculo.respondido_em ? new Date(vinculo.respondido_em).toLocaleDateString('pt-BR') : 'N/A'}
        </div>

        <button
          onClick={() => onRemover(vinculo)}
          className="w-full bg-red-50 text-red-700 px-3 py-2 rounded-lg text-sm hover:bg-red-100 transition-colors"
        >
          Remover Registro
        </button>
      </div>
    </MagicCard>
  );
}