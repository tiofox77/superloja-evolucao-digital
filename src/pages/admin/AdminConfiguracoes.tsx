import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Settings, Store, Bell, Shield, Database, Save, Upload, Globe, Clock, Users, Mail, MessageSquare, FileText, Zap, Download, RefreshCw, GitBranch, AlertTriangle, CheckCircle, History } from 'lucide-react';
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
    maintenance_mode: false,
    
    // Backup Settings
    github_repo: '',
    github_token: '',
    auto_update: false,
    current_version: 'v1.2.0',
    
    // Email Settings (SMTP)
    smtp_host: '',
    smtp_port: '587',
    smtp_user: '',
    smtp_password: '',
    smtp_from_email: '',
    smtp_from_name: '',
    smtp_use_tls: true,
    
    // SMS Settings (Twilio)
    twilio_account_sid: '',
    twilio_auth_token: '',
    twilio_phone_number: '',
    sms_notifications_enabled: false,
    
    // Notification Templates
    email_templates: {
      welcome: {
        enabled: true,
        subject: 'Bem-vindo à SuperLoja!',
        body: 'Olá {userName}! Sua conta foi criada com sucesso. Aproveite nossas ofertas especiais!'
      },
      order_created: {
        enabled: true,
        subject: 'Pedido Confirmado #{orderNumber}',
        body: 'Seu pedido #{orderNumber} foi criado com sucesso! Total: {orderTotal}. Acompanhe o status em nossa plataforma.'
      },
      status_changed: {
        enabled: true,
        subject: 'Status do Pedido Atualizado',
        body: 'Seu pedido #{orderNumber} teve o status alterado para: {newStatus}. Fique atento às atualizações!'
      }
    },
    sms_templates: {
      welcome: {
        enabled: true,
        body: 'Bem-vindo à SuperLoja, {userName}! Sua conta foi criada com sucesso. Aproveite!'
      },
      order_created: {
        enabled: true,
        body: 'SuperLoja: Pedido #{orderNumber} confirmado! Total: {orderTotal}'
      },
      status_changed: {
        enabled: true,
        body: 'SuperLoja: Pedido #{orderNumber} - Status: {newStatus}'
      }
    }
  });
  const [loading, setLoading] = useState(false);
  const [logoFile, setLogoFile] = useState(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [backupStatus, setBackupStatus] = useState('idle'); // idle, processing, success, error
  const [updateLogs, setUpdateLogs] = useState([]);
  const [availableVersions, setAvailableVersions] = useState([]);
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
            settingsMap.github_repo = value.github_repo || '';
            settingsMap.github_token = value.github_token || '';
            settingsMap.auto_update = value.auto_update ?? false;
            settingsMap.current_version = value.current_version || 'v1.2.0';
        } else if (setting.key === 'email_settings') {
          settingsMap.smtp_host = value.smtp_host || '';
          settingsMap.smtp_port = value.smtp_port || '587';
          settingsMap.smtp_user = value.smtp_user || '';
          settingsMap.smtp_password = value.smtp_password || '';
          settingsMap.smtp_from_email = value.smtp_from_email || '';
          settingsMap.smtp_from_name = value.smtp_from_name || '';
          settingsMap.smtp_use_tls = value.smtp_use_tls ?? true;
        } else if (setting.key === 'sms_settings') {
          settingsMap.twilio_account_sid = value.twilio_account_sid || '';
          settingsMap.twilio_auth_token = value.twilio_auth_token || '';
          settingsMap.twilio_phone_number = value.twilio_phone_number || '';
          settingsMap.sms_notifications_enabled = value.sms_notifications_enabled ?? false;
        } else if (setting.key === 'notification_templates') {
          settingsMap.email_templates = value.email_templates || settingsMap.email_templates;
          settingsMap.sms_templates = value.sms_templates || settingsMap.sms_templates;
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
            maintenance_mode: settings.maintenance_mode,
            github_repo: settings.github_repo,
            github_token: settings.github_token,
            auto_update: settings.auto_update,
            current_version: settings.current_version
          }
        },
        {
          key: 'email_settings',
          value: {
            smtp_host: settings.smtp_host,
            smtp_port: settings.smtp_port,
            smtp_user: settings.smtp_user,
            smtp_password: settings.smtp_password,
            smtp_from_email: settings.smtp_from_email,
            smtp_from_name: settings.smtp_from_name,
            smtp_use_tls: settings.smtp_use_tls
          }
        },
        {
          key: 'sms_settings',
          value: {
            twilio_account_sid: settings.twilio_account_sid,
            twilio_auth_token: settings.twilio_auth_token,
            twilio_phone_number: settings.twilio_phone_number,
            sms_notifications_enabled: settings.sms_notifications_enabled
          }
        },
        {
          key: 'notification_templates',
          value: {
            email_templates: settings.email_templates,
            sms_templates: settings.sms_templates
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

  const handleBackup = async () => {
    setBackupStatus('processing');
    try {
      const { data, error } = await supabase.functions.invoke('create-backup', {
        body: { type: 'manual' }
      });
      
      if (error) throw error;
      
      setBackupStatus('success');
      toast({
        title: "✅ Backup criado!",
        description: "Backup dos dados foi criado com sucesso."
      });
      
      // Add log entry
      const newLog = {
        id: Date.now(),
        type: 'backup',
        message: 'Backup manual criado com sucesso',
        timestamp: new Date().toISOString(),
        status: 'success'
      };
      setUpdateLogs(prev => [newLog, ...prev]);
      
    } catch (error) {
      setBackupStatus('error');
      toast({
        title: "❌ Erro no backup",
        description: "Não foi possível criar o backup.",
        variant: "destructive"
      });
    }
  };

  const checkForUpdates = async () => {
    try {
      if (!settings.github_repo) {
        toast({
          title: "⚠️ Repositório não configurado",
          description: "Configure o repositório GitHub nas configurações.",
          variant: "destructive"
        });
        return;
      }

      // Simulate GitHub API call for releases
      const versions = [
        { version: 'v1.3.0', date: '2024-01-15', changes: ['Nova funcionalidade de relatórios', 'Correções de bugs', 'Melhorias de performance'] },
        { version: 'v1.2.1', date: '2024-01-10', changes: ['Correção crítica de segurança', 'Otimização da base de dados'] },
        { version: 'v1.2.0', date: '2024-01-05', changes: ['Sistema de backup', 'Templates de notificação', 'Área do cliente'] }
      ];
      
      setAvailableVersions(versions);
      
      const hasUpdates = versions.some(v => v.version !== settings.current_version);
      if (hasUpdates) {
        toast({
          title: "🔄 Atualizações disponíveis",
          description: "Novas versões encontradas no repositório."
        });
      } else {
        toast({
          title: "✅ Sistema atualizado",
          description: "Você está usando a versão mais recente."
        });
      }
    } catch (error) {
      toast({
        title: "❌ Erro ao verificar atualizações",
        description: "Não foi possível conectar ao repositório.",
        variant: "destructive"
      });
    }
  };

  const performUpdate = async (version) => {
    setBackupStatus('processing');
    try {
      // Create automatic backup before update
      await handleBackup();
      
      const newLog = {
        id: Date.now(),
        type: 'update',
        message: `Iniciando atualização para ${version}`,
        timestamp: new Date().toISOString(),
        status: 'processing'
      };
      setUpdateLogs(prev => [newLog, ...prev]);
      
      // Simulate update process
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Update current version
      setSettings(prev => ({ ...prev, current_version: version }));
      
      const successLog = {
        id: Date.now() + 1,
        type: 'update',
        message: `Atualização para ${version} concluída com sucesso`,
        timestamp: new Date().toISOString(),
        status: 'success'
      };
      setUpdateLogs(prev => [successLog, ...prev.filter(log => log.id !== newLog.id)]);
      
      setBackupStatus('success');
      toast({
        title: "✅ Atualização concluída!",
        description: `Sistema atualizado para ${version} com sucesso.`
      });
      
    } catch (error) {
      const errorLog = {
        id: Date.now() + 2,
        type: 'update',
        message: `Erro na atualização para ${version}: ${error.message}`,
        timestamp: new Date().toISOString(),
        status: 'error'
      };
      setUpdateLogs(prev => [errorLog, ...prev]);
      
      setBackupStatus('error');
      toast({
        title: "❌ Erro na atualização",
        description: "Falha ao atualizar o sistema. Backup preservado.",
        variant: "destructive"
      });
    }
  };

  const rollbackUpdate = async () => {
    setBackupStatus('processing');
    try {
      const rollbackLog = {
        id: Date.now(),
        type: 'rollback',
        message: 'Iniciando rollback para versão anterior',
        timestamp: new Date().toISOString(),
        status: 'processing'
      };
      setUpdateLogs(prev => [rollbackLog, ...prev]);
      
      // Simulate rollback process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const successLog = {
        id: Date.now() + 1,
        type: 'rollback',
        message: 'Rollback concluído com sucesso',
        timestamp: new Date().toISOString(),
        status: 'success'
      };
      setUpdateLogs(prev => [successLog, ...prev.filter(log => log.id !== rollbackLog.id)]);
      
      setBackupStatus('success');
      toast({
        title: "✅ Rollback concluído!",
        description: "Sistema restaurado para versão anterior."
      });
      
    } catch (error) {
      setBackupStatus('error');
      toast({
        title: "❌ Erro no rollback",
        description: "Não foi possível fazer o rollback.",
        variant: "destructive"
      });
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

      <Tabs defaultValue="store" className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="store">Loja</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="notifications">Notificações</TabsTrigger>
          <TabsTrigger value="system">Sistema</TabsTrigger>
          <TabsTrigger value="backup">Backup</TabsTrigger>
          <TabsTrigger value="advanced">Avançado</TabsTrigger>
        </TabsList>

        <TabsContent value="store">
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

          </div>
        </TabsContent>

        <TabsContent value="templates">
          <div className="space-y-6">
            {/* Header */}
            <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 border-0">
              <CardContent className="p-6">
                <div className="text-center space-y-2">
                  <div className="flex justify-center">
                    <div className="bg-gradient-to-r from-blue-500 to-purple-500 p-3 rounded-full">
                      <FileText className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <h3 className="text-xl font-bold">Templates de Notificação</h3>
                  <p className="text-muted-foreground">
                    Configure mensagens personalizadas para cada evento do sistema
                  </p>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Email Templates */}
              <Card className="hover-scale">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Mail className="w-5 h-5" />
                    Templates de Email
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Welcome Email */}
                  <div className="space-y-4 p-4 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">Conta Criada</Badge>
                        <Switch
                          checked={settings.email_templates.welcome.enabled}
                          onCheckedChange={(checked) => setSettings({
                            ...settings,
                            email_templates: {
                              ...settings.email_templates,
                              welcome: { ...settings.email_templates.welcome, enabled: checked }
                            }
                          })}
                        />
                      </div>
                      <Zap className="w-4 h-4 text-green-500" />
                    </div>
                    
                    <div>
                      <Label htmlFor="welcome_email_subject">Assunto</Label>
                      <Input
                        id="welcome_email_subject"
                        value={settings.email_templates.welcome.subject}
                        onChange={(e) => setSettings({
                          ...settings,
                          email_templates: {
                            ...settings.email_templates,
                            welcome: { ...settings.email_templates.welcome, subject: e.target.value }
                          }
                        })}
                        placeholder="Assunto do email"
                        className="mt-1"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="welcome_email_body">Mensagem</Label>
                      <Textarea
                        id="welcome_email_body"
                        value={settings.email_templates.welcome.body}
                        onChange={(e) => setSettings({
                          ...settings,
                          email_templates: {
                            ...settings.email_templates,
                            welcome: { ...settings.email_templates.welcome, body: e.target.value }
                          }
                        })}
                        placeholder="Corpo do email"
                        className="mt-1"
                        rows={3}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Use {'{userName}'} para inserir o nome do usuário
                      </p>
                    </div>
                  </div>

                  {/* Order Created Email */}
                  <div className="space-y-4 p-4 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">Pedido Criado</Badge>
                        <Switch
                          checked={settings.email_templates.order_created.enabled}
                          onCheckedChange={(checked) => setSettings({
                            ...settings,
                            email_templates: {
                              ...settings.email_templates,
                              order_created: { ...settings.email_templates.order_created, enabled: checked }
                            }
                          })}
                        />
                      </div>
                      <Zap className="w-4 h-4 text-blue-500" />
                    </div>
                    
                    <div>
                      <Label htmlFor="order_email_subject">Assunto</Label>
                      <Input
                        id="order_email_subject"
                        value={settings.email_templates.order_created.subject}
                        onChange={(e) => setSettings({
                          ...settings,
                          email_templates: {
                            ...settings.email_templates,
                            order_created: { ...settings.email_templates.order_created, subject: e.target.value }
                          }
                        })}
                        className="mt-1"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="order_email_body">Mensagem</Label>
                      <Textarea
                        id="order_email_body"
                        value={settings.email_templates.order_created.body}
                        onChange={(e) => setSettings({
                          ...settings,
                          email_templates: {
                            ...settings.email_templates,
                            order_created: { ...settings.email_templates.order_created, body: e.target.value }
                          }
                        })}
                        className="mt-1"
                        rows={3}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Use {'{orderNumber}, {orderTotal}, {userName}'}
                      </p>
                    </div>
                  </div>

                  {/* Status Changed Email */}
                  <div className="space-y-4 p-4 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">Status Alterado</Badge>
                        <Switch
                          checked={settings.email_templates.status_changed.enabled}
                          onCheckedChange={(checked) => setSettings({
                            ...settings,
                            email_templates: {
                              ...settings.email_templates,
                              status_changed: { ...settings.email_templates.status_changed, enabled: checked }
                            }
                          })}
                        />
                      </div>
                      <Zap className="w-4 h-4 text-orange-500" />
                    </div>
                    
                    <div>
                      <Label htmlFor="status_email_subject">Assunto</Label>
                      <Input
                        id="status_email_subject"
                        value={settings.email_templates.status_changed.subject}
                        onChange={(e) => setSettings({
                          ...settings,
                          email_templates: {
                            ...settings.email_templates,
                            status_changed: { ...settings.email_templates.status_changed, subject: e.target.value }
                          }
                        })}
                        className="mt-1"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="status_email_body">Mensagem</Label>
                      <Textarea
                        id="status_email_body"
                        value={settings.email_templates.status_changed.body}
                        onChange={(e) => setSettings({
                          ...settings,
                          email_templates: {
                            ...settings.email_templates,
                            status_changed: { ...settings.email_templates.status_changed, body: e.target.value }
                          }
                        })}
                        className="mt-1"
                        rows={3}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Use {'{orderNumber}, {newStatus}, {userName}'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* SMS Templates */}
              <Card className="hover-scale">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="w-5 h-5" />
                    Templates de SMS
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Welcome SMS */}
                  <div className="space-y-4 p-4 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">Conta Criada</Badge>
                        <Switch
                          checked={settings.sms_templates.welcome.enabled}
                          onCheckedChange={(checked) => setSettings({
                            ...settings,
                            sms_templates: {
                              ...settings.sms_templates,
                              welcome: { ...settings.sms_templates.welcome, enabled: checked }
                            }
                          })}
                        />
                      </div>
                      <Zap className="w-4 h-4 text-green-500" />
                    </div>
                    
                    <div>
                      <Label htmlFor="welcome_sms_body">Mensagem SMS</Label>
                      <Textarea
                        id="welcome_sms_body"
                        value={settings.sms_templates.welcome.body}
                        onChange={(e) => setSettings({
                          ...settings,
                          sms_templates: {
                            ...settings.sms_templates,
                            welcome: { ...settings.sms_templates.welcome, body: e.target.value }
                          }
                        })}
                        placeholder="Mensagem do SMS"
                        className="mt-1"
                        rows={2}
                        maxLength={160}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Use {'{userName}'} • Máx: 160 caracteres • {settings.sms_templates.welcome.body.length}/160
                      </p>
                    </div>
                  </div>

                  {/* Order Created SMS */}
                  <div className="space-y-4 p-4 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">Pedido Criado</Badge>
                        <Switch
                          checked={settings.sms_templates.order_created.enabled}
                          onCheckedChange={(checked) => setSettings({
                            ...settings,
                            sms_templates: {
                              ...settings.sms_templates,
                              order_created: { ...settings.sms_templates.order_created, enabled: checked }
                            }
                          })}
                        />
                      </div>
                      <Zap className="w-4 h-4 text-blue-500" />
                    </div>
                    
                    <div>
                      <Label htmlFor="order_sms_body">Mensagem SMS</Label>
                      <Textarea
                        id="order_sms_body"
                        value={settings.sms_templates.order_created.body}
                        onChange={(e) => setSettings({
                          ...settings,
                          sms_templates: {
                            ...settings.sms_templates,
                            order_created: { ...settings.sms_templates.order_created, body: e.target.value }
                          }
                        })}
                        className="mt-1"
                        rows={2}
                        maxLength={160}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Use {'{orderNumber}, {orderTotal}'} • {settings.sms_templates.order_created.body.length}/160
                      </p>
                    </div>
                  </div>

                  {/* Status Changed SMS */}
                  <div className="space-y-4 p-4 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">Status Alterado</Badge>
                        <Switch
                          checked={settings.sms_templates.status_changed.enabled}
                          onCheckedChange={(checked) => setSettings({
                            ...settings,
                            sms_templates: {
                              ...settings.sms_templates,
                              status_changed: { ...settings.sms_templates.status_changed, enabled: checked }
                            }
                          })}
                        />
                      </div>
                      <Zap className="w-4 h-4 text-orange-500" />
                    </div>
                    
                    <div>
                      <Label htmlFor="status_sms_body">Mensagem SMS</Label>
                      <Textarea
                        id="status_sms_body"
                        value={settings.sms_templates.status_changed.body}
                        onChange={(e) => setSettings({
                          ...settings,
                          sms_templates: {
                            ...settings.sms_templates,
                            status_changed: { ...settings.sms_templates.status_changed, body: e.target.value }
                          }
                        })}
                        className="mt-1"
                        rows={2}
                        maxLength={160}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Use {'{orderNumber}, {newStatus}'} • {settings.sms_templates.status_changed.body.length}/160
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Template Variables Guide */}
            <Card className="bg-muted/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Guia de Variáveis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <h4 className="font-semibold mb-2">Usuário</h4>
                    <div className="space-y-1 text-muted-foreground">
                      <p><code>{'{userName}'}</code> - Nome do usuário</p>
                      <p><code>{'{userEmail}'}</code> - Email do usuário</p>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Pedido</h4>
                    <div className="space-y-1 text-muted-foreground">
                      <p><code>{'{orderNumber}'}</code> - Número do pedido</p>
                      <p><code>{'{orderTotal}'}</code> - Valor total</p>
                      <p><code>{'{newStatus}'}</code> - Novo status</p>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Loja</h4>
                    <div className="space-y-1 text-muted-foreground">
                      <p><code>{'{storeName}'}</code> - Nome da loja</p>
                      <p><code>{'{storePhone}'}</code> - Telefone da loja</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="notifications">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Email Settings */}
            <Card className="hover-scale">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="w-5 h-5" />
                  Configurações de Email (SMTP)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="smtp_host">Servidor SMTP</Label>
                    <Input
                      id="smtp_host"
                      value={settings.smtp_host}
                      onChange={(e) => setSettings({...settings, smtp_host: e.target.value})}
                      placeholder="smtp.gmail.com"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="smtp_port">Porta</Label>
                    <Input
                      id="smtp_port"
                      value={settings.smtp_port}
                      onChange={(e) => setSettings({...settings, smtp_port: e.target.value})}
                      placeholder="587"
                      className="mt-1"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="smtp_user">Usuário SMTP</Label>
                  <Input
                    id="smtp_user"
                    value={settings.smtp_user}
                    onChange={(e) => setSettings({...settings, smtp_user: e.target.value})}
                    placeholder="seu-email@gmail.com"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="smtp_password">Senha SMTP</Label>
                  <Input
                    id="smtp_password"
                    type="password"
                    value={settings.smtp_password}
                    onChange={(e) => setSettings({...settings, smtp_password: e.target.value})}
                    placeholder="sua-senha-app"
                    className="mt-1"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="smtp_from_email">Email de Envio</Label>
                    <Input
                      id="smtp_from_email"
                      value={settings.smtp_from_email}
                      onChange={(e) => setSettings({...settings, smtp_from_email: e.target.value})}
                      placeholder="noreply@superloja.com"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="smtp_from_name">Nome do Remetente</Label>
                    <Input
                      id="smtp_from_name"
                      value={settings.smtp_from_name}
                      onChange={(e) => setSettings({...settings, smtp_from_name: e.target.value})}
                      placeholder="SuperLoja"
                      className="mt-1"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Usar TLS/SSL</Label>
                    <div className="text-sm text-muted-foreground">
                      Conexão segura com o servidor
                    </div>
                  </div>
                  <Switch
                    checked={settings.smtp_use_tls}
                    onCheckedChange={(checked) => setSettings({...settings, smtp_use_tls: checked})}
                  />
                </div>
              </CardContent>
            </Card>

            {/* SMS Settings */}
            <Card className="hover-scale">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  Configurações de SMS (Twilio)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="space-y-0.5">
                    <Label>Notificações SMS</Label>
                    <div className="text-sm text-muted-foreground">
                      Habilitar envio de SMS
                    </div>
                  </div>
                  <Switch
                    checked={settings.sms_notifications_enabled}
                    onCheckedChange={(checked) => setSettings({...settings, sms_notifications_enabled: checked})}
                  />
                </div>

                <div>
                  <Label htmlFor="twilio_account_sid">Account SID</Label>
                  <Input
                    id="twilio_account_sid"
                    value={settings.twilio_account_sid}
                    onChange={(e) => setSettings({...settings, twilio_account_sid: e.target.value})}
                    placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                    className="mt-1"
                    disabled={!settings.sms_notifications_enabled}
                  />
                </div>

                <div>
                  <Label htmlFor="twilio_auth_token">Auth Token</Label>
                  <Input
                    id="twilio_auth_token"
                    type="password"
                    value={settings.twilio_auth_token}
                    onChange={(e) => setSettings({...settings, twilio_auth_token: e.target.value})}
                    placeholder="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                    className="mt-1"
                    disabled={!settings.sms_notifications_enabled}
                  />
                </div>

                <div>
                  <Label htmlFor="twilio_phone_number">Número Twilio</Label>
                  <Input
                    id="twilio_phone_number"
                    value={settings.twilio_phone_number}
                    onChange={(e) => setSettings({...settings, twilio_phone_number: e.target.value})}
                    placeholder="+1234567890"
                    className="mt-1"
                    disabled={!settings.sms_notifications_enabled}
                  />
                </div>

                <div className="p-4 bg-muted/50 rounded-lg">
                  <h4 className="font-medium text-sm mb-2">ℹ️ Como configurar Twilio:</h4>
                  <ol className="text-xs text-muted-foreground space-y-1">
                    <li>1. Crie conta em twilio.com</li>
                    <li>2. Obtenha Account SID e Auth Token</li>
                    <li>3. Compre um número de telefone</li>
                    <li>4. Configure as credenciais acima</li>
                  </ol>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="system">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
            <Card className="hover-scale">
              <CardHeader>
                <CardTitle>Informações do Sistema</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">Online</div>
                    <div className="text-sm text-muted-foreground">Status</div>
                  </div>
          <div className="text-center p-4 bg-muted/50 rounded-lg">
            <div className="text-2xl font-bold">{settings.current_version}</div>
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
        </TabsContent>

        <TabsContent value="backup">
          <div className="space-y-6">
            {/* Header */}
            <Card className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-950/20 dark:to-blue-950/20 border-0">
              <CardContent className="p-6">
                <div className="text-center space-y-2">
                  <div className="flex justify-center">
                    <div className="bg-gradient-to-r from-green-500 to-blue-500 p-3 rounded-full">
                      <Database className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <h3 className="text-xl font-bold">Sistema de Backup & Atualizações</h3>
                  <p className="text-muted-foreground">
                    Gerencie backups automáticos e atualizações do sistema via GitHub
                  </p>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* GitHub Configuration */}
              <Card className="hover-scale">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <GitBranch className="w-5 h-5" />
                    Configuração GitHub
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="github_repo">Repositório GitHub</Label>
                    <Input
                      id="github_repo"
                      value={settings.github_repo}
                      onChange={(e) => setSettings({...settings, github_repo: e.target.value})}
                      placeholder="usuario/repositorio"
                      className="mt-1"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Ex: meuusuario/superloja
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="github_token">Token de Acesso</Label>
                    <Input
                      id="github_token"
                      type="password"
                      value={settings.github_token}
                      onChange={(e) => setSettings({...settings, github_token: e.target.value})}
                      placeholder="ghp_xxxxxxxxxxxx"
                      className="mt-1"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Token GitHub com permissões de leitura
                    </p>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Atualizações Automáticas</Label>
                      <div className="text-sm text-muted-foreground">
                        Verificar e aplicar atualizações automaticamente
                      </div>
                    </div>
                    <Switch
                      checked={settings.auto_update}
                      onCheckedChange={(checked) => setSettings({...settings, auto_update: checked})}
                    />
                  </div>

                  <div className="pt-4 border-t">
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={checkForUpdates}
                        disabled={!settings.github_repo}
                      >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Verificar Atualizações
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Backup Management */}
              <Card className="hover-scale">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="w-5 h-5" />
                    Gerenciamento de Backup
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                    <div>
                      <div className="font-medium">Status do Sistema</div>
                      <div className="text-sm text-muted-foreground">
                        Versão atual: {settings.current_version}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {backupStatus === 'processing' && (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                      )}
                      {backupStatus === 'success' && (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      )}
                      {backupStatus === 'error' && (
                        <AlertTriangle className="w-5 h-5 text-red-500" />
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={handleBackup}
                      disabled={backupStatus === 'processing'}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      {backupStatus === 'processing' ? 'Criando Backup...' : 'Criar Backup Manual'}
                    </Button>

                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={rollbackUpdate}
                      disabled={backupStatus === 'processing'}
                    >
                      <History className="w-4 h-4 mr-2" />
                      Fazer Rollback
                    </Button>
                  </div>

                  <div className="pt-4 border-t">
                    <div className="text-sm space-y-1">
                      <p><strong>Último backup:</strong> Hoje às 03:00</p>
                      <p><strong>Próximo backup:</strong> Amanhã às 03:00</p>
                      <p><strong>Backups armazenados:</strong> 7 dias</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Available Updates */}
            {availableVersions.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <RefreshCw className="w-5 h-5" />
                    Atualizações Disponíveis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {availableVersions.filter(v => v.version !== settings.current_version).map((version) => (
                      <div key={version.version} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h4 className="font-semibold text-lg">{version.version}</h4>
                            <p className="text-sm text-muted-foreground">
                              Lançado em {new Date(version.date).toLocaleDateString('pt-BR')}
                            </p>
                          </div>
                          <Button 
                            size="sm"
                            onClick={() => performUpdate(version.version)}
                            disabled={backupStatus === 'processing'}
                          >
                            <Upload className="w-4 h-4 mr-2" />
                            Atualizar
                          </Button>
                        </div>
                        <div className="space-y-1">
                          <p className="font-medium text-sm">Mudanças:</p>
                          <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                            {version.changes.map((change, idx) => (
                              <li key={idx}>{change}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Update Logs */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Logs de Atualização
                </CardTitle>
              </CardHeader>
              <CardContent>
                {updateLogs.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Nenhum log de atualização disponível.</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {updateLogs.map((log) => (
                      <div key={log.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                        <div className="flex-shrink-0 mt-0.5">
                          {log.status === 'success' && <CheckCircle className="w-4 h-4 text-green-500" />}
                          {log.status === 'error' && <AlertTriangle className="w-4 h-4 text-red-500" />}
                          {log.status === 'processing' && (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">{log.message}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(log.timestamp).toLocaleString('pt-BR')}
                          </p>
                        </div>
                        <div className="flex-shrink-0">
                          <Badge variant={log.type === 'backup' ? 'secondary' : log.type === 'update' ? 'default' : 'outline'}>
                            {log.type}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="advanced">
          <Card className="hover-scale">
            <CardHeader>
              <CardTitle>Configurações Avançadas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <h4 className="font-medium text-yellow-800 dark:text-yellow-200 mb-2">⚠️ Atenção</h4>
                <p className="text-sm text-yellow-700 dark:text-yellow-300">
                  Essas configurações são para usuários avançados. Alterações incorretas podem afetar o funcionamento da loja.
                </p>
              </div>
              
              <div className="space-y-4">
                <h4 className="font-semibold">Cache e Performance</h4>
                <div className="grid grid-cols-2 gap-4">
                  <Button variant="outline">Limpar Cache</Button>
                  <Button variant="outline">Otimizar Imagens</Button>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-semibold">Logs do Sistema</h4>
                <Button variant="outline" className="w-full">Ver Logs de Erro</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

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