import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface OpenAIKeySetupProps {
  onKeyConfigured: () => void;
}

export const OpenAIKeySetup = ({ onKeyConfigured }: OpenAIKeySetupProps) => {
  const [apiKey, setApiKey] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isTestingKey, setIsTestingKey] = useState(false);
  const { toast } = useToast();

  const testOpenAIKey = async () => {
    if (!apiKey.trim()) {
      toast({
        title: "Erro",
        description: "Digite uma chave API válida",
        variant: "destructive",
      });
      return;
    }

    setIsTestingKey(true);
    try {
      const response = await supabase.functions.invoke('test-openai', {
        body: {
          api_key: apiKey,
          model: 'gpt-4.1-2025-04-14'
        }
      });

      if (response.data?.success) {
        toast({
          title: "Sucesso!",
          description: "Chave OpenAI validada com sucesso",
        });
        onKeyConfigured();
      } else {
        throw new Error(response.data?.error || 'Falha ao validar a chave');
      }
    } catch (error) {
      console.error('Erro ao testar chave OpenAI:', error);
      toast({
        title: "Erro",
        description: "Chave OpenAI inválida ou erro de conexão",
        variant: "destructive",
      });
    } finally {
      setIsTestingKey(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-amber-500" />
          Configuração Necessária
        </CardTitle>
        <CardDescription>
          Para usar a funcionalidade de Auto Post IA, você precisa configurar sua chave OpenAI
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Você precisa de uma conta OpenAI ativa para usar esta funcionalidade. 
            Acesse <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-primary underline">platform.openai.com</a> para obter sua chave API.
          </AlertDescription>
        </Alert>

        <div className="space-y-2">
          <Label htmlFor="openai-key">Chave API OpenAI</Label>
          <Input
            id="openai-key"
            type="password"
            placeholder="sk-..."
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
          />
        </div>

        <div className="flex gap-2">
          <Button 
            onClick={testOpenAIKey}
            disabled={isTestingKey || !apiKey.trim()}
            className="flex-1"
          >
            {isTestingKey ? "Testando..." : "Testar e Configurar"}
          </Button>
        </div>

        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            Sua chave será armazenada de forma segura e usada apenas para gerar conteúdo via OpenAI.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
};