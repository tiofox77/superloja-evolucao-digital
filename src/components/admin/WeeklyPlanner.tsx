import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Calendar, 
  Clock, 
  Play, 
  Pause, 
  Plus, 
  Settings,
  Target,
  TrendingUp,
  CheckCircle,
  AlertCircle,
  Edit,
  Send,
  Eye
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface WeeklyPlan {
  id: string;
  name: string;
  description: string;
  start_date: string;
  end_date: string;
  target_posts_per_day: number;
  preferred_times: string[];
  platforms: string[];
  post_types: string[];
  status: string;
  created_at: string;
}

interface WeeklyPlanPost {
  id: string;
  plan_id: string;
  platform: string;
  post_type: string;
  scheduled_for: string;
  status: string;
  generated_content?: string;
  content?: string;
  product?: {
    name: string;
    image_url?: string;
  };
}

export const WeeklyPlanner: React.FC = () => {
  const { toast } = useToast();
  const [plans, setPlans] = useState<WeeklyPlan[]>([]);
  const [planPosts, setPlanPosts] = useState<WeeklyPlanPost[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingPost, setEditingPost] = useState<WeeklyPlanPost | null>(null);
  const [viewingPost, setViewingPost] = useState<WeeklyPlanPost | null>(null);
  
  // Form states
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    start_date: '',
    end_date: '',
    target_posts_per_day: 2,
    preferred_times: ['09:00', '18:00'],
    platforms: ['both'],
    post_types: ['product', 'promotional'],
    auto_generate: true
  });

  useEffect(() => {
    loadPlans();
    loadPlanPosts();
  }, []);

  const loadPlans = async () => {
    try {
      const { data, error } = await supabase
        .from('weekly_posting_plans')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPlans(data || []);
    } catch (error) {
      console.error('Erro ao carregar planos:', error);
    }
  };

  const loadPlanPosts = async () => {
    try {
      const { data, error } = await supabase
        .from('weekly_plan_posts')
        .select(`
          *,
          products(name, image_url)
        `)
        .in('status', ['pending', 'generated', 'posted', 'failed'])
        .order('scheduled_for', { ascending: true })
        .limit(20);

      if (error) throw error;
      setPlanPosts(data || []);
    } catch (error) {
      console.error('Erro ao carregar posts do plano:', error);
    }
  };

  const createPlan = async () => {
    setLoading(true);
    try {
      // Validações
      if (!formData.name || !formData.start_date || !formData.end_date) {
        throw new Error('Preencha todos os campos obrigatórios');
      }

      // Criar plano
      const { data: plan, error: planError } = await supabase
        .from('weekly_posting_plans')
        .insert({
          name: formData.name,
          description: formData.description,
          start_date: formData.start_date,
          end_date: formData.end_date,
          target_posts_per_day: formData.target_posts_per_day,
          preferred_times: formData.preferred_times.map(time => `${time}:00`),
          platforms: formData.platforms,
          post_types: formData.post_types,
          auto_generate: formData.auto_generate
        })
        .select()
        .single();

      if (planError) throw planError;

      // Gerar posts automaticamente
      await generateWeeklyPosts(plan.id);

      toast({
        title: "Plano criado!",
        description: "Plano semanal criado e posts gerados automaticamente",
      });

      setShowCreateForm(false);
      setFormData({
        name: '',
        description: '',
        start_date: '',
        end_date: '',
        target_posts_per_day: 2,
        preferred_times: ['09:00', '18:00'],
        platforms: ['both'],
        post_types: ['product', 'promotional'],
        auto_generate: true
      });
      
      loadPlans();
      loadPlanPosts();
    } catch (error) {
      console.error('Erro ao criar plano:', error);
      toast({
        title: "Erro",
        description: error.message || "Falha ao criar plano",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const generateWeeklyPosts = async (planId: string) => {
    try {
      // Buscar produtos ativos
      const { data: products } = await supabase
        .from('products')
        .select('id, name')
        .eq('active', true)
        .limit(20);

      if (!products || products.length === 0) return;

      const plan = plans.find(p => p.id === planId) || formData;
      const startDate = new Date(plan.start_date);
      const endDate = new Date(plan.end_date);
      
      const postsToCreate = [];
      const currentDate = new Date(startDate);

      // Gerar posts para cada dia do período
      while (currentDate <= endDate) {
        for (let i = 0; i < plan.target_posts_per_day; i++) {
          const timeSlot = plan.preferred_times[i % plan.preferred_times.length];
          const [hours, minutes] = timeSlot.split(':');
          
          const scheduledDateTime = new Date(currentDate);
          scheduledDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

          // Selecionar produto aleatório
          const randomProduct = products[Math.floor(Math.random() * products.length)];
          
          // Selecionar tipo de post aleatório
          const randomPostType = plan.post_types[Math.floor(Math.random() * plan.post_types.length)];
          
          // Selecionar plataforma aleatória
          const randomPlatform = plan.platforms[Math.floor(Math.random() * plan.platforms.length)];

          postsToCreate.push({
            plan_id: planId,
            product_id: randomProduct.id,
            platform: randomPlatform,
            post_type: randomPostType,
            scheduled_for: scheduledDateTime.toISOString(),
            status: 'pending'
          });
        }
        
        currentDate.setDate(currentDate.getDate() + 1);
      }

      // Inserir posts
      const { error } = await supabase
        .from('weekly_plan_posts')
        .insert(postsToCreate);

      if (error) throw error;

      console.log(`✅ ${postsToCreate.length} posts criados para o plano`);
    } catch (error) {
      console.error('Erro ao gerar posts semanais:', error);
    }
  };

  const togglePlanStatus = async (planId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'paused' : 'active';
    
    try {
      const { error } = await supabase
        .from('weekly_posting_plans')
        .update({ status: newStatus })
        .eq('id', planId);

      if (error) throw error;

      toast({
        title: newStatus === 'active' ? "Plano ativado" : "Plano pausado",
        description: `Plano ${newStatus === 'active' ? 'retomado' : 'pausado'} com sucesso`,
      });

      loadPlans();
    } catch (error) {
      console.error('Erro ao alterar status:', error);
      toast({
        title: "Erro",
        description: "Falha ao alterar status do plano",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'paused': return 'bg-yellow-500';
      case 'completed': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const getPostStatusIcon = (status: string) => {
    switch (status) {
      case 'posted': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed': return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'generated': return <Target className="h-4 w-4 text-blue-500" />;
      default: return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const processPost = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('process-weekly-plans');
      
      if (error) throw error;

      toast({
        title: "Posts processados!",
        description: `${data.processed} posts foram processados com sucesso`,
      });

      loadPlanPosts();
    } catch (error) {
      console.error('Erro ao processar posts:', error);
      toast({
        title: "Erro",
        description: "Falha ao processar posts",
        variant: "destructive",
      });
    }
  };

  const updatePost = async (postId: string, updates: Partial<WeeklyPlanPost>) => {
    try {
      const { error } = await supabase
        .from('weekly_plan_posts')
        .update(updates)
        .eq('id', postId);

      if (error) throw error;

      toast({
        title: "Post atualizado!",
        description: "Post foi atualizado com sucesso",
      });

      setEditingPost(null);
      loadPlanPosts();
    } catch (error) {
      console.error('Erro ao atualizar post:', error);
      toast({
        title: "Erro",
        description: "Falha ao atualizar post",
        variant: "destructive",
      });
    }
  };

  const postNow = async (postId: string) => {
    try {
      // Primeiro atualizar o post para status 'generated' se ainda estiver 'pending'
      const { error: updateError } = await supabase
        .from('weekly_plan_posts')
        .update({ 
          status: 'generated',
          scheduled_for: new Date().toISOString()
        })
        .eq('id', postId);

      if (updateError) throw updateError;

      // Então processar imediatamente
      await processPost();

      toast({
        title: "Post enviado!",
        description: "Post foi enviado imediatamente para as redes sociais",
      });
    } catch (error) {
      console.error('Erro ao postar agora:', error);
      toast({
        title: "Erro",
        description: "Falha ao enviar post",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Planos Semanais</h2>
          <p className="text-muted-foreground">Automatize suas postagens com planos inteligentes</p>
        </div>
        <Button onClick={() => setShowCreateForm(!showCreateForm)}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Plano
        </Button>
      </div>

      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle>Criar Plano Semanal</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nome do Plano *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="Ex: Campanha Janeiro 2024"
                />
              </div>

              <div className="space-y-2">
                <Label>Posts por dia</Label>
                <Select value={formData.target_posts_per_day.toString()} onValueChange={(value) => setFormData({...formData, target_posts_per_day: parseInt(value)})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 post por dia</SelectItem>
                    <SelectItem value="2">2 posts por dia</SelectItem>
                    <SelectItem value="3">3 posts por dia</SelectItem>
                    <SelectItem value="4">4 posts por dia</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Data de Início *</Label>
                <Input
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <Label>Data de Fim *</Label>
                <Input
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData({...formData, end_date: e.target.value})}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Descrição</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Descreva o objetivo deste plano..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Horários Preferenciais</Label>
                <div className="flex gap-2">
                  <Input
                    type="time"
                    value={formData.preferred_times[0]}
                    onChange={(e) => {
                      const newTimes = [...formData.preferred_times];
                      newTimes[0] = e.target.value;
                      setFormData({...formData, preferred_times: newTimes});
                    }}
                  />
                  <Input
                    type="time"
                    value={formData.preferred_times[1]}
                    onChange={(e) => {
                      const newTimes = [...formData.preferred_times];
                      newTimes[1] = e.target.value;
                      setFormData({...formData, preferred_times: newTimes});
                    }}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Geração Automática</Label>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={formData.auto_generate}
                    onCheckedChange={(checked) => setFormData({...formData, auto_generate: checked})}
                  />
                  <Label>Gerar conteúdo automaticamente pela IA</Label>
                </div>
                <p className="text-xs text-muted-foreground">
                  {formData.auto_generate 
                    ? "✅ A IA irá gerar o conteúdo automaticamente nos horários agendados" 
                    : "⚠️ Você precisará gerar o conteúdo manualmente para cada post"}
                </p>
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button onClick={createPlan} disabled={loading}>
                {loading ? 'Criando...' : 'Criar Plano'}
              </Button>
              <Button variant="outline" onClick={() => setShowCreateForm(false)}>
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lista de Planos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {plans.map((plan) => (
          <Card key={plan.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{plan.name}</CardTitle>
                <Badge className={`${getStatusColor(plan.status)} text-white`}>
                  {plan.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">{plan.description}</p>
              
              <div className="space-y-2 text-xs">
                <div className="flex items-center gap-2">
                  <Calendar className="h-3 w-3" />
                  <span>{new Date(plan.start_date).toLocaleDateString()} - {new Date(plan.end_date).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Target className="h-3 w-3" />
                  <span>{plan.target_posts_per_day} posts/dia</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-3 w-3" />
                  <span>{plan.preferred_times.join(', ')}</span>
                </div>
              </div>

              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => togglePlanStatus(plan.id, plan.status)}
              >
                {plan.status === 'active' ? (
                  <>
                    <Pause className="mr-2 h-3 w-3" />
                    Pausar
                  </>
                ) : (
                  <>
                    <Play className="mr-2 h-3 w-3" />
                    Ativar
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Próximos Posts */}
      {planPosts.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Próximos Posts Agendados
              </CardTitle>
              <Button onClick={processPost} size="sm">
                <Play className="mr-2 h-4 w-4" />
                Executar Agora
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {planPosts.map((post) => (
                <div key={post.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {getPostStatusIcon(post.status)}
                    <div className="flex-1">
                      <p className="font-medium text-sm">
                        {post.product?.name || 'Post genérico'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(post.scheduled_for).toLocaleString()} • {post.platform} • {post.post_type}
                      </p>
                      {post.generated_content && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {post.generated_content.substring(0, 100)}...
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {post.status}
                    </Badge>
                    
                    {/* Botão Ver */}
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="sm" onClick={() => setViewingPost(post)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>Visualizar Post</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label className="font-semibold">Produto:</Label>
                            <p>{post.product?.name || 'Post genérico'}</p>
                          </div>
                          <div>
                            <Label className="font-semibold">Agendado para:</Label>
                            <p>{new Date(post.scheduled_for).toLocaleString()}</p>
                          </div>
                          <div>
                            <Label className="font-semibold">Plataforma:</Label>
                            <p>{post.platform}</p>
                          </div>
                          <div>
                            <Label className="font-semibold">Tipo:</Label>
                            <p>{post.post_type}</p>
                          </div>
                          {post.generated_content && (
                            <div>
                              <Label className="font-semibold">Conteúdo:</Label>
                              <div className="p-3 bg-muted rounded-lg whitespace-pre-wrap">
                                {post.generated_content}
                              </div>
                            </div>
                          )}
                        </div>
                      </DialogContent>
                    </Dialog>

                    {/* Botão Editar */}
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="sm" onClick={() => setEditingPost(post)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>Editar Post</DialogTitle>
                        </DialogHeader>
                        {editingPost && (
                          <div className="space-y-4">
                            <div>
                              <Label>Data e Hora</Label>
                              <Input
                                type="datetime-local"
                                value={new Date(editingPost.scheduled_for).toISOString().slice(0, 16)}
                                onChange={(e) => setEditingPost({
                                  ...editingPost,
                                  scheduled_for: new Date(e.target.value).toISOString()
                                })}
                              />
                            </div>
                            <div>
                              <Label>Plataforma</Label>
                              <Select 
                                value={editingPost.platform} 
                                onValueChange={(value) => setEditingPost({...editingPost, platform: value})}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="facebook">Facebook</SelectItem>
                                  <SelectItem value="instagram">Instagram</SelectItem>
                                  <SelectItem value="both">Ambos</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label>Tipo de Post</Label>
                              <Select 
                                value={editingPost.post_type} 
                                onValueChange={(value) => setEditingPost({...editingPost, post_type: value})}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="product">Produto</SelectItem>
                                  <SelectItem value="promotional">Promocional</SelectItem>
                                  <SelectItem value="engagement">Engajamento</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            {editingPost.generated_content && (
                              <div>
                                <Label>Conteúdo</Label>
                                <Textarea
                                  value={editingPost.generated_content}
                                  onChange={(e) => setEditingPost({
                                    ...editingPost,
                                    generated_content: e.target.value
                                  })}
                                  rows={6}
                                />
                              </div>
                            )}
                            <div className="flex gap-2">
                              <Button onClick={() => updatePost(editingPost.id, editingPost)}>
                                Salvar
                              </Button>
                              <Button variant="outline" onClick={() => setEditingPost(null)}>
                                Cancelar
                              </Button>
                            </div>
                          </div>
                        )}
                      </DialogContent>
                    </Dialog>

                    {/* Botão Postar Agora */}
                    {post.status === 'pending' && (
                      <Button variant="ghost" size="sm" onClick={() => postNow(post.id)}>
                        <Send className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};