-- SQL para verificar e corrigir inconsistência de proprietario_id do balão BR-RAF1
-- Execute este comando no Supabase Dashboard

-- 1. Verificar o balão BR-RAF1 e seu proprietario_id atual
SELECT 
    prefixo, 
    proprietario_id,
    ativo
FROM baloes 
WHERE prefixo = 'BR-RAF1';

-- 2. Verificar o membro Rafael e seu ID
SELECT 
    id,
    nome_completo,
    email,
    tipo
FROM membros 
WHERE nome_completo ILIKE '%Rafael%Carboni%';

-- 3. Verificar vinculos_agencia_piloto para encontrar o ID correto do Rafael
SELECT 
    v.piloto_id,
    m.nome_completo,
    m.email
FROM vinculos_agencia_piloto v
JOIN membros m ON v.piloto_id = m.id
WHERE m.nome_completo ILIKE '%Rafael%Carboni%';

-- 4. Atualizar o proprietario_id do balão BR-RAF1 para o ID correto do Rafael
-- (Execute somente após verificar os resultados das queries acima)
UPDATE baloes 
SET proprietario_id = '24a1a1f4-1304-4f45-98bc-8a9e89e533d0',
    updated_at = NOW()
WHERE prefixo = 'BR-RAF1';