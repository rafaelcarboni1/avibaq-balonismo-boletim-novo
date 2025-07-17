import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { 
  CalendarIcon, 
  ClockIcon, 
  MapPinIcon, 
  UserIcon,
  BuildingOfficeIcon,
  CheckCircleIcon,
  PlayIcon,
  ArrowRightIcon,
  PencilIcon,
  XMarkIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { supabase } from '../integrations/supabase/client';
import { useToast } from '../hooks/use-toast';

interface VooEmAndamentoProps {
  voo: {
    id: string;
    data_voo: string;
    periodo: 'manha' | 'tarde';
    horario_previsto?: string;
    local_decolagem_previsto?: string;
    status: 'rascunho' | 'planejado' | 'checklist_bloco1' | 'checklist_bloco2' | 'checklist_concluido';
    adultos_previstos?: number;
    criancas_previstas?: number;
    observacoes_planejamento?: string;
    piloto?: { nome: string };
    agencia?: { nome: string };
    created_at: string;
    updated_at: string;
  };
  showPilotInfo?: boolean; // Para dashboards de agência/admin mostrarem info do piloto
  compact?: boolean; // Versão compacta para listagem
}

const MOTIVOS_CANCELAMENTO = [
  { value: 'vento', label: 'Vento forte' },
  { value: 'chuva', label: 'Chuva' },
  { value: 'teto_baixo', label: 'Teto baixo' },
  { value: 'problema_tecnico', label: 'Problema técnico' },
  { value: 'passageiros_ausentes', label: 'Passageiros ausentes' },
  { value: 'outro', label: 'Outro' }
];

export default function VooEmAndamento({ voo, showPilotInfo = false, compact = false }: VooEmAndamentoProps) {
  const router = useRouter();
  const { toast } = useToast();
  
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelando, setCancelando] = useState(false);
  const [motivoCancelamento, setMotivoCancelamento] = useState('');
  const [observacoesCancelamento, setObservacoesCancelamento] = useState('');

  // Mapeamento de status para UI
  const statusConfig = {
    'rascunho': {
      label: 'Rascunho',
      color: 'bg-gray-100 text-gray-800 border-gray-300',
      progress: 10,
      primaryAction: { label: 'Iniciar Checklist', href: `/piloto/checklist/${voo.id}`, icon: PlayIcon, color: 'bg-blue-600 hover:bg-blue-700' },
      secondaryActions: [
        { label: 'Editar', href: `/piloto/planejamento?edit=${voo.id}`, icon: PencilIcon },
        { label: 'Cancelar', action: 'cancel', icon: XMarkIcon, color: 'text-red-600' }
      ]
    },
    'planejado': {
      label: 'Planejado',
      color: 'bg-blue-100 text-blue-800 border-blue-300',
      progress: 25,
      primaryAction: { label: 'Iniciar Checklist', href: `/piloto/checklist/${voo.id}`, icon: PlayIcon, color: 'bg-blue-600 hover:bg-blue-700' },
      secondaryActions: [
        { label: 'Editar', href: `/piloto/planejamento?edit=${voo.id}`, icon: PencilIcon },
        { label: 'Cancelar', action: 'cancel', icon: XMarkIcon, color: 'text-red-600' }
      ]
    },
    'checklist_bloco1': {
      label: 'Checklist 1/3',
      color: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      progress: 40,
      primaryAction: { label: 'Continuar Checklist', href: `/piloto/checklist/${voo.id}`, icon: ArrowRightIcon, color: 'bg-yellow-600 hover:bg-yellow-700' },
      secondaryActions: [
        { label: 'Cancelar', action: 'cancel', icon: XMarkIcon, color: 'text-red-600' }
      ]
    },
    'checklist_bloco2': {
      label: 'Checklist 2/3',
      color: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      progress: 65,
      primaryAction: { label: 'Continuar Checklist', href: `/piloto/checklist/${voo.id}`, icon: ArrowRightIcon, color: 'bg-yellow-600 hover:bg-yellow-700' },
      secondaryActions: [
        { label: 'Cancelar', action: 'cancel', icon: XMarkIcon, color: 'text-red-600' }
      ]
    },
    'checklist_concluido': {
      label: 'Checklist OK',
      color: 'bg-green-100 text-green-800 border-green-300',
      progress: 90,
      primaryAction: { label: 'Finalizar Voo', href: `/piloto/pos-voo/${voo.id}`, icon: CheckCircleIcon, color: 'bg-green-600 hover:bg-green-700' },
      secondaryActions: [
        { label: 'Ver Checklist', href: `/piloto/checklist/${voo.id}`, icon: CheckCircleIcon },
        { label: 'Cancelar', action: 'cancel', icon: XMarkIcon, color: 'text-red-600' }
      ]
    }
  };

  const config = statusConfig[voo.status];
  const isVooPassado = new Date(voo.data_voo) < new Date();
  const totalPassageiros = (voo.adultos_previstos || 0) + (voo.criancas_previstas || 0);

  const handleAction = (action: string) => {
    if (action === 'cancel') {
      setShowCancelModal(true);
    }
  };

  const handleCancelVoo = async () => {
    try {
      setCancelando(true);

      if (!motivoCancelamento.trim()) {
        toast({
          title: "Erro",
          description: "Motivo do cancelamento é obrigatório",
          variant: "destructive"
        });
        return;
      }

      // Atualizar voo para cancelado
      const { error } = await supabase
        .from('voos')
        .update({
          status: 'cancelado',
          motivo_cancelamento: motivoCancelamento,
          observacoes_cancelamento: observacoesCancelamento.trim() || null,
          cancelado_em: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', voo.id);

      if (error) {
        console.error('Erro ao cancelar voo:', error);
        toast({
          title: "Erro",
          description: "Erro ao cancelar voo. Tente novamente.",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Voo cancelado",
        description: "O voo foi cancelado com sucesso.",
        variant: "default"
      });

      // Fechar modal e resetar form
      setShowCancelModal(false);
      setMotivoCancelamento('');
      setObservacoesCancelamento('');

      // Recarregar a página ou atualizar o componente pai
      router.reload();

    } catch (error) {
      console.error('Erro:', error);
      toast({
        title: "Erro",
        description: "Erro inesperado ao cancelar voo",
        variant: "destructive"
      });
    } finally {
      setCancelando(false);
    }
  };

  const handleCloseCancelModal = () => {
    setShowCancelModal(false);
    setMotivoCancelamento('');
    setObservacoesCancelamento('');
  };

  if (compact) {
    return (
      <div className={`border rounded-lg p-4 hover:shadow-md transition-shadow ${
        isVooPassado ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-white'
      }`}>
        <div className="flex items-center justify-between">
          {/* Dados básicos */}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <CalendarIcon className="h-4 w-4 text-gray-500" />
              <span className="font-medium text-sm">
                {new Date(voo.data_voo).toLocaleDateString('pt-BR')}
              </span>
              <span className="text-sm text-gray-600">
                {voo.periodo === 'manha' ? 'Manhã' : 'Tarde'}
              </span>
              {voo.horario_previsto && (
                <>
                  <ClockIcon className="h-4 w-4 text-gray-500 ml-2" />
                  <span className="text-sm text-gray-600">{voo.horario_previsto}</span>
                </>
              )}
            </div>
            
            {voo.local_decolagem_previsto && (
              <div className="flex items-center gap-1 mb-1">
                <MapPinIcon className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-600 truncate">{voo.local_decolagem_previsto}</span>
              </div>
            )}

            {showPilotInfo && voo.piloto && (
              <div className="flex items-center gap-1">
                <UserIcon className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-600">{voo.piloto.nome}</span>
                {voo.agencia && (
                  <>
                    <BuildingOfficeIcon className="h-4 w-4 text-gray-500 ml-2" />
                    <span className="text-sm text-gray-600">{voo.agencia.nome}</span>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Status e ação */}
          <div className="flex items-center gap-3">
            <span className={`px-2 py-1 rounded-full text-xs font-medium border ${config.color}`}>
              {config.label}
            </span>
            <button
              onClick={() => router.push(config.primaryAction.href)}
              className={`px-3 py-1 rounded text-sm text-white transition-colors ${config.primaryAction.color}`}
            >
              {config.primaryAction.label}
            </button>
          </div>
        </div>

        {/* Alerta para voos no passado */}
        {isVooPassado && (
          <div className="mt-2 flex items-center gap-1 text-red-600 text-sm">
            <ExclamationTriangleIcon className="h-4 w-4" />
            <span>Voo em atraso - requer atenção</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`border rounded-xl p-6 bg-white hover:shadow-lg transition-all ${
      isVooPassado ? 'border-red-300 bg-red-50' : 'border-gray-200'
    }`}>
      {/* Header com status e progresso */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className={`px-3 py-1 rounded-full text-sm font-medium border ${config.color}`}>
            {config.label}
          </span>
          {isVooPassado && (
            <div className="flex items-center gap-1 text-red-600">
              <ExclamationTriangleIcon className="h-4 w-4" />
              <span className="text-sm">Atrasado</span>
            </div>
          )}
        </div>
        <div className="text-sm text-gray-500">
          ID: {voo.id.slice(0, 8)}...
        </div>
      </div>

      {/* Barra de progresso */}
      <div className="mb-4">
        <div className="flex justify-between text-sm text-gray-600 mb-1">
          <span>Progresso do voo</span>
          <span>{config.progress}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className={`h-2 rounded-full transition-all ${
              config.progress < 30 ? 'bg-gray-400' :
              config.progress < 70 ? 'bg-yellow-500' : 'bg-green-500'
            }`}
            style={{ width: `${config.progress}%` }}
          />
        </div>
      </div>

      {/* Dados do voo */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5 text-gray-500" />
            <div>
              <span className="font-medium">
                {new Date(voo.data_voo).toLocaleDateString('pt-BR')}
              </span>
              <span className="text-gray-600 ml-2">
                {voo.periodo === 'manha' ? 'Manhã' : 'Tarde'}
              </span>
            </div>
          </div>

          {voo.horario_previsto && (
            <div className="flex items-center gap-2">
              <ClockIcon className="h-5 w-5 text-gray-500" />
              <span className="text-gray-700">{voo.horario_previsto}</span>
            </div>
          )}

          {voo.local_decolagem_previsto && (
            <div className="flex items-center gap-2">
              <MapPinIcon className="h-5 w-5 text-gray-500" />
              <span className="text-gray-700">{voo.local_decolagem_previsto}</span>
            </div>
          )}
        </div>

        <div className="space-y-3">
          {showPilotInfo && voo.piloto && (
            <div className="flex items-center gap-2">
              <UserIcon className="h-5 w-5 text-gray-500" />
              <span className="text-gray-700">{voo.piloto.nome}</span>
            </div>
          )}

          {voo.agencia && (
            <div className="flex items-center gap-2">
              <BuildingOfficeIcon className="h-5 w-5 text-gray-500" />
              <span className="text-gray-700">{voo.agencia.nome}</span>
            </div>
          )}

          {totalPassageiros > 0 && (
            <div className="flex items-center gap-2">
              <UserIcon className="h-5 w-5 text-gray-500" />
              <span className="text-gray-700">
                {totalPassageiros} passageiros ({voo.adultos_previstos} adultos, {voo.criancas_previstas} crianças)
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Observações */}
      {voo.observacoes_planejamento && (
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-700">{voo.observacoes_planejamento}</p>
        </div>
      )}

      {/* Ações */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
        <div className="flex gap-2">
          {config.secondaryActions.map((action, index) => (
            <button
              key={index}
              onClick={() => action.href ? router.push(action.href) : handleAction(action.action!)}
              className={`flex items-center gap-1 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors ${
                action.color || 'text-gray-700'
              }`}
            >
              <action.icon className="h-4 w-4" />
              {action.label}
            </button>
          ))}
        </div>

        <button
          onClick={() => router.push(config.primaryAction.href)}
          className={`flex items-center gap-2 px-4 py-2 text-sm text-white rounded-lg transition-colors ${config.primaryAction.color}`}
        >
          <config.primaryAction.icon className="h-4 w-4" />
          {config.primaryAction.label}
        </button>
      </div>

      {/* Timestamps para debug */}
      <div className="mt-3 pt-3 border-t border-gray-100 text-xs text-gray-500">
        <div className="flex justify-between">
          <span>Criado: {new Date(voo.created_at).toLocaleString('pt-BR')}</span>
          <span>Atualizado: {new Date(voo.updated_at).toLocaleString('pt-BR')}</span>
        </div>
      </div>

      {/* Modal de cancelamento */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Cancelar Voo</h3>
              <button
                onClick={handleCloseCancelModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 mb-4">
                  Tem certeza que deseja cancelar este voo? Esta ação não pode ser desfeita.
                </p>
                <div className="bg-gray-50 p-3 rounded-lg text-sm">
                  <strong>Voo:</strong> {new Date(voo.data_voo).toLocaleDateString('pt-BR')} - {voo.periodo === 'manha' ? 'Manhã' : 'Tarde'}
                  <br />
                  <strong>Local:</strong> {voo.local_decolagem_previsto}
                  <br />
                  <strong>Horário:</strong> {voo.horario_previsto}
                </div>
              </div>

              <div>
                <label htmlFor="motivo" className="block text-sm font-medium text-gray-700 mb-1">
                  Motivo do Cancelamento *
                </label>
                <select
                  id="motivo"
                  value={motivoCancelamento}
                  onChange={(e) => setMotivoCancelamento(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                  required
                >
                  <option value="">Selecione o motivo...</option>
                  {MOTIVOS_CANCELAMENTO.map((motivo) => (
                    <option key={motivo.value} value={motivo.value}>
                      {motivo.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="observacoes" className="block text-sm font-medium text-gray-700 mb-1">
                  Observações Adicionais
                </label>
                <textarea
                  id="observacoes"
                  value={observacoesCancelamento}
                  onChange={(e) => setObservacoesCancelamento(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="Detalhes adicionais sobre o cancelamento..."
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={handleCloseCancelModal}
                disabled={cancelando}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleCancelVoo}
                disabled={cancelando || !motivoCancelamento.trim()}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {cancelando ? (
                  <>
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                    Cancelando...
                  </>
                ) : (
                  <>
                    <XMarkIcon className="h-4 w-4" />
                    Confirmar Cancelamento
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}