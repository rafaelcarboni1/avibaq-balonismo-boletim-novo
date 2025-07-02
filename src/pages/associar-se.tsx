// Alteração forçada para commit e deploy
import { useState } from "react";

const tipos = [
  { value: "piloto", label: "Piloto" },
  { value: "agencia", label: "Agência" },
];

export default function AssociarSe() {
  const [step, setStep] = useState(1);
  const [tipo, setTipo] = useState("piloto");
  const [form, setForm] = useState({
    nome_completo: "",
    email: "",
    telefone: "",
    observacoes: "",
    cpf: "",
    cnpj: "",
    rbac103: "",
    rbac91: "",
    qtd_baloes: "",
    volumes_baloes: "",
    comprovante: null,
  });
  const [erro, setErro] = useState("");
  const [isLoading, setIsLoading] = useState(false);

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
      if (!form.rbac103 && !form.rbac91) return "Preencha pelo menos um dos campos: RBAC 103 ou RBAC 91.";
    }
    if (tipo === "agencia") {
      if (!form.cnpj) return "Informe o CNPJ.";
      if (!form.qtd_baloes) return "Informe o número de balões.";
    }
    return "";
  }

  function validarCamposEtapa2() {
    if (!form.comprovante) return "Envie o comprovante de pagamento.";
    if (form.comprovante && form.comprovante.size > 5 * 1024 * 1024) return "Comprovante deve ter até 5MB.";
    return "";
  }

  function handleNext(e) {
    e.preventDefault();
    const err = validarCamposEtapa1();
    if (err) return setErro(err);
    setErro("");
    setStep(2);
  }

  function handleSubmit(e) {
    e.preventDefault();
    const err = validarCamposEtapa2();
    if (err) return setErro(err);
    setErro("");
    // Aqui vai a integração com a API na próxima etapa
    alert("Inscrição enviada! (integração na próxima etapa)");
  }

  return (
    <main className="min-h-screen bg-gray-50 py-10">
      <div className="max-w-xl mx-auto bg-white rounded-xl shadow-md px-6 py-8">
        <h1 className="text-2xl font-bold text-center mb-2">Associe-se à AVIBAQ</h1>
        {step === 1 && (
          <form className="space-y-5" onSubmit={handleNext}>
            <div>
              <label className="block font-medium mb-1">Nome completo *</label>
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
            <div>
              <label className="block font-medium mb-1">Tipo *</label>
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
            {tipo === "piloto" && (
              <>
                <div>
                  <label className="block font-medium mb-1">CPF *</label>
                  <input name="cpf" value={form.cpf} onChange={handleChange} className="w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition" required />
                </div>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="block font-medium mb-1">RBAC 103</label>
                    <input name="rbac103" value={form.rbac103} onChange={handleChange} className="w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition" />
                  </div>
                  <div className="flex-1">
                    <label className="block font-medium mb-1">RBAC 91</label>
                    <input name="rbac91" value={form.rbac91} onChange={handleChange} className="w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition" />
                  </div>
                </div>
                <div>
                  <label className="block font-medium mb-1">Observações</label>
                  <textarea name="observacoes" value={form.observacoes} onChange={handleChange} className="w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition" rows={2} />
                </div>
              </>
            )}
            {tipo === "agencia" && (
              <>
                <div>
                  <label className="block font-medium mb-1">CNPJ *</label>
                  <input name="cnpj" value={form.cnpj} onChange={handleChange} className="w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition" required />
                </div>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="block font-medium mb-1">Nº de balões *</label>
                    <input name="qtd_baloes" type="number" value={form.qtd_baloes} onChange={handleChange} className="w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition" required />
                  </div>
                  <div className="flex-1">
                    <label className="block font-medium mb-1">Volumes (m³, separados por vírgula)</label>
                    <input name="volumes_baloes" value={form.volumes_baloes} onChange={handleChange} className="w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition" />
                  </div>
                </div>
                <div>
                  <label className="block font-medium mb-1">Observações</label>
                  <textarea name="observacoes" value={form.observacoes} onChange={handleChange} className="w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition" rows={2} />
                </div>
              </>
            )}
            {erro && <div className="text-red-600 text-sm mb-2">{erro}</div>}
            <button
              type="submit"
              className="w-full bg-primary text-white font-semibold py-2 rounded-lg mt-2 disabled:opacity-60"
              disabled={isLoading}
            >
              Avançar
            </button>
          </form>
        )}
        {step === 2 && (
          <form className="space-y-5" onSubmit={handleSubmit}>
            <p className="text-center text-gray-600 mb-6">
              Investimento: taxa de inscrição única <b>R$ 50</b> + mensalidade <b>R$ 50</b>.
            </p>
            <div>
              <label className="block font-medium mb-1">Comprovante de pagamento *</label>
              <input
                name="comprovante"
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition"
                required
              />
              <span className="text-xs text-gray-500">PDF, JPG ou PNG até 5MB</span>
            </div>
            {erro && <div className="text-red-600 text-sm mb-2">{erro}</div>}
            <button
              type="submit"
              className="w-full bg-primary text-white font-semibold py-2 rounded-lg mt-2 disabled:opacity-60"
              disabled={isLoading}
            >
              Enviar inscrição
            </button>
          </form>
        )}
      </div>
    </main>
  );
} 