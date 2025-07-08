import React, { useState, useEffect } from 'react';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AdminSidebar } from '@/components/AdminSidebar';
import { AdminHeader } from '@/components/AdminHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Layout, Monitor, Smartphone, Tablet, Save, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface LayoutSettings {
  section_name: string;
  content: any;
  is_active: boolean;
}

const AdminLayoutEditor = () => {
  const [settings, setSettings] = useState<LayoutSettings[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadLayoutSettings();
  }, []);

  const loadLayoutSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('layout_settings')
        .select('*')
        .order('section_name');

      if (error) throw error;
      setSettings(data || []);
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as configurações.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = (sectionName: string, field: string, value: any) => {
    setSettings(prev => prev.map(setting => 
      setting.section_name === sectionName 
        ? { 
            ...setting, 
            content: { ...setting.content, [field]: value } 
          }
        : setting
    ));
  };

  const updateNestedSetting = (sectionName: string, parentField: string, field: string, value: any) => {
    setSettings(prev => prev.map(setting => 
      setting.section_name === sectionName 
        ? { 
            ...setting, 
            content: { 
              ...setting.content, 
              [parentField]: { ...setting.content[parentField], [field]: value } 
            } 
          }
        : setting
    ));
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      for (const setting of settings) {
        const { error } = await supabase
          .from('layout_settings')
          .update({
            content: setting.content,
            is_active: setting.is_active
          })
          .eq('section_name', setting.section_name);

        if (error) throw error;
      }

      toast({
        title: "✅ Configurações salvas!",
        description: "As alterações foram aplicadas com sucesso."
      });
    } catch (error) {
      console.error('Erro ao salvar:', error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar as configurações.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const getSettingByName = (name: string) => {
    return settings.find(s => s.section_name === name);
  };

  if (loading) {
    return (
      <SidebarProvider>
        <div className="min-h-screen flex w-full bg-muted/10">
          <AdminSidebar />
          <div className="flex-1 flex flex-col">
            <AdminHeader />
            <main className="flex-1 p-6">
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            </main>
          </div>
        </div>
      </SidebarProvider>
    );
  }

  const heroSettings = getSettingByName('hero');
  const footerSettings = getSettingByName('footer');
  const aboutSettings = getSettingByName('about');
  const contactSettings = getSettingByName('contact');

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-muted/10">
        <AdminSidebar />
        <div className="flex-1 flex flex-col">
          <AdminHeader />
          <main className="flex-1 p-6">
            <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Editor de Layout</h1>
            <p className="text-muted-foreground">
              Personalize a aparência do seu site
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={loadLayoutSettings}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Recarregar
            </Button>
            <Button onClick={saveSettings} disabled={saving}>
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Salvar Tudo
                </>
              )}
            </Button>
          </div>
        </div>

        <Tabs defaultValue="hero" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="hero">Hero Section</TabsTrigger>
            <TabsTrigger value="footer">Footer</TabsTrigger>
            <TabsTrigger value="about">Sobre</TabsTrigger>
            <TabsTrigger value="contact">Contato</TabsTrigger>
          </TabsList>

          {/* Hero Section */}
          <TabsContent value="hero">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Monitor className="w-5 h-5" />
                  Seção Hero (Página Inicial)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {heroSettings && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="hero-title">Título Principal</Label>
                        <Input
                          id="hero-title"
                          value={heroSettings.content.title || ''}
                          onChange={(e) => updateSetting('hero', 'title', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="hero-cta">Texto do Botão</Label>
                        <Input
                          id="hero-cta"
                          value={heroSettings.content.cta_text || ''}
                          onChange={(e) => updateSetting('hero', 'cta_text', e.target.value)}
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="hero-subtitle">Subtítulo</Label>
                      <Textarea
                        id="hero-subtitle"
                        value={heroSettings.content.subtitle || ''}
                        onChange={(e) => updateSetting('hero', 'subtitle', e.target.value)}
                        rows={3}
                      />
                    </div>
                    <div>
                      <Label htmlFor="hero-link">Link do Botão</Label>
                      <Input
                        id="hero-link"
                        value={heroSettings.content.cta_link || ''}
                        onChange={(e) => updateSetting('hero', 'cta_link', e.target.value)}
                        placeholder="/catalogo"
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="hero-stats"
                        checked={heroSettings.content.show_stats || false}
                        onCheckedChange={(checked) => updateSetting('hero', 'show_stats', checked)}
                      />
                      <Label htmlFor="hero-stats">Mostrar Estatísticas</Label>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Footer */}
          <TabsContent value="footer">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Layout className="w-5 h-5" />
                  Rodapé
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {footerSettings && (
                  <>
                    <div>
                      <Label htmlFor="footer-description">Descrição da Empresa</Label>
                      <Textarea
                        id="footer-description"
                        value={footerSettings.content.company_description || ''}
                        onChange={(e) => updateSetting('footer', 'company_description', e.target.value)}
                        rows={3}
                      />
                    </div>
                    
                    <Separator />
                    
                    <div className="space-y-4">
                      <h4 className="font-semibold">Informações de Contato</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="footer-email">Email</Label>
                          <Input
                            id="footer-email"
                            value={footerSettings.content.contact_info?.email || ''}
                            onChange={(e) => updateNestedSetting('footer', 'contact_info', 'email', e.target.value)}
                          />
                        </div>
                        <div>
                          <Label htmlFor="footer-phone">Telefone</Label>
                          <Input
                            id="footer-phone"
                            value={footerSettings.content.contact_info?.phone || ''}
                            onChange={(e) => updateNestedSetting('footer', 'contact_info', 'phone', e.target.value)}
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="footer-address">Endereço</Label>
                        <Input
                          id="footer-address"
                          value={footerSettings.content.contact_info?.address || ''}
                          onChange={(e) => updateNestedSetting('footer', 'contact_info', 'address', e.target.value)}
                        />
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div className="space-y-4">
                      <h4 className="font-semibold">Redes Sociais</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <Label htmlFor="footer-facebook">Facebook</Label>
                          <Input
                            id="footer-facebook"
                            value={footerSettings.content.social_links?.facebook || ''}
                            onChange={(e) => updateNestedSetting('footer', 'social_links', 'facebook', e.target.value)}
                            placeholder="https://facebook.com/..."
                          />
                        </div>
                        <div>
                          <Label htmlFor="footer-instagram">Instagram</Label>
                          <Input
                            id="footer-instagram"
                            value={footerSettings.content.social_links?.instagram || ''}
                            onChange={(e) => updateNestedSetting('footer', 'social_links', 'instagram', e.target.value)}
                            placeholder="https://instagram.com/..."
                          />
                        </div>
                        <div>
                          <Label htmlFor="footer-whatsapp">WhatsApp</Label>
                          <Input
                            id="footer-whatsapp"
                            value={footerSettings.content.social_links?.whatsapp || ''}
                            onChange={(e) => updateNestedSetting('footer', 'social_links', 'whatsapp', e.target.value)}
                            placeholder="+244..."
                          />
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* About */}
          <TabsContent value="about">
            <Card>
              <CardHeader>
                <CardTitle>Página Sobre</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {aboutSettings && (
                  <>
                    <div>
                      <Label htmlFor="about-title">Título</Label>
                      <Input
                        id="about-title"
                        value={aboutSettings.content.title || ''}
                        onChange={(e) => updateSetting('about', 'title', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="about-content">Conteúdo</Label>
                      <Textarea
                        id="about-content"
                        value={aboutSettings.content.content || ''}
                        onChange={(e) => updateSetting('about', 'content', e.target.value)}
                        rows={6}
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="about-mission">Missão</Label>
                        <Textarea
                          id="about-mission"
                          value={aboutSettings.content.mission || ''}
                          onChange={(e) => updateSetting('about', 'mission', e.target.value)}
                          rows={3}
                        />
                      </div>
                      <div>
                        <Label htmlFor="about-vision">Visão</Label>
                        <Textarea
                          id="about-vision"
                          value={aboutSettings.content.vision || ''}
                          onChange={(e) => updateSetting('about', 'vision', e.target.value)}
                          rows={3}
                        />
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Contact */}
          <TabsContent value="contact">
            <Card>
              <CardHeader>
                <CardTitle>Página Contato</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {contactSettings && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="contact-title">Título</Label>
                        <Input
                          id="contact-title"
                          value={contactSettings.content.title || ''}
                          onChange={(e) => updateSetting('contact', 'title', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="contact-subtitle">Subtítulo</Label>
                        <Input
                          id="contact-subtitle"
                          value={contactSettings.content.subtitle || ''}
                          onChange={(e) => updateSetting('contact', 'subtitle', e.target.value)}
                        />
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div className="space-y-4">
                      <h4 className="font-semibold">Horários de Funcionamento</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <Label htmlFor="contact-weekdays">Dias de Semana</Label>
                          <Input
                            id="contact-weekdays"
                            value={contactSettings.content.business_hours?.weekdays || ''}
                            onChange={(e) => updateNestedSetting('contact', 'business_hours', 'weekdays', e.target.value)}
                            placeholder="08:00 - 18:00"
                          />
                        </div>
                        <div>
                          <Label htmlFor="contact-saturday">Sábado</Label>
                          <Input
                            id="contact-saturday"
                            value={contactSettings.content.business_hours?.saturday || ''}
                            onChange={(e) => updateNestedSetting('contact', 'business_hours', 'saturday', e.target.value)}
                            placeholder="08:00 - 14:00"
                          />
                        </div>
                        <div>
                          <Label htmlFor="contact-sunday">Domingo</Label>
                          <Input
                            id="contact-sunday"
                            value={contactSettings.content.business_hours?.sunday || ''}
                            onChange={(e) => updateNestedSetting('contact', 'business_hours', 'sunday', e.target.value)}
                            placeholder="Fechado"
                          />
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default AdminLayoutEditor;