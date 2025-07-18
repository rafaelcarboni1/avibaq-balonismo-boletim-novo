import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { CloudArrowUpIcon, DocumentIcon, PhotoIcon, MapIcon, ClockIcon, UsersIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { EnhancedDashboardLayout } from '../../../src/components/magicui/enhanced-dashboard-layout';
import { MagicCard } from '../../../src/components/magicui/magic-card';
import { supabase } from '../../../src/integrations/supabase/client';
import { useUser } from '../../../src/hooks/useUser';
import { useToast } from '../../../src/hooks/use-toast';
import { formatDateSafe } from '../../../src/utils/dateUtils';

interface Voo {
  id: string;
  data_voo: string;
  periodo: 'manha' | 'tarde';
  horario_previsto: string;
  local_decolagem_previsto: string;
  status: string;
  adultos_previstos: number;
  criancas_previstas: number;
  adultos_transportados: number | null;
  criancas_transportadas: number | null;
  local_pouso: string | null;
  duracao_minutos: number | null;
  altitude_maxima: number | null;
  observacoes_pos_voo: string | null;
}

interface VooComBaloes extends Voo {
  baloes: Array<{
    id: string;
    prefixo: string;
    nome_batismo: string | null;
    volume_m3: number;
    adultos_previstos: number;
    criancas_previstas: number;
    adultos_transportados: number | null;
    criancas_transportadas: number | null;
  }>;
}

interface Anexo {
  id: string;
  tipo: 'track_log' | 'foto_voo' | 'regulamento_assinado';
  nome_arquivo: string;
  url_storage: string;
  tamanho_bytes: number;
  mime_type: string;
  uploaded_em: string;
}

interface PosVooFormData {
  adultos_transportados: number;
  criancas_transportadas: number;
  local_pouso: string;
  duracao_minutos: number;
  altitude_maxima: number;
  observacoes_pos_voo: string;
}

interface BalaoPassageiros {
  balao_id: string;
  adultos_transportados: number;
  criancas_transportadas: number;
}

export default function PosVoo() {
  const router = useRouter();
  const { id } = router.query;
  const { user, loading: userLoading } = useUser();
  const { toast } = useToast();
  
  const [voo, setVoo] = useState<VooComBaloes | null>(null);
  const [anexos, setAnexos] = useState<Anexo[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  const [formData, setFormData] = useState<PosVooFormData>({
    adultos_transportados: 0,
    criancas_transportadas: 0,
    local_pouso: '',
    duracao_minutos: 0,
    altitude_maxima: 0,
    observacoes_pos_voo: ''
  });

  const [baloesPassageiros, setBaloesPassageiros] = useState<BalaoPassageiros[]>([]);

  // Verificar se usuário está autenticado e é piloto
  useEffect(() => {
    if (!userLoading && (!user || user.role !== 'piloto')) {
      router.push('/login');
      return;
    }
  }, [user, userLoading]); // Removido router das dependências

  // Carregar dados do voo e anexos
  useEffect(() => {
    if (id && user) {
      carregarVoo();
      carregarAnexos();
    }
  }, [id, user]);

  const carregarVoo = async () => {
    try {
      if (!id) return;

      // Buscar dados do voo
      const { data: vooData, error: vooError } = await supabase
        .from('voos')
        .select('*')
        .eq('id', id)
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

      // Verificar se o piloto tem acesso a este voo
      const { data: membro, error: membroError } = await supabase
        .from('membros')
        .select('id')
        .eq('user_id', user?.id)
        .eq('tipo', 'piloto')
        .single();

      if (membroError || !membro || vooData.piloto_id !== membro.id) {
        toast({
          title: "Acesso negado",
          description: "Você não tem permissão para acessar este voo",
          variant: "destructive"
        });
        router.push('/piloto/dashboard');
        return;
      }

      // Verificar se o voo está no status correto
      if (!['checklist_concluido', 'finalizado'].includes(vooData.status)) {
        toast({
          title: "Voo não disponível",
          description: "O checklist deve ser concluído antes de preencher os dados pós-voo",
          variant: "destructive"
        });
        router.push('/piloto/dashboard');
        return;
      }

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
        criancas_previstas: vb.criancas_previstas,
        adultos_transportados: vb.adultos_transportados,
        criancas_transportadas: vb.criancas_transportadas
      })) || [];

      setVoo({
        ...vooData,
        baloes
      });

      // Inicializar form com dados existentes
      if (vooData.status === 'finalizado') {
        setFormData({
          adultos_transportados: vooData.adultos_transportados || 0,
          criancas_transportadas: vooData.criancas_transportadas || 0,
          local_pouso: vooData.local_pouso || '',
          duracao_minutos: vooData.duracao_minutos || 0,
          altitude_maxima: vooData.altitude_maxima || 0,
          observacoes_pos_voo: vooData.observacoes_pos_voo || ''
        });
      } else {
        // Inicializar com valores previstos
        setFormData(prev => ({
          ...prev,
          adultos_transportados: vooData.adultos_previstos || 0,
          criancas_transportadas: vooData.criancas_previstas || 0
        }));
      }

      // Inicializar passageiros por balão
      setBaloesPassageiros(baloes.map(b => ({
        balao_id: b.id,
        adultos_transportados: b.adultos_transportados || b.adultos_previstos,
        criancas_transportadas: b.criancas_transportadas || b.criancas_previstas
      })));

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

  const carregarAnexos = async () => {
    try {
      if (!id) return;

      const { data, error } = await supabase
        .from('voos_anexos')
        .select('*')
        .eq('voo_id', id)
        .order('uploaded_em', { ascending: false });

      if (error) {
        console.error('Erro ao carregar anexos:', error);
        return;
      }

      setAnexos(data || []);
    } catch (error) {
      console.error('Erro:', error);
    }
  };

  const handleFileUpload = async (file: File, tipo: 'track_log' | 'foto_voo' | 'regulamento_assinado') => {
    try {
      setUploading(true);

      // Validar tipo de arquivo
      const allowedTypes: Record<string, string[]> = {
        track_log: ['application/gpx+xml', 'text/xml', 'application/xml', 'text/plain', 'image/png', 'image/jpeg', 'image/jpg'],
        foto_voo: ['image/jpeg', 'image/png', 'image/webp', 'image/heic'],
        regulamento_assinado: ['application/pdf', 'image/jpeg', 'image/png', 'image/heic']
      };

      if (!allowedTypes[tipo].includes(file.type)) {
        toast({
          title: "Tipo de arquivo inválido",
          description: `Para ${tipo}, use: ${allowedTypes[tipo].join(', ')}`,
          variant: "destructive"
        });
        return;
      }

      // Validar tamanho (10MB max)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "Arquivo muito grande",
          description: "O arquivo deve ter no máximo 10MB",
          variant: "destructive"
        });
        return;
      }

      // Upload para Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `voos/${id}/${tipo}/${fileName}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('voos-anexos')
        .upload(filePath, file);

      if (uploadError) {
        console.error('Erro no upload:', uploadError);
        toast({
          title: "Erro no upload",
          description: "Erro ao fazer upload do arquivo",
          variant: "destructive"
        });
        return;
      }

      // Obter URL pública
      const { data: { publicUrl } } = supabase.storage
        .from('voos-anexos')
        .getPublicUrl(filePath);

      // Salvar no banco
      const { data: anexoData, error: anexoError } = await supabase
        .from('voos_anexos')
        .insert([{
          voo_id: id,
          tipo,
          nome_arquivo: file.name,
          url_storage: publicUrl,
          tamanho_bytes: file.size,
          mime_type: file.type,
          uploaded_por: user?.id
        }])
        .select()
        .single();

      if (anexoError) {
        console.error('Erro ao salvar anexo:', anexoError);
        toast({
          title: "Erro",
          description: "Erro ao salvar informações do arquivo",
          variant: "destructive"
        });
        return;
      }

      setAnexos(prev => [anexoData, ...prev]);
      
      toast({
        title: "Upload concluído",
        description: `${file.name} foi enviado com sucesso`,
        variant: "default"
      });

    } catch (error) {
      console.error('Erro:', error);
      toast({
        title: "Erro",
        description: "Erro inesperado no upload",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteAnexo = async (anexoId: string, filePath: string) => {
    try {
      // Remover do storage
      const { error: storageError } = await supabase.storage
        .from('voos-anexos')
        .remove([filePath]);

      if (storageError) {
        console.error('Erro ao deletar do storage:', storageError);
      }

      // Remover do banco
      const { error: dbError } = await supabase
        .from('voos_anexos')
        .delete()
        .eq('id', anexoId);

      if (dbError) {
        console.error('Erro ao deletar do banco:', dbError);
        toast({
          title: "Erro",
          description: "Erro ao deletar arquivo",
          variant: "destructive"
        });
        return;
      }

      setAnexos(prev => prev.filter(a => a.id !== anexoId));
      
      toast({
        title: "Arquivo deletado",
        description: "Arquivo removido com sucesso",
        variant: "default"
      });

    } catch (error) {
      console.error('Erro:', error);
    }
  };

  const handleUpdateBalaoPassageiros = (balaoId: string, field: 'adultos_transportados' | 'criancas_transportadas', value: number) => {
    setBaloesPassageiros(prev => 
      prev.map(bp => 
        bp.balao_id === balaoId 
          ? { ...bp, [field]: Math.max(0, value) }
          : bp
      )
    );

    // Atualizar totais
    const novosBaloesPassageiros = baloesPassageiros.map(bp => 
      bp.balao_id === balaoId 
        ? { ...bp, [field]: Math.max(0, value) }
        : bp
    );

    const totalAdultos = novosBaloesPassageiros.reduce((sum, bp) => sum + bp.adultos_transportados, 0);
    const totalCriancas = novosBaloesPassageiros.reduce((sum, bp) => sum + bp.criancas_transportadas, 0);

    setFormData(prev => ({
      ...prev,
      adultos_transportados: totalAdultos,
      criancas_transportadas: totalCriancas
    }));
  };

  const handleSubmit = async () => {
    try {
      setSubmitting(true);

      if (!formData.local_pouso.trim()) {
        toast({
          title: "Campo obrigatório",
          description: "Local de pouso é obrigatório",
          variant: "destructive"
        });
        return;
      }

      // Atualizar dados do voo
      const { error: vooError } = await supabase
        .from('voos')
        .update({
          adultos_transportados: formData.adultos_transportados,
          criancas_transportadas: formData.criancas_transportadas,
          local_pouso: formData.local_pouso.trim(),
          duracao_minutos: formData.duracao_minutos > 0 ? formData.duracao_minutos : null,
          altitude_maxima: formData.altitude_maxima > 0 ? formData.altitude_maxima : null,
          observacoes_pos_voo: formData.observacoes_pos_voo.trim() || null,
          status: 'finalizado'
        })
        .eq('id', id);

      if (vooError) {
        console.error('Erro ao atualizar voo:', vooError);
        toast({
          title: "Erro",
          description: "Erro ao salvar dados do voo",
          variant: "destructive"
        });
        return;
      }

      // Atualizar passageiros por balão
      for (const bp of baloesPassageiros) {
        const { error: balaoError } = await supabase
          .from('voos_baloes')
          .update({
            adultos_transportados: bp.adultos_transportados,
            criancas_transportadas: bp.criancas_transportadas
          })
          .eq('voo_id', id)
          .eq('balao_id', bp.balao_id);

        if (balaoError) {
          console.error('Erro ao atualizar balão:', balaoError);
        }
      }

      toast({
        title: "Sucesso",
        description: "Dados pós-voo salvos com sucesso! Voo finalizado.",
        variant: "default"
      });

      // Redirecionar para dashboard
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

  const getTipoAnexoLabel = (tipo: string) => {
    switch (tipo) {
      case 'track_log': return 'Track Log (GPS)';
      case 'foto_voo': return 'Foto do Voo';
      case 'regulamento_assinado': return 'Regulamento Assinado';
      default: return tipo;
    }
  };

  const getTipoAnexoIcon = (tipo: string) => {
    switch (tipo) {
      case 'track_log': return <MapIcon className="h-5 w-5" />;
      case 'foto_voo': return <PhotoIcon className="h-5 w-5" />;
      case 'regulamento_assinado': return <DocumentIcon className="h-5 w-5" />;
      default: return <DocumentIcon className="h-5 w-5" />;
    }
  };

  if (userLoading || loading) {
    return (
      <EnhancedDashboardLayout title="Dados Pós-Voo" loading={true}>
        <div>Carregando...</div>
      </EnhancedDashboardLayout>
    );
  }

  if (!voo) {
    return (
      <EnhancedDashboardLayout title="Dados Pós-Voo">
        <div>Voo não encontrado</div>
      </EnhancedDashboardLayout>
    );
  }

  const isReadOnly = voo.status === 'finalizado';

  return (
    <EnhancedDashboardLayout title="Dados Pós-Voo">
      <div className="space-y-6">
        {/* Header com informações do voo */}
        <MagicCard className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-semibold">Dados Pós-Voo</h2>
              <p className="text-gray-600">
                {formatDateSafe(voo.data_voo)} - {voo.periodo === 'manha' ? 'Manhã' : 'Tarde'}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">Status:</p>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                voo.status === 'finalizado' 
                  ? 'bg-green-100 text-green-800'
                  : 'bg-blue-100 text-blue-800'
              }`}>
                {voo.status === 'finalizado' ? 'Finalizado' : 'Checklist Concluído'}
              </span>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Local Decolagem:</span>
              <p className="font-medium">{voo.local_decolagem_previsto}</p>
            </div>
            <div>
              <span className="text-gray-600">Horário Previsto:</span>
              <p className="font-medium">{voo.horario_previsto}</p>
            </div>
            <div>
              <span className="text-gray-600">Passageiros Previstos:</span>
              <p className="font-medium">{voo.adultos_previstos + voo.criancas_previstas} total</p>
            </div>
          </div>
        </MagicCard>

        {/* Formulário de dados pós-voo */}
        <MagicCard className="p-6">
          <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
            <ClockIcon className="h-5 w-5 text-primary" />
            Dados de Realização do Voo
          </h3>
          
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Local de Pouso *
              </label>
              <input
                type="text"
                value={formData.local_pouso}
                onChange={(e) => setFormData({ ...formData, local_pouso: e.target.value })}
                placeholder="Ex: Campo de pouso central, Fazenda..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                required
                disabled={isReadOnly}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Duração do Voo (minutos)
              </label>
              <input
                type="number"
                value={formData.duracao_minutos}
                onChange={(e) => setFormData({ ...formData, duracao_minutos: parseInt(e.target.value) || 0 })}
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                disabled={isReadOnly}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Altitude Máxima (metros)
              </label>
              <input
                type="number"
                value={formData.altitude_maxima}
                onChange={(e) => setFormData({ ...formData, altitude_maxima: parseInt(e.target.value) || 0 })}
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                disabled={isReadOnly}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Total Passageiros Transportados
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={formData.adultos_transportados}
                  onChange={(e) => setFormData({ ...formData, adultos_transportados: parseInt(e.target.value) || 0 })}
                  placeholder="Adultos"
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  disabled={true} // Calculado automaticamente dos balões
                />
                <input
                  type="number"
                  value={formData.criancas_transportadas}
                  onChange={(e) => setFormData({ ...formData, criancas_transportadas: parseInt(e.target.value) || 0 })}
                  placeholder="Crianças"
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  disabled={true} // Calculado automaticamente dos balões
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Totais calculados automaticamente com base na distribuição por balão
              </p>
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium mb-1">
              Observações Pós-Voo
            </label>
            <textarea
              value={formData.observacoes_pos_voo}
              onChange={(e) => setFormData({ ...formData, observacoes_pos_voo: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Informações sobre o voo realizado, condições encontradas, ocorrências..."
              disabled={isReadOnly}
            />
          </div>
        </MagicCard>

        {/* Distribuição de passageiros por balão */}
        <MagicCard className="p-6">
          <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
            <UsersIcon className="h-5 w-5 text-primary" />
            Passageiros Transportados por Balão
          </h3>
          
          <div className="space-y-4">
            {voo.baloes.map((balao) => {
              const balaoPassageiro = baloesPassageiros.find(bp => bp.balao_id === balao.id);
              
              return (
                <div key={balao.id} className="border border-gray-200 rounded-lg p-4">
                  <h4 className="font-semibold mb-3">
                    {balao.prefixo}
                    {balao.nome_batismo && ` (${balao.nome_batismo})`}
                    <span className="text-sm text-gray-600 font-normal ml-2">
                      Previstos: {balao.adultos_previstos} adultos + {balao.criancas_previstas} crianças
                    </span>
                  </h4>
                  
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Adultos Transportados
                      </label>
                      <input
                        type="number"
                        value={balaoPassageiro?.adultos_transportados || 0}
                        onChange={(e) => handleUpdateBalaoPassageiros(balao.id, 'adultos_transportados', parseInt(e.target.value) || 0)}
                        min="0"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                        disabled={isReadOnly}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Crianças Transportadas
                      </label>
                      <input
                        type="number"
                        value={balaoPassageiro?.criancas_transportadas || 0}
                        onChange={(e) => handleUpdateBalaoPassageiros(balao.id, 'criancas_transportadas', parseInt(e.target.value) || 0)}
                        min="0"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                        disabled={isReadOnly}
                      />
                    </div>
                  </div>
                  
                  <div className="mt-2 text-sm text-gray-600">
                    Total neste balão: {(balaoPassageiro?.adultos_transportados || 0) + (balaoPassageiro?.criancas_transportadas || 0)} passageiros
                  </div>
                </div>
              );
            })}
          </div>

          {/* Resumo Total */}
          <div className="bg-green-50 p-4 rounded-lg mt-4">
            <h4 className="font-semibold text-green-900">Resumo Final</h4>
            <div className="grid md:grid-cols-3 gap-4 mt-2 text-sm">
              <div>
                <span className="text-green-700">Balões:</span>
                <span className="font-medium ml-2">{voo.baloes.length}</span>
              </div>
              <div>
                <span className="text-green-700">Adultos:</span>
                <span className="font-medium ml-2">{formData.adultos_transportados}</span>
              </div>
              <div>
                <span className="text-green-700">Crianças:</span>
                <span className="font-medium ml-2">{formData.criancas_transportadas}</span>
              </div>
            </div>
            <div className="mt-2 pt-2 border-t border-green-200">
              <span className="text-green-700">Total transportados:</span>
              <span className="font-bold ml-2 text-lg">{formData.adultos_transportados + formData.criancas_transportadas}</span>
            </div>
          </div>
        </MagicCard>

        {/* Anexos */}
        <MagicCard className="p-6">
          <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
            <CloudArrowUpIcon className="h-5 w-5 text-primary" />
            Anexos do Voo
          </h3>
          
          {!isReadOnly && (
            <div className="grid md:grid-cols-3 gap-4 mb-6">
              {/* Upload Track Log */}
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-primary transition-colors">
                <MapIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm font-medium mb-2">Track Log (GPS)</p>
                <input
                  type="file"
                  accept=".gpx,.xml,.txt"
                  onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'track_log')}
                  className="hidden"
                  id="track-log-upload"
                  disabled={uploading}
                />
                <label
                  htmlFor="track-log-upload"
                  className="cursor-pointer bg-primary text-white px-3 py-1 rounded text-xs hover:bg-primary/90 transition-colors"
                >
                  Escolher Arquivo
                </label>
                <p className="text-xs text-gray-500 mt-1">GPX, XML, TXT</p>
              </div>

              {/* Upload Foto */}
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-primary transition-colors">
                <PhotoIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm font-medium mb-2">Foto do Voo</p>
                <input
                  type="file"
                  accept=".jpg,.jpeg,.png,.webp"
                  onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'foto_voo')}
                  className="hidden"
                  id="foto-upload"
                  disabled={uploading}
                />
                <label
                  htmlFor="foto-upload"
                  className="cursor-pointer bg-primary text-white px-3 py-1 rounded text-xs hover:bg-primary/90 transition-colors"
                >
                  Escolher Arquivo
                </label>
                <p className="text-xs text-gray-500 mt-1">JPG, PNG, WEBP</p>
              </div>

              {/* Upload Regulamento */}
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-primary transition-colors">
                <DocumentIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm font-medium mb-2">Regulamento Assinado</p>
                <input
                  type="file"
                  accept=".pdf"
                  onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'regulamento_assinado')}
                  className="hidden"
                  id="regulamento-upload"
                  disabled={uploading}
                />
                <label
                  htmlFor="regulamento-upload"
                  className="cursor-pointer bg-primary text-white px-3 py-1 rounded text-xs hover:bg-primary/90 transition-colors"
                >
                  Escolher Arquivo
                </label>
                <p className="text-xs text-gray-500 mt-1">PDF</p>
              </div>
            </div>
          )}

          {uploading && (
            <div className="flex items-center gap-2 text-blue-600 mb-4">
              <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
              Fazendo upload...
            </div>
          )}

          {/* Lista de anexos */}
          {anexos.length > 0 ? (
            <div className="space-y-3">
              {anexos.map((anexo) => (
                <div key={anexo.id} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                  <div className="flex items-center gap-3">
                    {getTipoAnexoIcon(anexo.tipo)}
                    <div>
                      <p className="font-medium">{anexo.nome_arquivo}</p>
                      <p className="text-sm text-gray-600">
                        {getTipoAnexoLabel(anexo.tipo)} • {(anexo.tamanho_bytes / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <a
                      href={anexo.url_storage}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:text-primary/80 text-sm underline"
                    >
                      Visualizar
                    </a>
                    {!isReadOnly && (
                      <button
                        onClick={() => handleDeleteAnexo(anexo.id, anexo.url_storage)}
                        className="text-red-600 hover:text-red-800 p-1"
                      >
                        <XMarkIcon className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <CloudArrowUpIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Nenhum anexo enviado ainda</p>
            </div>
          )}
        </MagicCard>

        {/* Botões de ação */}
        {!isReadOnly && (
          <div className="flex justify-between">
            <button
              onClick={() => router.push('/piloto/dashboard')}
              className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Salvar como Rascunho
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting || !formData.local_pouso.trim()}
              className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {submitting ? 'Finalizando...' : 'Finalizar Voo'}
              <CheckIcon className="h-4 w-4" />
            </button>
          </div>
        )}

        {isReadOnly && (
          <div className="text-center">
            <button
              onClick={() => router.push('/piloto/dashboard')}
              className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary/90 transition-colors"
            >
              Voltar ao Dashboard
            </button>
          </div>
        )}
      </div>
    </EnhancedDashboardLayout>
  );
}