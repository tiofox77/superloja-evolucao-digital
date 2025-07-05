import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Settings, Store, Bell, Shield, Database, Save, Upload, Globe, Clock, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import SuperLojaAvatar from '@/components/SuperLojaAvatar';

const AdminConfiguracoes = () => {
  const [settings, setSettings] = useState({
    // Store Info
    store_name: 'SuperLoja',
    store_description: 'A melhor loja de eletrônicos de Angola',
    logo_url: null,
    
    // Contact Info
    contact_email: 'contato@superloja.com',
    contact_phone: '+244 900 000 000',
    address: 'Luanda, Angola',
    
    // Business Info
    business_hours: '9:00 - 18:00',
    website: '',
    facebook: '',
    instagram: '',
    whatsapp: '',
    
    // System Settings
    notifications_enabled: true,
    auto_backup: true,
    maintenance_mode: false
  });
  const [loading, setLoading] = useState(false);
  const [logoFile, setLogoFile] = useState(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('settings')
        .select('*');
      
      if (error) throw error;
      
      // Parse settings from database
      const settingsMap: any = {};
      data?.forEach(setting => {
        const value = setting.value as any;
        if (setting.key === 'store_info') {
          settingsMap.store_name = value.name;
          settingsMap.store_description = value.description;
          settingsMap.logo_url = value.logo_url;
        } else if (setting.key === 'contact_info') {
          settingsMap.contact_email = value.email;
          settingsMap.contact_phone = value.phone;
          settingsMap.address = value.address;
        } else if (setting.key === 'business_info') {
          settingsMap.business_hours = value.business_hours;
          settingsMap.website = value.website || '';
          settingsMap.facebook = value.social_media?.facebook || '';
          settingsMap.instagram = value.social_media?.instagram || '';
          settingsMap.whatsapp = value.social_media?.whatsapp || '';
        } else if (setting.key === 'system_settings') {
          settingsMap.notifications_enabled = value.notifications_enabled;
          settingsMap.auto_backup = value.auto_backup;
          settingsMap.maintenance_mode = value.maintenance_mode;
        }
      });
      
      setSettings(prev => ({ ...prev, ...settingsMap }));
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
    }
  };

  const uploadLogo = async (file) => {
    setUploadingLogo(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `logo.${fileExt}`;
      const filePath = `logos/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath);

      return data.publicUrl;
    } catch (error) {
      console.error('Erro ao fazer upload do logo:', error);
      throw error;
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      let logoUrl = settings.logo_url;
      
      // Upload logo if selected
      if (logoFile) {
        logoUrl = await uploadLogo(logoFile);
      }

      // Update settings in database
      const updates = [
        {
          key: 'store_info',
          value: {
            name: settings.store_name,
            description: settings.store_description,
            logo_url: logoUrl
          }
        },
        {
          key: 'contact_info',
          value: {
            email: settings.contact_email,
            phone: settings.contact_phone,
            address: settings.address
          }
        },
        {
          key: 'business_info',
          value: {
            business_hours: settings.business_hours,
            website: settings.website,
            social_media: {
              facebook: settings.facebook,
              instagram: settings.instagram,
              whatsapp: settings.whatsapp
            }
          }
        },
        {
          key: 'system_settings',
          value: {
            notifications_enabled: settings.notifications_enabled,
            auto_backup: settings.auto_backup,
            maintenance_mode: settings.maintenance_mode
          }
        }
      ];

      for (const update of updates) {
        const { error } = await supabase
          .from('settings')
          .upsert({ 
            key: update.key, 
            value: update.value,
            description: update.key.replace('_', ' ').toUpperCase()
          }, { 
            onConflict: 'key' 
          });

        if (error) throw error;
      }
      
      setSettings(prev => ({ ...prev, logo_url: logoUrl }));
      setLogoFile(null);
      
      toast({
        title: "✅ Configurações salvas!",
        description: "Todas as configurações foram atualizadas com sucesso."
      });
    } catch (error) {
      console.error('Erro ao salvar:', error);
      toast({
        title: "❌ Erro ao salvar",
        description: "Não foi possível salvar as configurações.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          ⚙️ Configurações
        </h1>
        <p className="text-muted-foreground">Gerencie as configurações da sua loja e sistema</p>
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
              <Label>Logo da Loja</Label>
              <div className="mt-2 space-y-4">
                <div className="flex items-center gap-4">
                  <SuperLojaAvatar 
                    src={settings.logo_url} 
                    alt="Logo da loja"
                    size="lg"
                  />
                  <div className="flex-1">
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setLogoFile(file);
                        }
                      }}
                      className="mb-2"
                    />
                    <p className="text-xs text-muted-foreground">
                      Formatos aceitos: JPG, PNG, GIF (máx. 2MB)
                    </p>
                  </div>
                </div>
                {logoFile && (
                  <p className="text-sm text-green-600">
                    ✓ Nova logo selecionada: {logoFile.name}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Informações de Contato */}
        <Card className="hover-scale">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Contato & Endereço
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
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
              <Textarea
                id="address"
                value={settings.address}
                onChange={(e) => setSettings({...settings, address: e.target.value})}
                className="mt-1"
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Informações do Negócio */}
        <Card className="hover-scale">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Negócio & Redes Sociais
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="business_hours">Horário de Funcionamento</Label>
              <Input
                id="business_hours"
                value={settings.business_hours}
                onChange={(e) => setSettings({...settings, business_hours: e.target.value})}
                placeholder="Ex: 9:00 - 18:00"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                value={settings.website}
                onChange={(e) => setSettings({...settings, website: e.target.value})}
                placeholder="https://www.superloja.com"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="whatsapp">WhatsApp</Label>
              <Input
                id="whatsapp"
                value={settings.whatsapp}
                onChange={(e) => setSettings({...settings, whatsapp: e.target.value})}
                placeholder="+244 900 000 000"
                className="mt-1"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="facebook">Facebook</Label>
                <Input
                  id="facebook"
                  value={settings.facebook}
                  onChange={(e) => setSettings({...settings, facebook: e.target.value})}
                  placeholder="@superloja"
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="instagram">Instagram</Label>
                <Input
                  id="instagram"
                  value={settings.instagram}
                  onChange={(e) => setSettings({...settings, instagram: e.target.value})}
                  placeholder="@superloja"
                  className="mt-1"
                />
              </div>
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
                <div className="text-2xl font-bold">v1.2.0</div>
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
        <Button onClick={handleSave} size="lg" disabled={loading}>
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Salvando...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              💾 Salvar Configurações
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default AdminConfiguracoes;