# Correção das Políticas RLS para Upload de Anexos

**Data:** 18/07/2024  
**Problema:** Erro no upload de anexos devido a políticas RLS incorretas

## Problema Identificado

As políticas RLS (Row Level Security) da tabela `voos_anexos` e do storage `voos-anexos` estavam fazendo comparações incorretas:

- **Tabela `voos_anexos`**: Comparava `piloto_id` e `agencia_id` diretamente com `auth.uid()`, mas esses campos referenciam a tabela `membros`, não `users`
- **Storage**: Faltava política para administradores e a política de agências era muito permissiva

## Correções Aplicadas

### 1. Políticas da Tabela `voos_anexos`

Corrigidas todas as políticas (SELECT, INSERT, UPDATE, DELETE) para fazer JOIN correto:

```sql
-- Exemplo da política corrigida
CREATE POLICY "Usuários podem ver anexos dos voos que têm acesso" ON voos_anexos
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM voos v
      JOIN membros m_piloto ON m_piloto.id = v.piloto_id
      LEFT JOIN membros m_agencia ON m_agencia.id = v.agencia_id
      WHERE v.id = voos_anexos.voo_id
      AND (
        m_piloto.user_id = auth.uid() OR
        m_agencia.user_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM usuarios_admin ua
          WHERE ua.id = auth.uid() AND ua.ativo = true
        )
      )
    )
  );
```

### 2. Políticas do Storage

- **Adicionada**: Política para administradores com acesso completo
- **Corrigida**: Política para agências (apenas voos que gerenciam, não todos)
- **Mantidas**: Políticas existentes para pilotos

```sql
-- Nova política para administradores
CREATE POLICY "Administradores podem acessar todos os anexos" ON storage.objects
  FOR ALL USING (
    bucket_id = 'voos-anexos' AND
    EXISTS (
      SELECT 1 FROM usuarios_admin ua
      WHERE ua.id = auth.uid() AND ua.ativo = true
    )
  );
```

## Resultado

Agora o sistema consegue vincular corretamente os arquivos do storage com a tabela `voos_anexos`, respeitando as permissões de cada tipo de usuário:

- ✅ **Pilotos**: Podem gerenciar anexos dos próprios voos
- ✅ **Agências**: Podem gerenciar anexos dos voos que supervisionam
- ✅ **Administradores**: Podem gerenciar todos os anexos

## Migrações Aplicadas

1. `fix_voos_anexos_policies` - Correção das políticas da tabela
2. `fix_storage_policies` - Correção das políticas do storage

## Testes Recomendados

- [ ] Upload de anexo como piloto
- [ ] Upload de anexo como agência
- [ ] Upload de anexo como administrador
- [ ] Verificar que usuários não conseguem acessar anexos de voos de outros