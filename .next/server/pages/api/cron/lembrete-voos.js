"use strict";(()=>{var e={};e.id=1905,e.ids=[1905],e.modules={2885:e=>{e.exports=require("@supabase/supabase-js")},145:e=>{e.exports=require("next/dist/compiled/next-server/pages-api.runtime.prod.js")},6249:(e,o)=>{Object.defineProperty(o,"l",{enumerable:!0,get:function(){return function e(o,a){return a in o?o[a]:"then"in o&&"function"==typeof o.then?o.then(o=>e(o,a)):"function"==typeof o&&"default"===a?o:void 0}}})},7637:(e,o,a)=>{a.r(o),a.d(o,{config:()=>g,default:()=>m,routeModule:()=>u});var r={};a.r(r),a.d(r,{default:()=>l});var t=a(1802),s=a(7153),i=a(6249);let n=(0,a(2885).createClient)("https://elcbodhxzvoqpzamgown.supabase.co","eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVsY2JvZGh4enZvcXB6YW1nb3duIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEzMDQ3ODAsImV4cCI6MjA2Njg4MDc4MH0.wr15r6xgR0vAlnna2S7qs4RCLgWEPGqQZLq8jaW3BTw");async function l(e,o){if("POST"!==e.method)return o.status(405).json({error:"Method not allowed"});try{console.log("[Lembrete Voos] Iniciando envio de lembretes...");let e=new Date;e.setDate(e.getDate()+1);let a=e.toISOString().split("T")[0];console.log("[Lembrete Voos] Buscando voos para",a);let{data:r,error:t}=await n.from("voos").select(`
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
      `).eq("data_voo",a).in("status",["rascunho","planejado","checklist_bloco1","checklist_bloco2","checklist_concluido"]);if(t)return console.error("[Lembrete Voos] Erro ao buscar voos:",t),o.status(500).json({error:"Erro ao buscar voos"});if(!r||0===r.length)return console.log("[Lembrete Voos] Nenhum voo encontrado para amanh\xe3"),o.status(200).json({message:"Nenhum voo encontrado para amanh\xe3",voosEncontrados:0});console.log(`[Lembrete Voos] ${r.length} voos encontrados para amanh\xe3`);let s=[];for(let e of r)try{let o={id:e.id,data_voo:e.data_voo,periodo:e.periodo,horario_previsto:e.horario_previsto,local_decolagem_previsto:e.local_decolagem_previsto,piloto_id:e.piloto_id,agencia_id:e.agencia_id,adultos_previstos:e.adultos_previstos,criancas_previstas:e.criancas_previstas,piloto_nome:e.membros?.nome_completo||"Piloto",piloto_email:e.membros?.users?.[0]?.email||""};e.agencia&&(o.agencia_nome=e.agencia.nome_completo,o.agencia_email=e.agencia.users?.[0]?.email||"");let a=await c(o),r=null;e.agencia_id&&o.agencia_email&&(r=await d(o)),s.push({voo_id:e.id,piloto_email:o.piloto_email,piloto_enviado:a.sucesso,agencia_email:o.agencia_email,agencia_enviado:r?.sucesso||!1,erro:a.erro||r?.erro})}catch(o){console.error(`[Lembrete Voos] Erro ao processar voo ${e.id}:`,o),s.push({voo_id:e.id,piloto_enviado:!1,agencia_enviado:!1,erro:o.message})}await p(s);let i=s.filter(e=>e.piloto_enviado).length,l=s.filter(e=>!e.piloto_enviado).length;return console.log(`[Lembrete Voos] Conclu\xeddo: ${i} sucessos, ${l} erros`),o.status(200).json({message:"Lembretes processados",voosEncontrados:r.length,sucessos:i,erros:l,resultados:s})}catch(e){return console.error("[Lembrete Voos] Erro geral:",e),o.status(500).json({error:"Erro interno do servidor"})}}async function c(e){try{if(!e.piloto_email)return{sucesso:!1,erro:"E-mail do piloto n\xe3o encontrado"};let o=`🎈 Lembrete: Voc\xea tem voo amanh\xe3 - ${new Date(e.data_voo).toLocaleDateString("pt-BR")}`,a=`
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">🎈 Lembrete de Voo - AVIBAQ</h2>
        
        <p>Ol\xe1 <strong>${e.piloto_nome}</strong>,</p>
        
        <p>Este \xe9 um lembrete autom\xe1tico de que voc\xea tem um voo programado para <strong>amanh\xe3</strong>:</p>
        
        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #1f2937;">📅 Detalhes do Voo</h3>
          <p><strong>Data:</strong> ${new Date(e.data_voo).toLocaleDateString("pt-BR")}</p>
          <p><strong>Per\xedodo:</strong> ${"manha"===e.periodo?"Manh\xe3":"Tarde"}</p>
          <p><strong>Hor\xe1rio Previsto:</strong> ${e.horario_previsto}</p>
          <p><strong>Local de Decolagem:</strong> ${e.local_decolagem_previsto}</p>
          <p><strong>Passageiros Previstos:</strong> ${e.adultos_previstos+e.criancas_previstas} (${e.adultos_previstos} adultos, ${e.criancas_previstas} crian\xe7as)</p>
          ${e.agencia_nome?`<p><strong>Ag\xeancia:</strong> ${e.agencia_nome}</p>`:""}
        </div>
        
        <div style="background-color: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <h4 style="margin-top: 0; color: #d97706;">⚠️ A\xe7\xe3o Necess\xe1ria</h4>
          <p>N\xe3o se esque\xe7a de completar o <strong>checklist de seguran\xe7a</strong> antes do voo!</p>
          <p>Acesse seu dashboard para iniciar o checklist:</p>
          <p><a href="${process.env.NEXT_PUBLIC_SITE_URL}/piloto/dashboard" style="color: #2563eb; text-decoration: underline;">Acessar Dashboard</a></p>
        </div>
        
        <div style="background-color: #ecfdf5; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <h4 style="margin-top: 0; color: #059669;">✅ Lembrete Importante</h4>
          <ul style="margin: 10px 0; padding-left: 20px;">
            <li>Verifique as condi\xe7\xf5es meteorol\xf3gicas</li>
            <li>Confirme o equipamento e combust\xedvel</li>
            <li>Revise o planejamento de voo</li>
            <li>Complete todos os blocos do checklist</li>
            <li>Mantenha contato com os passageiros</li>
          </ul>
        </div>
        
        <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
          Este \xe9 um e-mail autom\xe1tico enviado pela AVIBAQ \xe0s 19h do dia anterior ao voo.<br>
          Para d\xfavidas ou suporte, entre em contato com a associa\xe7\xe3o.
        </p>
        
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
        
        <p style="color: #9ca3af; font-size: 12px; text-align: center;">
          AVIBAQ - Associa\xe7\xe3o de Pilotos e Empresas de Balonismo<br>
          Praia Grande/SC
        </p>
      </div>
    `;console.log(`[Lembrete Voos] Enviando para piloto: ${e.piloto_email}`);let r=await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/send-email`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({to:e.piloto_email,subject:o,html:a})});if(!r.ok)throw Error(`Erro ao enviar e-mail: ${r.status}`);return{sucesso:!0}}catch(e){return console.error("[Lembrete Voos] Erro ao enviar para piloto:",e),{sucesso:!1,erro:e.message}}}async function d(e){try{if(!e.agencia_email)return{sucesso:!1,erro:"E-mail da ag\xeancia n\xe3o encontrado"};let o=`🎈 Lembrete: Voo da ag\xeancia amanh\xe3 - ${new Date(e.data_voo).toLocaleDateString("pt-BR")}`,a=`
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">🎈 Lembrete de Voo - AVIBAQ</h2>
        
        <p>Ol\xe1 <strong>${e.agencia_nome}</strong>,</p>
        
        <p>Este \xe9 um lembrete autom\xe1tico de que voc\xeas t\xeam um voo programado para <strong>amanh\xe3</strong>:</p>
        
        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #1f2937;">📅 Detalhes do Voo</h3>
          <p><strong>Data:</strong> ${new Date(e.data_voo).toLocaleDateString("pt-BR")}</p>
          <p><strong>Per\xedodo:</strong> ${"manha"===e.periodo?"Manh\xe3":"Tarde"}</p>
          <p><strong>Hor\xe1rio Previsto:</strong> ${e.horario_previsto}</p>
          <p><strong>Local de Decolagem:</strong> ${e.local_decolagem_previsto}</p>
          <p><strong>Piloto:</strong> ${e.piloto_nome}</p>
          <p><strong>Passageiros Previstos:</strong> ${e.adultos_previstos+e.criancas_previstas} (${e.adultos_previstos} adultos, ${e.criancas_previstas} crian\xe7as)</p>
        </div>
        
        <div style="background-color: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <h4 style="margin-top: 0; color: #d97706;">⚠️ Responsabilidades da Ag\xeancia</h4>
          <p>Lembre-se de coordenar com o piloto <strong>${e.piloto_nome}</strong> para garantir que:</p>
          <ul style="margin: 10px 0; padding-left: 20px;">
            <li>Todos os passageiros estejam confirmados</li>
            <li>O checklist seja completado adequadamente</li>
            <li>Os regulamentos estejam assinados</li>
            <li>O equipamento esteja em perfeitas condi\xe7\xf5es</li>
          </ul>
        </div>
        
        <p><a href="${process.env.NEXT_PUBLIC_SITE_URL}/agencia/dashboard" style="color: #2563eb; text-decoration: underline;">Acessar Dashboard da Ag\xeancia</a></p>
        
        <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
          Este \xe9 um e-mail autom\xe1tico enviado pela AVIBAQ \xe0s 19h do dia anterior ao voo.<br>
          Para d\xfavidas ou suporte, entre em contato com a associa\xe7\xe3o.
        </p>
        
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
        
        <p style="color: #9ca3af; font-size: 12px; text-align: center;">
          AVIBAQ - Associa\xe7\xe3o de Pilotos e Empresas de Balonismo<br>
          Praia Grande/SC
        </p>
      </div>
    `;console.log(`[Lembrete Voos] Enviando para ag\xeancia: ${e.agencia_email}`);let r=await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/send-email`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({to:e.agencia_email,subject:o,html:a})});if(!r.ok)throw Error(`Erro ao enviar e-mail: ${r.status}`);return{sucesso:!0}}catch(e){return console.error("[Lembrete Voos] Erro ao enviar para ag\xeancia:",e),{sucesso:!1,erro:e.message}}}async function p(e){try{let o={operacao:"lembrete_voos",data_operacao:new Date().toISOString(),detalhes:{total_voos:e.length,sucessos:e.filter(e=>e.piloto_enviado).length,erros:e.filter(e=>!e.piloto_enviado).length,resultados:e}},{error:a}=await n.from("logs_atividade").insert([{tipo_atividade:"lembrete_voos",descricao:`Envio de lembretes para ${e.length} voos`,detalhes:o.detalhes,created_at:new Date().toISOString()}]);a&&console.error("[Lembrete Voos] Erro ao salvar log:",a)}catch(e){console.error("[Lembrete Voos] Erro ao registrar log:",e)}}let m=(0,i.l)(r,"default"),g=(0,i.l)(r,"config"),u=new t.PagesAPIRouteModule({definition:{kind:s.x.PAGES_API,page:"/api/cron/lembrete-voos",pathname:"/api/cron/lembrete-voos",bundlePath:"",filename:""},userland:r})},7153:(e,o)=>{var a;Object.defineProperty(o,"x",{enumerable:!0,get:function(){return a}}),function(e){e.PAGES="PAGES",e.PAGES_API="PAGES_API",e.APP_PAGE="APP_PAGE",e.APP_ROUTE="APP_ROUTE"}(a||(a={}))},1802:(e,o,a)=>{e.exports=a(145)}};var o=require("../../../webpack-api-runtime.js");o.C(e);var a=o(o.s=7637);module.exports=a})();