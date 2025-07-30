import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Settings, 
  Save, 
  Bot, 
  Brain,
  User,
  MessageSquare,
  Key,
  Eye,
  CheckCircle,
  AlertTriangle,
  Bell,
  Mail,
  Phone
} from 'lucide-react';

interface ConfigurationsTabProps {
  botEnabled: boolean;
  knowledgeBaseEnabled: boolean;
  adminFacebookId: string;
  adminBackupId: string;
  escalationKeywords: string;
  escalationTime: number;
  settingsLoading: boolean;
  onBotToggle: (enabled: boolean) => void;
  onKnowledgeBaseToggle: (enabled: boolean) => void;
  onAdminFacebookIdChange: (id: string) => void;
  onAdminBackupIdChange: (id: string) => void;
  onEscalationKeywordsChange: (keywords: string) => void;
  onEscalationTimeChange: (time: number) => void;
  onSaveSettings: () => void;
}

export const ConfigurationsTab: React.FC<ConfigurationsTabProps> = ({
  botEnabled,
  knowledgeBaseEnabled,
  adminFacebookId,
  adminBackupId,
  escalationKeywords,
  escalationTime,
  settingsLoading,
  onBotToggle,
  onKnowledgeBaseToggle,
  onAdminFacebookIdChange,
  onAdminBackupIdChange,
  onEscalationKeywordsChange,
  onEscalationTimeChange,
  onSaveSettings
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          ⚙️ Configurações
        </CardTitle>
        <CardDescription>
          Configure o comportamento e funcionalidades do agente IA
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Configurações Principais */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">🤖 Controles Principais</h3>
              
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <Bot className="h-4 w-4" />
                    <Label className="text-base font-medium">Agente IA</Label>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Habilitar/desabilitar o bot completamente
                  </p>
                </div>
                <Switch
                  checked={botEnabled}
                  onCheckedChange={onBotToggle}
                />
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <Brain className="h-4 w-4" />
                    <Label className="text-base font-medium">Base de Conhecimento</Label>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Usar conhecimentos cadastrados nas respostas
                  </p>
                </div>
                <Switch
                  checked={knowledgeBaseEnabled}
                  onCheckedChange={onKnowledgeBaseToggle}
                />
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">📊 Status Atual</h3>
              
              <div className="space-y-3">
                <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Bot está {botEnabled ? 'ativo' : 'inativo'}</span>
                </div>
                
                <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
                  <Brain className="h-4 w-4 text-blue-500" />
                  <span className="text-sm">Base de conhecimento {knowledgeBaseEnabled ? 'ativa' : 'inativa'}</span>
                </div>
                
                <div className="flex items-center gap-2 p-3 bg-orange-50 rounded-lg">
                  <AlertTriangle className="h-4 w-4 text-orange-500" />
                  <span className="text-sm">Sistema monitorado 24/7</span>
                </div>
              </div>
            </div>
          </div>

          {/* Escalation para Humano */}
          <div className="border-t pt-6 space-y-4">
            <h3 className="text-lg font-semibold">👤 Escalation para Humano</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>ID Facebook do Admin Principal</Label>
                  <Input
                    value={adminFacebookId}
                    onChange={(e) => onAdminFacebookIdChange(e.target.value)}
                    placeholder="Ex: carlosfox2"
                  />
                  <p className="text-xs text-muted-foreground">
                    ID do Facebook/Instagram para receber notificações prioritárias
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label>ID Facebook do Admin Backup</Label>
                  <Input
                    value={adminBackupId}
                    onChange={(e) => onAdminBackupIdChange(e.target.value)}
                    placeholder="Ex: admin_backup"
                  />
                  <p className="text-xs text-muted-foreground">
                    Admin alternativo caso o principal não responda
                  </p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Palavras-chave para Escalation</Label>
                  <Textarea
                    value={escalationKeywords}
                    onChange={(e) => onEscalationKeywordsChange(e.target.value)}
                    placeholder="comprar,finalizar,problema,ajuda,atendente,humano"
                    rows={3}
                  />
                  <p className="text-xs text-muted-foreground">
                    Palavras que fazem o bot chamar um humano (separadas por vírgula)
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label>Tempo para Escalation (minutos)</Label>
                  <Input
                    type="number"
                    value={escalationTime}
                    onChange={(e) => onEscalationTimeChange(parseInt(e.target.value) || 10)}
                    min="1"
                    max="60"
                  />
                  <p className="text-xs text-muted-foreground">
                    Tempo sem resposta antes de notificar admin
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-blue-800 mb-2">Como Funciona o Escalation</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• IA detecta palavras-chave de escalation</li>
                <li>• Admin recebe notificação no Facebook Messenger</li>
                <li>• IA pausa automaticamente por 30 minutos</li>
                <li>• Admin pode responder diretamente no chat</li>
                <li>• Backup é notificado se admin principal não responder</li>
              </ul>
            </div>

            {/* Notificações */}
            <div className="space-y-4">
              <h4 className="font-medium">🔔 Métodos de Notificação</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <h5 className="text-sm font-medium">📧 Notificações por Email</h5>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox id="email-escalation" defaultChecked />
                      <Label htmlFor="email-escalation" className="text-sm">
                        Escalation para humano
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="email-orders" defaultChecked />
                      <Label htmlFor="email-orders" className="text-sm">
                        Novos pedidos
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="email-errors" defaultChecked />
                      <Label htmlFor="email-errors" className="text-sm">
                        Erros do sistema
                      </Label>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <h5 className="text-sm font-medium">📱 Notificações por WhatsApp</h5>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox id="whats-escalation" defaultChecked />
                      <Label htmlFor="whats-escalation" className="text-sm">
                        Escalation urgente
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="whats-orders" />
                      <Label htmlFor="whats-orders" className="text-sm">
                        Pedidos importantes
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="whats-system" />
                      <Label htmlFor="whats-system" className="text-sm">
                        Falhas críticas
                      </Label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Controle Chat Humano/IA */}
          <div className="border-t pt-6 space-y-4">
            <h3 className="text-lg font-semibold">🎭 Controle Chat Humano/IA</h3>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <Label className="font-medium">Sistema Inteligente Ativado</Label>
              </div>
              <ul className="text-sm space-y-1 text-green-700">
                <li>• IA **para automaticamente** quando humano responde no chat</li>
                <li>• IA **analisa contexto completo** das conversas antes de responder</li>
                <li>• IA **responde diretamente** às perguntas específicas</li>
                <li>• IA **não envia produtos** sem solicitação</li>
              </ul>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Modo de Operação Atual</Label>
                <div className="bg-blue-50 p-3 rounded-lg">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-blue-500" />
                    <span className="font-medium">IA Inteligente + Controle Humano</span>
                  </div>
                  <p className="text-sm text-blue-700 mt-1">
                    Sistema detecta automaticamente quando humano está ativo e pausa a IA
                  </p>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Tempo de Pausa</Label>
                <Input type="number" defaultValue="30" />
                <p className="text-xs text-muted-foreground">
                  IA fica pausada por 30min após atividade humana
                </p>
              </div>
            </div>
          </div>

          {/* Sincronização */}
          <div className="border-t pt-6 space-y-4">
            <h3 className="text-lg font-semibold">🔄 Sincronização</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button variant="outline">
                <MessageSquare className="h-4 w-4 mr-2" />
                Sincronizar com Secrets
              </Button>
              <Button variant="outline">
                <Key className="h-4 w-4 mr-2" />
                Usar Token Meta
              </Button>
              <Button variant="outline">
                <Eye className="h-4 w-4 mr-2" />
                Verificar Tabelas
              </Button>
            </div>
            <div className="bg-yellow-50 p-3 rounded-lg">
              <p className="text-sm text-yellow-800">
                💡 Use "Usar Token Meta" para sincronizar o token que você salvou na página de configurações Meta/Facebook
              </p>
            </div>
          </div>

          {/* Links Úteis */}
          <div className="border-t pt-6 space-y-4">
            <h3 className="text-lg font-semibold">🔗 Links Úteis</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="p-4">
                <div className="text-center">
                  <MessageSquare className="h-8 w-8 mx-auto mb-2 text-blue-500" />
                  <h4 className="font-medium">Webhook Facebook</h4>
                  <p className="text-xs text-muted-foreground mb-2">
                    URL para configurar no Facebook
                  </p>
                  <div className="text-xs bg-gray-100 p-2 rounded">
                    https://fijbvihinhuedkvkxwir.supabase.co/functions/v1/facebook-webhook
                  </div>
                  <Button variant="outline" size="sm" className="mt-2">
                    Copiar URL
                  </Button>
                </div>
              </Card>
              
              <Card className="p-4">
                <div className="text-center">
                  <Settings className="h-8 w-8 mx-auto mb-2 text-green-500" />
                  <h4 className="font-medium">Facebook Developers</h4>
                  <p className="text-xs text-muted-foreground mb-2">
                    Configure seu app Facebook
                  </p>
                  <Button variant="outline" size="sm">
                    Abrir Console
                  </Button>
                </div>
              </Card>
              
              <Card className="p-4">
                <div className="text-center">
                  <Key className="h-8 w-8 mx-auto mb-2 text-orange-500" />
                  <h4 className="font-medium">OpenAI Platform</h4>
                  <p className="text-xs text-muted-foreground mb-2">
                    Gerencie suas chaves API
                  </p>
                  <Button variant="outline" size="sm">
                    Acessar
                  </Button>
                </div>
              </Card>
            </div>
          </div>

          <Button 
            onClick={onSaveSettings}
            className="w-full"
            size="lg"
            disabled={settingsLoading}
          >
            {settingsLoading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Salvando Configurações...
              </>
            ) : (
              <>
                <Save className="h-5 w-5 mr-2" />
                Salvar Configurações
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};