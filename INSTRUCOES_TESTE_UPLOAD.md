# 🧪 INSTRUÇÕES PARA TESTE DE UPLOAD

## 🎯 Situação Atual
- **Upload chega ao Storage**: ✅ Confirmado pelos logs do Supabase
- **Problema**: Upload não está sendo salvo no banco de dados
- **Logs adicionados**: API agora tem logs detalhados

## 📋 TESTE PASSO A PASSO

### 1. 🔧 Executar Diagnóstico Detalhado
```bash
cd "/Users/rafaelcarboni/Documents/AVIBAQ - 1.0/avibaq-balonismo-boletim"
node scripts/debug-upload-detailed.js
```

### 2. 🚀 Garantir que Servidor Está Rodando
```bash
# Se não estiver rodando
npm run dev

# Aguardar até ver: "Ready in X.Xs"
# Ignorar warnings de Fast Refresh
```

### 3. 🧪 Testar Upload na Interface
1. **Abrir navegador**: `http://localhost:3000`
2. **Fazer login**: `rafaeldacunhacarboni@gmail.com` + sua senha
3. **Acessar página**: `http://localhost:3000/piloto/pos-voo/8c930b01-b679-4659-8224-3db8bd0b5d85`
4. **Scroll até "Anexos do Voo"**
5. **Clicar em "Escolher Arquivo"** (qualquer seção)
6. **Selecionar arquivo pequeno** (< 5MB)

### 4. 📊 Observar Logs Detalhados
**No terminal onde `npm run dev` está rodando, você deve ver:**

```
🚀 [UPLOAD] Iniciando handler de upload
🚀 [UPLOAD] Método: POST
🚀 [UPLOAD] Headers: {...}
🚀 [UPLOAD] Voo ID: 8c930b01-b679-4659-8224-3db8bd0b5d85
🔐 [UPLOAD] Verificando autenticação...
🔐 [UPLOAD] Token recebido: ey...
✅ [UPLOAD] Usuário autenticado: rafaeldacunhacarboni@gmail.com
👤 [UPLOAD] Verificando se usuário é piloto...
✅ [UPLOAD] Usuário é piloto, ID: 24a1a1f4-1304-4f45-98bc-8a9e89e533d0
📦 [UPLOAD] Parseando formulário multipart...
📦 [UPLOAD] Fields recebidos: {...}
📦 [UPLOAD] Files recebidos: [...] 
📦 [UPLOAD] Tipo extraído: foto_voo
📦 [UPLOAD] File extraído: arquivo.jpg (12345 bytes)
Iniciando upload para Storage: voos/8c930b01-b679-4659-8224-3db8bd0b5d85/...
Upload para Storage concluído: {...}
Salvando anexo no banco: {...}
Anexo salvo no banco com sucesso: uuid...
🎉 [UPLOAD] Upload completo com sucesso!
🎉 [UPLOAD] Anexo ID: uuid...
🎉 [UPLOAD] URL: https://...
```

### 5. 🔍 Identificar Onde Para o Processo
**Se o upload falhar, os logs mostrarão EXATAMENTE onde:**

#### Possível Erro 1: Autenticação
```
❌ [UPLOAD] Token não fornecido ou formato inválido
```
**Solução**: Usuário não está logado

#### Possível Erro 2: Usuário não é piloto
```
❌ [UPLOAD] Usuário não é piloto: ...
```
**Solução**: Verificar se usuário tem role correto

#### Possível Erro 3: Erro no parse do arquivo
```
📦 [UPLOAD] File extraído: Não encontrado
```
**Solução**: Problema no formidable/multipart

#### Possível Erro 4: Erro no Storage
```
Erro no upload para Storage: ...
```
**Solução**: Problema nas políticas do Storage

#### Possível Erro 5: Erro no banco
```
Erro ao salvar anexo no banco: ...
```
**Solução**: Problema nas políticas RLS da tabela

### 6. 📋 Executar Diagnóstico Pós-Teste
```bash
node scripts/debug-upload-detailed.js
```

Este script irá mostrar:
- Quantos arquivos estão no Storage
- Quantos registros estão no banco
- Se há divergência entre Storage e banco

## 🎯 RESULTADO ESPERADO

**SE TUDO FUNCIONAR:**
- Console mostrará todos os logs de sucesso
- Arquivo aparecerá na lista de anexos
- Diagnóstico mostrará Storage e banco sincronizados

**SE HOUVER PROBLEMA:**
- Logs mostrarão exatamente onde falhou
- Diagnóstico identificará se é Storage ou banco
- Poderemos corrigir o problema específico

## 🔥 EXECUTE AGORA!

1. `node scripts/debug-upload-detailed.js`
2. Teste upload na interface
3. Copie e cole TODOS os logs do terminal
4. Execute diagnóstico novamente para comparar

**Os logs detalhados mostrarão exatamente onde está o problema!**