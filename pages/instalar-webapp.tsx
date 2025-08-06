import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import {
  DevicePhoneMobileIcon,
  ComputerDesktopIcon,
  CloudArrowDownIcon,
  WifiIcon,
  BoltIcon,
  ShieldCheckIcon,
  ArrowDownTrayIcon,
  ShareIcon,
  PlusIcon,
  Cog6ToothIcon
} from '@heroicons/react/24/outline';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export default function InstalarWebApp() {
  const router = useRouter();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [userAgent, setUserAgent] = useState('');

  useEffect(() => {
    setUserAgent(navigator.userAgent);

    // Verifica se já está instalado
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    // Listener para o evento beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsInstallable(true);
    };

    // Listener para quando o app é instalado
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
      setIsInstallable(false);
    }
  };

  const isIOS = () => {
    return /iPad|iPhone|iPod/.test(userAgent) && !(window as any).MSStream;
  };

  const isAndroid = () => {
    return /Android/.test(userAgent);
  };

  const isSafari = () => {
    return /Safari/.test(userAgent) && !/Chrome/.test(userAgent);
  };

  const benefits = [
    {
      icon: BoltIcon,
      title: 'Acesso Rápido',
      description: 'Abra o app diretamente da tela inicial, sem precisar abrir o navegador'
    },
    {
      icon: WifiIcon,
      title: 'Funciona Offline',
      description: 'Continue trabalhando mesmo sem conexão com a internet'
    },
    {
      icon: ShieldCheckIcon,
      title: 'Seguro e Confiável',
      description: 'Dados protegidos e sincronização automática quando online'
    },
    {
      icon: CloudArrowDownIcon,
      title: 'Atualizações Automáticas',
      description: 'Sempre tenha a versão mais recente sem precisar baixar nada'
    }
  ];

  return (
    <>
      <Head>
        <title>Instalar WebApp - AVIBAQ</title>
        <meta name="description" content="Instale o aplicativo AVIBAQ em seu dispositivo para acesso rápido e funcionalidade offline" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
        {/* Header */}
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-4xl mx-auto px-4 py-6">
            <div className="flex items-center gap-4">
              <img
                src="https://elcbodhxzvoqpzamgown.supabase.co/storage/v1/object/public/public-assets/Logo%20AVIBAQ.png"
                alt="AVIBAQ"
                className="h-12 w-12 rounded-lg"
              />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Instalar WebApp AVIBAQ</h1>
                <p className="text-gray-600">Tenha acesso rápido ao sistema meteorológico</p>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 py-8">
          {/* Hero Section com Botão Principal */}
          <div className="text-center mb-12">
            <div className="mb-8">
              <ArrowDownTrayIcon className="h-20 w-20 text-blue-600 mx-auto mb-6" />
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Instale o App AVIBAQ</h2>
              <p className="text-xl text-gray-600 mb-8">Acesso rápido, funciona offline e sempre atualizado</p>
            </div>

            {/* Status do App */}
            {isInstalled ? (
              <div className="mb-8 p-8 bg-green-50 border border-green-200 rounded-2xl">
                <div className="flex flex-col items-center gap-4">
                  <ShieldCheckIcon className="h-16 w-16 text-green-600" />
                  <div>
                    <h3 className="text-2xl font-semibold text-green-800 mb-2">App Já Instalado!</h3>
                    <p className="text-green-700 text-lg">O AVIBAQ WebApp já está instalado em seu dispositivo.</p>
                  </div>
                  <button
                    onClick={() => router.back()}
                    className="mt-4 px-8 py-4 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition-colors text-lg"
                  >
                    Voltar ao App
                  </button>
                </div>
              </div>
            ) : isInstallable ? (
              <div className="mb-8 p-8 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-2xl">
                <div className="text-center">
                  <div className="mb-6">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-100 rounded-full mb-4">
                      <ArrowDownTrayIcon className="h-12 w-12 text-blue-600" />
                    </div>
                    <h3 className="text-2xl font-semibold text-blue-800 mb-2">Pronto para Instalar!</h3>
                    <p className="text-blue-700 text-lg mb-6">Seu dispositivo suporta instalação automática</p>
                  </div>
                  <button
                    onClick={handleInstallClick}
                    className="px-12 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-bold hover:from-blue-700 hover:to-purple-700 transition-all transform hover:scale-105 text-xl shadow-lg"
                  >
                    🚀 Instalar Agora
                  </button>
                  <p className="text-sm text-gray-600 mt-4">Instalação com um clique • Sem downloads • Seguro</p>
                </div>
              </div>
            ) : (
              <div className="mb-8 p-8 bg-yellow-50 border border-yellow-200 rounded-2xl">
                <div className="text-center">
                  <div className="mb-6">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-yellow-100 rounded-full mb-4">
                      <DevicePhoneMobileIcon className="h-12 w-12 text-yellow-600" />
                    </div>
                    <h3 className="text-2xl font-semibold text-yellow-800 mb-2">Instalação Manual</h3>
                    <p className="text-yellow-700 text-lg mb-6">Siga as instruções abaixo para instalar em seu dispositivo</p>
                  </div>
                  <div className="inline-flex items-center gap-2 px-6 py-3 bg-yellow-100 rounded-lg">
                    <span className="text-yellow-800 font-semibold">📱 Veja as instruções abaixo</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Benefícios */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Por que instalar o WebApp?</h2>
            <div className="grid md:grid-cols-2 gap-6">
              {benefits.map((benefit, index) => {
                const Icon = benefit.icon;
                return (
                  <div key={index} className="p-6 bg-white rounded-xl shadow-sm border">
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-blue-100 rounded-lg">
                        <Icon className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-2">{benefit.title}</h3>
                        <p className="text-gray-600">{benefit.description}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Instruções por Dispositivo */}
          <div className="space-y-8">
            <h2 className="text-2xl font-bold text-gray-900 text-center">Como Instalar</h2>

            {/* iOS Safari */}
            {isIOS() && (
              <div className="p-6 bg-white rounded-xl shadow-sm border">
                <div className="flex items-center gap-3 mb-4">
                  <DevicePhoneMobileIcon className="h-8 w-8 text-blue-600" />
                  <h3 className="text-xl font-semibold text-gray-900">iPhone/iPad (Safari)</h3>
                </div>
                <div className="space-y-3 text-gray-700">
                  <div className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-semibold">1</span>
                    <p>Abra este site no <strong>Safari</strong></p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-semibold">2</span>
                    <div className="flex items-center gap-2">
                      <p>Toque no botão de compartilhar</p>
                      <ShareIcon className="h-5 w-5 text-blue-600" />
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-semibold">3</span>
                    <div className="flex items-center gap-2">
                      <p>Selecione "Adicionar à Tela de Início"</p>
                      <PlusIcon className="h-5 w-5 text-blue-600" />
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-semibold">4</span>
                    <p>Toque em "Adicionar" para confirmar</p>
                  </div>
                </div>
              </div>
            )}

            {/* Android Chrome */}
            {isAndroid() && (
              <div className="p-6 bg-white rounded-xl shadow-sm border">
                <div className="flex items-center gap-3 mb-4">
                  <DevicePhoneMobileIcon className="h-8 w-8 text-green-600" />
                  <h3 className="text-xl font-semibold text-gray-900">Android (Chrome)</h3>
                </div>
                <div className="space-y-3 text-gray-700">
                  <div className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-sm font-semibold">1</span>
                    <p>Abra este site no <strong>Chrome</strong></p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-sm font-semibold">2</span>
                    <div className="flex items-center gap-2">
                      <p>Toque no menu (três pontos)</p>
                      <Cog6ToothIcon className="h-5 w-5 text-green-600" />
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-sm font-semibold">3</span>
                    <p>Selecione "Instalar app" ou "Adicionar à tela inicial"</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-sm font-semibold">4</span>
                    <p>Confirme a instalação</p>
                  </div>
                </div>
              </div>
            )}

            {/* Desktop */}
            <div className="p-6 bg-white rounded-xl shadow-sm border">
              <div className="flex items-center gap-3 mb-4">
                <ComputerDesktopIcon className="h-8 w-8 text-purple-600" />
                <h3 className="text-xl font-semibold text-gray-900">Desktop (Chrome/Edge)</h3>
              </div>
              <div className="space-y-3 text-gray-700">
                <div className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-sm font-semibold">1</span>
                  <p>Abra este site no <strong>Chrome</strong> ou <strong>Edge</strong></p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-sm font-semibold">2</span>
                  <p>Procure pelo ícone de instalação na barra de endereços</p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-sm font-semibold">3</span>
                  <p>Clique em "Instalar" quando aparecer a notificação</p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-sm font-semibold">4</span>
                  <p>O app será adicionado ao seu sistema operacional</p>
                </div>
              </div>
            </div>
          </div>

          {/* Botão Voltar */}
          <div className="mt-8 text-center">
            <button
              onClick={() => router.back()}
              className="px-6 py-3 bg-gray-600 text-white rounded-lg font-semibold hover:bg-gray-700 transition-colors"
            >
              Voltar
            </button>
          </div>
        </div>
      </div>
    </>
  );
}