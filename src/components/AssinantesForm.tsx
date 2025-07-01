import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Mail, CheckCircle, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const AssinantesForm = () => {
  const [formData, setFormData] = useState({
    nome: "",
    email: "",
    ehPiloto: false,
    aceitouTermos: false
  });
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.aceitouTermos) {
      toast({
        title: "Termos não aceitos",
        description: "Você precisa aceitar os termos para se cadastrar.",
        variant: "destructive"
      });
      return;
    }

    // Validação de e-mail simples
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast({
        title: "E-mail inválido",
        description: "Digite um e-mail válido.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const tokenConfirmacao = crypto.randomUUID();
      
      const { error } = await supabase
        .from("assinantes")
        .insert({
          nome: formData.nome,
          email: formData.email,
          eh_piloto: formData.ehPiloto,
          token_confirmacao: tokenConfirmacao
        });

      if (error) {
        if (error.code === "23505") {
          toast({
            title: "E-mail já cadastrado",
            description: "Este e-mail já está cadastrado em nossa lista.",
            variant: "destructive"
          });
        } else {
          throw error;
        }
      } else {
        // Chamar a Edge Function para enviar o e-mail de confirmação
        await fetch('https://elcbodhxzvoqpzamgown.functions.supabase.co/send-confirmation-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: formData.email,
            nome: formData.nome,
            token: tokenConfirmacao
          })
        });

        setSuccess(true);
        setFormData({ nome: "", email: "", ehPiloto: false, aceitouTermos: false });
        toast({
          title: "Cadastro realizado!",
          description: "Você começará a receber os boletins por e-mail.",
        });
      }
    } catch (error) {
      console.error("Erro ao cadastrar:", error);
      toast({
        title: "Erro no cadastro",
        description: "Tente novamente em alguns instantes.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="p-6 text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Cadastro Realizado!</h3>
          <p className="text-gray-600 mb-4">
            Você começará a receber os boletins por e-mail. Caso não queira mais receber, utilize o link de descadastro presente em todos os e-mails.
          </p>
          <Button onClick={() => setSuccess(false)} variant="outline">
            Fazer Novo Cadastro
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="flex items-center justify-center space-x-2 mb-2">
          <Mail className="w-6 h-6 text-blue-600" />
          <CardTitle className="text-xl">Receba o Boletim</CardTitle>
        </div>
        <p className="text-sm text-gray-600">
          Cadastre-se para receber o boletim meteorológico diariamente por e-mail
        </p>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="nome">Nome Completo *</Label>
            <Input
              id="nome"
              type="text"
              value={formData.nome}
              onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
              required
              placeholder="Seu nome completo"
            />
          </div>

          <div>
            <Label htmlFor="email">E-mail *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              required
              placeholder="seu@email.com"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="piloto"
              checked={formData.ehPiloto}
              onCheckedChange={(checked) => 
                setFormData(prev => ({ ...prev, ehPiloto: !!checked }))
              }
            />
            <Label htmlFor="piloto" className="text-sm">
              Sou piloto de balão
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="termos"
              checked={formData.aceitouTermos}
              onCheckedChange={(checked) => 
                setFormData(prev => ({ ...prev, aceitouTermos: !!checked }))
              }
            />
            <Label htmlFor="termos" className="text-sm">
              Aceito receber e-mails e concordo com a{" "}
              <a href="/politica-privacidade" className="text-blue-600 hover:underline">
                Política de Privacidade
              </a>
            </Label>
          </div>

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-xs">
              Seus dados serão utilizados apenas para envio do boletim meteorológico.
              Você pode cancelar a inscrição a qualquer momento.
            </AlertDescription>
          </Alert>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Cadastrando..." : "Cadastrar"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
