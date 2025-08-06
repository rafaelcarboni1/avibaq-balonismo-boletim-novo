import { useState } from 'react';

export default function TestPost() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testPostRequest = async () => {
    setLoading(true);
    try {
      console.log('🧪 Testando POST request...');
      
      const response = await fetch('/api/test-post-only', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ test: 'data' })
      });

      console.log('📡 Response status:', response.status);
      console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()));

      const data = await response.text();
      console.log('📡 Response text:', data);

      if (data) {
        try {
          const jsonData = JSON.parse(data);
          setResult({ status: response.status, data: jsonData });
        } catch {
          setResult({ status: response.status, data: data, error: 'Invalid JSON' });
        }
      } else {
        setResult({ status: response.status, error: 'Empty response' });
      }

    } catch (error) {
      console.error('❌ Erro no POST:', error);
      setResult({ error: error instanceof Error ? error.message : String(error) });
    }
    setLoading(false);
  };

  const testUploadPost = async () => {
    setLoading(true);
    try {
      console.log('🧪 Testando upload POST request...');
      
      const response = await fetch('/api/upload-anexo?vooId=test123', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ test: 'upload data' })
      });

      console.log('📡 Upload Response status:', response.status);
      
      const data = await response.text();
      console.log('📡 Upload Response text:', data);

      if (data) {
        try {
          const jsonData = JSON.parse(data);
          setResult({ status: response.status, data: jsonData, type: 'upload' });
        } catch {
          setResult({ status: response.status, data: data, error: 'Invalid JSON', type: 'upload' });
        }
      } else {
        setResult({ status: response.status, error: 'Empty response', type: 'upload' });
      }

    } catch (error) {
      console.error('❌ Erro no upload POST:', error);
      setResult({ error: error instanceof Error ? error.message : String(error), type: 'upload' });
    }
    setLoading(false);
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h1>🧪 Teste de POST Request</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <button 
          onClick={testPostRequest}
          disabled={loading}
          style={{ 
            padding: '10px 20px', 
            marginRight: '10px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          {loading ? 'Testando...' : 'Testar POST /api/test-post-only'}
        </button>

        <button 
          onClick={testUploadPost}
          disabled={loading}
          style={{ 
            padding: '10px 20px', 
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          {loading ? 'Testando...' : 'Testar POST /api/upload-anexo'}
        </button>
      </div>

      {result && (
        <div style={{ 
          background: '#f8f9fa', 
          padding: '15px', 
          borderRadius: '4px',
          border: '1px solid #dee2e6'
        }}>
          <h3>📊 Resultado:</h3>
          <pre style={{ whiteSpace: 'pre-wrap' }}>
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}

      <div style={{ marginTop: '20px', fontSize: '14px', color: '#666' }}>
        <p><strong>Instruções:</strong></p>
        <p>1. Clique nos botões para testar POST requests</p>
        <p>2. Abra o DevTools (F12) e veja os logs no Console</p>
        <p>3. Se POST funcionar, status deve ser 200</p>
        <p>4. Se ainda der 405, então CORS não resolveu o problema</p>
      </div>
    </div>
  );
}