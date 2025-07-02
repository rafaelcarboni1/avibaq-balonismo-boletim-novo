import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";
import formidable from "formidable";
import fs from "fs";

export const config = {
  api: {
    bodyParser: false,
  },
};

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido" });
  }

  const form = new formidable.IncomingForm();
  form.maxFileSize = 5 * 1024 * 1024; // 5MB

  form.parse(req, async (err, fields, files) => {
    if (err) return res.status(400).json({ error: "Erro no upload do arquivo" });

    try {
      // 1. Extrair dados do formulário
      const {
        nome_completo, email, telefone, tipo, cpf, cnpj, nome_empresa, rbac103, rbac91, qtd_baloes, volumes_baloes, observacoes
      } = fields;
      const comprovante = files.comprovante as formidable.File;
      if (!comprovante) return res.status(400).json({ error: "Comprovante obrigatório" });

      // 2. Inserir membro (status pendente)
      const { data: membro, error: errInsert } = await supabase
        .from("membros")
        .insert([
          {
            nome_completo,
            email,
            telefone,
            tipo,
            cpf,
            cnpj,
            nome_empresa,
            rbac103,
            rbac91,
            qtd_baloes: qtd_baloes ? Number(qtd_baloes) : null,
            volumes_baloes: volumes_baloes ? JSON.stringify(volumes_baloes) : null,
            observacoes,
            status: "pendente",
            pagamento_inscricao: "aguardando",
          },
        ])
        .select("id")
        .single();
      if (errInsert || !membro) return res.status(500).json({ error: "Erro ao salvar membro" });

      // 3. Upload do comprovante
      const ext = comprovante.originalFilename?.split(".").pop() || "pdf";
      const fileBuffer = fs.readFileSync(comprovante.filepath);
      const storagePath = `membros-docs/${membro.id}/comprovante.${ext}`;
      const { error: errUpload } = await supabase.storage
        .from("membros-docs")
        .upload(storagePath, fileBuffer, {
          contentType: comprovante.mimetype || "application/octet-stream",
          upsert: true,
        });
      if (errUpload) return res.status(500).json({ error: "Erro ao fazer upload do comprovante" });

      // 4. Atualizar membro com URL do comprovante
      const { data: membroFinal, error: errUpdate } = await supabase
        .from("membros")
        .update({ comprovante_url: storagePath })
        .eq("id", membro.id)
        .select("id")
        .single();
      if (errUpdate) return res.status(500).json({ error: "Erro ao atualizar comprovante" });

      return res.status(200).json({ success: true });
    } catch (e) {
      return res.status(500).json({ error: "Erro inesperado" });
    }
  });
} 