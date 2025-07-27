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

  const updateSlideSetting = (sectionName: string, slideIndex: number, field: string, value: any) => {
    setSettings(prev => prev.map(setting => 
      setting.section_name === sectionName 
        ? { 
            ...setting, 
            content: { 
              ...setting.content, 
              slides: {
                ...setting.content.slides,
                [slideIndex]: {
                  ...setting.content.slides?.[slideIndex],
                  [field]: value
                }
              }
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
            <div className="space-y-6">
              {/* Hero Settings Overview */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Monitor className="w-5 h-5" />
                    Configurações Gerais do Hero
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {heroSettings && (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="hero-auto-play">Reprodução Automática</Label>
                          <div className="flex items-center space-x-2 mt-2">
                            <Switch
                              id="hero-auto-play"
                              checked={heroSettings.content.auto_play || false}
                              onCheckedChange={(checked) => updateSetting('hero', 'auto_play', checked)}
                            />
                            <Label htmlFor="hero-auto-play" className="text-sm text-muted-foreground">
                              Troca automática de slides
                            </Label>
                          </div>
                        </div>
                        <div>
                          <Label htmlFor="hero-interval">Intervalo (segundos)</Label>
                          <Input
                            id="hero-interval"
                            type="number"
                            min="3"
                            max="15"
                            value={heroSettings.content.slide_interval || 6}
                            onChange={(e) => updateSetting('hero', 'slide_interval', parseInt(e.target.value))}
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="hero-3d-enabled">Efeitos 3D</Label>
                        <div className="flex items-center space-x-2 mt-2">
                          <Switch
                            id="hero-3d-enabled"
                            checked={heroSettings.content.enable_3d || true}
                            onCheckedChange={(checked) => updateSetting('hero', 'enable_3d', checked)}
                          />
                          <Label htmlFor="hero-3d-enabled" className="text-sm text-muted-foreground">
                            Ativar animações 3D de fundo
                          </Label>
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Slides Management */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Tablet className="w-5 h-5" />
                    Gerenciar Slides do Hero
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {heroSettings && (
                    <Tabs defaultValue="slide-0" className="space-y-4">
                      <TabsList className="grid w-full grid-cols-7">
                        {Array.from({ length: 7 }, (_, i) => (
                          <TabsTrigger key={i} value={`slide-${i}`}>
                            Slide {i + 1}
                          </TabsTrigger>
                        ))}
                      </TabsList>

                      {Array.from({ length: 7 }, (_, slideIndex) => (
                        <TabsContent key={slideIndex} value={`slide-${slideIndex}`} className="space-y-6">
                          <Card>
                            <CardHeader>
                              <CardTitle className="text-lg">Slide {slideIndex + 1} - Configurações</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                              {/* Basic Info */}
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <Label htmlFor={`slide-${slideIndex}-title`}>Título Principal</Label>
                                  <Input
                                    id={`slide-${slideIndex}-title`}
                                    value={heroSettings.content.slides?.[slideIndex]?.title || ''}
                                    onChange={(e) => updateSlideSetting('hero', slideIndex, 'title', e.target.value)}
                                    placeholder="Ex: Tecnologia 2025"
                                  />
                                </div>
                                <div>
                                  <Label htmlFor={`slide-${slideIndex}-subtitle`}>Subtítulo</Label>
                                  <Input
                                    id={`slide-${slideIndex}-subtitle`}
                                    value={heroSettings.content.slides?.[slideIndex]?.subtitle || ''}
                                    onChange={(e) => updateSlideSetting('hero', slideIndex, 'subtitle', e.target.value)}
                                    placeholder="Ex: Futuro"
                                  />
                                </div>
                              </div>

                              <div>
                                <Label htmlFor={`slide-${slideIndex}-description`}>Descrição</Label>
                                <Textarea
                                  id={`slide-${slideIndex}-description`}
                                  value={heroSettings.content.slides?.[slideIndex]?.description || ''}
                                  onChange={(e) => updateSlideSetting('hero', slideIndex, 'description', e.target.value)}
                                  rows={3}
                                  placeholder="Descrição atrativa do produto/categoria"
                                />
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                  <Label htmlFor={`slide-${slideIndex}-badge`}>Badge/Etiqueta</Label>
                                  <Input
                                    id={`slide-${slideIndex}-badge`}
                                    value={heroSettings.content.slides?.[slideIndex]?.badge || ''}
                                    onChange={(e) => updateSlideSetting('hero', slideIndex, 'badge', e.target.value)}
                                    placeholder="Ex: AI Tech 2025"
                                  />
                                </div>
                                <div>
                                  <Label htmlFor={`slide-${slideIndex}-discount`}>Desconto (%)</Label>
                                  <Input
                                    id={`slide-${slideIndex}-discount`}
                                    value={heroSettings.content.slides?.[slideIndex]?.discount || ''}
                                    onChange={(e) => updateSlideSetting('hero', slideIndex, 'discount', e.target.value)}
                                    placeholder="Ex: 45%"
                                  />
                                </div>
                                <div>
                                  <Label htmlFor={`slide-${slideIndex}-category`}>Categoria</Label>
                                  <Input
                                    id={`slide-${slideIndex}-category`}
                                    value={heroSettings.content.slides?.[slideIndex]?.category || ''}
                                    onChange={(e) => updateSlideSetting('hero', slideIndex, 'category', e.target.value)}
                                    placeholder="Ex: tech, audio, gaming"
                                  />
                                </div>
                              </div>

                              {/* Image */}
                              <div>
                                <Label htmlFor={`slide-${slideIndex}-image`}>URL da Imagem</Label>
                                <Input
                                  id={`slide-${slideIndex}-image`}
                                  value={heroSettings.content.slides?.[slideIndex]?.image_url || ''}
                                  onChange={(e) => updateSlideSetting('hero', slideIndex, 'image_url', e.target.value)}
                                  placeholder="https://exemplo.com/imagem.jpg"
                                />
                              </div>

                              {/* Gradients */}
                              <div className="space-y-4">
                                <h4 className="font-semibold text-base">Configurações Visuais</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div>
                                    <Label htmlFor={`slide-${slideIndex}-gradient`}>Gradiente de Fundo</Label>
                                    <Input
                                      id={`slide-${slideIndex}-gradient`}
                                      value={heroSettings.content.slides?.[slideIndex]?.gradient || ''}
                                      onChange={(e) => updateSlideSetting('hero', slideIndex, 'gradient', e.target.value)}
                                      placeholder="from-violet-600 via-purple-600 to-blue-600"
                                    />
                                  </div>
                                  <div>
                                    <Label htmlFor={`slide-${slideIndex}-text-gradient`}>Gradiente do Texto</Label>
                                    <Input
                                      id={`slide-${slideIndex}-text-gradient`}
                                      value={heroSettings.content.slides?.[slideIndex]?.text_gradient || ''}
                                      onChange={(e) => updateSlideSetting('hero', slideIndex, 'text_gradient', e.target.value)}
                                      placeholder="from-cyan-300 to-violet-300"
                                    />
                                  </div>
                                </div>

                                <div>
                                  <Label htmlFor={`slide-${slideIndex}-bg-pattern`}>Padrão de Fundo (CSS)</Label>
                                  <Textarea
                                    id={`slide-${slideIndex}-bg-pattern`}
                                    value={heroSettings.content.slides?.[slideIndex]?.bg_pattern || ''}
                                    onChange={(e) => updateSlideSetting('hero', slideIndex, 'bg_pattern', e.target.value)}
                                    rows={2}
                                    placeholder="radial-gradient(circle at 20% 50%, rgba(120, 119, 198, 0.3), transparent 50%)"
                                  />
                                </div>
                              </div>

                              {/* CTA Buttons */}
                              <div className="space-y-4">
                                <h4 className="font-semibold text-base">Botões de Ação</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div>
                                    <Label htmlFor={`slide-${slideIndex}-cta-primary`}>Texto Botão Principal</Label>
                                    <Input
                                      id={`slide-${slideIndex}-cta-primary`}
                                      value={heroSettings.content.slides?.[slideIndex]?.cta_primary_text || ''}
                                      onChange={(e) => updateSlideSetting('hero', slideIndex, 'cta_primary_text', e.target.value)}
                                      placeholder="Explorar Agora"
                                    />
                                  </div>
                                  <div>
                                    <Label htmlFor={`slide-${slideIndex}-cta-primary-link`}>Link Botão Principal</Label>
                                    <Input
                                      id={`slide-${slideIndex}-cta-primary-link`}
                                      value={heroSettings.content.slides?.[slideIndex]?.cta_primary_link || ''}
                                      onChange={(e) => updateSlideSetting('hero', slideIndex, 'cta_primary_link', e.target.value)}
                                      placeholder="/categoria/tech"
                                    />
                                  </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div>
                                    <Label htmlFor={`slide-${slideIndex}-cta-secondary`}>Texto Botão Secundário</Label>
                                    <Input
                                      id={`slide-${slideIndex}-cta-secondary`}
                                      value={heroSettings.content.slides?.[slideIndex]?.cta_secondary_text || ''}
                                      onChange={(e) => updateSlideSetting('hero', slideIndex, 'cta_secondary_text', e.target.value)}
                                      placeholder="Ver Catálogo"
                                    />
                                  </div>
                                  <div>
                                    <Label htmlFor={`slide-${slideIndex}-cta-secondary-link`}>Link Botão Secundário</Label>
                                    <Input
                                      id={`slide-${slideIndex}-cta-secondary-link`}
                                      value={heroSettings.content.slides?.[slideIndex]?.cta_secondary_link || ''}
                                      onChange={(e) => updateSlideSetting('hero', slideIndex, 'cta_secondary_link', e.target.value)}
                                      placeholder="/catalogo"
                                    />
                                  </div>
                                </div>
                              </div>

                              {/* Toggle Active */}
                              <div className="flex items-center space-x-2 pt-4 border-t">
                                <Switch
                                  id={`slide-${slideIndex}-active`}
                                  checked={heroSettings.content.slides?.[slideIndex]?.active !== false}
                                  onCheckedChange={(checked) => updateSlideSetting('hero', slideIndex, 'active', checked)}
                                />
                                <Label htmlFor={`slide-${slideIndex}-active`}>Slide Ativo</Label>
                              </div>
                            </CardContent>
                          </Card>
                        </TabsContent>
                      ))}
                    </Tabs>
                  )}
                </CardContent>
              </Card>
            </div>
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