-- Adiciona campos para controlar o modal de boas-vindas do grupo WhatsApp
ALTER TABLE users 
ADD COLUMN whatsapp_group_joined boolean DEFAULT false,
ADD COLUMN whatsapp_modal_shown boolean DEFAULT false;