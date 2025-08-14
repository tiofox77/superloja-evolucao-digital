import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/components/ui/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { OpenAIKeySetup } from '@/components/admin/OpenAIKeySetup';
import { PostPreview } from '@/components/admin/PostPreview';
import { WeeklyPlanner } from '@/components/admin/WeeklyPlanner';
import { AutomatedPlansStatus } from '@/components/admin/AutomatedPlansStatus';
import { 
  Bot, 
  Calendar, 
  Clock,
  Facebook, 
  Instagram, 
  Sparkles, 
  Send,
  History,
  Settings,
  Image,
  Zap,
  CalendarDays,
  HelpCircle,
  Eye
} from 'lucide-react';
import { TokenHelpDialog } from '@/components/admin/TokenHelpDialog';

interface ContentSuggestionsProps {
  content: string;
  onContentChange: (content: string) => void;
}

const ContentSuggestions: React.FC<ContentSuggestionsProps> = ({ content, onContentChange }) => {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    console.log('🔍 ContentSuggestions useEffect:', { content, hasTripleDash: content?.includes('---') });
    
    // Verificar se o conteúdo atual tem sugestões (formatadas com ---)
    if (content && typeof content === 'string' && content.includes('---')) {
      const newSuggestions = content.split('---').map(s => s.trim()).filter(s => s.length > 0);
      console.log('📝 Sugestões processadas:', newSuggestions.length, newSuggestions);
      
      if (newSuggestions.length >= 2) {
        setSuggestions(newSuggestions);
        // Manter o índice atual se válido, senão resetar para 0
        if (selectedIndex >= newSuggestions.length) {
          setSelectedIndex(0);
        }
        return; 
      }
    }
    
    // Conteúdo único
    if (content && typeof content === 'string') {
      setSuggestions([content]);
      setSelectedIndex(0);
    }
  }, [content, selectedIndex]);

  const handleSuggestionSelect = (index: number) => {
    console.log('📌 Selecionando sugestão:', index, suggestions[index]);
    setSelectedIndex(index);
    onContentChange(suggestions[index] || '');
  };

  const handleContentEdit = (editedContent: string) => {
    const newSuggestions = [...suggestions];
    newSuggestions[selectedIndex] = editedContent;
    setSuggestions(newSuggestions);
    onContentChange(editedContent);
  };

  if (suggestions.length <= 1) {
    return (
      <Textarea
        placeholder="Digite aqui seu conteúdo personalizado..."
        value={content}
        onChange={(e) => onContentChange(e.target.value)}
        className="min-h-[120px] resize-none"
      />
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2 flex-wrap mb-3">
        <div className="text-xs text-muted-foreground w-full mb-2">
          {suggestions.length} sugestões disponíveis
        </div>
        {suggestions.map((suggestion, index) => (
          <Button
            key={`suggestion-${index}`}
            variant={selectedIndex === index ? "default" : "outline"}
            size="sm"
            onClick={() => handleSuggestionSelect(index)}
            className="whitespace-nowrap"
          >
            Sugestão {index + 1}
          </Button>
        ))}
      </div>
      <Textarea
        value={suggestions[selectedIndex] || ''}
        onChange={(e) => handleContentEdit(e.target.value)}
        className="min-h-[120px] resize-none"
        placeholder="Edite o conteúdo da sugestão selecionada..."
      />
      <div className="text-sm text-muted-foreground">
        {suggestions.length} sugestões geradas • Selecione uma para editar
      </div>
    </div>
  );
};

interface Product {
  id: string;
  name: string;
  price: number;
  image_url?: string;
}

interface ScheduledPost {
  id: string;
  platform: string;
  content: string;
  scheduled_for: string;
  post_type: string;
  status: string;
  products?: Product;
}

interface SocialMediaSettings {
  platform: string;
  settings: {
    access_token?: string;
    page_id?: string;
    business_id?: string;
  };
  is_active: boolean;
}

