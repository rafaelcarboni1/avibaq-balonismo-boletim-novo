# 🔧 CORREÇÃO CONFIGURAÇÃO SUPABASE - RECUPERAÇÃO DE SENHA

## Problema Identificado
- Link do email redireciona para homepage em vez de `/redefinir-senha`
- Causa: Redirect URLs não configuradas no painel Supabase

## Solução no Painel Supabase

### 1. Acessar Configurações
```
Supabase Dashboard → Authentication → URL Configuration
```

### 2. Configurar Site URL
```
Site URL: https://avibaq-balonismo-boletim-novo.vercel.app
```

### 3. Adicionar Redirect URLs
```
Redirect URLs (adicionar ambas):
- http://localhost:3000/redefinir-senha
- https://avibaq-balonismo-boletim-novo.vercel.app/redefinir-senha
```

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