import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../../src/integrations/supabase/client';

interface VooLembrete {
  id: string;
  data_voo: string;
  periodo: 'manha' | 'tarde';
  horario_previsto: string;
  local_decolagem_previsto: string;
  piloto_id: string;
  agencia_id: string | null;
  adultos_previstos: number;
  criancas_previstas: number;
  piloto_nome: string;
  piloto_email: string;
  agencia_nome?: string;
  agencia_email?: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Verificar se é uma requisição POST (para webhooks/cron)
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('[Lembrete Voos] Iniciando envio de lembretes...');

    // Calcular data de amanhã
    const amanha = new Date();
    amanha.setDate(amanha.getDate() + 1);
    const dataAmanha = amanha.toISOString().split('T')[0];

    console.log('[Lembrete Voos] Buscando voos para', dataAmanha);

    // Buscar voos agendados para amanhã que ainda não foram finalizados ou cancelados
    const { data: voos, error: vooError } = await supabase
      .from('voos')
      .select(`
        id,
        data_voo,
        periodo,
        horario_previsto,
        local_decolagem_previsto,
        piloto_id,
        agencia_id,
        adultos_previstos,
        criancas_previstas,
        status,
        membros!piloto_id (
          nome_completo,
          users!user_id (
            email
          )
        ),
        agencia:membros!agencia_id (
          nome_completo,
          users!user_id (
            email
          )
        )
      `)
      .eq('data_voo', dataAmanha)
      .in('status', ['rascunho', 'planejado', 'checklist_bloco1', 'checklist_bloco2', 'checklist_concluido']);

    if (vooError) {
      console.error('[Lembrete Voos] Erro ao buscar voos:', vooError);
      return res.status(500).json({ error: 'Erro ao buscar voos' });
    }

    if (!voos || voos.length === 0) {
      console.log('[Lembrete Voos] Nenhum voo encontrado para amanhã');
      return res.status(200).json({ message: 'Nenhum voo encontrado para amanhã', voosEncontrados: 0 });
    }

    console.log(`[Lembrete Voos] ${voos.length} voos encontrados para amanhã`);

    // Processar cada voo
    const resultados = [];
    for (const voo of voos) {
      try {
        const vooProcessado: VooLembrete = {
          id: voo.id,
          data_voo: voo.data_voo,
          periodo: voo.periodo,
          horario_previsto: voo.horario_previsto,
          local_decolagem_previsto: voo.local_decolagem_previsto,
          piloto_id: voo.piloto_id,
          agencia_id: voo.agencia_id,
          adultos_previstos: voo.adultos_previstos,
          criancas_previstas: voo.criancas_previstas,
          piloto_nome: (voo.membros as any)?.nome_completo || 'Piloto',
          piloto_email: (voo.membros as any)?.users?.[0]?.email || ''
        };

        if (voo.agencia) {
          vooProcessado.agencia_nome = (voo.agencia as any).nome_completo;
          vooProcessado.agencia_email = (voo.agencia as any).users?.[0]?.email || '';
        }

        // Enviar e-mail para o piloto
        const resultadoPiloto = await enviarLembretePiloto(vooProcessado);
        
        // Enviar e-mail para a agência (se houver)
        let resultadoAgencia = null;
        if (voo.agencia_id && vooProcessado.agencia_email) {
          resultadoAgencia = await enviarLembreteAgencia(vooProcessado);
        }

        resultados.push({
          voo_id: voo.id,
          piloto_email: vooProcessado.piloto_email,
          piloto_enviado: resultadoPiloto.sucesso,
          agencia_email: vooProcessado.agencia_email,
          agencia_enviado: resultadoAgencia?.sucesso || false,
          erro: resultadoPiloto.erro || resultadoAgencia?.erro
        });

      } catch (error) {
        console.error(`[Lembrete Voos] Erro ao processar voo ${voo.id}:`, error);
        resultados.push({
          voo_id: voo.id,
          piloto_enviado: false,
          agencia_enviado: false,
          erro: error.message
        });
      }
    }

    // Registrar log da operação
    await registrarLog(resultados);

