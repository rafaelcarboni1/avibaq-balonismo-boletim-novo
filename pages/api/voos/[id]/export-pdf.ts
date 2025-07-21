import { NextApiRequest, NextApiResponse } from 'next';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
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
      .select('nome_completo, email, telefone')
      .eq('id', voo.piloto_id)
      .single();

    // Criar PDF
    const pdf = new jsPDF();
    
    // Configurações
    const primaryColor = [59, 130, 246]; // Blue
    const secondaryColor = [107, 114, 128]; // Gray
    let yPosition = 20;

    // Função helper para adicionar nova página se necessário
    const checkPageBreak = (requiredSpace: number = 20) => {
      if (yPosition + requiredSpace > 280) {
        pdf.addPage();
        yPosition = 20;
        return true;
      }
      return false;
    };

    // CABEÇALHO
    pdf.setFillColor(...primaryColor);
    pdf.rect(0, 0, 210, 30, 'F');
    
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(20);
    pdf.setFont('helvetica', 'bold');
    pdf.text('AVIBAQ', 15, 15);
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'normal');
    pdf.text('Associação de Pilotos e Empresas de Balonismo', 15, 22);

    // Título do relatório
    pdf.setTextColor(0, 0, 0);
    pdf.setFontSize(18);
    pdf.setFont('helvetica', 'bold');
    yPosition = 45;
    pdf.text('RELATÓRIO DE VOO', 15, yPosition);

    // Data e hora de geração
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(...secondaryColor);
    const dataGeracao = new Date().toLocaleString('pt-BR');
    pdf.text(`Gerado em: ${dataGeracao}`, 150, yPosition);

    yPosition += 15;

    // INFORMAÇÕES BÁSICAS
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(0, 0, 0);
    pdf.text('DADOS BÁSICOS', 15, yPosition);
    yPosition += 10;

    const dadosBasicos = [
      ['Data do Voo', voo.data_voo ? new Date(voo.data_voo).toLocaleDateString('pt-BR') : 'N/A'],
      ['Período', voo.periodo === 'manha' ? 'Manhã' : 'Tarde'],
      ['Horário Previsto', voo.horario_previsto || 'N/A'],
      ['Status', voo.status.toUpperCase()],
      ['Piloto', piloto?.nome_completo || 'Não informado'],
      ['Email do Piloto', piloto?.email || 'Não informado'],
      ['Telefone do Piloto', piloto?.telefone || 'Não informado']
    ];

    autoTable(pdf, {
      startY: yPosition,
      head: [['Campo', 'Valor']],
      body: dadosBasicos,
      theme: 'striped',
      headStyles: { fillColor: primaryColor },
      margin: { left: 15, right: 15 },
      styles: { fontSize: 10 }
    });

    yPosition = (pdf as any).lastAutoTable.finalY + 15;

    // DETALHES OPERACIONAIS
    checkPageBreak(60);
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('DETALHES OPERACIONAIS', 15, yPosition);
    yPosition += 10;

    const detalhesOperacionais = [
      ['Local de Decolagem', voo.local_decolagem_previsto || 'Não informado'],
      ['Local de Pouso', voo.local_pouso || 'Não informado'],
      ['Duração (minutos)', voo.duracao_minutos?.toString() || 'N/A'],
      ['Altitude Máxima (m)', voo.altitude_maxima?.toString() || 'N/A']
    ];

    autoTable(pdf, {
      startY: yPosition,
      head: [['Detalhe', 'Valor']],
      body: detalhesOperacionais,
      theme: 'striped',
      headStyles: { fillColor: primaryColor },
      margin: { left: 15, right: 15 },
      styles: { fontSize: 10 }
    });

    yPosition = (pdf as any).lastAutoTable.finalY + 15;

    // PASSAGEIROS
    checkPageBreak(60);
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('INFORMAÇÕES DE PASSAGEIROS', 15, yPosition);
    yPosition += 10;

    const passageiros = [
      ['Adultos Previstos', voo.adultos_previstos?.toString() || '0'],
      ['Crianças Previstas', voo.criancas_previstas?.toString() || '0'],
      ['Total Previsto', ((voo.adultos_previstos || 0) + (voo.criancas_previstas || 0)).toString()]
    ];

    if (voo.status === 'finalizado') {
      passageiros.push(
        ['Adultos Transportados', voo.adultos_transportados?.toString() || '0'],
        ['Crianças Transportadas', voo.criancas_transportadas?.toString() || '0'],
        ['Total Transportado', ((voo.adultos_transportados || 0) + (voo.criancas_transportadas || 0)).toString()]
      );
    }

    autoTable(pdf, {
      startY: yPosition,
      head: [['Categoria', 'Quantidade']],
      body: passageiros,
      theme: 'striped',
      headStyles: { fillColor: primaryColor },
      margin: { left: 15, right: 15 },
      styles: { fontSize: 10 }
    });

    yPosition = (pdf as any).lastAutoTable.finalY + 15;

    // BALÕES UTILIZADOS
    if (voo.voos_baloes && voo.voos_baloes.length > 0) {
      checkPageBreak(60);
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('BALÕES UTILIZADOS', 15, yPosition);
      yPosition += 10;

      const baloesData = voo.voos_baloes.map((vb: any) => [
        vb.baloes.prefixo,
        vb.baloes.nome_batismo || 'N/A',
        `${vb.baloes.volume_m3}m³`
      ]);

      autoTable(pdf, {
        startY: yPosition,
        head: [['Prefixo', 'Nome de Batismo', 'Volume']],
        body: baloesData,
        theme: 'striped',
        headStyles: { fillColor: primaryColor },
        margin: { left: 15, right: 15 },
        styles: { fontSize: 10 }
      });

      yPosition = (pdf as any).lastAutoTable.finalY + 15;
    }

    // OBSERVAÇÕES
    if (voo.observacoes_pos_voo) {
      checkPageBreak(40);
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('OBSERVAÇÕES PÓS-VOO', 15, yPosition);
      yPosition += 10;

      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      const observacoes = pdf.splitTextToSize(voo.observacoes_pos_voo, 180);
      pdf.text(observacoes, 15, yPosition);
      yPosition += observacoes.length * 5 + 10;
    }

    // MOTIVO DE CANCELAMENTO (se aplicável)
    if (voo.motivo_cancelamento) {
      checkPageBreak(40);
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(220, 38, 38); // Red
      pdf.text('CANCELAMENTO', 15, yPosition);
      yPosition += 10;

      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(0, 0, 0);
      const motivo = pdf.splitTextToSize(voo.motivo_cancelamento, 180);
      pdf.text(motivo, 15, yPosition);
      yPosition += motivo.length * 5 + 10;
    }

    // ANEXOS
    if (voo.voos_anexos && voo.voos_anexos.length > 0) {
      checkPageBreak(60);
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(0, 0, 0);
      pdf.text('ANEXOS', 15, yPosition);
      yPosition += 10;

      const anexosData = voo.voos_anexos.map((anexo: any) => [
        anexo.nome_arquivo,
        anexo.tipo.replace('_', ' ').toUpperCase(),
        anexo.mime_type || 'N/A'
      ]);

      autoTable(pdf, {
        startY: yPosition,
        head: [['Nome do Arquivo', 'Tipo', 'Formato']],
        body: anexosData,
        theme: 'striped',
        headStyles: { fillColor: primaryColor },
        margin: { left: 15, right: 15 },
        styles: { fontSize: 10 }
      });

      yPosition = (pdf as any).lastAutoTable.finalY + 15;
    }

    // RODAPÉ
    const totalPages = pdf.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      pdf.setPage(i);
      pdf.setFontSize(8);
      pdf.setTextColor(...secondaryColor);
      pdf.text(`Página ${i} de ${totalPages}`, 15, 290);
      pdf.text('AVIBAQ - Sistema de Gerenciamento de Voos', 150, 290);
    }

    // Gerar PDF
    const pdfBuffer = pdf.output('arraybuffer');

    // Configurar headers para download
    const nomeArquivo = `relatorio-voo-${voo.data_voo}-${voo.periodo}-${piloto?.nome_completo?.replace(/\s+/g, '-') || 'piloto'}.pdf`;
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${nomeArquivo}"`);
    res.setHeader('Content-Length', pdfBuffer.byteLength);

    res.send(Buffer.from(pdfBuffer));

  } catch (error) {
    console.error('Erro ao gerar PDF:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}