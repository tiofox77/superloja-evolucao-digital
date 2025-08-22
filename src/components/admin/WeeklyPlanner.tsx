import React from 'react';
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

export const WeeklyPlanner = () => {
  const { toast } = useToast();
  const [plans, setPlans] = React.useState<WeeklyPlan[]>([]);
  const [planPosts, setPlanPosts] = React.useState<WeeklyPlanPost[]>([]);
  const [filteredPosts, setFilteredPosts] = React.useState<WeeklyPlanPost[]>([]);
  const [selectedPlanId, setSelectedPlanId] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [showCreateForm, setShowCreateForm] = React.useState(false);
  const [editingPost, setEditingPost] = React.useState<WeeklyPlanPost | null>(null);
  const [viewingPost, setViewingPost] = React.useState<WeeklyPlanPost | null>(null);
  
  // Form states
  const [formData, setFormData] = React.useState({
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

  React.useEffect(() => {
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
      
      // Verificar e atualizar status de planos completos
      const today = new Date();
      today.setHours(23, 59, 59, 999); // Final do dia
      
      const plansToUpdate = data?.filter(plan => {
        const endDate = new Date(plan.end_date);
        return plan.status === 'active' && endDate < today;
      }) || [];

      // Atualizar planos completos
      for (const plan of plansToUpdate) {
        await supabase
          .from('weekly_posting_plans')
          .update({ status: 'completed' })
          .eq('id', plan.id);
      }

      // Recarregar dados se houve atualizações
      if (plansToUpdate.length > 0) {
        const { data: updatedData, error: updatedError } = await supabase
          .from('weekly_posting_plans')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (updatedError) throw updatedError;
        setPlans(updatedData || []);
      } else {
        setPlans(data || []);
      }
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
          products!inner(name, image_url)
        `)
        .in('status', ['pending', 'generated', 'posted', 'failed'])
        .order('scheduled_for', { ascending: true })
        .limit(50);

      if (error) {
        console.error('Erro na query de posts:', error);
        // Fallback: carregar posts sem join se der erro
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('weekly_plan_posts')
          .select('*')
          .in('status', ['pending', 'generated', 'posted', 'failed'])
          .order('scheduled_for', { ascending: true })
          .limit(50);
        
        if (fallbackError) throw fallbackError;
        setPlanPosts(fallbackData || []);
        setFilteredPosts(fallbackData || []);
        return;
      }
      
      setPlanPosts(data || []);
      setFilteredPosts(data || []);
    } catch (error) {
      console.error('Erro ao carregar posts do plano:', error);
      // Em caso de erro, mostrar um array vazio para não quebrar a UI
      setPlanPosts([]);
      setFilteredPosts([]);
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

  const generateContent = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('process-weekly-plans', {
        body: { action: 'generate_only' }
      });
      
      if (error) throw error;

      toast({
        title: "Conteúdo gerado!",
        description: `${data.processed} posts tiveram seu conteúdo gerado`,
      });

      loadPlanPosts();
    } catch (error) {
      console.error('Erro ao gerar conteúdo:', error);
      toast({
        title: "Erro",
        description: "Falha ao gerar conteúdo",
        variant: "destructive",
      });
    }
  };

  const processPost = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('process-weekly-plans', {
        body: { action: 'post_generated' }
      });
      
      if (error) throw error;

      toast({
        title: "Posts publicados!",
        description: `${data.processed} posts foram publicados no Facebook`,
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

  const filterPostsByPlan = (planId: string | null) => {
    setSelectedPlanId(planId);
    if (planId) {
      const filtered = planPosts.filter(post => post.plan_id === planId);
      setFilteredPosts(filtered);
    } else {
      setFilteredPosts(planPosts);
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active': return 'Ativo';
      case 'paused': return 'Pausado';
      case 'completed': return 'Concluído';
      default: return status;
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
                    : "❌ Você precisará gerar o conteúdo manualmente"
                  }
                </p>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button onClick={createPlan} disabled={loading} className="flex-1">
                {loading ? "Criando..." : "Criar Plano"}
              </Button>
              <Button variant="outline" onClick={() => setShowCreateForm(false)}>
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lista de Planos */}
      {plans.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {plans.map((plan) => (
            <Card key={plan.id} className="border-l-4" style={{borderLeftColor: getStatusColor(plan.status).replace('bg-', '#')}}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{plan.name}</CardTitle>
                  <Badge className={`${getStatusColor(plan.status)} text-white`}>
                    {getStatusLabel(plan.status)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">{plan.description}</p>
                
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span>{new Date(plan.start_date).toLocaleDateString()} - {new Date(plan.end_date).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Target className="h-4 w-4" />
                    <span>{plan.target_posts_per_day}/dia</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => filterPostsByPlan(plan.id)}
                  >
                    <Eye className="mr-2 h-3 w-3" />
                    Ver Posts
                  </Button>
                  {plan.status !== 'completed' && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
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
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="text-center py-8">
            <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">
              Nenhum plano semanal encontrado
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Crie seu primeiro plano para começar a automatizar suas postagens
            </p>
          </CardContent>
        </Card>
      )}

      {/* Próximos Posts */}
      {filteredPosts.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                {selectedPlanId 
                  ? `Posts do Plano: ${plans.find(p => p.id === selectedPlanId)?.name || 'Selecionado'}`
                  : 'Próximos Posts Agendados'
                }
              </CardTitle>
              <div className="flex gap-2">
                {selectedPlanId && (
                  <Button 
                    onClick={() => filterPostsByPlan(null)} 
                    variant="ghost" 
                    size="sm"
                  >
                    Mostrar Todos
                  </Button>
                )}
                <Button onClick={generateContent} variant="outline" size="sm">
                  <Settings className="mr-2 h-4 w-4" />
                  Gerar Conteúdo
                </Button>
                <Button onClick={processPost} size="sm">
                  <Send className="mr-2 h-4 w-4" />
                  Publicar Posts
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {filteredPosts.map((post) => (
                <div key={post.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {getPostStatusIcon(post.status)}
                    <div>
                      <p className="font-medium">
                        {post.product?.name || 'Post genérico'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(post.scheduled_for).toLocaleString()} • {post.platform} • {post.post_type}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">
                      {post.status}
                    </Badge>
                    
                    <div className="flex gap-1">
                      {/* Botão Ver Conteúdo - sempre visível */}
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="sm" title="Ver conteúdo">
                            <Eye className="h-3 w-3" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Visualizar Post</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-3">
                            <div>
                              <Label>Produto</Label>
                              <p className="text-sm">{post.product?.name || 'Post genérico'}</p>
                            </div>
                            <div>
                              <Label>Plataforma</Label>
                              <p className="text-sm">{post.platform}</p>
                            </div>
                            <div>
                              <Label>Tipo de Post</Label>
                              <p className="text-sm">{post.post_type}</p>
                            </div>
                            <div>
                              <Label>Conteúdo</Label>
                              <p className="text-sm whitespace-pre-wrap">
                                {post.generated_content || post.content || 'Conteúdo não gerado ainda'}
                              </p>
                            </div>
                            <div>
                              <Label>Agendado para</Label>
                              <p className="text-sm">{new Date(post.scheduled_for).toLocaleString()}</p>
                            </div>
                            <div>
                              <Label>Status</Label>
                              <Badge variant="outline">{post.status}</Badge>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                      
                      {/* Botão Editar - sempre visível */}
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="sm" title="Editar post">
                            <Edit className="h-3 w-3" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Editar Post</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-3">
                            <div>
                              <Label>Conteúdo</Label>
                              <Textarea
                                value={editingPost?.content || editingPost?.generated_content || ''}
                                onChange={(e) => setEditingPost(prev => prev ? {...prev, content: e.target.value} : null)}
                                rows={4}
                              />
                            </div>
                            <div>
                              <Label>Data/Hora</Label>
                              <Input
                                type="datetime-local"
                                value={editingPost ? new Date(editingPost.scheduled_for).toISOString().slice(0, 16) : ''}
                                onChange={(e) => setEditingPost(prev => prev ? {...prev, scheduled_for: new Date(e.target.value).toISOString()} : null)}
                              />
                            </div>
                            <div className="flex gap-2">
                              <Button
                                onClick={() => editingPost && updatePost(editingPost.id, {
                                  content: editingPost.content,
                                  scheduled_for: editingPost.scheduled_for
                                })}
                                className="flex-1"
                              >
                                Salvar
                              </Button>
                              <Button variant="outline" onClick={() => setEditingPost(null)}>
                                Cancelar
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                      
                      {/* Botão Postar Agora - disponível para posts pendentes e gerados */}
                      {(post.status === 'generated' || post.status === 'pending') && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => postNow(post.id)}
                          title="Postar agora"
                        >
                          <Send className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
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