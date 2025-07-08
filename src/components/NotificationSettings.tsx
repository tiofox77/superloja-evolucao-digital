import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Bell, Mail, MessageSquare } from 'lucide-react';

interface NotificationSettings {
  email_notifications: boolean;
  sms_notifications: boolean;
  order_created_email: boolean;
  order_created_sms: boolean;
  status_changed_email: boolean;
  status_changed_sms: boolean;
  welcome_email: boolean;
  phone_number: string;
}

const NotificationSettings = () => {
  const [settings, setSettings] = useState<NotificationSettings>({
    email_notifications: true,
    sms_notifications: false,
    order_created_email: true,
    order_created_sms: false,
    status_changed_email: true,
    status_changed_sms: false,
    welcome_email: true,
    phone_number: ''
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      const { data, error } = await supabase
        .from('notification_settings')
        .select('*')
        .eq('user_id', user.user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setSettings({
          email_notifications: data.email_notifications,
          sms_notifications: data.sms_notifications,
          order_created_email: data.order_created_email,
          order_created_sms: data.order_created_sms,
          status_changed_email: data.status_changed_email,
          status_changed_sms: data.status_changed_sms,
          welcome_email: data.welcome_email,
          phone_number: data.phone_number || ''
        });
      }
    } catch (error: any) {
      console.error('Erro ao carregar configurações:', error);
    }
  };

  const saveSettings = async () => {
    setLoading(true);
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      const { error } = await supabase
        .from('notification_settings')
        .upsert({
          user_id: user.user.id,
          ...settings
        });

      if (error) throw error;

      toast({
        title: "✅ Configurações salvas",
        description: "Suas preferências de notificação foram atualizadas."
      });
    } catch (error: any) {
      toast({
        title: "❌ Erro",
        description: "Não foi possível salvar as configurações.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = (key: keyof NotificationSettings, value: boolean | string) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Configurações de Notificações
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Configurações Gerais */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Geral</h3>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Notificações por Email
                </Label>
                <p className="text-sm text-muted-foreground">
                  Receber notificações no seu email
                </p>
              </div>
              <Switch
                checked={settings.email_notifications}
                onCheckedChange={(checked) => updateSetting('email_notifications', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  Notificações por SMS
                </Label>
                <p className="text-sm text-muted-foreground">
                  Receber notificações no seu telemóvel
                </p>
              </div>
              <Switch
                checked={settings.sms_notifications}
                onCheckedChange={(checked) => updateSetting('sms_notifications', checked)}
              />
            </div>

            {settings.sms_notifications && (
              <div className="space-y-2">
                <Label htmlFor="phone">Número de Telemóvel</Label>
                <Input
                  id="phone"
                  placeholder="+244 900 000 000"
                  value={settings.phone_number}
                  onChange={(e) => updateSetting('phone_number', e.target.value)}
                />
              </div>
            )}
          </div>

          {/* Configurações de Pedidos */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Pedidos</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-4">
                <h4 className="font-medium">Novo Pedido</h4>
                <div className="flex items-center justify-between">
                  <Label>Email</Label>
                  <Switch
                    checked={settings.order_created_email}
                    onCheckedChange={(checked) => updateSetting('order_created_email', checked)}
                    disabled={!settings.email_notifications}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label>SMS</Label>
                  <Switch
                    checked={settings.order_created_sms}
                    onCheckedChange={(checked) => updateSetting('order_created_sms', checked)}
                    disabled={!settings.sms_notifications}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium">Mudança de Status</h4>
                <div className="flex items-center justify-between">
                  <Label>Email</Label>
                  <Switch
                    checked={settings.status_changed_email}
                    onCheckedChange={(checked) => updateSetting('status_changed_email', checked)}
                    disabled={!settings.email_notifications}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label>SMS</Label>
                  <Switch
                    checked={settings.status_changed_sms}
                    onCheckedChange={(checked) => updateSetting('status_changed_sms', checked)}
                    disabled={!settings.sms_notifications}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Configurações de Conta */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Conta</h3>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Email de Boas-vindas</Label>
                <p className="text-sm text-muted-foreground">
                  Receber email quando criar conta
                </p>
              </div>
              <Switch
                checked={settings.welcome_email}
                onCheckedChange={(checked) => updateSetting('welcome_email', checked)}
                disabled={!settings.email_notifications}
              />
            </div>
          </div>

          <Button onClick={saveSettings} disabled={loading} className="w-full">
            {loading ? 'Salvando...' : 'Salvar Configurações'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default NotificationSettings;