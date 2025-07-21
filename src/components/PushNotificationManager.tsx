'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { 
  BellIcon, 
  BellSlashIcon, 
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

interface PushNotificationManagerProps {
  userId: string;
  className?: string;
}

interface NotificationState {
  permission: NotificationPermission;
  supported: boolean;
  subscribed: boolean;
  loading: boolean;
  error: string | null;
}

export default function PushNotificationManager({ userId, className = '' }: PushNotificationManagerProps) {
  const { toast } = useToast();
  const [state, setState] = useState<NotificationState>({
    permission: 'default',
    supported: false,
    subscribed: false,
    loading: false,
    error: null
  });

  // VAPID Public Key - deve ser adicionada ao .env.local
  const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';

  useEffect(() => {
    checkNotificationSupport();
    checkCurrentSubscription();
  }, [userId]);

  const checkNotificationSupport = () => {
    const supported = 'serviceWorker' in navigator && 
                     'PushManager' in window && 
                     'Notification' in window;

    setState(prev => ({
      ...prev,
      supported,
      permission: supported ? Notification.permission : 'denied'
    }));

    if (!supported) {
      setState(prev => ({
        ...prev,
        error: 'Seu navegador não suporta notificações push'
      }));
    }
  };

  const checkCurrentSubscription = async () => {
    if (!('serviceWorker' in navigator)) return;

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      
      setState(prev => ({
        ...prev,
        subscribed: !!subscription
      }));
    } catch (error) {
      console.error('Erro ao verificar subscription:', error);
    }
  };

  const requestPermission = async (): Promise<boolean> => {
    if (!('Notification' in window)) {
      setState(prev => ({ ...prev, error: 'Este navegador não suporta notificações' }));
      return false;
    }

    const permission = await Notification.requestPermission();
    setState(prev => ({ ...prev, permission }));

    if (permission !== 'granted') {
      setState(prev => ({ 
        ...prev, 
        error: permission === 'denied' 
          ? 'Permissão negada. Você pode habilitar nas configurações do navegador.'
          : 'Permissão para notificações é necessária.'
      }));
      return false;
    }

    return true;
  };

  const urlBase64ToUint8Array = (base64String: string): Uint8Array => {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  };

  const subscribe = async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      // 1. Solicitar permissão
      const hasPermission = await requestPermission();
      if (!hasPermission) {
        setState(prev => ({ ...prev, loading: false }));
        return;
      }

      // 2. Registrar Service Worker
      const registration = await navigator.serviceWorker.ready;

      // 3. Verificar se VAPID key existe
      if (!VAPID_PUBLIC_KEY) {
        throw new Error('VAPID public key não configurada');
      }

      // 4. Criar subscription
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
      });

      console.log('[PUSH] Subscription criada:', subscription);

      // 5. Enviar subscription para o servidor
      const response = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscription,
          userId
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao salvar subscription');
      }

      const result = await response.json();
      console.log('[PUSH] Subscription salva:', result);

      setState(prev => ({
        ...prev,
        subscribed: true,
        loading: false
      }));

      toast({
        title: "Notificações Ativadas! ✈️",
        description: "Você receberá alertas importantes sobre voos e meteorologia.",
        duration: 5000
      });

    } catch (error: any) {
      console.error('[PUSH] Erro ao ativar notificações:', error);
      
      setState(prev => ({
        ...prev,
        loading: false,
        error: error.message || 'Erro ao ativar notificações'
      }));

      toast({
        title: "Erro ao Ativar Notificações",
        description: error.message || "Tente novamente ou verifique as configurações do navegador.",
        variant: "destructive"
      });
    }
  };

  const unsubscribe = async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        await subscription.unsubscribe();
      }

      // Notificar servidor
      const response = await fetch('/api/push/unsubscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          endpoint: subscription?.endpoint
        })
      });

      if (!response.ok) {
        console.warn('Erro ao notificar servidor sobre unsubscribe');
      }

      setState(prev => ({
        ...prev,
        subscribed: false,
        loading: false
      }));

      toast({
        title: "Notificações Desativadas",
        description: "Você não receberá mais alertas push deste dispositivo.",
        duration: 3000
      });

    } catch (error: any) {
      console.error('[PUSH] Erro ao desativar notificações:', error);
      
      setState(prev => ({
        ...prev,
        loading: false,
        error: error.message || 'Erro ao desativar notificações'
      }));
    }
  };

  const handleToggle = (checked: boolean) => {
    if (checked) {
      subscribe();
    } else {
      unsubscribe();
    }
  };

  const getStatusInfo = () => {
    if (!state.supported) {
      return {
        icon: XMarkIcon,
        title: "Não Suportado",
        description: "Seu navegador não suporta notificações push",
        color: "text-red-600"
      };
    }

    if (state.permission === 'denied') {
      return {
        icon: XMarkIcon,
        title: "Bloqueado",
        description: "Notificações foram bloqueadas. Habilite nas configurações do navegador.",
        color: "text-red-600"
      };
    }

    if (state.subscribed) {
      return {
        icon: CheckCircleIcon,
        title: "Ativo",
        description: "Você receberá notificações importantes neste dispositivo",
        color: "text-green-600"
      };
    }

    if (state.permission === 'granted') {
      return {
        icon: BellIcon,
        title: "Disponível",
        description: "Ative para receber alertas importantes",
        color: "text-blue-600"
      };
    }

    return {
      icon: BellSlashIcon,
      title: "Inativo",
      description: "Ative as notificações para receber alertas importantes",
      color: "text-gray-600"
    };
  };

  const statusInfo = getStatusInfo();
  const StatusIcon = statusInfo.icon;

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Status Card */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3">
            <div className={`p-2 rounded-full ${
              state.subscribed ? 'bg-green-100' : 
              state.permission === 'denied' ? 'bg-red-100' : 
              'bg-gray-100'
            }`}>
              <StatusIcon className={`h-5 w-5 ${statusInfo.color}`} />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900">
                Notificações Push
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                {statusInfo.description}
              </p>
            </div>
          </div>

          {/* Toggle Switch */}
          {state.supported && state.permission !== 'denied' && (
            <div className="flex items-center space-x-3">
              <Switch
                checked={state.subscribed}
                onCheckedChange={handleToggle}
                disabled={state.loading}
                aria-label="Ativar notificações push"
              />
            </div>
          )}
        </div>

        {/* Error Alert */}
        {state.error && (
          <Alert className="mt-4 border-red-200 bg-red-50">
            <ExclamationTriangleIcon className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              {state.error}
            </AlertDescription>
          </Alert>
        )}

        {/* Action Buttons */}
        <div className="mt-4 flex flex-wrap gap-2">
          {state.permission === 'denied' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                alert('Para habilitar notificações:\n\n1. Clique no ícone de cadeado na barra de endereços\n2. Altere "Notificações" para "Permitir"\n3. Recarregue a página');
              }}
            >
              Como Habilitar?
            </Button>
          )}

          {state.subscribed && (
            <Button
              variant="outline"
              size="sm"
              onClick={unsubscribe}
              disabled={state.loading}
            >
              Desativar Neste Dispositivo
            </Button>
          )}

          {!state.subscribed && state.supported && state.permission !== 'denied' && (
            <Button
              onClick={subscribe}
              disabled={state.loading}
              size="sm"
            >
              {state.loading ? 'Ativando...' : 'Ativar Notificações'}
            </Button>
          )}
        </div>
      </div>

      {/* Info Card */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <BellIcon className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">O que você receberá:</p>
            <ul className="space-y-1 text-blue-700">
              <li>• Alertas meteorológicos críticos</li>
              <li>• Lembretes de checklist antes do voo</li>
              <li>• Convites pendentes de agências</li>
              <li>• Comunicados importantes da AVIBAQ</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}