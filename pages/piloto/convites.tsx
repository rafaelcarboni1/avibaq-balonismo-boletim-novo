import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { CheckIcon, XMarkIcon, ClockIcon, BuildingOfficeIcon, EyeIcon, HomeIcon } from '@heroicons/react/24/outline';
import { EnhancedDashboardLayout } from '../../src/components/magicui/enhanced-dashboard-layout';
import { MagicCard } from '../../src/components/magicui/magic-card';
import { NumberTicker } from '../../src/components/magicui/number-ticker';
import { BentoGrid, BentoGridItem } from '../../src/components/magicui/bento-grid';
import { supabase } from '../../src/integrations/supabase/client';
import { useUser } from '../../src/hooks/useUser';
import { useToast } from '../../src/hooks/use-toast';

interface Agencia {
  id: string;
  nome_completo: string;
  email: string;
  telefone: string;
  nome_empresa: string;
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
  agencia: Agencia;
}

export default function ConvitesRecebidos() {
  const router = useRouter();
  const { user, loading: userLoading } = useUser();
  const { toast } = useToast();
  
  const [vinculos, setVinculos] = useState<Vinculo[]>([]);
  const [loading, setLoading] = useState(true);

  // Verificar se usuário está autenticado e é piloto
  useEffect(() => {
    if (!userLoading) {
      if (!user) {
        router.push('/piloto/login');
        return;
      }
      // Só redireciona se o role estiver carregado E for diferente de piloto
      if (user.role && user.role !== 'piloto') {
        console.log('[Convites] Redirecionando - role:', user.role);
        router.push('/');
        return;
      }
    }
  }, [user, userLoading, router]);

  // Carregar convites do piloto
  useEffect(() => {
    if (user) {
      carregarConvites();
    }
  }, [user]);

  const carregarConvites = async () => {
    try {
      setLoading(true);
      
      // Buscar membro associado ao usuário (piloto) (primeiro por user_id, depois por email como fallback)
      let membro = null;
      let membroError = null;

      console.log('[Convites] Carregando convites para usuário:', { userId: user?.id, email: user?.email });

      // Tentar primeiro por user_id
      const { data: membroPorId, error: errorPorId } = await supabase
        .from('membros')
        .select('id, user_id')
        .eq('user_id', user?.id)
        .eq('tipo', 'piloto')
        .single();

      if (membroPorId && !errorPorId) {
        membro = membroPorId;
        console.log('[Convites] Membro encontrado por user_id:', membro.id);
      } else {
        console.log('[Convites] Membro não encontrado por user_id, tentando por email:', user?.email);
        
        // Fallback: buscar por email se user_id não funcionou
        const { data: membroPorEmail, error: errorPorEmail } = await supabase
          .from('membros')
          .select('id, user_id')
          .eq('email', user?.email)
          .eq('tipo', 'piloto')
          .single();

        if (membroPorEmail && !errorPorEmail) {
          membro = membroPorEmail;
          console.log('[Convites] Membro encontrado por email. User_id atual:', membroPorEmail.user_id);
          
          // Se encontrou por email mas user_id está null, tentar atualizar
          if (!membroPorEmail.user_id && user?.id) {
            console.log('[Convites] Tentando vincular user_id ao membro...');
            await supabase
              .from('membros')
              .update({ user_id: user.id })
              .eq('id', membroPorEmail.id);
            console.log('[Convites] Vinculação user_id tentada');
          }
        } else {
          membroError = errorPorEmail || errorPorId;
        }
      }

      if (membroError || !membro) {
        console.error('[Convites] Erro ao buscar membro:', { 
          errorPorId, 
          errorPorEmail: membroError, 
          userEmail: user?.email, 
          userId: user?.id 
        });
        
        toast({
          title: "Erro ao carregar dados",
          description: "Piloto não encontrado no sistema. Entre em contato com o administrador.",
          variant: "destructive"
        });
        return;
      }

      console.log('[Convites] Membro encontrado, carregando convites:', membro.id);

      // Buscar convites recebidos com dados das agências
      const { data, error } = await supabase
        .from('vinculos_agencia_piloto')
        .select(`
          *,
          agencia:membros!vinculos_agencia_piloto_agencia_id_fkey (
            id,
            nome_completo,
            email,
            telefone,
            nome_empresa,
            status
          )
        `)
        .eq('piloto_id', membro.id)
        .order('convite_enviado_em', { ascending: false });

      if (error) {
        console.error('Erro ao carregar convites:', error);
        toast({
          title: "Erro",
          description: "Erro ao carregar convites",
          variant: "destructive"
        });
        return;
      }

      setVinculos(data || []);
    } catch (error) {
      console.error('Erro:', error);
      toast({
        title: "Erro",
        description: "Erro inesperado ao carregar convites",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResponderConvite = async (vinculo: Vinculo, aceitar: boolean) => {
    const acao = aceitar ? 'aceitar' : 'recusar';
    
    if (!confirm(`Tem certeza que deseja ${acao} o convite da ${vinculo.agencia.nome_empresa}?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('vinculos_agencia_piloto')
        .update({ 
          status: aceitar ? 'aceito' : 'recusado',
          respondido_em: new Date().toISOString()
        })
        .eq('id', vinculo.id);

      if (error) {
        console.error('Erro ao responder convite:', error);
        toast({
          title: "Erro",
          description: "Erro ao responder convite",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Sucesso",
        description: `Convite ${aceitar ? 'aceito' : 'recusado'} com sucesso`,
        variant: "default"
      });

      await carregarConvites();
    } catch (error) {
      console.error('Erro:', error);
      toast({
        title: "Erro",
        description: "Erro inesperado",
        variant: "destructive"
      });
    }
  };

  const vinculosPendentes = vinculos.filter(v => v.status === 'pendente');
  const vinculosAceitos = vinculos.filter(v => v.status === 'aceito');
  const vinculosRecusados = vinculos.filter(v => v.status === 'recusado');

  if (userLoading || loading) {
    return (
      <EnhancedDashboardLayout title="Convites Recebidos" loading={true}>
        <div>Carregando...</div>
      </EnhancedDashboardLayout>
    );
  }

  return (
    <EnhancedDashboardLayout title="Convites de Agências" breadcrumbs={[
      { label: 'Dashboard', href: '/piloto/dashboard', icon: HomeIcon },
      { label: 'Convites de Agências' }
    ]}>
      <div className="space-y-6">
        {/* Estatísticas */}
        <BentoGrid className="grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <BentoGridItem className="bg-white border border-blue-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-600">Total de Convites</p>
                  <NumberTicker value={vinculos.length} className="text-2xl font-semibold text-gray-800" />
                </div>
                <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center">
                  <EyeIcon className="h-6 w-6 text-blue-500" />
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

          <BentoGridItem className="bg-white border border-green-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-600">Aceitos</p>
                  <NumberTicker value={vinculosAceitos.length} className="text-2xl font-semibold text-gray-800" />
                </div>
                <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center">
                  <CheckIcon className="h-6 w-6 text-green-500" />
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

        {/* Lista de Convites */}
        {vinculos.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center">
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center">
                <BuildingOfficeIcon className="h-10 w-10 text-blue-400" />
              </div>
              <h3 className="text-xl font-medium text-gray-800">Nenhum convite recebido</h3>
              <p className="text-gray-600 max-w-md">
                Quando agências enviarem convites para você, eles aparecerão aqui.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
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
                      onResponder={handleResponderConvite}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Parcerias Ativas */}
            {vinculosAceitos.length > 0 && (
              <div>
                <h3 className="text-lg font-medium mb-3 text-green-700 flex items-center gap-2">
                  <CheckIcon className="h-5 w-5" />
                  Parcerias Ativas ({vinculosAceitos.length})
                </h3>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {vinculosAceitos.map((vinculo) => (
                    <ParceriaAtivaCard
                      key={vinculo.id}
                      vinculo={vinculo}
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
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </EnhancedDashboardLayout>
  );
}

// Componente para Convite Pendente
function ConvitePendenteCard({ 
  vinculo, 
  onResponder 
}: { 
  vinculo: Vinculo;
  onResponder: (vinculo: Vinculo, aceitar: boolean) => void;
}) {
  return (
    <MagicCard className="p-4 border-yellow-200 ring-2 ring-yellow-100">
      <div className="space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <h4 className="font-semibold text-lg">{vinculo.agencia.nome_empresa}</h4>
            <p className="text-sm text-gray-600">{vinculo.agencia.nome_completo}</p>
            <p className="text-sm text-gray-600">{vinculo.agencia.email}</p>
            <p className="text-sm text-gray-600">{vinculo.agencia.telefone}</p>
          </div>
          <div className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            Aguardando Resposta
          </div>
        </div>

        {vinculo.observacoes && (
          <div className="bg-blue-50 p-3 rounded-lg">
            <p className="text-sm text-blue-800">
              <span className="font-medium">Mensagem da agência:</span><br />
              "{vinculo.observacoes}"
            </p>
          </div>
        )}

        <div className="text-xs text-gray-500">
          Recebido em: {new Date(vinculo.convite_enviado_em).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}
        </div>

        <div className="flex gap-2 pt-2">
          <button
            onClick={() => onResponder(vinculo, true)}
            className="flex-1 bg-green-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
          >
            <CheckIcon className="h-4 w-4" />
            Aceitar
          </button>
          
          <button
            onClick={() => onResponder(vinculo, false)}
            className="flex-1 bg-red-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
          >
            <XMarkIcon className="h-4 w-4" />
            Recusar
          </button>
        </div>
      </div>
    </MagicCard>
  );
}

// Componente para Parceria Ativa
function ParceriaAtivaCard({ 
  vinculo 
}: { 
  vinculo: Vinculo;
}) {
  return (
    <MagicCard className="p-4 border-green-200">
      <div className="space-y-3">
        <div className="flex items-start justify-between">
          <div>
            <h4 className="font-semibold text-lg">{vinculo.agencia.nome_empresa}</h4>
            <p className="text-sm text-gray-600">{vinculo.agencia.nome_completo}</p>
            <p className="text-sm text-gray-600">{vinculo.agencia.email}</p>
            <p className="text-sm text-gray-600">{vinculo.agencia.telefone}</p>
          </div>
          <div className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
            Parceiro Ativo
          </div>
        </div>

        {vinculo.observacoes && (
          <p className="text-sm text-gray-600">
            <span className="font-medium">Observações:</span> {vinculo.observacoes}
          </p>
        )}

        <div className="text-xs text-gray-500">
          Parceria iniciada em: {vinculo.respondido_em ? 
            new Date(vinculo.respondido_em).toLocaleDateString('pt-BR') : 
            new Date(vinculo.convite_enviado_em).toLocaleDateString('pt-BR')
          }
        </div>

        <div className="bg-green-50 p-3 rounded-lg">
          <p className="text-sm text-green-800">
            ✅ Você pode ser escalado para voos desta agência
          </p>
        </div>
      </div>
    </MagicCard>
  );
}

// Componente para Convite Recusado
function ConviteRecusadoCard({ 
  vinculo 
}: { 
  vinculo: Vinculo;
}) {
  return (
    <MagicCard className="p-4 border-red-200 opacity-80">
      <div className="space-y-3">
        <div className="flex items-start justify-between">
          <div>
            <h4 className="font-semibold text-lg">{vinculo.agencia.nome_empresa}</h4>
            <p className="text-sm text-gray-600">{vinculo.agencia.nome_completo}</p>
          </div>
          <div className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
            Recusado
          </div>
        </div>

        <div className="text-xs text-gray-500">
          Recusado em: {vinculo.respondido_em ? 
            new Date(vinculo.respondido_em).toLocaleDateString('pt-BR') : 'N/A'
          }
        </div>
      </div>
    </MagicCard>
  );
}