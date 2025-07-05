import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Settings, Store, Bell, Shield, Database } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const AdminConfiguracoes = () => {
  const [settings, setSettings] = useState({
    store_name: 'SuperLoja',
    store_description: 'A melhor loja de eletrônicos de Angola',
    contact_email: 'contato@superloja.com',
    contact_phone: '+244 900 000 000',
    address: 'Luanda, Angola',
    notifications_enabled: true,
    auto_backup: true,
    maintenance_mode: false
  });
  const { toast } = useToast();

  const handleSave = async () => {
    try {
      // Simular salvamento (implementar com Supabase posteriormente)
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Configurações salvas!",
        description: "Todas as configurações foram atualizadas."
      });
    } catch (error) {
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar as configurações.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Configurações
        </h1>
        <p className="text-muted-foreground">Gerencie as configurações da sua loja</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Configurações da Loja */}
        <Card className="hover-scale">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Store className="w-5 h-5" />
              Informações da Loja
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="store_name">Nome da Loja</Label>
              <Input
                id="store_name"
                value={settings.store_name}
                onChange={(e) => setSettings({...settings, store_name: e.target.value})}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="store_description">Descrição</Label>
              <Textarea
                id="store_description"
                value={settings.store_description}
                onChange={(e) => setSettings({...settings, store_description: e.target.value})}
                className="mt-1"
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="contact_email">Email de Contato</Label>
              <Input
                id="contact_email"
                type="email"
                value={settings.contact_email}
                onChange={(e) => setSettings({...settings, contact_email: e.target.value})}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="contact_phone">Telefone</Label>
              <Input
                id="contact_phone"
                value={settings.contact_phone}
                onChange={(e) => setSettings({...settings, contact_phone: e.target.value})}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="address">Endereço</Label>
              <Input
                id="address"
                value={settings.address}
                onChange={(e) => setSettings({...settings, address: e.target.value})}
                className="mt-1"
              />
            </div>
          </CardContent>
        </Card>

        {/* Configurações do Sistema */}
        <Card className="hover-scale">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Sistema
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4" />
                  <Label>Notificações</Label>
                </div>
                <div className="text-sm text-muted-foreground">
                  Receber notificações de vendas e estoque
                </div>
              </div>
              <Switch
                checked={settings.notifications_enabled}
                onCheckedChange={(checked) => setSettings({...settings, notifications_enabled: checked})}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4" />
                  <Label>Backup Automático</Label>
                </div>
                <div className="text-sm text-muted-foreground">
                  Backup diário dos dados
                </div>
              </div>
              <Switch
                checked={settings.auto_backup}
                onCheckedChange={(checked) => setSettings({...settings, auto_backup: checked})}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  <Label>Modo Manutenção</Label>
                </div>
                <div className="text-sm text-muted-foreground">
                  Desabilita acesso público à loja
                </div>
              </div>
              <Switch
                checked={settings.maintenance_mode}
                onCheckedChange={(checked) => setSettings({...settings, maintenance_mode: checked})}
              />
            </div>
          </CardContent>
        </Card>

        {/* Estatísticas do Sistema */}
        <Card className="hover-scale lg:col-span-2">
          <CardHeader>
            <CardTitle>Informações do Sistema</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">Online</div>
                <div className="text-sm text-muted-foreground">Status</div>
              </div>
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <div className="text-2xl font-bold">v1.0.0</div>
                <div className="text-sm text-muted-foreground">Versão</div>
              </div>
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <div className="text-2xl font-bold">99.9%</div>
                <div className="text-sm text-muted-foreground">Uptime</div>
              </div>
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <div className="text-2xl font-bold">Fast</div>
                <div className="text-sm text-muted-foreground">Performance</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Salvar Configurações */}
      <div className="flex justify-end">
        <Button onClick={handleSave} size="lg">
          <Settings className="w-4 h-4 mr-2" />
          Salvar Configurações
        </Button>
      </div>
    </div>
  );
};

export default AdminConfiguracoes;