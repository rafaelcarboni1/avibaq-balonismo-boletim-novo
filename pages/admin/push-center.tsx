import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useUser } from '@/hooks/useUser';
import { EnhancedDashboardLayout } from '@/components/magicui/enhanced-dashboard-layout';
import RequireAdmin from '@/components/RequireAdmin';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { 
  BellIcon,
  PaperAirplaneIcon,
  CalendarIcon,
  ClockIcon,
  UserIcon,
  UsersIcon,
  BuildingOffice2Icon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

interface NotificationData {
  title: string;
  message: string;
  internalLink: string;
  targetAudience: {
    type: 'all' | 'roles' | 'users';
    roles?: string[];
    user_ids?: string[];
    emails?: string[];
  };
}

interface NotificationPreview {
  title: string;
  message: string;
  url?: string;
}

export default function PushCenter() {
  const { user, loading: userLoading } = useUser();
  const router = useRouter();
  const { toast } = useToast();

  const [formData, setFormData] = useState<NotificationData>({
    title: '',
    message: '',
    internalLink: '',
    targetAudience: { type: 'all' }
  });

  const [sending, setSending] = useState(false);
  const [targetCount, setTargetCount] = useState<number | null>(null);

  // Mock data para preview - em produção virá do banco
  const [stats, setStats] = useState({
    totalSubscriptions: 0,
    pilotSubscriptions: 0,
    agencySubscriptions: 0,
    totalSent: 0,
    recentNotifications: []
  });

  useEffect(() => {
    // Calcular número de destinatários baseado no público-alvo selecionado
    calculateTargetCount();
  }, [formData.targetAudience]);

  const calculateTargetCount = () => {
    // Mock - em produção faria chamada à API
    if (formData.targetAudience.type === 'all') {
      setTargetCount(stats.totalSubscriptions || 87); // Mock
    } else if (formData.targetAudience.type === 'roles') {
      const roles = formData.targetAudience.roles || [];
      let count = 0;
      if (roles.includes('pilot')) count += stats.pilotSubscriptions || 65;
      if (roles.includes('agency')) count += stats.agencySubscriptions || 22;
      setTargetCount(count);
    } else {
      setTargetCount(formData.targetAudience.user_ids?.length || 0);
    }
  };

  const handleInputChange = (field: keyof NotificationData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAudienceChange = (type: string) => {
    setFormData(prev => ({
      ...prev,
      targetAudience: { type: type as 'all' | 'roles' | 'users' }
    }));
  };

  const handleRoleToggle = (role: string) => {
    setFormData(prev => ({
      ...prev,
      targetAudience: {
        ...prev.targetAudience,
        roles: prev.targetAudience.roles?.includes(role)
          ? prev.targetAudience.roles.filter(r => r !== role)
          : [...(prev.targetAudience.roles || []), role]
      }
    }));
  };

  const validateForm = (): string | null => {
    if (!formData.title.trim()) return 'Título é obrigatório';
    if (formData.title.length > 50) return 'Título deve ter no máximo 50 caracteres';
    if (!formData.message.trim()) return 'Mensagem é obrigatória';
    if (formData.message.length > 120) return 'Mensagem deve ter no máximo 120 caracteres';
    if (formData.targetAudience.type === 'roles' && (!formData.targetAudience.roles || formData.targetAudience.roles.length === 0)) {
      return 'Selecione pelo menos um tipo de usuário';
    }
    return null;
  };

  const sendImmediateNotification = async () => {
    const validationError = validateForm();
    if (validationError) {
      toast({
        title: "Erro de Validação",
        description: validationError,
        variant: "destructive"
      });
      return;
    }

    setSending(true);
    try {
      const response = await fetch('/api/push/send-immediate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminUserId: user?.id,
          title: formData.title,
          message: formData.message,
          internalLink: formData.internalLink || undefined,
          targetAudience: formData.targetAudience
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao enviar notificação');
      }

      const result = await response.json();

      toast({
        title: "Notificação Enviada! ✈️",
        description: `Enviada para ${result.sent} de ${result.targeted} destinatários (${result.successRate})`,
        duration: 6000
      });

      // Limpar formulário
      setFormData({
        title: '',
        message: '',
        internalLink: '',
        targetAudience: { type: 'all' }
      });

    } catch (error: any) {
      toast({
        title: "Erro ao Enviar",
        description: error.message || "Erro interno do servidor",
        variant: "destructive"
      });
    } finally {
      setSending(false);
    }
  };

  const getPreviewData = (): NotificationPreview => ({
    title: formData.title || 'Título da Notificação',
    message: formData.message || 'Mensagem da notificação aparecerá aqui...',
    url: formData.internalLink
  });

  if (userLoading) {
    return <div>Carregando...</div>;
  }

  return (
    <RequireAdmin>
      <EnhancedDashboardLayout 
        title="Push Center"
        breadcrumbs={[
          { label: "Dashboard", href: "/admin/dashboard" },
          { label: "Push Center" }
        ]}
      >
        <div className="space-y-8">
          {/* Header com estatísticas rápidas */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <UsersIcon className="h-5 w-5 text-blue-500" />
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total</p>
                    <p className="text-2xl font-bold text-gray-900">87</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <UserIcon className="h-5 w-5 text-green-500" />
                  <div>
                    <p className="text-sm font-medium text-gray-600">Pilotos</p>
                    <p className="text-2xl font-bold text-gray-900">65</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <BuildingOffice2Icon className="h-5 w-5 text-purple-500" />
                  <div>
                    <p className="text-sm font-medium text-gray-600">Agências</p>
                    <p className="text-2xl font-bold text-gray-900">22</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <PaperAirplaneIcon className="h-5 w-5 text-orange-500" />
                  <div>
                    <p className="text-sm font-medium text-gray-600">Enviadas</p>
                    <p className="text-2xl font-bold text-gray-900">2.1k</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="editor" className="space-y-6">
            <TabsList>
              <TabsTrigger value="editor" className="flex items-center space-x-2">
                <BellIcon className="h-4 w-4" />
                <span>Editor</span>
              </TabsTrigger>
              <TabsTrigger value="scheduled" className="flex items-center space-x-2">
                <CalendarIcon className="h-4 w-4" />
                <span>Agendadas</span>
              </TabsTrigger>
              <TabsTrigger value="history" className="flex items-center space-x-2">
                <ClockIcon className="h-4 w-4" />
                <span>Histórico</span>
              </TabsTrigger>
            </TabsList>

            {/* Editor de Notificações */}
            <TabsContent value="editor">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Formulário de Edição */}
                <div className="lg:col-span-2 space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Nova Notificação Push</CardTitle>
                      <CardDescription>
                        Crie e envie notificações para pilotos e agências
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Título */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">
                          Título <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <Input
                            value={formData.title}
                            onChange={(e) => handleInputChange('title', e.target.value)}
                            placeholder="Ex: Alerta Meteorológico Crítico"
                            maxLength={50}
                            className={formData.title.length > 45 ? 'border-yellow-400' : ''}
                          />
                          <span className={`absolute right-3 top-2.5 text-xs ${
                            formData.title.length > 45 ? 'text-yellow-600' : 'text-gray-400'
                          }`}>
                            {formData.title.length}/50
                          </span>
                        </div>
                      </div>

                      {/* Mensagem */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">
                          Mensagem <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <Textarea
                            value={formData.message}
                            onChange={(e) => handleInputChange('message', e.target.value)}
                            placeholder="Ex: Ventos fortes e visibilidade reduzida previstos para amanhã. Evite voos até nova atualização."
                            maxLength={120}
                            rows={3}
                            className={formData.message.length > 110 ? 'border-yellow-400' : ''}
                          />
                          <span className={`absolute right-3 bottom-2 text-xs ${
                            formData.message.length > 110 ? 'text-yellow-600' : 'text-gray-400'
                          }`}>
                            {formData.message.length}/120
                          </span>
                        </div>
                      </div>

                      {/* Link Interno */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">
                          Link Interno (opcional)
                        </label>
                        <Input
                          value={formData.internalLink}
                          onChange={(e) => handleInputChange('internalLink', e.target.value)}
                          placeholder="/admin/boletins ou /piloto/dashboard"
                        />
                        <p className="text-xs text-gray-500">
                          Para onde redirecionar quando o usuário clicar na notificação
                        </p>
                      </div>

                      {/* Público-Alvo */}
                      <div className="space-y-4">
                        <label className="text-sm font-medium text-gray-700">
                          Público-Alvo <span className="text-red-500">*</span>
                        </label>

                        <div className="space-y-3">
                          {/* Todos */}
                          <div className="flex items-center space-x-3">
                            <input
                              type="radio"
                              id="all"
                              name="audience"
                              checked={formData.targetAudience.type === 'all'}
                              onChange={() => handleAudienceChange('all')}
                              className="h-4 w-4 text-blue-600"
                            />
                            <label htmlFor="all" className="text-sm text-gray-700">
                              Todos os usuários ({targetCount || 87} destinatários)
                            </label>
                          </div>

                          {/* Por tipo */}
                          <div className="space-y-2">
                            <div className="flex items-center space-x-3">
                              <input
                                type="radio"
                                id="roles"
                                name="audience"
                                checked={formData.targetAudience.type === 'roles'}
                                onChange={() => handleAudienceChange('roles')}
                                className="h-4 w-4 text-blue-600"
                              />
                              <label htmlFor="roles" className="text-sm text-gray-700">
                                Por tipo de usuário
                              </label>
                            </div>

                            {formData.targetAudience.type === 'roles' && (
                              <div className="ml-7 space-y-2">
                                <div className="flex items-center space-x-3">
                                  <input
                                    type="checkbox"
                                    id="pilots"
                                    checked={formData.targetAudience.roles?.includes('pilot') || false}
                                    onChange={() => handleRoleToggle('pilot')}
                                    className="h-4 w-4 text-blue-600"
                                  />
                                  <label htmlFor="pilots" className="text-sm text-gray-700">
                                    Pilotos (65 destinatários)
                                  </label>
                                </div>

                                <div className="flex items-center space-x-3">
                                  <input
                                    type="checkbox"
                                    id="agencies"
                                    checked={formData.targetAudience.roles?.includes('agency') || false}
                                    onChange={() => handleRoleToggle('agency')}
                                    className="h-4 w-4 text-blue-600"
                                  />
                                  <label htmlFor="agencies" className="text-sm text-gray-700">
                                    Agências (22 destinatários)
                                  </label>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Usuários específicos */}
                          <div className="flex items-center space-x-3">
                            <input
                              type="radio"
                              id="users"
                              name="audience"
                              checked={formData.targetAudience.type === 'users'}
                              onChange={() => handleAudienceChange('users')}
                              className="h-4 w-4 text-blue-600"
                            />
                            <label htmlFor="users" className="text-sm text-gray-700">
                              Usuários específicos (em desenvolvimento)
                            </label>
                          </div>
                        </div>

                        {/* Contador de destinatários */}
                        {targetCount !== null && (
                          <Alert>
                            <UsersIcon className="h-4 w-4" />
                            <AlertDescription>
                              Esta notificação será enviada para <strong>{targetCount} destinatário{targetCount !== 1 ? 's' : ''}</strong>
                            </AlertDescription>
                          </Alert>
                        )}
                      </div>

                      {/* Botões de Ação */}
                      <div className="flex flex-wrap gap-4 pt-4 border-t">
                        <Button
                          onClick={sendImmediateNotification}
                          disabled={sending || !formData.title || !formData.message}
                          className="flex items-center space-x-2"
                        >
                          <PaperAirplaneIcon className="h-4 w-4" />
                          <span>{sending ? 'Enviando...' : 'Enviar Agora'}</span>
                        </Button>

                        <Button variant="outline" disabled>
                          <CalendarIcon className="h-4 w-4 mr-2" />
                          Agendar (Em Breve)
                        </Button>

                        <Button 
                          variant="ghost"
                          onClick={() => setFormData({
                            title: '',
                            message: '',
                            internalLink: '',
                            targetAudience: { type: 'all' }
                          })}
                        >
                          Limpar
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Preview */}
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Preview</CardTitle>
                      <CardDescription>
                        Como a notificação aparecerá nos dispositivos
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {/* Android Preview */}
                      <div className="space-y-4">
                        <h4 className="font-medium text-sm text-gray-600">Android</h4>
                        <div className="bg-gray-900 rounded-lg p-4 text-white text-sm">
                          <div className="flex items-start space-x-3">
                            <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                              <BellIcon className="h-3 w-3" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <p className="font-medium truncate">AVIBAQ</p>
                                <span className="text-xs text-gray-400">agora</span>
                              </div>
                              <p className="font-medium text-white mt-1 line-clamp-1">
                                {getPreviewData().title}
                              </p>
                              <p className="text-gray-300 text-xs mt-1 line-clamp-2">
                                {getPreviewData().message}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* iOS Preview */}
                        <h4 className="font-medium text-sm text-gray-600 mt-6">iOS</h4>
                        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-lg">
                          <div className="flex items-start space-x-3">
                            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
                              <BellIcon className="h-4 w-4 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <p className="font-medium text-gray-900">AVIBAQ</p>
                                <span className="text-xs text-gray-500">agora</span>
                              </div>
                              <p className="font-medium text-gray-900 mt-1 line-clamp-1">
                                {getPreviewData().title}
                              </p>
                              <p className="text-gray-600 text-sm mt-1 line-clamp-2">
                                {getPreviewData().message}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Dicas */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Dicas</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm text-gray-600">
                      <div className="flex items-start space-x-2">
                        <CheckCircleIcon className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                        <p>Use títulos concisos e informativos</p>
                      </div>
                      <div className="flex items-start space-x-2">
                        <CheckCircleIcon className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                        <p>Mensagens curtas têm melhor engajamento</p>
                      </div>
                      <div className="flex items-start space-x-2">
                        <CheckCircleIcon className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                        <p>Inclua links internos quando relevante</p>
                      </div>
                      <div className="flex items-start space-x-2">
                        <ExclamationTriangleIcon className="h-4 w-4 text-yellow-500 flex-shrink-0 mt-0.5" />
                        <p>Evite spam - use com moderação</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            {/* Agendadas */}
            <TabsContent value="scheduled">
              <Card>
                <CardHeader>
                  <CardTitle>Notificações Agendadas</CardTitle>
                  <CardDescription>
                    Gerencie envios programados e recorrentes
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12">
                    <CalendarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Sistema de Agendamento
                    </h3>
                    <p className="text-gray-500 mb-4">
                      Em breve você poderá agendar notificações para datas específicas e criar envios recorrentes.
                    </p>
                    <Badge variant="secondary">Em Desenvolvimento</Badge>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Histórico */}
            <TabsContent value="history">
              <Card>
                <CardHeader>
                  <CardTitle>Histórico de Envios</CardTitle>
                  <CardDescription>
                    Acompanhe o histórico e estatísticas de entrega
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12">
                    <ClockIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Histórico de Notificações
                    </h3>
                    <p className="text-gray-500 mb-4">
                      Visualize o histórico completo de notificações enviadas, taxas de entrega e engajamento.
                    </p>
                    <Badge variant="secondary">Em Desenvolvimento</Badge>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </EnhancedDashboardLayout>
    </RequireAdmin>
  );
}