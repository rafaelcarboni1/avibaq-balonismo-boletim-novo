#!/bin/bash

# Script para testar upload usando curl
echo "🚀 Testando upload com curl..."

# Carregar variáveis de ambiente
source .env.local

# Fazer login e obter token
echo "1️⃣ Fazendo login..."
LOGIN_RESPONSE=$(curl -s -X POST "$NEXT_PUBLIC_SUPABASE_URL/auth/v1/token?grant_type=password" \
  -H "apikey: $NEXT_PUBLIC_SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "rafaeldacunhacarboni@gmail.com",
    "password": "Rafinha885"
  }')

# Extrair token (usando jq se disponível, senão usar grep/sed)
if command -v jq &> /dev/null; then
  ACCESS_TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.access_token')
else
  ACCESS_TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"access_token":"[^"]*"' | cut -d'"' -f4)
fi

if [ "$ACCESS_TOKEN" = "null" ] || [ -z "$ACCESS_TOKEN" ]; then
  echo "❌ Erro no login:"
  echo "$LOGIN_RESPONSE"
  exit 1
fi

echo "✅ Login bem-sucedido"
echo "   Token: ${ACCESS_TOKEN:0:50}..."

# Buscar voo
echo "\n2️⃣ Buscando voo..."
VOO_ID="8c930b01-b679-4659-8224-3db8bd0b5d85"
echo "   Usando voo ID: $VOO_ID"

# Verificar se arquivo de teste existe
TEST_FILE="./scripts/test-image.jpg"
if [ ! -f "$TEST_FILE" ]; then
  echo "\n3️⃣ Criando arquivo de teste..."
  # Criar um arquivo JPEG mínimo
  printf '\xff\xd8\xff\xe0\x00\x10JFIF\x00\x01\x01\x01\x00H\x00H\x00\x00\xff\xd9' > "$TEST_FILE"
  echo "✅ Arquivo criado: $TEST_FILE"
fi

# Fazer upload
echo "\n4️⃣ Fazendo upload..."
UPLOAD_URL="http://localhost:3000/api/voos/$VOO_ID/anexos/upload"

echo "   URL: $UPLOAD_URL"
echo "   Arquivo: $TEST_FILE"
echo "   Tipo: foto_voo"

RESPONSE=$(curl -v -X POST "$UPLOAD_URL" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -F "file=@$TEST_FILE;type=image/jpeg" \
  -F "tipo=foto_voo" \
  2>&1)

echo "\n📊 Resposta completa:"
echo "$RESPONSE"

echo "\n🏁 Teste concluído!"