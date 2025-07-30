import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Zap, 
  Bot, 
  MessageSquare, 
  Activity, 
  Send, 
  CheckCircle, 
  Brain, 
  Key, 
  Settings,
  Bell
} from 'lucide-react';

interface TestsTabProps {
  onSendTestNotification: () => void;
  onCheckSystemHealth: () => void;
}

export const TestsTab: React.FC<TestsTabProps> = ({
  onSendTestNotification,
  onCheckSystemHealth
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5" />
          🧪 Centro de Testes
        </CardTitle>
        <CardDescription>
          Teste todas as APIs e funcionalidades do agente IA
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Testes de API */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button variant="outline" className="h-16">
              <div className="text-center">
                <Bot className="h-6 w-6 mx-auto mb-1" />
                <div className="text-sm font-medium">Testar OpenAI</div>
              </div>
            </Button>
            
            <Button variant="outline" className="h-16">
              <div className="text-center">
                <MessageSquare className="h-6 w-6 mx-auto mb-1 text-blue-500" />
                <div className="text-sm font-medium">Testar Facebook</div>
              </div>
            </Button>
            
            <Button variant="outline" className="h-16 border-blue-500 text-blue-600">
              <div className="text-center">
                <Activity className="h-6 w-6 mx-auto mb-1" />
                <div className="text-sm font-medium">Debug Mensagens</div>
              </div>
            </Button>
          </div>

          {/* Testes Avançados */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button variant="default" className="h-16 bg-green-500 hover:bg-green-600">
              <div className="text-center text-white">
                <Send className="h-6 w-6 mx-auto mb-1" />
                <div className="text-sm font-medium">Teste Envio Real</div>
              </div>
            </Button>
            
            <Button variant="default" className="h-16 bg-orange-500 hover:bg-orange-600">
              <div className="text-center text-white">
                <CheckCircle className="h-6 w-6 mx-auto mb-1" />
                <div className="text-sm font-medium">Teste Completo</div>
              </div>
            </Button>
            
            <Button variant="outline" className="h-16 border-purple-500 text-purple-600">
              <div className="text-center">
                <Brain className="h-6 w-6 mx-auto mb-1" />
                <div className="text-sm font-medium">Testar Instagram</div>
              </div>
            </Button>
          </div>

          {/* Validação e Debug */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button 
              variant="outline" 
              className="h-16 border-blue-500 text-blue-600"
              onClick={onCheckSystemHealth}
            >
              <div className="text-center">
                <Key className="h-6 w-6 mx-auto mb-1" />
                <div className="text-sm font-medium">Verificar Sistema</div>
              </div>
            </Button>
            
            <Button 
              variant="outline" 
              className="h-16 border-green-500 text-green-600"
              onClick={onSendTestNotification}
            >
              <div className="text-center">
                <Send className="h-6 w-6 mx-auto mb-1" />
                <div className="text-sm font-medium">Teste Notificação</div>
              </div>
            </Button>
          </div>

          {/* Sistema de Notificações */}
          <div className="border-t pt-6 space-y-4">
            <h3 className="text-lg font-semibold">🔔 Sistema de Notificações</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button 
                variant="outline" 
                className="h-16"
                onClick={onSendTestNotification}
              >
                <div className="text-center">
                  <Send className="h-6 w-6 mx-auto mb-1 text-blue-500" />
                  <div className="text-sm font-medium">Enviar Teste</div>
                </div>
              </Button>
              
              <Button 
                variant="outline" 
                className="h-16"
                onClick={onCheckSystemHealth}
              >
                <div className="text-center">
                  <CheckCircle className="h-6 w-6 mx-auto mb-1 text-green-500" />
                  <div className="text-sm font-medium">Status Sistema</div>
                </div>
              </Button>
              
              <Button variant="outline" className="h-16">
                <div className="text-center">
                  <Settings className="h-6 w-6 mx-auto mb-1 text-orange-500" />
                  <div className="text-sm font-medium">Config Alertas</div>
                </div>
              </Button>
            </div>
            
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-blue-800 mb-2">Sistema de Notificações Ativo</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• ✅ Notificações de configurações salvas</li>
                <li>• ✅ Alertas de erro no sistema</li>
                <li>• ✅ Verificação automática de saúde</li>
                <li>• ✅ Feedback de aprendizado IA</li>
                <li>• ✅ Notificações de pedidos pendentes</li>
              </ul>
            </div>
          </div>

          {/* Configuração do Webhook Facebook */}
          <div className="border-t pt-6">
            <div className="flex items-center gap-2 mb-4">
              <MessageSquare className="h-5 w-5 text-blue-500" />
              <h3 className="text-lg font-semibold">Configuração do Webhook Facebook</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Para o bot responder automaticamente, você precisa configurar o webhook no Facebook:
            </p>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="font-medium">1. URL do Webhook</Label>
                <div className="flex gap-2">
                  <Input 
                    value="https://fijbvihinhuedkvkxwir.supabase.co/functions/v1/facebook-webhook"
                    readOnly
                    className="font-mono text-sm"
                  />
                  <Button variant="outline" size="sm">
                    Copiar
                  </Button>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label className="font-medium">2. Verify Token</Label>
                <div className="flex gap-2">
                  <Input 
                    value="minha_superloja_webhook_token_2024"
                    readOnly
                    className="font-mono text-sm"
                  />
                  <Button variant="outline" size="sm">
                    Copiar
                  </Button>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label className="font-medium">3. Configurar no Facebook</Label>
                <div className="space-y-2 text-sm">
                  <p>1. Acesse <Button variant="link" className="p-0 h-auto text-blue-500">Facebook Developers</Button></p>
                  <p>2. Vá para sua aplicação → Produtos → Messenger → Configurações</p>
                  <p>3. Na seção "Webhooks", clique em "Configurar Webhooks"</p>
                  <p>4. Cole a URL do webhook acima</p>
                  <p>5. Cole o Verify Token acima</p>
                  <p>6. Selecione os eventos: <code>messages, messaging_postbacks</code></p>
                  <p>7. Clique em "Verificar e Salvar"</p>
                  <p>8. Depois, associe o webhook à sua página</p>
                </div>
              </div>
            </div>
            
            <div className="bg-yellow-50 p-4 rounded-lg mt-4">
              <div className="flex items-start gap-2">
                <div className="bg-yellow-400 rounded-full p-1 mt-0.5">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium text-yellow-800">Verificações Importantes</h4>
                  <ul className="text-sm text-yellow-700 space-y-1">
                    <li>• Certifique-se que o token da página tem permissão <code>pages_messaging</code></li>
                    <li>• A página deve estar em modo "Desenvolvedor" ou "Ativo"</li>
                    <li>• O webhook deve estar associado especificamente à sua página</li>
                    <li>• Verifique se as configurações de privacidade da página permitem mensagens</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};