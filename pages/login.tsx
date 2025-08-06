import Link from "next/link";

export default function Login() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md mx-auto bg-white rounded-xl shadow-md px-8 py-10 text-center">
        <h1 className="text-2xl font-bold mb-4 text-primary">Login</h1>
        <p className="mb-4 text-gray-700">
          O login de administradores é feito pela página <Link href="/admin/login" className="text-blue-600 underline">/admin/login</Link>.<br />
          (Em breve, login para outros tipos de usuário estará disponível aqui.)
        </p>
        <Link href="/" className="inline-block bg-primary text-white font-semibold px-6 py-2 rounded-lg hover:bg-primary/90 transition">
          Voltar para a Home
        </Link>
      </div>
    </div>
  );
} 