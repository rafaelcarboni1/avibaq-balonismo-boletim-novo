import { Link } from "react-router-dom";

export default function InscricaoRecebida() {
  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center py-10">
      <div className="max-w-lg mx-auto bg-white rounded-xl shadow-md px-8 py-10 text-center">
        <h1 className="text-2xl font-bold mb-4 text-primary">Inscrição recebida!</h1>
        <p className="mb-4 text-gray-700">
          Sua ficha de inscrição foi enviada com sucesso.<br />
          Em breve nossa equipe irá analisar seus dados e você receberá um e-mail com a confirmação ou orientações para finalizar o cadastro.
        </p>
        <p className="mb-6 text-gray-500 text-sm">
          Dúvidas? Entre em contato pelo e-mail <b>contato@avibaq.org</b>.
        </p>
        <Link to="/" className="inline-block bg-primary text-white font-semibold px-6 py-2 rounded-lg hover:bg-primary/90 transition">
          Voltar para a Home
        </Link>
      </div>
    </main>
  );
} 