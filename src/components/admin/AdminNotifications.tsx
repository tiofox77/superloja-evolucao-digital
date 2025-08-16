import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Bell, 
  User, 
  MessageSquare, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  Eye,
  RefreshCw,
  Filter
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface AdminNotification {
  id: string;
  admin_user_id: string;
  notification_type: string;
  message: string;
  metadata?: any;
  is_sent?: boolean;
  created_at: string;
}

const AdminNotifications = () => {
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'in_progress' | 'resolved'>('all');
  const [priorityFilter, setPriorityFilter] = useState<'all' | 'low' | 'medium' | 'high' | 'urgent'>('all');

  // Carregar notificações
  const loadNotifications = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('admin_notifications')
        .select('*')
        .order('created_at', { ascending: false });

      // Filtros não aplicáveis para esta tabela simplificada

      const { data, error } = await query;

      if (error) throw error;

      if (data) {
        setNotifications(data);
      }
    } catch (error) {
      console.error('Erro ao carregar notificações:', error);
      toast.error('Erro ao carregar notificações admin');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, [filter, priorityFilter]);

  // Marcar como lida
  const markAsRead = async (id: string) => {
    try {
      const { error } = await supabase
        .from('admin_notifications')
        .update({ is_sent: true })
        .eq('id', id);

      if (error) throw error;

      toast.success('Notificação marcada como lida');
      loadNotifications();
    } catch (error) {
      console.error('Erro ao atualizar notificação:', error);
      toast.error('Erro ao atualizar notificação');
    }
  };

  // Obter cor da prioridade
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'secondary';
    }
  };

  // Obter cor do status
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'destructive';
      case 'in_progress': return 'default';
      case 'resolved': return 'secondary';
      case 'dismissed': return 'outline';
      default: return 'secondary';
    }
  };

  // Formatar data
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR') + ' às ' + date.toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Notificações Admin
        </CardTitle>
        <CardDescription>
          Casos escalados que precisam de intervenção manual do administrador
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Filtros */}
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              <Select value={filter} onValueChange={(value: any) => setFilter(value)}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="pending">Pendentes</SelectItem>
                  <SelectItem value="in_progress">Em Progresso</SelectItem>
                  <SelectItem value="resolved">Resolvidos</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Select value={priorityFilter} onValueChange={(value: any) => setPriorityFilter(value)}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Prioridade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="urgent">Urgente</SelectItem>
                <SelectItem value="high">Alta</SelectItem>
                <SelectItem value="medium">Média</SelectItem>
                <SelectItem value="low">Baixa</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" onClick={loadNotifications} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>

            <div className="ml-auto text-sm text-muted-foreground">
              {notifications.length} notificação(ões)
            </div>
          </div>

          {/* Lista de Notificações */}
          <ScrollArea className="h-96">
            <div className="space-y-3">
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">
                  <RefreshCw className="h-8 w-8 mx-auto mb-2 animate-spin" />
                  <p>Carregando notificações...</p>
                </div>
              ) : notifications.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Bell className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Nenhuma notificação encontrada</p>
                  <p className="text-sm">
                    {filter !== 'all' || priorityFilter !== 'all' 
                      ? 'Tente ajustar os filtros acima'
                      : 'Notificações aparecerão aqui quando usuários precisarem de ajuda'
                    }
                  </p>
                </div>
              ) : (
                notifications.map((notification) => (
                  <Card key={notification.id} className="p-4">
                    <div className="space-y-3">
                      {/* Header da notificação */}
                      <div className="flex items-start justify-between">
                       <div className="flex items-center gap-2">
                           <User className="h-4 w-4 text-muted-foreground" />
                           <span className="font-medium text-sm">
                             {notification.metadata?.customer_name || 
                              `Cliente ID: ${notification.metadata?.customer_id || 'N/A'}`}
                           </span>
                           {notification.metadata?.platform && (
                             <Badge variant="outline" className="text-xs">
                               📱 {notification.metadata.platform}
                             </Badge>
                           )}
                           <Badge variant="outline" className="text-xs">
                             {notification.notification_type}
                           </Badge>
                         </div>
                         <div className="flex items-center gap-2">
                           <Badge variant={notification.is_sent ? 'secondary' : 'destructive'}>
                             {notification.is_sent ? 'Lida' : 'Nova'}
                           </Badge>
                         </div>
                      </div>

                       {/* Mensagem da notificação */}
                       <div className="bg-muted/50 p-3 rounded-lg">
                         <div className="flex items-center gap-2 mb-2">
                           <MessageSquare className="h-4 w-4 text-muted-foreground" />
                           <span className="font-medium text-sm">Notificação:</span>
                         </div>
                         <p className="text-sm">{notification.message}</p>
                       </div>

                       {/* Metadata adicional */}
                       {notification.metadata && (
                         <div className="bg-slate-50 p-3 rounded-lg text-xs space-y-1">
                           {notification.metadata.customer_id && (
                             <div><strong>ID Cliente:</strong> {notification.metadata.customer_id}</div>
                           )}
                           {notification.metadata.customer_message && (
                             <div><strong>Mensagem:</strong> "{notification.metadata.customer_message}"</div>
                           )}
                           {notification.metadata.platform && (
                             <div><strong>Plataforma:</strong> {notification.metadata.platform}</div>
                           )}
                           {notification.metadata.context && (
                             <details className="mt-2">
                               <summary className="cursor-pointer font-medium">Ver contexto completo</summary>
                               <pre className="mt-1 text-xs bg-white p-2 rounded border overflow-auto">
                                 {JSON.stringify(notification.metadata.context, null, 2)}
                               </pre>
                             </details>
                           )}
                         </div>
                       )}

                       {/* Timestamps */}
                       <div className="flex items-center gap-4 text-xs text-muted-foreground">
                         <div className="flex items-center gap-1">
                           <Clock className="h-3 w-3" />
                           Criado: {formatDate(notification.created_at)}
                         </div>
                       </div>

                       {/* Ações */}
                       {!notification.is_sent && (
                         <div className="flex gap-2 pt-2 border-t">
                           <Button
                             size="sm"
                             onClick={() => markAsRead(notification.id)}
                           >
                             <CheckCircle className="h-3 w-3 mr-1" />
                             Marcar como Lida
                           </Button>
                         </div>
                       )}
                    </div>
                  </Card>
                ))
              )}
            </div>
          </ScrollArea>
        </div>
      </CardContent>
    </Card>
  );
};

export default AdminNotifications;