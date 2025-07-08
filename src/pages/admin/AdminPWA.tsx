import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Smartphone, Download, Settings, Bell, Image, Palette, Globe, Eye, Plus, Trash2, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface PWAShortcut {
  name: string;
  short_name?: string;
  description?: string;
  url: string;
  icons?: Array<{ src: string; sizes: string; type: string }>;
}

const AdminPWA = () => {
  const [settings, setSettings] = useState({
    name: 'SuperLoja',
    short_name: 'SuperLoja',
    description: 'Sua loja moderna de tecnologia',
    theme_color: '#4F46E5',
    background_color: '#ffffff',
    display: 'standalone',
    orientation: 'portrait-primary',
    start_url: '/',
    scope: '/',
    lang: 'pt-BR',
    categories: ['shopping', 'business'],
    icon_192: null,
    icon_512: null,
    icon_maskable: null,
    offline_page_enabled: true,
    offline_cache_strategy: 'cache-first',
    push_notifications_enabled: false,
    app_shortcuts: [] as PWAShortcut[],
    share_target: {},
    screenshots: [],
    install_prompt_enabled: true,
    install_prompt_delay: 3000
  });
  
  const [loading, setLoading] = useState(false);
  const [uploadingIcon, setUploadingIcon] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    loadPWASettings();
  }, []);

  const loadPWASettings = async () => {
    try {
      const { data, error } = await supabase
        .from('pwa_settings')
        .select('*')
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      
      if (data) {
        setSettings({
          ...settings,
          ...data,
          categories: data.categories || ['shopping', 'business'],
          app_shortcuts: Array.isArray(data.app_shortcuts) ? (data.app_shortcuts as unknown as PWAShortcut[]) : [],
          share_target: (typeof data.share_target === 'object' ? data.share_target : {}) as Record<string, any>,
          screenshots: Array.isArray(data.screenshots) ? data.screenshots : []
        });
      }
    } catch (error) {
      console.error('Erro ao carregar configurações PWA:', error);
    }
  };

  const uploadIcon = async (file: File, iconType: string) => {
    setUploadingIcon(iconType);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `pwa-icon-${iconType}.${fileExt}`;
      const filePath = `pwa/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath);

      return data.publicUrl;
    } catch (error) {
      console.error('Erro ao fazer upload do ícone:', error);
      throw error;
    } finally {
      setUploadingIcon('');
    }
  };

  const handleIconUpload = async (event: React.ChangeEvent<HTMLInputElement>, iconType: string) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const iconUrl = await uploadIcon(file, iconType);
      setSettings(prev => ({ ...prev, [`icon_${iconType}`]: iconUrl }));
      
      toast({
        title: "✅ Ícone carregado!",
        description: `Ícone ${iconType} atualizado com sucesso.`
      });
    } catch (error) {
      toast({
        title: "❌ Erro no upload",
        description: "Não foi possível carregar o ícone.",
        variant: "destructive"
      });
    }
  };

  const addShortcut = () => {
    const newShortcut: PWAShortcut = {
      name: '',
      url: '/',
      description: ''
    };
    setSettings(prev => ({
      ...prev,
      app_shortcuts: [...prev.app_shortcuts, newShortcut]
    }));
  };

  const updateShortcut = (index: number, field: keyof PWAShortcut, value: string) => {
    setSettings(prev => ({
      ...prev,
      app_shortcuts: prev.app_shortcuts.map((shortcut, i) => 
        i === index ? { ...shortcut, [field]: value } : shortcut
      )
    }));
  };

  const removeShortcut = (index: number) => {
    setSettings(prev => ({
      ...prev,
      app_shortcuts: prev.app_shortcuts.filter((_, i) => i !== index)
    }));
  };

  const updateManifest = async () => {
    const manifest = {
      name: settings.name,
      short_name: settings.short_name,
      description: settings.description,
      start_url: settings.start_url,
      display: settings.display,
      background_color: settings.background_color,
      theme_color: settings.theme_color,
      orientation: settings.orientation,
      scope: settings.scope,
      lang: settings.lang,
      categories: settings.categories,
      icons: [
        settings.icon_192 && {
          src: settings.icon_192,
          sizes: "192x192",
          type: "image/png"
        },
        settings.icon_512 && {
          src: settings.icon_512,
          sizes: "512x512",
          type: "image/png"
        },
        settings.icon_maskable && {
          src: settings.icon_maskable,
          sizes: "192x192",
          type: "image/png",
          purpose: "maskable"
        }
      ].filter(Boolean),
      shortcuts: settings.app_shortcuts.filter(s => s.name && s.url),
      share_target: Object.keys(settings.share_target).length > 0 ? settings.share_target : undefined,
      screenshots: settings.screenshots,
      prefer_related_applications: false
    };

    // Update manifest.json via storage or static file replacement
    try {
      const manifestBlob = new Blob([JSON.stringify(manifest, null, 2)], { 
        type: 'application/json' 
      });
      
      // For demo purposes, we'll log the manifest
      console.log('Manifest atualizado:', manifest);
      
      return manifest;
    } catch (error) {
      console.error('Erro ao atualizar manifest:', error);
      throw error;
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      // Update manifest
      await updateManifest();
      
      // Save to database
      const saveData = {
        name: settings.name,
        short_name: settings.short_name,
        description: settings.description,
        theme_color: settings.theme_color,
        background_color: settings.background_color,
        display: settings.display,
        orientation: settings.orientation,
        start_url: settings.start_url,
        scope: settings.scope,
        lang: settings.lang,
        categories: settings.categories,
        icon_192: settings.icon_192,
        icon_512: settings.icon_512,
        icon_maskable: settings.icon_maskable,
        offline_page_enabled: settings.offline_page_enabled,
        offline_cache_strategy: settings.offline_cache_strategy,
        push_notifications_enabled: settings.push_notifications_enabled,
        app_shortcuts: settings.app_shortcuts as any,
        share_target: settings.share_target as any,
        screenshots: settings.screenshots as any,
        install_prompt_enabled: settings.install_prompt_enabled,
        install_prompt_delay: settings.install_prompt_delay
      };
      
      const { error } = await supabase
        .from('pwa_settings')
        .upsert(saveData);

      if (error) throw error;
      
      toast({
        title: "✅ Configurações PWA salvas!",
        description: "Todas as configurações foram atualizadas com sucesso."
      });
    } catch (error) {
      console.error('Erro ao salvar:', error);
      toast({
        title: "❌ Erro ao salvar",
        description: "Não foi possível salvar as configurações PWA.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Configurações PWA</h1>
          <p className="text-muted-foreground mt-2">
            Configure sua Progressive Web App para uma experiência móvel avançada
          </p>
        </div>
        <Button onClick={handleSave} disabled={loading}>
          <Save className="h-4 w-4 mr-2" />
          {loading ? 'Salvando...' : 'Salvar Configurações'}
        </Button>
      </div>

      <div className="grid gap-6">
        {/* Informações Básicas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="h-5 w-5" />
              Informações Básicas
            </CardTitle>
          </CardHeader>
          <CardContent className="grid md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Nome do App</Label>
              <Input
                id="name"
                value={settings.name}
                onChange={(e) => setSettings(prev => ({ ...prev, name: e.target.value }))}
                placeholder="SuperLoja"
              />
            </div>
            <div>
              <Label htmlFor="short_name">Nome Curto</Label>
              <Input
                id="short_name"
                value={settings.short_name}
                onChange={(e) => setSettings(prev => ({ ...prev, short_name: e.target.value }))}
                placeholder="SuperLoja"
              />
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={settings.description}
                onChange={(e) => setSettings(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Sua loja moderna de tecnologia"
              />
            </div>
          </CardContent>
        </Card>

        {/* Aparência */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              Aparência
            </CardTitle>
          </CardHeader>
          <CardContent className="grid md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="theme_color">Cor do Tema</Label>
              <div className="flex gap-2">
                <Input
                  id="theme_color"
                  type="color"
                  value={settings.theme_color}
                  onChange={(e) => setSettings(prev => ({ ...prev, theme_color: e.target.value }))}
                  className="w-20"
                />
                <Input
                  value={settings.theme_color}
                  onChange={(e) => setSettings(prev => ({ ...prev, theme_color: e.target.value }))}
                  placeholder="#4F46E5"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="background_color">Cor de Fundo</Label>
              <div className="flex gap-2">
                <Input
                  id="background_color"
                  type="color"
                  value={settings.background_color}
                  onChange={(e) => setSettings(prev => ({ ...prev, background_color: e.target.value }))}
                  className="w-20"
                />
                <Input
                  value={settings.background_color}
                  onChange={(e) => setSettings(prev => ({ ...prev, background_color: e.target.value }))}
                  placeholder="#ffffff"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="display">Modo de Exibição</Label>
              <Select value={settings.display} onValueChange={(value) => setSettings(prev => ({ ...prev, display: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="standalone">Standalone (App Nativo)</SelectItem>
                  <SelectItem value="fullscreen">Tela Cheia</SelectItem>
                  <SelectItem value="minimal-ui">UI Mínima</SelectItem>
                  <SelectItem value="browser">Navegador</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="orientation">Orientação</Label>
              <Select value={settings.orientation} onValueChange={(value) => setSettings(prev => ({ ...prev, orientation: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="portrait-primary">Retrato</SelectItem>
                  <SelectItem value="landscape-primary">Paisagem</SelectItem>
                  <SelectItem value="any">Qualquer</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Ícones */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Image className="h-5 w-5" />
              Ícones do App
            </CardTitle>
          </CardHeader>
          <CardContent className="grid md:grid-cols-3 gap-4">
            {[
              { key: '192', label: 'Ícone 192x192', desc: 'Ícone principal do app' },
              { key: '512', label: 'Ícone 512x512', desc: 'Ícone de alta resolução' },
              { key: 'maskable', label: 'Ícone Maskable', desc: 'Ícone adaptativo para Android' }
            ].map(({ key, label, desc }) => (
              <div key={key} className="space-y-2">
                <Label>{label}</Label>
                <p className="text-xs text-muted-foreground">{desc}</p>
                {settings[`icon_${key}` as keyof typeof settings] && (
                  <img 
                    src={settings[`icon_${key}` as keyof typeof settings] as string} 
                    alt={label}
                    className="w-16 h-16 rounded-lg border"
                  />
                )}
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleIconUpload(e, key)}
                  disabled={uploadingIcon === key}
                />
                {uploadingIcon === key && (
                  <p className="text-xs text-primary">Carregando...</p>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Funcionalidades */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Funcionalidades
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Prompt de Instalação</Label>
                <p className="text-sm text-muted-foreground">
                  Exibir prompt para instalar o app no dispositivo
                </p>
              </div>
              <Switch
                checked={settings.install_prompt_enabled}
                onCheckedChange={(checked) => setSettings(prev => ({ ...prev, install_prompt_enabled: checked }))}
              />
            </div>
            
            {settings.install_prompt_enabled && (
              <div>
                <Label htmlFor="install_delay">Delay do Prompt (ms)</Label>
                <Input
                  id="install_delay"
                  type="number"
                  value={settings.install_prompt_delay}
                  onChange={(e) => setSettings(prev => ({ ...prev, install_prompt_delay: parseInt(e.target.value) }))}
                  placeholder="3000"
                />
              </div>
            )}

            <div className="flex items-center justify-between">
              <div>
                <Label>Página Offline</Label>
                <p className="text-sm text-muted-foreground">
                  Habilitar funcionalidade offline
                </p>
              </div>
              <Switch
                checked={settings.offline_page_enabled}
                onCheckedChange={(checked) => setSettings(prev => ({ ...prev, offline_page_enabled: checked }))}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Notificações Push</Label>
                <p className="text-sm text-muted-foreground">
                  Habilitar notificações push
                </p>
              </div>
              <Switch
                checked={settings.push_notifications_enabled}
                onCheckedChange={(checked) => setSettings(prev => ({ ...prev, push_notifications_enabled: checked }))}
              />
            </div>
          </CardContent>
        </Card>

        {/* Atalhos do App */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Atalhos do App
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {settings.app_shortcuts.map((shortcut, index) => (
              <div key={index} className="p-4 border rounded-lg space-y-3">
                <div className="flex justify-between items-start">
                  <h4 className="font-medium">Atalho {index + 1}</h4>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => removeShortcut(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <div className="grid md:grid-cols-2 gap-3">
                  <div>
                    <Label>Nome</Label>
                    <Input
                      value={shortcut.name}
                      onChange={(e) => updateShortcut(index, 'name', e.target.value)}
                      placeholder="Nome do atalho"
                    />
                  </div>
                  <div>
                    <Label>URL</Label>
                    <Input
                      value={shortcut.url}
                      onChange={(e) => updateShortcut(index, 'url', e.target.value)}
                      placeholder="/catalogo"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label>Descrição</Label>
                    <Input
                      value={shortcut.description || ''}
                      onChange={(e) => updateShortcut(index, 'description', e.target.value)}
                      placeholder="Descrição do atalho"
                    />
                  </div>
                </div>
              </div>
            ))}
            
            <Button onClick={addShortcut} variant="outline" className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Atalho
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminPWA;