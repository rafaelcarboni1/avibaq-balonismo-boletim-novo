# Teste do Fluxo Completo de Voos

## 🔑 Credenciais de Teste

### Piloto de Teste
- **Email:** joao.piloto@avibaq.test
- **Username:** piloto_teste
- **Senha:** teste123
- **ID do Membro:** 654ca703-b42d-4466-aa0f-cd6330370136
- **User ID:** 9c03e546-c85d-469e-87ad-7349055d4bfc

### Balão Associado
- **Prefixo:** PT-TST
- **Nome:** Balão Teste
- **Volume:** 6000 m³
- **ID:** 1e7243b4-fe12-49d9-848b-4ee9fa5da74e
- **Proprietário:** Piloto Teste

## Fluxo de Teste

### 1. Login
1. Acesse http://localhost:3001/login
2. Faça login com as credenciais:
   - Username: `piloto_teste`
   - Senha: `password`

### 2. Planejamento de Voo
1. Navegue para `/piloto/planejamento`
2. Preencha os dados do voo:
   - Data: Escolha uma data futura
   - Período: manhã/tarde
   - Horário: Defina horário de decolagem
   - Local: Escolha um local
   - Selecione o balão PT-TST
   - Defina quantidade de passageiros
3. Finalize o planejamento

### 3. Checklist do Voo
1. Após criar o voo, acesse a página de checklist
2. Complete os itens do checklist
3. Marque todos os itens obrigatórios

### 4. Finalização do Voo
1. Após completar o checklist, finalize o voo
2. Verifique se o status do voo foi atualizado

## Verificações no Banco

### Verificar Voo Criado
```sql
SELECT v.*, m.nome_completo as piloto_nome 
FROM voos v 
JOIN membros m ON v.piloto_id = m.id 
WHERE v.piloto_id = '654ca703-b42d-4466-aa0f-cd6330370136'
ORDER BY v.created_at DESC;
```

### Verificar Balões do Voo
```sql
SELECT vb.*, b.prefixo, b.nome_batismo 
FROM voos_baloes vb 
JOIN baloes b ON vb.balao_id = b.id 
JOIN voos v ON vb.voo_id = v.id 
WHERE v.piloto_id = '654ca703-b42d-4466-aa0f-cd6330370136';
```

### Verificar Checklist
```sql
SELECT ci.* 
FROM checklist_itens ci 
JOIN voos v ON ci.voo_id = v.id 
WHERE v.piloto_id = '654ca703-b42d-4466-aa0f-cd6330370136'
ORDER BY ci.bloco, ci.item_numero;
```

## Resultados Esperados

✅ **Login bem-sucedido** - Piloto consegue fazer login
✅ **Planejamento funcional** - Voo é criado com sucesso
✅ **Checklist operacional** - Itens são criados e podem ser marcados
✅ **Finalização correta** - Voo é finalizado e status atualizado
✅ **Dados consistentes** - Todas as tabelas relacionadas são atualizadas

## Limpeza Após Teste

```sql
-- Remover dados de teste
DELETE FROM checklist_itens WHERE voo_id IN (
    SELECT id FROM voos WHERE piloto_id = '654ca703-b42d-4466-aa0f-cd6330370136'
);

DELETE FROM voos_baloes WHERE voo_id IN (
    SELECT id FROM voos WHERE piloto_id = '654ca703-b42d-4466-aa0f-cd6330370136'
);

DELETE FROM voos WHERE piloto_id = '654ca703-b42d-4466-aa0f-cd6330370136';

DELETE FROM baloes WHERE id = '1e7243b4-fe12-49d9-848b-4ee9fa5da74e';

DELETE FROM membros WHERE id = '654ca703-b42d-4466-aa0f-cd6330370136';
```