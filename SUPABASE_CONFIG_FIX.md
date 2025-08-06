# 🔧 CORREÇÃO CONFIGURAÇÃO SUPABASE - RECUPERAÇÃO DE SENHA

## Problema Identificado
- Link do email redireciona para homepage em vez de `/redefinir-senha`
- Causa: Redirect URLs não configuradas no painel Supabase

## Solução no Painel Supabase

### 1. Acessar Configurações
```
Supabase Dashboard → Authentication → URL Configuration
```

### 2. Configurar Site URL (manter o principal)
```
Site URL: https://avibaq.org
```

### 3. Adicionar Redirect URLs (CRÍTICO!)
```
Redirect URLs (adicionar todas essas):
- http://localhost:3000/**
- https://avibaq-balonismo-boletim-novo.vercel.app/**
- https://avibaq.org/**
```

**IMPORTANTE**: O problema é que o Supabase só aceita redirectTo para URLs que estão na lista de Redirect URLs. Como o link do email está indo para avibaq.org em vez da URL do Vercel, precisa adicionar ambas as URLs.

### 4. Salvar Configurações
Clicar "Save" após adicionar as URLs

## Como Testar
1. Configurar URLs no Supabase
2. Solicitar nova recuperação de senha
3. Clicar no link do email
4. Deve ir para `/redefinir-senha` com logs no console

## URLs que devem funcionar
- Local: http://localhost:3000/redefinir-senha
- Produção: https://avibaq-balonismo-boletim-novo.vercel.app/redefinir-senha

## Status
- [ ] Site URL configurada
- [ ] Redirect URLs adicionadas  
- [ ] Teste de recuperação realizado
- [ ] Logs de debug funcionando