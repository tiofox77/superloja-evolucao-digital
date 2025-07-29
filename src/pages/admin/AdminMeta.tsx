import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Facebook, Instagram, ExternalLink, RefreshCw, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface MetaSettings {
  id?: string;
  pixel_id?: string;
  access_token?: string;
  app_id?: string;
  app_secret?: string;
  catalog_id?: string;
  page_id?: string;
  instagram_id?: string;
  is_active?: boolean;
}

interface FacebookProduct {
  id: string;
  product_id: string;
  facebook_product_id?: string;
  sync_status: string;
  last_sync_at?: string;
  sync_error?: string;
  products: {
    name: string;
    price: number;
    image_url?: string;
  };
}

const AdminMeta = () => {
  const [settings, setSettings] = useState<MetaSettings>({});
  const [products, setProducts] = useState<FacebookProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadSettings();
    loadProducts();
  }, []);

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('meta_settings')
        .select('*')
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      if (data) setSettings(data);
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
    }
  };

  const loadProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('facebook_products')
        .select(`
          *,
          products (
            name,
            price,
            image_url
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('meta_settings')
        .upsert({
          ...settings,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      toast({
        title: "Configurações salvas",
        description: "Configurações do Meta foram atualizadas com sucesso."
      });
    } catch (error) {
      console.error('Erro ao salvar:', error);
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar as configurações.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const syncProducts = async () => {
    setSyncing(true);
    try {
      // Buscar produtos ativos
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('*')
        .eq('active', true);

      if (productsError) throw productsError;

      // Criar registros no facebook_products para produtos que não existem
      for (const product of productsData || []) {
        const { error: insertError } = await supabase
          .from('facebook_products')
          .upsert({
            product_id: product.id,
            sync_status: 'pending'
          });

        if (insertError) console.error('Erro ao criar registro:', insertError);
      }

      // Chamar edge function para sincronizar com Facebook
      const { error: syncError } = await supabase.functions.invoke('sync-facebook-catalog', {
        body: { action: 'sync_all' }
      });

      if (syncError) throw syncError;

      toast({
        title: "Sincronização iniciada",
        description: "Os produtos estão sendo sincronizados com o Facebook."
      });

      // Recarregar produtos
      await loadProducts();
    } catch (error) {
      console.error('Erro na sincronização:', error);
      toast({
        title: "Erro na sincronização",
        description: "Não foi possível sincronizar os produtos.",
        variant: "destructive"
      });
    } finally {
      setSyncing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'synced':
        return <Badge variant="default">Sincronizado</Badge>;
      case 'pending':
        return <Badge variant="secondary">Pendente</Badge>;
      case 'error':
        return <Badge variant="destructive">Erro</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Meta/Facebook Integration</h1>
          <p className="text-muted-foreground">
            Configure integração com Meta Pixel e Facebook Catalog
          </p>
        </div>
        <Button onClick={syncProducts} disabled={syncing}>
          <RefreshCw className={`w-4 h-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
          Sincronizar Produtos
        </Button>
      </div>

      <Tabs defaultValue="settings" className="space-y-6">
        <TabsList>
          <TabsTrigger value="settings">Configurações</TabsTrigger>
          <TabsTrigger value="products">Produtos</TabsTrigger>
          <TabsTrigger value="ads">Anúncios</TabsTrigger>
        </TabsList>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Facebook className="w-5 h-5" />
                Configurações do Meta
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="pixel_id">Meta Pixel ID</Label>
                  <Input
                    id="pixel_id"
                    value={settings.pixel_id || ''}
                    onChange={(e) => setSettings({...settings, pixel_id: e.target.value})}
                    placeholder="123456789"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="app_id">App ID</Label>
                  <Input
                    id="app_id"
                    value={settings.app_id || ''}
                    onChange={(e) => setSettings({...settings, app_id: e.target.value})}
                    placeholder="Seu App ID"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="access_token">Access Token</Label>
                  <Input
                    id="access_token"
                    type="password"
                    value={settings.access_token || ''}
                    onChange={(e) => setSettings({...settings, access_token: e.target.value})}
                    placeholder="Seu Access Token"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="catalog_id">Catalog ID</Label>
                  <Input
                    id="catalog_id"
                    value={settings.catalog_id || ''}
                    onChange={(e) => setSettings({...settings, catalog_id: e.target.value})}
                    placeholder="ID do seu catálogo"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="page_id">Facebook Page ID</Label>
                  <Input
                    id="page_id"
                    value={settings.page_id || ''}
                    onChange={(e) => setSettings({...settings, page_id: e.target.value})}
                    placeholder="ID da sua página"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="instagram_id">Instagram ID</Label>
                  <Input
                    id="instagram_id"
                    value={settings.instagram_id || ''}
                    onChange={(e) => setSettings({...settings, instagram_id: e.target.value})}
                    placeholder="ID do Instagram"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  checked={settings.is_active || false}
                  onCheckedChange={(checked) => setSettings({...settings, is_active: checked})}
                />
                <Label htmlFor="is_active">Ativar integração</Label>
              </div>

              <Button onClick={saveSettings} disabled={saving}>
                {saving ? 'Salvando...' : 'Salvar Configurações'}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                🔧 Configuração do Webhook Facebook
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground mb-4">
                Para o bot responder automaticamente, configure o webhook no Facebook:
              </p>
              
              <div className="space-y-3">
                <div>
                  <Label className="text-sm font-medium">1. URL do Webhook</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Input 
                      readOnly 
                      value="https://fijbvihinhuedkvkxwir.supabase.co/functions/v1/facebook-webhook"
                      className="font-mono text-xs"
                    />
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => navigator.clipboard.writeText("https://fijbvihinhuedkvkxwir.supabase.co/functions/v1/facebook-webhook")}
                    >
                      Copiar
                    </Button>
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium">2. Verify Token</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Input 
                      readOnly 
                      value="minha_superloja_webhook_token_2024"
                      className="font-mono text-xs"
                    />
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => navigator.clipboard.writeText("minha_superloja_webhook_token_2024")}
                    >
                      Copiar
                    </Button>
                  </div>
                </div>

                <div className="bg-muted p-4 rounded-lg">
                  <h4 className="font-medium mb-2">3. Configurar no Facebook</h4>
                  <ol className="text-sm space-y-1 list-decimal list-inside">
                    <li>Acesse <a href="https://developers.facebook.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Facebook Developers</a></li>
                    <li>Vá para sua aplicação → Produtos → Messenger → Configurações</li>
                    <li>Na seção "Webhooks", clique em "Configurar Webhooks"</li>
                    <li>Cole a URL do webhook acima</li>
                    <li>Cole o Verify Token acima</li>
                    <li>Selecione os eventos: <code className="bg-background px-1 rounded">messages</code>, <code className="bg-background px-1 rounded">messaging_postbacks</code></li>
                    <li>Clique em "Verificar e Salvar"</li>
                    <li>Depois, associe o webhook à sua página</li>
                  </ol>
                </div>
              </div>
            </CardContent>
          </Card>

          <Alert>
            <AlertCircle className="w-4 h-4" />
            <AlertTitle>Como obter as credenciais</AlertTitle>
            <AlertDescription>
              <div className="space-y-2 mt-2">
                <p>1. Acesse o Facebook Business Manager</p>
                <p>2. Crie um App no Facebook Developers</p>
                <p>3. Configure o Meta Pixel na sua conta</p>
                <p>4. Crie um catálogo de produtos</p>
                <p>5. Obtenha o Access Token com permissões necessárias</p>
              </div>
            </AlertDescription>
          </Alert>
        </TabsContent>

        <TabsContent value="products" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Produtos Sincronizados</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {products.map((product) => (
                  <div key={product.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      {product.products.image_url && (
                        <img
                          src={product.products.image_url}
                          alt={product.products.name}
                          className="w-12 h-12 object-cover rounded"
                        />
                      )}
                      <div>
                        <h3 className="font-medium">{product.products.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          R$ {product.products.price.toFixed(2)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getStatusBadge(product.sync_status)}
                      {product.facebook_product_id && (
                        <Button variant="outline" size="sm" asChild>
                          <a
                            href={`https://business.facebook.com/commerce/catalog/products/${product.facebook_product_id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ads" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Criação de Anúncios</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Funcionalidade em desenvolvimento. Em breve você poderá criar anúncios diretamente da plataforma.
              </p>
              <Button variant="outline" disabled>
                Criar Anúncio
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminMeta;