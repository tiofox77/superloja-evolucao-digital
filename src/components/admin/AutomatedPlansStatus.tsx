import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Play, 
  Pause, 
  Bot, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  Settings2,
  Calendar,
  Zap
} from 'lucide-react';

interface WeeklyPlan {
  id: string;
  name: string;
  description: string;
  start_date: string;
  end_date: string;
  target_posts_per_day: number;
  status: string;
  auto_generate: boolean;
}

interface WeeklyPlanPost {
  id: string;
  plan_id: string;
  platform: string;
  post_type: string;
  scheduled_for: string;
  status: string;
  generated_content?: string;
  product?: {
    name: string;
  };
}

export const AutomatedPlansStatus: React.FC = () => {
  const { toast } = useToast();
  const [plans, setPlans] = useState<WeeklyPlan[]>([]);
  const [planPosts, setPlanPosts] = useState<WeeklyPlanPost[]>([]);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadPlans();
    loadPlanPosts();
  }, []);

  const loadPlans = async () => {
    try {
      const { data, error } = await supabase
        .from('weekly_posting_plans')
        .select('*')
        .eq('auto_generate', true)
        .in('status', ['active', 'completed', 'paused'])
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Verificar se planos ativos devem ser marcados como concluídos
      const now = new Date();
      const plansToUpdate = (data || []).filter(plan => {
        const endDate = new Date(plan.end_date);
        return plan.status === 'active' && endDate < now;
      });

      // Atualizar planos concluídos no banco
      if (plansToUpdate.length > 0) {
        const planIds = plansToUpdate.map(plan => plan.id);
        await supabase
          .from('weekly_posting_plans')
          .update({ status: 'completed' })
          .in('id', planIds);
      }

      // Aplicar status correto localmente
      const plansWithStatus = (data || []).map(plan => {
        const endDate = new Date(plan.end_date);
        if (plan.status === 'active' && endDate < now) {
          return { ...plan, status: 'completed' };
        }
        return plan;
      });
      
      setPlans(plansWithStatus);
    } catch (error) {
      console.error('Erro ao carregar planos automáticos:', error);
    }
  };

  const loadPlanPosts = async () => {
    try {
      const { data, error } = await supabase
        .from('weekly_plan_posts')
        .select(`
          *,
          products(name)
        `)
        .in('status', ['pending', 'generated', 'posted', 'failed'])
        .order('scheduled_for', { ascending: true })
        .limit(20);

      if (error) throw error;
      setPlanPosts(data || []);
    } catch (error) {
      console.error('Erro ao carregar posts automáticos:', error);
    }
  };

  const processPlansNow = async () => {
    setProcessing(true);
    try {
      const response = await supabase.functions.invoke('process-weekly-plans');
      
      if (response.data?.success) {
        toast({
          title: "Processamento executado!",
          description: `${response.data.processed} posts foram processados`,
        });
        loadPlanPosts();
      } else {
        throw new Error('Falha no processamento');
      }
    } catch (error) {
      console.error('Erro ao processar planos:', error);
      toast({
        title: "Erro",
        description: "Falha ao processar planos automáticos",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'posted': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed': return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'generated': return <Bot className="h-4 w-4 text-blue-500" />;
      default: return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'posted': return 'bg-green-100 text-green-800 border-green-200';
      case 'failed': return 'bg-red-100 text-red-800 border-red-200';
      case 'generated': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Planos Automáticos IA</h3>
          <p className="text-sm text-muted-foreground">
            Sistema automatizado executa a cada 30 minutos
          </p>
        </div>
        <Button 
          onClick={processPlansNow}
          disabled={processing}
          size="sm"
        >
          {processing ? (
            <>
              <Bot className="mr-2 h-4 w-4 animate-spin" />
              Processando...
            </>
          ) : (
            <>
              <Zap className="mr-2 h-4 w-4" />
              Executar Agora
            </>
          )}
        </Button>
      </div>

      {/* Planos */}
      {plans.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {plans.map((plan) => {
            const isCompleted = plan.status === 'completed';
            const isPaused = plan.status === 'paused';
            
            return (
              <Card key={plan.id} className={`border-l-4 ${
                isCompleted ? 'border-l-blue-500' : 
                isPaused ? 'border-l-yellow-500' : 
                'border-l-green-500'
              }`}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{plan.name}</CardTitle>
                    <Badge variant="default" className={
                      isCompleted ? 'bg-blue-100 text-blue-800' :
                      isPaused ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }>
                      {isCompleted ? 'Concluído' : isPaused ? 'Pausado' : 'Ativo'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-xs text-muted-foreground">{plan.description}</p>
                  
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      <span>{new Date(plan.start_date).toLocaleDateString()} - {new Date(plan.end_date).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Bot className="h-3 w-3" />
                      <span>{plan.target_posts_per_day}/dia</span>
                    </div>
                  </div>

                  {!isCompleted && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full h-8"
                      onClick={() => togglePlanStatus(plan.id, plan.status)}
                    >
                      {isPaused ? (
                        <>
                          <Play className="mr-1 h-3 w-3" />
                          Reativar
                        </>
                      ) : (
                        <>
                          <Pause className="mr-1 h-3 w-3" />
                          Pausar
                        </>
                      )}
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="text-center py-8">
            <Settings2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">
              Nenhum plano automático ativo encontrado
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Crie planos semanais com "Geração Automática" ativada
            </p>
          </CardContent>
        </Card>
      )}

      {/* Posts Recentes */}
      {planPosts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Posts Automáticos Recentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {planPosts.slice(0, 8).map((post) => (
                <div key={post.id} className="flex items-center justify-between p-2 border rounded text-xs">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(post.status)}
                    <div>
                      <p className="font-medium">
                        {post.product?.name || 'Post genérico'}
                      </p>
                      <p className="text-muted-foreground">
                        {new Date(post.scheduled_for).toLocaleString()} • {post.platform}
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline" className={`text-xs ${getStatusColor(post.status)}`}>
                    {post.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};