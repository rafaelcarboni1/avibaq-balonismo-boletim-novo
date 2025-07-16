import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { Card, CardContent, CardHeader, CardTitle } from "../src/components/ui/card";
import { CheckCircle, AlertCircle } from "lucide-react";
import { supabase } from "../src/integrations/supabase/client";

export default function Descadastrar() {
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "ok" | "fail">("loading");

  useEffect(() => {
    const { token } = router.query;
    const tokenString = token as string;
    if (!tokenString) {
      setStatus("fail");
      return;
    }
    supabase
      .from("assinantes")
      .update({ ativo: false })
      .eq("token_descadastro", tokenString)
      .select()
      .then(({ error, data }) => {
        if (error || !data || data.length === 0) setStatus("fail");
        else setStatus("ok");
      });
  }, [router.query]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md mx-auto mt-20">
        <CardHeader className="text-center">
          <CardTitle>Descadastro</CardTitle>
        </CardHeader>
        <CardContent className="p-6 text-center">
          {status === "loading" && <p>Processando descadastro...</p>}
          {status === "ok" && (
            <>
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Descadastro realizado com sucesso!</h3>
              <p className="text-gray-600">Você não receberá mais os boletins por e-mail.</p>
            </>
          )}
          {status === "fail" && (
            <>
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Descadastro inválido</h3>
              <p className="text-gray-600">O link de descadastro é inválido ou já foi utilizado.</p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 