    const sucessos = resultados.filter(r => r.piloto_enviado).length;
    const erros = resultados.filter(r => !r.piloto_enviado).length;

    console.log(`[Lembrete Voos] Concluído: ${sucessos} sucessos, ${erros} erros`);

    return res.status(200).json({
      message: 'Lembretes processados',
      voosEncontrados: voos.length,
      sucessos,
      erros,
      resultados
    });

  } catch (error) {
    console.error('[Lembrete Voos] Erro geral:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

async function enviarLembretePiloto(voo: VooLembrete) {
  try {
    if (!voo.piloto_email) {
      return { sucesso: false, erro: 'E-mail do piloto não encontrado' };
    }

    const assunto = `🎈 Lembrete: Você tem voo amanhã - ${new Date(voo.data_voo).toLocaleDateString('pt-BR')}`;
    
    const corpo = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">🎈 Lembrete de Voo - AVIBAQ</h2>
        
        <p>Olá <strong>${voo.piloto_nome}</strong>,</p>
        
        <p>Este é um lembrete automático de que você tem um voo programado para <strong>amanhã</strong>:</p>
        
        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #1f2937;">📅 Detalhes do Voo</h3>
          <p><strong>Data:</strong> ${new Date(voo.data_voo).toLocaleDateString('pt-BR')}</p>
          <p><strong>Período:</strong> ${voo.periodo === 'manha' ? 'Manhã' : 'Tarde'}</p>
          <p><strong>Horário Previsto:</strong> ${voo.horario_previsto}</p>
          <p><strong>Local de Decolagem:</strong> ${voo.local_decolagem_previsto}</p>
          <p><strong>Passageiros Previstos:</strong> ${voo.adultos_previstos + voo.criancas_previstas} (${voo.adultos_previstos} adultos, ${voo.criancas_previstas} crianças)</p>
          ${voo.agencia_nome ? `<p><strong>Agência:</strong> ${voo.agencia_nome}</p>` : ''}
        </div>
        
        <div style="background-color: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <h4 style="margin-top: 0; color: #d97706;">⚠️ Ação Necessária</h4>
          <p>Não se esqueça de completar o <strong>checklist de segurança</strong> antes do voo!</p>
          <p>Acesse seu dashboard para iniciar o checklist:</p>
          <p><a href="${process.env.NEXT_PUBLIC_SITE_URL}/piloto/dashboard" style="color: #2563eb; text-decoration: underline;">Acessar Dashboard</a></p>
        </div>
        
        <div style="background-color: #ecfdf5; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <h4 style="margin-top: 0; color: #059669;">✅ Lembrete Importante</h4>
          <ul style="margin: 10px 0; padding-left: 20px;">
            <li>Verifique as condições meteorológicas</li>
            <li>Confirme o equipamento e combustível</li>
            <li>Revise o planejamento de voo</li>
            <li>Complete todos os blocos do checklist</li>
            <li>Mantenha contato com os passageiros</li>
          </ul>
        </div>
        
        <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
          Este é um e-mail automático enviado pela AVIBAQ às 19h do dia anterior ao voo.<br>
          Para dúvidas ou suporte, entre em contato com a associação.
        </p>
        
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
        
        <p style="color: #9ca3af; font-size: 12px; text-align: center;">
          AVIBAQ - Associação de Pilotos e Empresas de Balonismo<br>
          Praia Grande/SC
        </p>
      </div>
    `;

    // Aqui você integraria com o serviço de e-mail (Resend, SendGrid, etc.)
    // Por enquanto, vamos simular o envio
    console.log(`[Lembrete Voos] Enviando para piloto: ${voo.piloto_email}`);
    
    // Simular chamada para API de e-mail
    const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/send-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: voo.piloto_email,
        subject: assunto,
        html: corpo
      })
    });

    if (!response.ok) {
      throw new Error(`Erro ao enviar e-mail: ${response.status}`);
    }

    return { sucesso: true };

  } catch (error) {
    console.error('[Lembrete Voos] Erro ao enviar para piloto:', error);
    return { sucesso: false, erro: error.message };
  }
}

async function enviarLembreteAgencia(voo: VooLembrete) {
  try {
    if (!voo.agencia_email) {
      return { sucesso: false, erro: 'E-mail da agência não encontrado' };
    }

    const assunto = `🎈 Lembrete: Voo da agência amanhã - ${new Date(voo.data_voo).toLocaleDateString('pt-BR')}`;
    
    const corpo = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">🎈 Lembrete de Voo - AVIBAQ</h2>
        
        <p>Olá <strong>${voo.agencia_nome}</strong>,</p>
        
        <p>Este é um lembrete automático de que vocês têm um voo programado para <strong>amanhã</strong>:</p>
        
        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #1f2937;">📅 Detalhes do Voo</h3>
          <p><strong>Data:</strong> ${new Date(voo.data_voo).toLocaleDateString('pt-BR')}</p>
          <p><strong>Período:</strong> ${voo.periodo === 'manha' ? 'Manhã' : 'Tarde'}</p>
          <p><strong>Horário Previsto:</strong> ${voo.horario_previsto}</p>
          <p><strong>Local de Decolagem:</strong> ${voo.local_decolagem_previsto}</p>
          <p><strong>Piloto:</strong> ${voo.piloto_nome}</p>
          <p><strong>Passageiros Previstos:</strong> ${voo.adultos_previstos + voo.criancas_previstas} (${voo.adultos_previstos} adultos, ${voo.criancas_previstas} crianças)</p>
        </div>
        
        <div style="background-color: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <h4 style="margin-top: 0; color: #d97706;">⚠️ Responsabilidades da Agência</h4>
          <p>Lembre-se de coordenar com o piloto <strong>${voo.piloto_nome}</strong> para garantir que:</p>
          <ul style="margin: 10px 0; padding-left: 20px;">
            <li>Todos os passageiros estejam confirmados</li>
            <li>O checklist seja completado adequadamente</li>
            <li>Os regulamentos estejam assinados</li>
            <li>O equipamento esteja em perfeitas condições</li>
          </ul>
        </div>
        
        <p><a href="${process.env.NEXT_PUBLIC_SITE_URL}/agencia/dashboard" style="color: #2563eb; text-decoration: underline;">Acessar Dashboard da Agência</a></p>
        
        <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
          Este é um e-mail automático enviado pela AVIBAQ às 19h do dia anterior ao voo.<br>
          Para dúvidas ou suporte, entre em contato com a associação.
        </p>
        
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
        
        <p style="color: #9ca3af; font-size: 12px; text-align: center;">
          AVIBAQ - Associação de Pilotos e Empresas de Balonismo<br>
          Praia Grande/SC
        </p>
      </div>
    `;

    console.log(`[Lembrete Voos] Enviando para agência: ${voo.agencia_email}`);
    
    // Simular chamada para API de e-mail
    const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/send-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: voo.agencia_email,
        subject: assunto,
        html: corpo
      })
    });

    if (!response.ok) {
      throw new Error(`Erro ao enviar e-mail: ${response.status}`);
    }

    return { sucesso: true };

  } catch (error) {
    console.error('[Lembrete Voos] Erro ao enviar para agência:', error);
    return { sucesso: false, erro: error.message };
  }
}

async function registrarLog(resultados: any[]) {
  try {
    const logData = {
      operacao: 'lembrete_voos',
      data_operacao: new Date().toISOString(),
      detalhes: {
        total_voos: resultados.length,
        sucessos: resultados.filter(r => r.piloto_enviado).length,
        erros: resultados.filter(r => !r.piloto_enviado).length,
        resultados
      }
    };

    // Registrar no banco se houver uma tabela de logs
    const { error } = await supabase
      .from('logs_atividade')
      .insert([{
        tipo_atividade: 'lembrete_voos',
        descricao: `Envio de lembretes para ${resultados.length} voos`,
        detalhes: logData.detalhes,
        created_at: new Date().toISOString()
      }]);

    if (error) {
      console.error('[Lembrete Voos] Erro ao salvar log:', error);
    }

  } catch (error) {
    console.error('[Lembrete Voos] Erro ao registrar log:', error);
  }
}