const AdminAutoPostIA: React.FC = () => {
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [scheduledPosts, setScheduledPosts] = useState<ScheduledPost[]>([]);
  const [loading, setLoading] = useState(false);
  const [generatedContent, setGeneratedContent] = useState('');
  const [generatedBanner, setGeneratedBanner] = useState<string | null>(null);
  
  // Form states
  const [selectedProduct, setSelectedProduct] = useState('');
  const [platform, setPlatform] = useState('both');
  const [postType, setPostType] = useState('product');
  const [customPrompt, setCustomPrompt] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');

  // Social media settings states
  const [socialSettings, setSocialSettings] = useState<SocialMediaSettings[]>([]);
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [facebookSettings, setFacebookSettings] = useState({
    access_token: '',
    page_id: ''
  });
  const [instagramSettings, setInstagramSettings] = useState({
    access_token: '',
    business_id: ''
  });
  const [showKeySetup, setShowKeySetup] = useState(false);
  const [showTokenHelp, setShowTokenHelp] = useState(false);

  useEffect(() => {
    loadProducts();
    loadScheduledPosts();
    loadSocialSettings();
  }, []);

  const loadProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('id, name, price, image_url')
        .eq('active', true)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);
    }
  };

  const loadScheduledPosts = async () => {
    try {
      const response = await supabase.functions.invoke('auto-post-social', {
        body: { action: 'get_scheduled' }
      });

      if (response.data?.scheduled_posts) {
        setScheduledPosts(response.data.scheduled_posts);
      }
    } catch (error) {
      console.error('Erro ao carregar posts agendados:', error);
    }
  };

  const loadSocialSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('social_media_settings')
        .select('*')
        .in('platform', ['facebook', 'instagram']);

      if (error) throw error;

      // Type assertion for proper handling
      const typedData = data as Array<{
        platform: string;
        settings: any;
        is_active: boolean;
      }>;

      setSocialSettings(typedData || []);
      
      // Set individual platform settings
      const facebook = typedData?.find(s => s.platform === 'facebook');
      if (facebook && facebook.settings && typeof facebook.settings === 'object') {
        const fbSettings = facebook.settings as any;
        setFacebookSettings({
          access_token: fbSettings.access_token || '',
          page_id: fbSettings.page_id || ''
        });
      }

      const instagram = typedData?.find(s => s.platform === 'instagram');
      if (instagram && instagram.settings && typeof instagram.settings === 'object') {
        const igSettings = instagram.settings as any;
        setInstagramSettings({
          access_token: igSettings.access_token || '',
          business_id: igSettings.business_id || ''
        });
      }
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
    }
  };

  const generateBanner = async (product: Product) => {
    try {
      const { BannerService } = await import('@/utils/BannerService');
      
      const bannerDataUrl = await BannerService.generateProductBanner(
        {
          id: product.id,
          name: product.name,
          price: product.price,
          image_url: product.image_url
        },
        postType
      );
      
      if (bannerDataUrl) {
        setGeneratedBanner(bannerDataUrl);
        return bannerDataUrl;
      }
    } catch (error) {
      console.error('Erro ao gerar banner:', error);
    }
    return null;
  };

  const generateContent = async () => {
    setLoading(true);
    setGeneratedBanner(null);
    
    try {
      // Gerar banner primeiro se houver produto selecionado
      let bannerUrl = null;
      if (selectedProduct) {
        const product = products.find(p => p.id === selectedProduct);
        if (product) {
          bannerUrl = await generateBanner(product);
        }
      }

      const response = await supabase.functions.invoke('auto-post-social', {
        body: {
          action: 'generate_content',
          product_id: selectedProduct || undefined,
          post_type: postType,
          custom_prompt: customPrompt || undefined
        }
      });

      if (response.data?.suggestions && response.data.suggestions.length >= 2) {
        // Formatar as sugestões separadas por ---
        const formattedContent = response.data.suggestions.join('\n---\n');
        setGeneratedContent(formattedContent);
        toast({
          title: "3 Sugestões geradas!",
          description: bannerUrl 
            ? "Conteúdo criado com banner promocional incluído"
            : "Conteúdo criado pela IA com sucesso",
        });
      } else if (response.data?.content) {
        setGeneratedContent(response.data.content);
        toast({
          title: "Conteúdo gerado!",
          description: bannerUrl 
            ? "Conteúdo criado com banner promocional incluído"
            : "Conteúdo criado pela IA com sucesso",
        });
      } else {
        // Check if the error is related to missing OpenAI key
        if (response.error?.message?.includes('OpenAI API Key não configurada')) {
          setShowKeySetup(true);
          toast({
            title: "Configuração Necessária",
            description: "Configure sua chave OpenAI para gerar conteúdo",
            variant: "destructive",
          });
          return;
        }
        throw new Error('Erro ao gerar conteúdo');
      }
    } catch (error) {
      console.error('Erro ao gerar conteúdo:', error);
      // Check if the error is related to missing OpenAI key
      if (error.message?.includes('OpenAI API Key não configurada')) {
        setShowKeySetup(true);
        toast({
          title: "Configuração Necessária",
          description: "Configure sua chave OpenAI para gerar conteúdo",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Erro",
          description: "Falha ao gerar conteúdo com IA",
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const schedulePost = async () => {
    if (!generatedContent) {
      toast({
        title: "Erro",
        description: "Gere o conteúdo primeiro",
        variant: "destructive",
      });
      return;
    }

    if (!scheduleTime) {
      toast({
        title: "Erro",
        description: "Selecione data e hora para agendamento",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const response = await supabase.functions.invoke('auto-post-social', {
        body: {
          action: 'schedule_post',
          platform,
          product_id: selectedProduct || undefined,
          custom_prompt: generatedContent,
          schedule_time: scheduleTime,
          post_type: postType
        }
      });

      if (response.data?.success) {
        toast({
          title: "Post agendado!",
          description: "Post foi agendado com sucesso",
        });
        setGeneratedContent('');
        setScheduleTime('');
        loadScheduledPosts();
      } else {
        throw new Error('Erro ao agendar post');
      }
    } catch (error) {
      console.error('Erro ao agendar post:', error);
      toast({
        title: "Erro",
        description: "Falha ao agendar post",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const postNow = async () => {
    if (!generatedContent) {
      toast({
        title: "Erro",
        description: "Gere o conteúdo primeiro",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Converter banner do preview para base64 se existir
      let bannerBase64 = null;
      if (generatedBanner) {
        // O generatedBanner já é uma data URL, extrair apenas o base64
        bannerBase64 = generatedBanner.split(',')[1];
      }

      const response = await supabase.functions.invoke('auto-post-social', {
        body: {
          action: 'post_now',
          platform,
          product_id: selectedProduct || undefined,
          custom_prompt: generatedContent,
          post_type: postType,
          banner_base64: bannerBase64
        }
      });

      if (response.data?.success) {
        const results = response.data.results;
        const successCount = results.filter((r: any) => r.success).length;
        
        // Mostrar detalhes dos erros se houver
        const errors = results.filter((r: any) => !r.success);
        if (errors.length > 0) {
          console.log('❌ Erros nas postagens:', errors);
          
          // Mostrar erro específico do token expirado
          const expiredToken = errors.find((e: any) => 
            e.error?.includes('Session has expired') || 
            e.error?.includes('expired')
          );
          
          if (expiredToken) {
            toast({
              title: "Token Expirado",
              description: "O token do Facebook expirou. Atualize na aba Configurações.",
              variant: "destructive",
            });
          } else {
            toast({
              title: `${successCount} de ${results.length} posts publicados`,
              description: errors.map((e: any) => `${e.platform}: ${e.error}`).join('\n'),
              variant: successCount > 0 ? "default" : "destructive",
            });
          }
        } else {
          toast({
            title: "Posts publicados!",
            description: `${successCount} de ${results.length} posts publicados com sucesso`,
          });
        }
        
        setGeneratedContent('');
      } else {
        throw new Error('Erro ao publicar posts');
      }
    } catch (error) {
      console.error('Erro ao publicar posts:', error);
      toast({
        title: "Erro",
        description: "Falha ao publicar posts",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const testSocialConfig = async () => {
    setSettingsLoading(true);
    try {
      const response = await supabase.functions.invoke('test-social-config');
      
      if (response.data?.success) {
        const results = response.data.results;
        const summary = response.data.summary;
        
        console.log('🔍 Teste de configurações:', results);
        
        toast({
          title: "Teste de Configurações",
          description: `Facebook: ${summary.facebookReady ? '✅ OK' : '❌ Problema'} | Instagram: ${summary.instagramReady ? '✅ OK' : '❌ Problema'}`,
          variant: summary.facebookReady || summary.instagramReady ? "default" : "destructive",
        });
      }
    } catch (error) {
      console.error('Erro no teste:', error);
      toast({
        title: "Erro no teste",
        description: "Falha ao testar configurações",
        variant: "destructive",
      });
    } finally {
      setSettingsLoading(false);
    }
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'facebook': return <Facebook className="h-4 w-4" />;
      case 'instagram': return <Instagram className="h-4 w-4" />;
      default: return <Zap className="h-4 w-4" />;
    }
  };

  const getPlatformColor = (platform: string) => {
    switch (platform) {
      case 'facebook': return 'bg-blue-500';
      case 'instagram': return 'bg-pink-500';
      default: return 'bg-purple-500';
    }
  };

  const saveSocialSettings = async (platform: 'facebook' | 'instagram') => {
    setSettingsLoading(true);
    try {
      const settings = platform === 'facebook' ? facebookSettings : instagramSettings;
      
      const { error } = await supabase
        .from('social_media_settings')
        .upsert({
          platform,
          settings,
          is_active: true
        }, {
          onConflict: 'platform'
        });

      if (error) throw error;

      toast({
        title: "Configurações salvas!",
        description: `Configurações do ${platform === 'facebook' ? 'Facebook' : 'Instagram'} foram salvas com sucesso`,
      });
      
      loadSocialSettings();
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      toast({
        title: "Erro",
        description: "Falha ao salvar configurações",
        variant: "destructive",
      });
    } finally {
      setSettingsLoading(false);
    }
  };

  if (showKeySetup) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center gap-3 mb-6">
          <Bot className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Auto Post IA</h1>
            <p className="text-muted-foreground">Sistema automático de postagens para redes sociais</p>
          </div>
        </div>
        <OpenAIKeySetup onKeyConfigured={() => setShowKeySetup(false)} />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <Bot className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Auto Post IA</h1>
          <p className="text-muted-foreground">Sistema automático de postagens para redes sociais</p>
        </div>
      </div>

      <Tabs defaultValue="create" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="create" className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            Criar Post
          </TabsTrigger>
          <TabsTrigger value="weekly" className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4" />
            Planos Semanais
          </TabsTrigger>
          <TabsTrigger value="automated" className="flex items-center gap-2">
            <Bot className="h-4 w-4" />
            Automático IA
          </TabsTrigger>
          <TabsTrigger value="scheduled" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Agendados
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Configurações
          </TabsTrigger>
        </TabsList>

        <TabsContent value="create" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Configurações do Post */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Configurações do Post
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Tipo de Post</Label>
                  <Select value={postType} onValueChange={setPostType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="product">Produto Específico</SelectItem>
                      <SelectItem value="promotional">Promocional</SelectItem>
                      <SelectItem value="engagement">Engajamento</SelectItem>
                      <SelectItem value="custom">Personalizado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {postType === 'product' && (
                  <div className="space-y-2">
                    <Label>Produto</Label>
                    <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um produto" />
                      </SelectTrigger>
                      <SelectContent>
                        {products.map((product) => (
                          <SelectItem key={product.id} value={product.id}>
                            {product.name} - {product.price} AOA
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {postType === 'custom' && (
                  <div className="space-y-2">
                    <Label>Prompt Personalizado</Label>
                    <Textarea
                      placeholder="Descreva o tipo de post que deseja..."
                      value={customPrompt}
                      onChange={(e) => setCustomPrompt(e.target.value)}
                      rows={3}
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Plataforma</Label>
                  <Select value={platform} onValueChange={setPlatform}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="both">Facebook + Instagram</SelectItem>
                      <SelectItem value="facebook">Apenas Facebook</SelectItem>
                      <SelectItem value="instagram">Apenas Instagram</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button 
                  onClick={generateContent} 
                  disabled={loading}
                  className="w-full"
                >
                  {loading ? (
                    <>
                      <Bot className="mr-2 h-4 w-4 animate-spin" />
                      Gerando...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Gerar Conteúdo IA
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Preview e Ações */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Image className="h-5 w-5" />
                  Preview do Post
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {generatedContent ? (
                  <>
                    <ContentSuggestions 
                      content={generatedContent}
                      onContentChange={setGeneratedContent}
                    />
                    
                    <PostPreview 
                      content={generatedContent}
                      platform={platform}
                      postType={postType}
                      productData={selectedProduct ? products.find(p => p.id === selectedProduct) : undefined}
                      hasBanner={!!generatedBanner || !!selectedProduct}
                      bannerUrl={generatedBanner || undefined}
                    />
                    
                    <Separator />
                    
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <Label>Agendar para</Label>
                        <Input
                          type="datetime-local"
                          value={scheduleTime}
                          onChange={(e) => setScheduleTime(e.target.value)}
                          min={new Date().toISOString().slice(0, 16)}
                        />
                      </div>
                      
                      <div className="flex gap-2">
                        <Button 
                          onClick={postNow}
                          disabled={loading}
                          className="flex-1"
                        >
                          <Send className="mr-2 h-4 w-4" />
                          Postar Agora
                        </Button>
                        
                        <Button 
                          onClick={schedulePost}
                          disabled={loading || !scheduleTime}
                          variant="outline"
                          className="flex-1"
                        >
                          <Clock className="mr-2 h-4 w-4" />
                          Agendar
                        </Button>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Bot className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Configure as opções e clique em "Gerar Conteúdo IA" para começar</p>
                    <p className="text-xs mt-2">✨ Banners promocionais serão gerados automaticamente para produtos</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="weekly" className="space-y-6">
          <WeeklyPlanner />
        </TabsContent>

        <TabsContent value="automated" className="space-y-6">
          <AutomatedPlansStatus />
        </TabsContent>

        <TabsContent value="scheduled" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Posts Agendados
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Items pendentes aparecem primeiro • Clique no preview para ver detalhes
              </p>
            </CardHeader>
            <CardContent>
              {scheduledPosts.length > 0 ? (
                <div className="space-y-4">
                  {scheduledPosts
                    .sort((a, b) => {
                      // Priorizar pendentes primeiro
                      if (a.status === 'pending' && b.status !== 'pending') return -1;
                      if (b.status === 'pending' && a.status !== 'pending') return 1;
                      // Depois ordenar por data mais próxima
                      return new Date(a.scheduled_for).getTime() - new Date(b.scheduled_for).getTime();
                    })
                    .map((post) => (
                    <div key={post.id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {getPlatformIcon(post.platform)}
                          <Badge className={getPlatformColor(post.platform)}>
                            {post.platform}
                          </Badge>
                          <Badge variant="outline">{post.post_type}</Badge>
                          <Badge variant={post.status === 'pending' ? 'default' : 'secondary'}>
                            {post.status === 'pending' ? '⏳ Pendente' : 
                             post.status === 'posted' ? '✅ Publicado' : 
                             post.status === 'failed' ? '❌ Falhou' : post.status}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="text-sm text-muted-foreground">
                            {new Date(post.scheduled_for).toLocaleString()}
                          </div>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm">
                                <Eye className="h-4 w-4 mr-1" />
                                Preview
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                              <DialogHeader>
                                <DialogTitle className="flex items-center gap-2">
                                  <Image className="h-5 w-5" />
                                  Preview do Post Agendado
                                </DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                  <div>
                                    <strong>Plataforma:</strong> {post.platform}
                                  </div>
                                  <div>
                                    <strong>Tipo:</strong> {post.post_type}
                                  </div>
                                  <div>
                                    <strong>Status:</strong> {post.status}
                                  </div>
                                  <div>
                                    <strong>Agendado para:</strong> {new Date(post.scheduled_for).toLocaleString()}
                                  </div>
                                </div>
                                <Separator />
                                <PostPreview 
                                  content={post.content}
                                  platform={post.platform}
                                  postType={post.post_type}
                                  productData={post.products ? {
                                    name: post.products.name,
                                    price: post.products.price,
                                    image_url: post.products.image_url
                                  } : undefined}
                                  hasBanner={!!post.products}
                                />
                                {post.products && (
                                  <div className="bg-muted p-3 rounded-lg">
                                    <p className="text-sm font-medium mb-1">Produto Associado:</p>
                                    <p className="text-sm text-muted-foreground">
                                      {post.products.name} - {post.products.price.toLocaleString()} AOA
                                    </p>
                                  </div>
                                )}
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </div>
                      <p className="text-sm bg-muted p-3 rounded line-clamp-3">{post.content}</p>
                      {post.products && (
                        <div className="text-xs text-muted-foreground">
                          Produto: {post.products.name}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhum post agendado encontrado</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-amber-800 mb-1">Status dos Tokens</p>
                <p className="text-amber-700 mb-2">
                  <strong>Facebook:</strong> Token expirou em 03/08/2025 - Precisa renovar
                </p>
                <p className="text-amber-700 mb-3">
                  <strong>Instagram:</strong> Não configurado - Configure access token e business ID
                </p>
                <Button 
                  onClick={() => setShowTokenHelp(true)}
                  variant="outline"
                  size="sm"
                  className="bg-white"
                >
                  <HelpCircle className="h-4 w-4 mr-1" />
                  Ver Guia de Configuração
                </Button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Facebook Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Facebook className="h-5 w-5 text-blue-600" />
                  Facebook
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fb-access-token">Token de Acesso da Página</Label>
                  <Input
                    id="fb-access-token"
                    type="password"
                    placeholder="Insira o Facebook Page Access Token"
                    value={facebookSettings.access_token}
                    onChange={(e) => setFacebookSettings(prev => ({
                      ...prev,
                      access_token: e.target.value
                    }))}
                  />
                  <p className="text-xs text-muted-foreground">
                    Token obtido no Facebook Developers para sua página
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fb-page-id">ID da Página</Label>
                  <Input
                    id="fb-page-id"
                    placeholder="Insira o Facebook Page ID"
                    value={facebookSettings.page_id}
                    onChange={(e) => setFacebookSettings(prev => ({
                      ...prev,
                      page_id: e.target.value
                    }))}
                  />
                  <p className="text-xs text-muted-foreground">
                    ID numérico da sua página do Facebook
                  </p>
                </div>

                <Button 
                  onClick={() => saveSocialSettings('facebook')}
                  disabled={settingsLoading || !facebookSettings.access_token || !facebookSettings.page_id}
                  className="w-full"
                >
                  {settingsLoading ? 'Salvando...' : 'Salvar Configurações Facebook'}
                </Button>
              </CardContent>
            </Card>

            {/* Instagram Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Instagram className="h-5 w-5 text-pink-600" />
                  Instagram
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="ig-access-token">Token de Acesso</Label>
                  <Input
                    id="ig-access-token"
                    type="password"
                    placeholder="Insira o Instagram Access Token"
                    value={instagramSettings.access_token}
                    onChange={(e) => setInstagramSettings(prev => ({
                      ...prev,
                      access_token: e.target.value
                    }))}
                  />
                  <p className="text-xs text-muted-foreground">
                    Token do Instagram Business Account
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ig-business-id">ID da Conta Business</Label>
                  <Input
                    id="ig-business-id"
                    placeholder="Insira o Instagram Business ID"
                    value={instagramSettings.business_id}
                    onChange={(e) => setInstagramSettings(prev => ({
                      ...prev,
                      business_id: e.target.value
                    }))}
                  />
                  <p className="text-xs text-muted-foreground">
                    ID da sua conta Instagram Business
                  </p>
                </div>

                <Button 
                  onClick={() => saveSocialSettings('instagram')}
                  disabled={settingsLoading || !instagramSettings.access_token || !instagramSettings.business_id}
                  className="w-full"
                >
                  {settingsLoading ? 'Salvando...' : 'Salvar Configurações Instagram'}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Status das Configurações */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Status das Integrações
                <div className="flex gap-2">
                  <Button 
                    onClick={() => setShowTokenHelp(true)}
                    variant="outline"
                    size="sm"
                  >
                    <HelpCircle className="h-4 w-4 mr-1" />
                    Ajuda
                  </Button>
                  <Button 
                    onClick={testSocialConfig}
                    disabled={settingsLoading}
                    variant="outline"
                    size="sm"
                  >
                    {settingsLoading ? 'Testando...' : 'Testar Configurações'}
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-2">
                    <Facebook className="h-4 w-4 text-blue-600" />
                    <span>Facebook</span>
                  </div>
                  <Badge variant={facebookSettings.access_token && facebookSettings.page_id ? "default" : "secondary"}>
                    {facebookSettings.access_token && facebookSettings.page_id ? "Configurado" : "Não configurado"}
                  </Badge>
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-2">
                    <Instagram className="h-4 w-4 text-pink-600" />
                    <span>Instagram</span>
                  </div>
                  <Badge variant={instagramSettings.access_token && instagramSettings.business_id ? "default" : "secondary"}>
                    {instagramSettings.access_token && instagramSettings.business_id ? "Configurado" : "Não configurado"}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <TokenHelpDialog 
        open={showTokenHelp} 
        onOpenChange={setShowTokenHelp} 
      />
    </div>
  );
};

export default AdminAutoPostIA;