-- SQL para ativar o balão BR-RAF1 do piloto Rafael
-- Execute este comando no Supabase Dashboard

-- Verificar o status atual do balão BR-RAF1
SELECT prefixo, ativo, proprietario_id 
FROM baloes 
WHERE prefixo = 'BR-RAF1';

-- Ativar o balão BR-RAF1
UPDATE baloes 
SET ativo = true, 
    updated_at = NOW()
WHERE prefixo = 'BR-RAF1';

-- Verificar se foi atualizado
SELECT prefixo, ativo, proprietario_id, updated_at
FROM baloes 
WHERE prefixo = 'BR-RAF1';