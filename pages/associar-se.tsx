import { useState } from "react";
import { useRouter } from "next/navigation";
import { Header } from "../src/components/Layout/Header";
import { supabase } from "../src/integrations/supabase/client";
import bcrypt from "bcryptjs";

const tipos = [
  { value: "piloto", label: "Piloto" },
  { value: "agencia", label: "Agência" },
];

export default function AssociarSe() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [tipo, setTipo] = useState("piloto");
  const [form, setForm] = useState({
    nome_completo: "",
    email: "",
    telefone: "",
    observacoes: "",
    cpf: "",
    cnpj: "",
    nome_empresa: "",
    rbac103: "",
    rbac91: "",
    qtd_baloes: "",
    volumes_baloes: "",
    comprovante: null,
  });
  const [erro, setErro] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [endereco, setEndereco] = useState("");
  const [cidade, setCidade] = useState("");
  const [estado, setEstado] = useState("");
  const [rbac103, setRbac103] = useState(false);
  const [rbac61, setRbac61] = useState(false);
  const [validadeRbac103, setValidadeRbac103] = useState("");
  const [associacaoRbac103, setAssociacaoRbac103] = useState("");
  const [codigoAnac, setCodigoAnac] = useState("");
  const [validadeHabilitacao, setValidadeHabilitacao] = useState("");
  const [numeroLicenca, setNumeroLicenca] = useState("");
  const [validadeCma, setValidadeCma] = useState("");
  const [username, setUsername] = useState("");
  const [senha, setSenha] = useState("");
  const [senhaConfirm, setSenhaConfirm] = useState("");

  function handleChange(e) {
    const { name, value, files } = e.target;
    if (name === "comprovante") {
      setForm((f) => ({ ...f, comprovante: files?.[0] || null }));
    } else {
      setForm((f) => ({ ...f, [name]: value }));
    }
  }

  function handleTipoChange(e) {
    setTipo(e.target.value);
    setForm((f) => ({ ...f, tipo: e.target.value }));
  }

  function validarCamposEtapa1() {
    if (!form.nome_completo || !form.email || !form.telefone) return "Preencha todos os campos obrigatórios.";
    if (tipo === "piloto") {
      if (!form.cpf) return "Informe o CPF.";
    }
    if (tipo === "agencia") {
      if (!form.nome_empresa) return "Informe o nome da empresa.";
      if (!form.cnpj) return "Informe o CNPJ.";
      if (!form.qtd_baloes) return "Informe o número de balões.";
    }
    return "";
  }

  function handleNext(e) {
    e.preventDefault();
    const err = validarCamposEtapa1();
    if (err) return setErro(err);
    setErro("");
    setStep(2);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErro("");
    setIsLoading(true);
    try {
      // Validação prévia: verifica se já existe e-mail ou username
      const { data: existingUser } = await supabase
        .from("users")
        .select("id")
        .or(`email.eq.${form.email},username.eq.${username}`)
        .maybeSingle();
      if (existingUser) {
        setErro("Já existe um cadastro com este e-mail ou usuário. Por favor, utilize outros dados ou recupere sua senha.");
        setIsLoading(false);
        return;
      }
      // Validação básica já feita antes
      // 1. Gerar hash da senha
      const senha_hash = await bcrypt.hash(senha, 10);
      const role = tipo === "piloto" ? "piloto" : "agencia";
      // 2. Inserir usuário na tabela users
      const { data: user, error: userError } = await supabase
        .from("users")
        .insert([
          {
            nome: form.nome_completo,
            email: form.email,
            username,
            senha_hash,
            role,
            created_at: new Date().toISOString(),
          },
        ])
        .select()
        .single();
      if (userError || !user) {
        setErro("Erro ao criar usuário: " + (userError?.message || ""));
        setIsLoading(false);
        return;
      }
      // 3. Inserir membro na tabela membros, vinculando ao user_id
      const membroPayload = {
        nome_completo: form.nome_completo,
        email: form.email,
        telefone: form.telefone,
        tipo,
        cpf: form.cpf,
        cnpj: form.cnpj,
        nome_empresa: form.nome_empresa,
        observacoes: form.observacoes,
        endereco,
        cidade,
        estado,
        user_id: user.id,
        // RBAC 103
        validade_rbac103: rbac103 ? validadeRbac103 : null,
        associacao_rbac103: rbac103 ? associacaoRbac103 : null,
        // RBAC 61
        codigo_anac: rbac61 ? codigoAnac : null,
        validade_habilitacao: rbac61 ? validadeHabilitacao : null,
        numero_licenca: rbac61 ? numeroLicenca : null,
        validade_cma: rbac61 ? validadeCma : null,
        created_at: new Date().toISOString(),
        status: "pendente",
        pagamento_inscricao: "aguardando",
      };
      const { error: membroError } = await supabase
        .from("membros")
        .insert([membroPayload]);
      if (membroError) {
        setErro("Usuário criado, mas erro ao cadastrar membro: " + membroError.message);
        setIsLoading(false);
        return;
      }
      // Sucesso!
      router.push("/inscricao-recebida");
    } catch (e: any) {
      setErro(e.message || "Erro inesperado ao enviar inscrição");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="py-10">
        <div className="max-w-xl mx-auto bg-white rounded-xl shadow-md px-6 py-8">
          <h1 className="text-2xl font-bold text-center mb-2">Associe-se à AVIBAQ</h1>
          
          {/* Destaque sobre investimento */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="font-semibold text-blue-800">Investimento</span>
            </div>
            <p className="text-blue-700 text-sm">
              <strong>Taxa de inscrição única: R$ 50</strong> + <strong>Mensalidade: R$ 50</strong>
            </p>
          </div>

          {/* Escolha do tipo de cadastro */}
          <form className="space-y-5" onSubmit={handleNext}>
            <div>
              <label className="block font-medium mb-1">Tipo de cadastro *</label>
              <div className="flex gap-4">
                {tipos.map((t) => (
                  <label key={t.value} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="tipo"
                      value={t.value}
                      checked={tipo === t.value}
                      onChange={handleTipoChange}
                    />
                    {t.label}
                  </label>
                ))}
              </div>
            </div>
            {/* Campos para Piloto */}
            {tipo === "piloto" && (
              <>
                <div>
                  <label className="block font-medium mb-1">Nome completo *</label>
                  <input name="nome_completo" value={form.nome_completo} onChange={handleChange} className="w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition" required />
                </div>
                <div>
                  <label className="block font-medium mb-1">CPF *</label>
                  <input name="cpf" value={form.cpf} onChange={handleChange} className="w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition" required />
                </div>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="block font-medium mb-1">E-mail *</label>
                    <input name="email" type="email" value={form.email} onChange={handleChange} className="w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition" required />
                  </div>
                  <div className="flex-1">
                    <label className="block font-medium mb-1">Telefone *</label>
                    <input name="telefone" value={form.telefone} onChange={handleChange} className="w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition" required />
                  </div>
                </div>
                <div>
                  <label className="block font-medium mb-1">Endereço Pessoal *</label>
                  <input type="text" className="w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition" value={endereco} onChange={e => setEndereco(e.target.value)} required />
                  <div className="flex gap-2 mt-2">
                    <input type="text" className="w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition" placeholder="Cidade" value={cidade} onChange={e => setCidade(e.target.value)} required />
                    <select className="w-36 rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition" value={estado} onChange={e => setEstado(e.target.value)} required>
                      <option value="">Estado</option>
                      <option value="AC">AC</option><option value="AL">AL</option><option value="AP">AP</option><option value="AM">AM</option><option value="BA">BA</option><option value="CE">CE</option><option value="DF">DF</option><option value="ES">ES</option><option value="GO">GO</option><option value="MA">MA</option><option value="MT">MT</option><option value="MS">MS</option><option value="MG">MG</option><option value="PA">PA</option><option value="PB">PB</option><option value="PR">PR</option><option value="PE">PE</option><option value="PI">PI</option><option value="RJ">RJ</option><option value="RN">RN</option><option value="RS">RS</option><option value="RO">RO</option><option value="RR">RR</option><option value="SC">SC</option><option value="SP">SP</option><option value="SE">SE</option><option value="TO">TO</option>
                    </select>
                  </div>
                </div>
                {/* Selecione o(s) registro(s) que possui */}
                <div className="mt-6">
                  <label className="block font-medium mb-2">Selecione o(s) registro(s) que possui *</label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2">
                      <input type="checkbox" checked={rbac103} onChange={e => setRbac103(e.target.checked)} /> RBAC 103
                    </label>
                    <label className="flex items-center gap-2">
                      <input type="checkbox" checked={rbac61} onChange={e => setRbac61(e.target.checked)} /> RBAC 61
                    </label>
                  </div>
                  <div className="text-xs text-gray-500 mt-2">Se possuir ambos, preencha os dois blocos abaixo. Se só possuir um, preencha apenas o correspondente.</div>
                  <div className="text-xs text-red-500 mt-1">É obrigatório preencher pelo menos um dos dois registros para enviar a inscrição.</div>
                  {rbac103 && (
                    <div className="border rounded-lg p-4 mt-4 bg-gray-50">
                      <div className="font-semibold mb-2">RBAC 103</div>
                      <div className="mb-2">CPF: <span className="font-mono">{form.cpf}</span></div>
                      <label className="block font-medium">Data de validade do registro *</label>
                      <input type="date" className="input" value={validadeRbac103} onChange={e => setValidadeRbac103(e.target.value)} required={rbac103} />
                      <label className="block font-medium mt-2">Associação responsável pela validação *</label>
                      <input type="text" className="input" value={associacaoRbac103} onChange={e => setAssociacaoRbac103(e.target.value)} required={rbac103} />
                    </div>
                  )}
                  {rbac61 && (
                    <div className="border rounded-lg p-4 mt-4 bg-gray-50">
                      <div className="font-semibold mb-2">RBAC 61</div>
                      <label className="block font-medium">Código ANAC *</label>
                      <input type="text" className="input" value={codigoAnac} onChange={e => setCodigoAnac(e.target.value)} required={rbac61} />
                      <label className="block font-medium mt-2">Validade da habilitação *</label>
                      <input type="date" className="input" value={validadeHabilitacao} onChange={e => setValidadeHabilitacao(e.target.value)} required={rbac61} />
                      <label className="block font-medium mt-2">Número da licença *</label>
                      <input type="text" className="input" value={numeroLicenca} onChange={e => setNumeroLicenca(e.target.value)} required={rbac61} />
                      <label className="block font-medium mt-2">Validade do Certificado Médico Aeronáutico *</label>
                      <input type="date" className="input" value={validadeCma} onChange={e => setValidadeCma(e.target.value)} required={rbac61} />
                    </div>
                  )}
                </div>
                <div>
                  <label className="block font-medium mb-1">Observações</label>
                  <textarea name="observacoes" value={form.observacoes} onChange={handleChange} className="w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition" rows={2} />
                </div>
              </>
            )}
            {/* Campos para Agência */}
            {tipo === "agencia" && (
              <>
                <div>
                  <label className="block font-medium mb-1">Nome da Empresa *</label>
                  <input name="nome_empresa" value={form.nome_empresa} onChange={handleChange} className="w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition" required />
                </div>
                <div>
                  <label className="block font-medium mb-1">CNPJ *</label>
                  <input name="cnpj" value={form.cnpj} onChange={handleChange} className="w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition" required />
                </div>
                <div>
                  <label className="block font-medium mb-1">Endereço da Empresa *</label>
                  <input type="text" className="w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition" value={endereco} onChange={e => setEndereco(e.target.value)} required />
                  <div className="flex gap-2 mt-2">
                    <input type="text" className="w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition" placeholder="Cidade" value={cidade} onChange={e => setCidade(e.target.value)} required />
                    <select className="w-36 rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition" value={estado} onChange={e => setEstado(e.target.value)} required>
                      <option value="">Estado</option>
                      <option value="AC">AC</option><option value="AL">AL</option><option value="AP">AP</option><option value="AM">AM</option><option value="BA">BA</option><option value="CE">CE</option><option value="DF">DF</option><option value="ES">ES</option><option value="GO">GO</option><option value="MA">MA</option><option value="MT">MT</option><option value="MS">MS</option><option value="MG">MG</option><option value="PA">PA</option><option value="PB">PB</option><option value="PR">PR</option><option value="PE">PE</option><option value="PI">PI</option><option value="RJ">RJ</option><option value="RN">RN</option><option value="RS">RS</option><option value="RO">RO</option><option value="RR">RR</option><option value="SC">SC</option><option value="SP">SP</option><option value="SE">SE</option><option value="TO">TO</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block font-medium mb-1">Nome do responsável *</label>
                  <input name="nome_completo" value={form.nome_completo} onChange={handleChange} className="w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition" required />
                </div>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="block font-medium mb-1">E-mail *</label>
                    <input name="email" type="email" value={form.email} onChange={handleChange} className="w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition" required />
                  </div>
                  <div className="flex-1">
                    <label className="block font-medium mb-1">Telefone *</label>
                    <input name="telefone" value={form.telefone} onChange={handleChange} className="w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition" required />
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="block font-medium mb-1">Nº de balões *</label>
                    <input name="qtd_baloes" type="number" value={form.qtd_baloes} onChange={handleChange} className="w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition" required />
                  </div>
                  <div className="flex-1">
                    <label className="block font-medium mb-1">Volumes (m³)</label>
                    <input name="volumes_baloes" value={form.volumes_baloes} onChange={handleChange} placeholder="Ex: 1200, 1800, 2200" className="w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition" />
                  </div>
                </div>
                <div>
                  <label className="block font-medium mb-1">Observações</label>
                  <textarea name="observacoes" value={form.observacoes} onChange={handleChange} className="w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition" rows={2} />
                </div>
              </>
            )}
            {erro && <div className="text-red-600 text-sm">{erro}</div>}
            <button
              type="submit"
              className="w-full bg-primary text-white font-semibold py-2 rounded-lg mt-2 disabled:opacity-60"
              disabled={isLoading}
            >
              Próximo
            </button>
          </form>
          {step === 2 && (
            <form className="space-y-5" onSubmit={handleSubmit}>
              <div className="mt-6">
                <label className="block font-medium">Usuário *</label>
                <input type="text" className="input" value={username} onChange={e => setUsername(e.target.value)} required />
                <label className="block font-medium mt-2">Senha *</label>
                <input type="password" className="input" value={senha} onChange={e => setSenha(e.target.value)} required />
                <label className="block font-medium mt-2">Confirmar Senha *</label>
                <input type="password" className="input" value={senhaConfirm} onChange={e => setSenhaConfirm(e.target.value)} required />
                <div className="text-xs text-gray-500 mt-2">O acesso ao painel do associado está em desenvolvimento.</div>
              </div>
              {erro && <div className="text-red-600 text-sm">{erro}</div>}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex-1 bg-gray-300 text-gray-700 font-semibold py-2 rounded-lg"
                >
                  Voltar
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-primary text-white font-semibold py-2 rounded-lg disabled:opacity-60"
                  disabled={isLoading}
                >
                  Enviar inscrição
                </button>
              </div>
            </form>
          )}
          <div className="mt-6 text-sm text-blue-700 bg-blue-50 rounded p-3">
            O cadastro só será aprovado após confirmação de pagamento feita pelo tesoureiro responsável.<br />
            Quando o cadastro for aprovado, você receberá um e-mail com mais informações.
          </div>
        </div>
      </main>
    </div>
  );
} 