import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { MessageCircle, Users } from 'lucide-react';
import { motion } from 'framer-motion';

interface WhatsAppWelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onJoinWhatsApp: () => void;
  onMarkAsJoined: () => void;
  onSkip: () => void;
  hasShownBefore: boolean;
}

export function WhatsAppWelcomeModal({
  isOpen,
  onClose,
  onJoinWhatsApp,
  onMarkAsJoined,
  onSkip,
  hasShownBefore
}: WhatsAppWelcomeModalProps) {
  if (hasShownBefore) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-green-600" />
              Grupo WhatsApp AVIBAQ
            </DialogTitle>
            <DialogDescription>
              Você já entrou no grupo do WhatsApp da associação?
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex flex-col gap-3 mt-4">
            <Button 
              onClick={onMarkAsJoined}
              className="bg-green-600 hover:bg-green-700"
            >
              Sim, já entrei no grupo
            </Button>
            <Button 
              onClick={onJoinWhatsApp}
              variant="outline"
              className="border-green-600 text-green-600 hover:bg-green-50"
            >
              Não, entrar no grupo agora
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 0.5, repeat: 2 }}
            >
              <MessageCircle className="h-6 w-6 text-green-600" />
            </motion.div>
            Bem-vindo(a) à AVIBAQ!
          </DialogTitle>
          <DialogDescription className="text-base">
            Você já faz parte do grupo do WhatsApp da associação?
          </DialogDescription>
        </DialogHeader>
        
        <motion.div 
          className="bg-green-50 border border-green-200 rounded-lg p-4 my-4"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center gap-3 mb-3">
            <Users className="h-5 w-5 text-green-600" />
            <h3 className="font-semibold text-green-800">
              Grupo Exclusivo para Associados
            </h3>
          </div>
          <p className="text-green-700 text-sm">
            Este é o canal oficial de comunicação da AVIBAQ, onde compartilhamos:
          </p>
          <ul className="text-green-700 text-sm mt-2 space-y-1">
            <li>• Atualizações meteorológicas importantes</li>
            <li>• Avisos sobre operações de voo</li>
            <li>• Comunicados da diretoria</li>
            <li>• Networking entre pilotos e agências</li>
          </ul>
        </motion.div>

        <div className="flex flex-col gap-3">
          <Button 
            onClick={onJoinWhatsApp}
            className="bg-green-600 hover:bg-green-700 text-white"
            size="lg"
          >
            <MessageCircle className="h-4 w-4 mr-2" />
            Entrar no Grupo WhatsApp
          </Button>
          <Button 
            onClick={onSkip}
            variant="ghost"
            className="text-gray-600 hover:text-gray-800"
          >
            Agora não, perguntar depois
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}