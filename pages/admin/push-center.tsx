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
  const [selectedEmails, setSelectedEmails] = useState<string[]>([]);
  const [emailInput, setEmailInput] = useState('');
  const [availableUsers, setAvailableUsers] = useState<any[]>([]);
  const [scheduledJobs, setScheduledJobs] = useState<any[]>([]);
  const [loadingScheduled, setLoadingScheduled] = useState(false);
  const [historyData, setHistoryData] = useState<any>(null);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [historyFilters, setHistoryFilters] = useState({
    search: '',
    status: 'all',
    type: 'all',
    dateFrom: '',
    dateTo: ''
  });
  const [activeTab, setActiveTab] = useState('editor');

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
    // Buscar usuários disponíveis quando necessário
    if (formData.targetAudience.type === 'users') {
      fetchAvailableUsers();
    }
  }, [formData.targetAudience]);

  // Monitor tab changes to load data
  useEffect(() => {
    if (activeTab === 'scheduled') {
      fetchScheduledJobs();
    } else if (activeTab === 'history') {
      fetchHistory();
    }
  }, [activeTab]);

  const fetchAvailableUsers = async () => {
    try {
      // Buscar usuários com subscriptions ativas
      const response = await fetch('/api/push/available-users', {
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (response.ok) {
        const users = await response.json();
        setAvailableUsers(users);
      }
    } catch (error) {
      console.error('Erro ao buscar usuários:', error);
    }
  };

  const fetchScheduledJobs = async () => {
    try {
      setLoadingScheduled(true);
      const response = await fetch('/api/push/scheduled-list?limit=10', {
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (response.ok) {
        const data = await response.json();
        setScheduledJobs(data.jobs || []);
      }
    } catch (error) {
      console.error('Erro ao buscar jobs agendados:', error);
    } finally {
      setLoadingScheduled(false);
    }
  };

  const fetchHistory = async () => {
    try {
      setLoadingHistory(true);
      const params = new URLSearchParams({
        page: '1',
        limit: '20',
        ...(historyFilters.search && { search: historyFilters.search }),
        ...(historyFilters.status !== 'all' && { status: historyFilters.status }),
        ...(historyFilters.type !== 'all' && { type: historyFilters.type }),
        ...(historyFilters.dateFrom && { dateFrom: historyFilters.dateFrom }),
        ...(historyFilters.dateTo && { dateTo: historyFilters.dateTo })
      });
      
      const response = await fetch(`/api/push/history?${params}`, {
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (response.ok) {
        const data = await response.json();
        setHistoryData(data);
      } else {
        toast({
          title: "Erro",
          description: "Erro ao carregar histórico",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Erro ao buscar histórico:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar histórico",
        variant: "destructive"
      });
    } finally {
      setLoadingHistory(false);
    }
  };

  const calculateTargetCount = () => {
    if (formData.targetAudience.type === 'all') {
      setTargetCount(stats.totalSubscriptions || 87); // Mock
    } else if (formData.targetAudience.type === 'roles') {
      const roles = formData.targetAudience.roles || [];
      let count = 0;
      if (roles.includes('pilot')) count += stats.pilotSubscriptions || 65;
      if (roles.includes('agency')) count += stats.agencySubscriptions || 22;
      setTargetCount(count);
    } else if (formData.targetAudience.type === 'users') {
      setTargetCount(selectedEmails.length);
    } else {
      setTargetCount(0);
    }
  };

  const handleEmailAdd = () => {
    const email = emailInput.trim().toLowerCase();
    if (email && !selectedEmails.includes(email) && validateEmail(email)) {
      const newEmails = [...selectedEmails, email];
      setSelectedEmails(newEmails);
      setEmailInput('');
      // Atualizar formData
      setFormData(prev => ({
        ...prev,
        targetAudience: {
          ...prev.targetAudience,
          emails: newEmails
        }
      }));
    }
  };

  const handleEmailRemove = (email: string) => {
    const newEmails = selectedEmails.filter(e => e !== email);
    setSelectedEmails(newEmails);
    setFormData(prev => ({
      ...prev,
      targetAudience: {
        ...prev.targetAudience,
        emails: newEmails
      }
    }));
  };

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleInputChange = (field: keyof NotificationData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAudienceChange = (type: string) => {
    // Limpar emails selecionados ao mudar de tipo
    if (type !== 'users') {
      setSelectedEmails([]);
      setEmailInput('');
    }
    
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
    if (formData.targetAudience.type === 'users' && selectedEmails.length === 0) {
      return 'Adicione pelo menos um email para envio direcionado';
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
      setSelectedEmails([]);
      setEmailInput('');

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

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
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
                          <div className="space-y-2">
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
                                Usuários específicos ({selectedEmails.length} selecionados)
                              </label>
                            </div>

                            {formData.targetAudience.type === 'users' && (
                              <div className="ml-7 space-y-3">
                                {/* Input para adicionar emails */}
                                <div className="flex gap-2">
                                  <Input
                                    value={emailInput}
                                    onChange={(e) => setEmailInput(e.target.value)}
                                    placeholder="usuario@email.com"
                                    onKeyPress={(e) => {
                                      if (e.key === 'Enter') {
                                        e.preventDefault();
                                        handleEmailAdd();
                                      }
                                    }}
                                    className="flex-1"
                                  />
                                  <Button
                                    type="button"
                                    onClick={handleEmailAdd}
                                    disabled={!emailInput.trim() || !validateEmail(emailInput.trim())}
                                    size="sm"
                                  >
                                    Adicionar
                                  </Button>
                                </div>

                                {/* Lista de emails selecionados */}
                                {selectedEmails.length > 0 && (
                                  <div className="space-y-2">
                                    <p className="text-xs text-gray-600">Emails selecionados:</p>
                                    <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                                      {selectedEmails.map((email, index) => (
                                        <Badge key={index} variant="secondary" className="flex items-center gap-1">
                                          <span className="text-xs">{email}</span>
                                          <button
                                            onClick={() => handleEmailRemove(email)}
                                            className="ml-1 hover:bg-gray-300 rounded-full p-0.5"
                                          >
                                            <XMarkIcon className="h-3 w-3" />
                                          </button>
                                        </Badge>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {/* Sugestões de usuários disponíveis */}
                                {availableUsers.length > 0 && (
                                  <div className="space-y-2">
                                    <p className="text-xs text-gray-600">Usuários com notificações ativas:</p>
                                    <div className="max-h-40 overflow-y-auto space-y-1">
                                      {availableUsers
                                        .filter(user => !selectedEmails.includes(user.email))
                                        .slice(0, 10)
                                        .map((user) => (
                                          <button
                                            key={user.id}
                                            onClick={() => {
                                              setEmailInput(user.email);
                                              handleEmailAdd();
                                            }}
                                            className="flex items-center gap-2 p-2 w-full text-left hover:bg-gray-50 rounded text-xs"
                                          >
                                            <span className="font-medium">{user.nome || user.email}</span>
                                            <span className="text-gray-500">({user.email})</span>
                                            <Badge variant="outline" className="ml-auto text-xs">
                                              {user.role}
                                            </Badge>
                                          </button>
                                        ))
                                      }
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
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

                        <Button 
                          variant="outline"
                          disabled={!formData.title || !formData.message}
                          onClick={() => {
                            // TODO: Abrir modal de agendamento
                            toast({
                              title: "Agendamento",
                              description: "Interface de agendamento será implementada em breve",
                            });
                          }}
                        >
                          <CalendarIcon className="h-4 w-4 mr-2" />
                          Agendar
                        </Button>

                        <Button 
                          variant="ghost"
                          onClick={() => {
                            setFormData({
                              title: '',
                              message: '',
                              internalLink: '',
                              targetAudience: { type: 'all' }
                            });
                            setSelectedEmails([]);
                            setEmailInput('');
                          }}
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
                  {loadingScheduled ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                      <p className="mt-2 text-gray-500">Carregando jobs agendados...</p>
                    </div>
                  ) : scheduledJobs.length === 0 ? (
                    <div className="text-center py-12">
                      <CalendarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        Nenhuma Notificação Agendada
                      </h3>
                      <p className="text-gray-500 mb-4">
                        Crie uma nova notificação e use o botão "Agendar" para programar envios.
                      </p>
                      <Button 
                        onClick={() => setActiveTab('editor')}
                        variant="outline"
                      >
                        <PaperAirplaneIcon className="h-4 w-4 mr-2" />
                        Criar Nova Notificação
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {scheduledJobs.map((job) => {
                        const getStatusColor = (status: string) => {
                          switch (status) {
                            case 'pending': return 'bg-yellow-100 text-yellow-800';
                            case 'processing': return 'bg-blue-100 text-blue-800';
                            case 'completed': return 'bg-green-100 text-green-800';
                            case 'failed': return 'bg-red-100 text-red-800';
                            default: return 'bg-gray-100 text-gray-800';
                          }
                        };

                        const getStatusLabel = (status: string) => {
                          switch (status) {
                            case 'pending': return 'Pendente';
                            case 'processing': return 'Processando';
                            case 'completed': return 'Concluído';
                            case 'failed': return 'Falhado';
                            default: return status;
                          }
                        };

                        return (
                          <div key={job.id} className="border rounded-lg p-4 hover:bg-gray-50">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <h4 className="font-medium text-gray-900">
                                    {job.notification.title}
                                  </h4>
                                  <Badge className={getStatusColor(job.status)}>
                                    {getStatusLabel(job.status)}
                                  </Badge>
                                  {job.recurring && (
                                    <Badge variant="outline" className="text-xs">
                                      Recorrente
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-sm text-gray-600 mb-2">
                                  {job.notification.message}
                                </p>
                                <div className="flex items-center gap-4 text-xs text-gray-500">
                                  <span>
                                    📅 {new Date(job.scheduledFor).toLocaleString('pt-BR')}
                                  </span>
                                  {job.sentCount !== null && (
                                    <span>
                                      ✉️ {job.sentCount} enviadas
                                    </span>
                                  )}
                                  {job.failedCount > 0 && (
                                    <span className="text-red-600">
                                      ⚠️ {job.failedCount} falharam
                                    </span>
                                  )}
                                  {job.recurring && job.recurringPattern && (
                                    <span>
                                      🔁 {job.recurringPattern}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                {job.status === 'pending' && (
                                  <Button size="sm" variant="outline">
                                    <XMarkIcon className="h-3 w-3 mr-1" />
                                    Cancelar
                                  </Button>
                                )}
                              </div>
                            </div>
                            {job.errorMessage && (
                              <Alert className="mt-3">
                                <ExclamationTriangleIcon className="h-4 w-4" />
                                <AlertDescription>
                                  <strong>Erro:</strong> {job.errorMessage}
                                </AlertDescription>
                              </Alert>
                            )}
                          </div>
                        );
                      })}
                      
                      <div className="text-center pt-4">
                        <Button 
                          variant="outline" 
                          onClick={fetchScheduledJobs}
                          size="sm"
                        >
                          Atualizar Lista
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Histórico */}
            <TabsContent value="history">
              <Card>
                <CardHeader>
                  <CardTitle>Histórico de Envios</CardTitle>
                  <CardDescription>
                    Acompanhe o histórico e estatísticas de entrega das notificações
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {/* Filtros */}
                  <div className="mb-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                    <Input
                      placeholder="Buscar por título ou admin..."
                      value={historyFilters.search}
                      onChange={(e) => setHistoryFilters(prev => ({ ...prev, search: e.target.value }))}
                    />
                    
                    <select
                      value={historyFilters.status}
                      onChange={(e) => setHistoryFilters(prev => ({ ...prev, status: e.target.value }))}
                      className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                    >
                      <option value="all">Todos Status</option>
                      <option value="sent">Enviadas</option>
                      <option value="scheduled">Agendadas</option>
                    </select>
                    
                    <select
                      value={historyFilters.type}
                      onChange={(e) => setHistoryFilters(prev => ({ ...prev, type: e.target.value }))}
                      className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                    >
                      <option value="all">Todos Tipos</option>
                      <option value="immediate">Imediatas</option>
                      <option value="scheduled">Agendadas</option>
                    </select>
                    
                    <Input
                      type="date"
                      value={historyFilters.dateFrom}
                      onChange={(e) => setHistoryFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
                      placeholder="Data início"
                    />
                    
                    <Input
                      type="date"
                      value={historyFilters.dateTo}
                      onChange={(e) => setHistoryFilters(prev => ({ ...prev, dateTo: e.target.value }))}
                      placeholder="Data fim"
                    />
                  </div>
                  
                  <div className="flex gap-2 mb-6">
                    <Button onClick={fetchHistory} disabled={loadingHistory} size="sm">
                      Filtrar
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        setHistoryFilters({ search: '', status: 'all', type: 'all', dateFrom: '', dateTo: '' });
                        fetchHistory();
                      }}
                    >
                      Limpar
                    </Button>
                  </div>

                  {/* Estatísticas Gerais */}
                  {historyData?.stats && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <p className="text-sm text-blue-600 font-medium">Total de Notificações</p>
                        <p className="text-2xl font-bold text-blue-900">{historyData.stats.totalNotifications}</p>
                      </div>
                      <div className="bg-green-50 p-4 rounded-lg">
                        <p className="text-sm text-green-600 font-medium">Total Enviadas</p>
                        <p className="text-2xl font-bold text-green-900">{historyData.stats.totalSent}</p>
                      </div>
                      <div className="bg-purple-50 p-4 rounded-lg">
                        <p className="text-sm text-purple-600 font-medium">Total Destinatários</p>
                        <p className="text-2xl font-bold text-purple-900">{historyData.stats.totalTargeted}</p>
                      </div>
                    </div>
                  )}

                  {loadingHistory ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                      <p className="mt-2 text-gray-500">Carregando histórico...</p>
                    </div>
                  ) : !historyData || historyData.notifications.length === 0 ? (
                    <div className="text-center py-12">
                      <ClockIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        Nenhuma Notificação Encontrada
                      </h3>
                      <p className="text-gray-500 mb-4">
                        Nenhuma notificação encontrada com os filtros aplicados.
                      </p>
                      <Button onClick={() => setActiveTab('editor')} variant="outline">
                        <PaperAirplaneIcon className="h-4 w-4 mr-2" />
                        Criar Nova Notificação
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {historyData.notifications.map((notification) => {
                        const getStatusColor = (status: string) => {
                          switch (status) {
                            case 'sent': return 'bg-green-100 text-green-800';
                            case 'scheduled': return 'bg-blue-100 text-blue-800';
                            default: return 'bg-gray-100 text-gray-800';
                          }
                        };

                        const getAudienceLabel = (audience: any) => {
                          if (audience.type === 'all') return 'Todos';
                          if (audience.type === 'roles') {
                            const roles = audience.roles || [];
                            return roles.map((r: string) => r === 'pilot' ? 'Pilotos' : 'Agências').join(', ');
                          }
                          if (audience.type === 'users') {
                            return `${audience.emails?.length || 0} usuários específicos`;
                          }
                          return 'N/A';
                        };

                        return (
                          <div key={notification.id} className="border rounded-lg p-4 hover:bg-gray-50">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <h4 className="font-medium text-gray-900">
                                    {notification.title}
                                  </h4>
                                  <Badge className={getStatusColor(notification.status)}>
                                    {notification.status === 'sent' ? 'Enviada' : 'Agendada'}
                                  </Badge>
                                </div>
                                <p className="text-sm text-gray-600 mb-3">
                                  {notification.message}
                                </p>
                                
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs text-gray-500 mb-3">
                                  <div>
                                    <span className="font-medium">Criada:</span><br/>
                                    {new Date(notification.createdAt).toLocaleString('pt-BR')}
                                  </div>
                                  <div>
                                    <span className="font-medium">Público:</span><br/>
                                    {getAudienceLabel(notification.targetAudience)}
                                  </div>
                                  <div>
                                    <span className="font-medium">Admin:</span><br/>
                                    {notification.adminEmail}
                                  </div>
                                  <div>
                                    <span className="font-medium">Estatísticas:</span><br/>
                                    {notification.stats.targeted > 0 ? (
                                      `${notification.stats.delivered}/${notification.stats.targeted} (${notification.stats.deliveryRate}%)`
                                    ) : (
                                      'N/A'
                                    )}
                                  </div>
                                </div>

                                {/* Estatísticas detalhadas */}
                                {notification.stats.targeted > 0 && (
                                  <div className="flex gap-4 text-xs">
                                    <span className="bg-green-100 text-green-800 px-2 py-1 rounded">
                                      ✓ {notification.stats.delivered} entregues
                                    </span>
                                    {notification.stats.failed > 0 && (
                                      <span className="bg-red-100 text-red-800 px-2 py-1 rounded">
                                        ✗ {notification.stats.failed} falharam
                                      </span>
                                    )}
                                    {notification.stats.clicked > 0 && (
                                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                        👆 {notification.stats.clicked} cliques ({notification.stats.clickRate}%)
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      
                      {/* Paginação */}
                      {historyData?.pagination && historyData.pagination.totalPages > 1 && (
                        <div className="flex justify-center items-center gap-2 pt-4">
                          <Button 
                            variant="outline" 
                            size="sm"
                            disabled={!historyData.pagination.hasPrev}
                          >
                            Anterior
                          </Button>
                          <span className="text-sm text-gray-600">
                            Página {historyData.pagination.page} de {historyData.pagination.totalPages}
                          </span>
                          <Button 
                            variant="outline" 
                            size="sm"
                            disabled={!historyData.pagination.hasNext}
                          >
                            Próxima
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </EnhancedDashboardLayout>
    </RequireAdmin>
  );
}