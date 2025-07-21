import { NextApiRequest, NextApiResponse } from 'next';
import JSZip from 'jszip';
import { supabase } from '../../../../src/integrations/supabase/client';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.query;
  
  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'ID do voo é obrigatório' });
  }

  try {
    // Buscar dados completos do voo
    const { data: voo, error: vooError } = await supabase
      .from('voos')
      .select(`
        *,
        voos_baloes (
          baloes (
            id,
            prefixo,
            nome_batismo,
            volume_m3
          )
        ),
        voos_anexos (
          id,
          tipo,
          nome_arquivo,
          url_storage,
          tamanho_bytes,
          mime_type
        )
      `)
      .eq('id', id)
      .single();

    if (vooError || !voo) {
      return res.status(404).json({ error: 'Voo não encontrado' });
    }

    // Buscar dados do piloto
    const { data: piloto, error: pilotoError } = await supabase
      .from('membros')
      .select('nome_completo, email')
      .eq('id', voo.piloto_id)
      .single();

    // Criar ZIP
    const zip = new JSZip();

    // 1. Adicionar dados estruturados do voo (JSON)
    const vooDetalhes = {
      id: voo.id,
      data_voo: voo.data_voo,
      periodo: voo.periodo,
      horario_previsto: voo.horario_previsto,
      status: voo.status,
      piloto: piloto?.nome_completo || 'Não informado',
      email_piloto: piloto?.email || 'Não informado',
      local_decolagem_previsto: voo.local_decolagem_previsto,
      local_pouso: voo.local_pouso,
      adultos_previstos: voo.adultos_previstos,
      criancas_previstas: voo.criancas_previstas,
      adultos_transportados: voo.adultos_transportados,
      criancas_transportadas: voo.criancas_transportadas,
      duracao_minutos: voo.duracao_minutos,
      altitude_maxima: voo.altitude_maxima,
      observacoes_pos_voo: voo.observacoes_pos_voo,
      motivo_cancelamento: voo.motivo_cancelamento,
      created_at: voo.created_at,
      updated_at: voo.updated_at,
      baloes: voo.voos_baloes?.map((vb: any) => vb.baloes) || [],
      anexos: voo.voos_anexos || []
    };

    zip.file('voo-detalhes.json', JSON.stringify(vooDetalhes, null, 2));

    // 2. Adicionar relatório legível (TXT)
    const relatorio = `
RELATÓRIO DE VOO - AVIBAQ
=======================

DATA DO VOO: ${voo.data_voo}
PERÍODO: ${voo.periodo === 'manha' ? 'Manhã' : 'Tarde'}
HORÁRIO: ${voo.horario_previsto}
STATUS: ${voo.status}
PILOTO: ${piloto?.nome_completo || 'Não informado'}

DETALHES DO VOO
===============
Local de Decolagem: ${voo.local_decolagem_previsto || 'Não informado'}
Local de Pouso: ${voo.local_pouso || 'Não informado'}
Duração: ${voo.duracao_minutos ? `${voo.duracao_minutos} minutos` : 'Não informado'}
Altitude Máxima: ${voo.altitude_maxima ? `${voo.altitude_maxima}m` : 'Não informado'}

PASSAGEIROS
===========
Adultos Previstos: ${voo.adultos_previstos}
Crianças Previstas: ${voo.criancas_previstas}
${voo.status === 'finalizado' ? `
Adultos Transportados: ${voo.adultos_transportados || 0}
Crianças Transportadas: ${voo.criancas_transportadas || 0}
Total Transportado: ${(voo.adultos_transportados || 0) + (voo.criancas_transportadas || 0)}
` : ''}

BALÕES UTILIZADOS
=================
${vooDetalhes.baloes.length > 0 ? 
  vooDetalhes.baloes.map((b: any) => 
    `- ${b.prefixo}${b.nome_batismo ? ` (${b.nome_batismo})` : ''} - ${b.volume_m3}m³`
  ).join('\n') : 
  'Nenhum balão registrado'
}

${voo.observacoes_pos_voo ? `
OBSERVAÇÕES
===========
${voo.observacoes_pos_voo}
` : ''}

${voo.motivo_cancelamento ? `
CANCELAMENTO
============
Motivo: ${voo.motivo_cancelamento}
` : ''}

ANEXOS
======
Total de anexos: ${vooDetalhes.anexos.length}
${vooDetalhes.anexos.map((a: any) => `- ${a.nome_arquivo} (${a.tipo})`).join('\n')}

=======================================
Relatório gerado em: ${new Date().toLocaleString('pt-BR')}
Sistema AVIBAQ - Associação de Pilotos e Empresas de Balonismo
    `.trim();

    zip.file('relatorio-voo.txt', relatorio);

    // 3. Baixar e adicionar anexos
    const anexosFolder = zip.folder('anexos');
    
    if (voo.voos_anexos && voo.voos_anexos.length > 0) {
      for (const anexo of voo.voos_anexos) {
        try {
          // Baixar arquivo do Supabase Storage
          const response = await fetch(anexo.url_storage);
          if (response.ok) {
            const arrayBuffer = await response.arrayBuffer();
            
            // Organizar por tipo
            const tipoFolder = anexosFolder?.folder(anexo.tipo) || anexosFolder;
            tipoFolder?.file(anexo.nome_arquivo, arrayBuffer);
          }
        } catch (error) {
          console.error(`Erro ao baixar anexo ${anexo.nome_arquivo}:`, error);
          // Continua mesmo se um anexo falhar
        }
      }
    }

    // Gerar ZIP
    const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });

    // Configurar headers para download
    const nomeArquivo = `voo-${voo.data_voo}-${voo.periodo}-${piloto?.nome_completo?.replace(/\s+/g, '-') || 'piloto'}.zip`;
    
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${nomeArquivo}"`);
    res.setHeader('Content-Length', zipBuffer.length);

    res.send(zipBuffer);

  } catch (error) {
    console.error('Erro ao gerar ZIP:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

export const config = {
  api: {
    responseLimit: '50mb', // Aumentar limite para arquivos grandes
  },
};