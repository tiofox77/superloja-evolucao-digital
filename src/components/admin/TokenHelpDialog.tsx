import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Facebook, Instagram, Clock, Shield, CheckCircle, AlertTriangle, ExternalLink } from 'lucide-react';

interface TokenHelpDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const TokenHelpDialog: React.FC<TokenHelpDialogProps> = ({ open, onOpenChange }) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Guia de Configuração de Tokens
          </DialogTitle>
          <DialogDescription>
            Configure tokens de longa duração para postagens automáticas no Facebook e Instagram
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="facebook" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="facebook" className="flex items-center gap-2">
              <Facebook className="h-4 w-4" />
              Facebook
            </TabsTrigger>
            <TabsTrigger value="instagram" className="flex items-center gap-2">
              <Instagram className="h-4 w-4" />
              Instagram
            </TabsTrigger>
          </TabsList>

          <TabsContent value="facebook" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Facebook className="h-5 w-5 text-blue-600" />
                  Token de Página do Facebook
                  <Badge variant="outline" className="ml-auto">
                    <Clock className="h-3 w-3 mr-1" />
                    60 dias
                  </Badge>
                </CardTitle>
                <CardDescription>
                  Configure um token de longa duração para sua página do Facebook
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="bg-primary/10 text-primary rounded-full p-1 text-sm font-bold min-w-[24px] h-6 flex items-center justify-center">1</div>
                    <div>
                      <h4 className="font-medium">Acesse Facebook Developers</h4>
                      <p className="text-sm text-muted-foreground">
                        Vá para <span className="font-mono bg-muted px-1 rounded">developers.facebook.com</span> e faça login
                      </p>
                      <Button variant="link" size="sm" className="p-0 h-auto" asChild>
                        <a href="https://developers.facebook.com" target="_blank" rel="noopener noreferrer">
                          Abrir Facebook Developers <ExternalLink className="h-3 w-3 ml-1" />
                        </a>
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="bg-primary/10 text-primary rounded-full p-1 text-sm font-bold min-w-[24px] h-6 flex items-center justify-center">2</div>
                    <div>
                      <h4 className="font-medium">Crie ou selecione seu App</h4>
                      <p className="text-sm text-muted-foreground">
                        Se não tiver, crie um novo app do tipo "Business". Adicione o produto "Login do Facebook"
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="bg-primary/10 text-primary rounded-full p-1 text-sm font-bold min-w-[24px] h-6 flex items-center justify-center">3</div>
                    <div>
                      <h4 className="font-medium">Configure as Permissões</h4>
                      <p className="text-sm text-muted-foreground mb-2">
                        Sua aplicação precisa das seguintes permissões:
                      </p>
                      <div className="space-y-1 text-xs">
                        <Badge variant="secondary" className="mr-1 mb-1">pages_show_list</Badge>
                        <Badge variant="secondary" className="mr-1 mb-1">pages_read_engagement</Badge>
                        <Badge variant="secondary" className="mr-1 mb-1">pages_manage_posts</Badge>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="bg-primary/10 text-primary rounded-full p-1 text-sm font-bold min-w-[24px] h-6 flex items-center justify-center">4</div>
                    <div>
                      <h4 className="font-medium">Obtenha o Token da Página</h4>
                       <p className="text-sm text-muted-foreground">
                         Em "Ferramentas &gt; Explorador da API", selecione seu app e sua página.
                         Gere um token com as permissões necessárias.
                       </p>
                      <Button variant="link" size="sm" className="p-0 h-auto" asChild>
                        <a href="https://developers.facebook.com/tools/explorer/" target="_blank" rel="noopener noreferrer">
                          Abrir Explorador da API <ExternalLink className="h-3 w-3 ml-1" />
                        </a>
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="bg-green-100 text-green-600 rounded-full p-1 text-sm font-bold min-w-[24px] h-6 flex items-center justify-center">5</div>
                    <div>
                      <h4 className="font-medium">Estenda a Duração do Token</h4>
                      <p className="text-sm text-muted-foreground">
                        Use a ferramenta "Token de Acesso" para converter seu token em um de longa duração (60 dias)
                      </p>
                      <Button variant="link" size="sm" className="p-0 h-auto" asChild>
                        <a href="https://developers.facebook.com/tools/debug/accesstoken/" target="_blank" rel="noopener noreferrer">
                          Ferramenta de Debug de Token <ExternalLink className="h-3 w-3 ml-1" />
                        </a>
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium text-amber-800">Importante:</p>
                      <p className="text-amber-700">
                        Tokens de página do Facebook expiram em 60 dias. Configure lembretes para renová-los.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="instagram" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Instagram className="h-5 w-5 text-pink-600" />
                  Token do Instagram Business
                  <Badge variant="outline" className="ml-auto">
                    <Clock className="h-3 w-3 mr-1" />
                    60 dias
                  </Badge>
                </CardTitle>
                <CardDescription>
                  Configure acesso à API do Instagram via Facebook Business
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="bg-primary/10 text-primary rounded-full p-1 text-sm font-bold min-w-[24px] h-6 flex items-center justify-center">1</div>
                    <div>
                      <h4 className="font-medium">Conta Instagram Business</h4>
                      <p className="text-sm text-muted-foreground">
                        Converta sua conta Instagram para Business e conecte-a a uma página do Facebook
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="bg-primary/10 text-primary rounded-full p-1 text-sm font-bold min-w-[24px] h-6 flex items-center justify-center">2</div>
                    <div>
                      <h4 className="font-medium">Configure no Facebook App</h4>
                      <p className="text-sm text-muted-foreground">
                        No Facebook Developers, adicione o produto "Instagram Basic Display" ao seu app
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="bg-primary/10 text-primary rounded-full p-1 text-sm font-bold min-w-[24px] h-6 flex items-center justify-center">3</div>
                    <div>
                      <h4 className="font-medium">Obtenha as Permissões</h4>
                      <p className="text-sm text-muted-foreground mb-2">
                        Solicite as seguintes permissões:
                      </p>
                      <div className="space-y-1 text-xs">
                        <Badge variant="secondary" className="mr-1 mb-1">instagram_basic</Badge>
                        <Badge variant="secondary" className="mr-1 mb-1">instagram_content_publish</Badge>
                        <Badge variant="secondary" className="mr-1 mb-1">pages_show_list</Badge>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="bg-primary/10 text-primary rounded-full p-1 text-sm font-bold min-w-[24px] h-6 flex items-center justify-center">4</div>
                    <div>
                      <h4 className="font-medium">Obtenha o Instagram Business ID</h4>
                      <p className="text-sm text-muted-foreground">
                        Use a API do Facebook para obter o ID da sua conta Instagram Business:
                      </p>
                      <code className="text-xs bg-muted p-2 rounded block mt-1">
                        GET /{'{page-id}'}?fields=instagram_business_account
                      </code>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="bg-green-100 text-green-600 rounded-full p-1 text-sm font-bold min-w-[24px] h-6 flex items-center justify-center">5</div>
                    <div>
                      <h4 className="font-medium">Use o Token da Página</h4>
                      <p className="text-sm text-muted-foreground">
                        O token do Instagram é o mesmo token de longa duração da sua página do Facebook
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-blue-600 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium text-blue-800">Dica:</p>
                      <p className="text-blue-700">
                        O token do Instagram é o mesmo da página do Facebook. Configure primeiro o Facebook.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="bg-muted rounded-lg p-4">
          <h4 className="font-medium mb-2">Recursos Úteis</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
            <Button variant="link" size="sm" className="justify-start h-auto p-2" asChild>
              <a href="https://developers.facebook.com/docs/facebook-login/access-tokens/refreshing" target="_blank" rel="noopener noreferrer">
                📚 Renovação de Tokens <ExternalLink className="h-3 w-3 ml-1" />
              </a>
            </Button>
            <Button variant="link" size="sm" className="justify-start h-auto p-2" asChild>
              <a href="https://developers.facebook.com/docs/instagram-api" target="_blank" rel="noopener noreferrer">
                📱 Instagram API Docs <ExternalLink className="h-3 w-3 ml-1" />
              </a>
            </Button>
            <Button variant="link" size="sm" className="justify-start h-auto p-2" asChild>
              <a href="https://developers.facebook.com/tools/debug/accesstoken/" target="_blank" rel="noopener noreferrer">
                🔧 Debug de Tokens <ExternalLink className="h-3 w-3 ml-1" />
              </a>
            </Button>
            <Button variant="link" size="sm" className="justify-start h-auto p-2" asChild>
              <a href="https://business.facebook.com/" target="_blank" rel="noopener noreferrer">
                💼 Business Manager <ExternalLink className="h-3 w-3 ml-1" />
              </a>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};