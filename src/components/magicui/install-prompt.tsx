/**
 * Componente para prompt de instalação PWA
 * Detecta quando a instalação está disponível e mostra um banner
 */

import React, { useState, useEffect } from 'react';
import { XMarkIcon, ArrowDownTrayIcon, DevicePhoneMobileIcon } from '@heroicons/react/24/outline';
import { Button } from '../ui/button';
import { MagicCard } from './magic-card';
import { usePWA } from '../providers/PWAProvider';

interface InstallPromptProps {
  className?: string;
}

export function InstallPrompt({ className = '' }: InstallPromptProps) {
  const { canInstall, install, isInstalled } = usePWA();
  const [showPrompt, setShowPrompt] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);

  useEffect(() => {
    // Detectar iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(iOS);
    
    // Detectar Android
    const android = /Android/.test(navigator.userAgent);
    setIsAndroid(android);
    
    // Verificar se foi dispensado anteriormente
    const dismissed = localStorage.getItem('pwa_install_dismissed');
    setIsDismissed(!!dismissed);
    
    // Mostrar prompt se pode instalar e não foi dispensado
    setShowPrompt(canInstall && !isDismissed && !isInstalled);
  }, [canInstall, isDismissed, isInstalled]);

  const handleInstall = async () => {
    try {
      await install();
      setShowPrompt(false);
    } catch (error) {
      console.error('Erro ao instalar PWA:', error);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    setIsDismissed(true);
    localStorage.setItem('pwa_install_dismissed', 'true');
  };

  // Instruções específicas para iOS
  const IOSInstructions = () => (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-blue-600">
        <DevicePhoneMobileIcon className="h-5 w-5" />
        <span className="font-medium">Como instalar no iOS:</span>
      </div>
      <ol className="text-sm space-y-2 text-gray-600">
        <li className="flex gap-2">
          <span className="font-medium text-blue-600">1.</span>
          Toque no ícone de compartilhar (□↗) na barra do Safari
        </li>
        <li className="flex gap-2">
          <span className="font-medium text-blue-600">2.</span>
          Role para baixo e toque em "Adicionar à Tela de Início"
        </li>
        <li className="flex gap-2">
          <span className="font-medium text-blue-600">3.</span>
          Confirme tocando em "Adicionar"
        </li>
      </ol>
    </div>
  );

  // Instruções específicas para Android
  const AndroidInstructions = () => (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-blue-600">
        <DevicePhoneMobileIcon className="h-5 w-5" />
        <span className="font-medium">Como instalar no Android:</span>
      </div>
      <ol className="text-sm space-y-2 text-gray-600">
        <li className="flex gap-2">
          <span className="font-medium text-blue-600">1.</span>
          Toque no menu (⋮) do Chrome
        </li>
        <li className="flex gap-2">
          <span className="font-medium text-blue-600">2.</span>
          Selecione "Adicionar à tela inicial" ou "Instalar app"
        </li>
        <li className="flex gap-2">
          <span className="font-medium text-blue-600">3.</span>
          Confirme a instalação
        </li>
      </ol>
    </div>
  );

  // Não mostrar nada se instalado ou dispensado
  if (isInstalled || !showPrompt) {
    return null;
  }

  return (
    <MagicCard className={`border-blue-200 bg-blue-50 ${className}`}>
      <div className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <ArrowDownTrayIcon className="h-5 w-5 text-blue-600" />
              <h3 className="font-semibold text-blue-900">
                Instalar AVIBAQ App
              </h3>
            </div>
            
            <p className="text-sm text-blue-700 mb-3">
              Instale nosso app para acesso rápido, funcionalidade offline e melhor experiência mobile!
            </p>

            {/* Instruções específicas por plataforma */}
            {isIOS && <IOSInstructions />}
            {isAndroid && !canInstall && <AndroidInstructions />}
            
            {/* Botão de instalação automática (desktop/Chrome) */}
            {canInstall && !isIOS && (
              <div className="mt-3">
                <Button 
                  onClick={handleInstall}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                  size="sm"
                >
                  <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
                  Instalar App
                </Button>
              </div>
            )}
          </div>
          
          <button
            onClick={handleDismiss}
            className="p-1 text-blue-400 hover:text-blue-600 transition-colors"
            title="Dispensar"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
      </div>
    </MagicCard>
  );
}

// Componente menor para usar em headers/footers
export function InstallBadge({ className = '' }: InstallPromptProps) {
  const { canInstall, install, isInstalled } = usePWA();
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    setIsIOS(/iPad|iPhone|iPod/.test(navigator.userAgent));
  }, []);

  if (isInstalled || (!canInstall && !isIOS)) {
    return null;
  }

  const handleClick = async () => {
    if (canInstall) {
      try {
        await install();
      } catch (error) {
        console.error('Erro ao instalar PWA:', error);
      }
    } else if (isIOS) {
      // Para iOS, mostrar instruções
      alert('Para instalar:\n1. Toque no ícone compartilhar (□↗)\n2. Selecione "Adicionar à Tela de Início"\n3. Confirme tocando em "Adicionar"');
    }
  };

  return (
    <button
      onClick={handleClick}
      className={`flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm ${className}`}
      title="Instalar App"
    >
      <ArrowDownTrayIcon className="h-4 w-4" />
      <span className="hidden sm:inline">Instalar App</span>
    </button>
  );
}

export default InstallPrompt;