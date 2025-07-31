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

interface AdminEscalation {
  id: string;
  user_id: string;
  conversation_id?: string | null;
  message: string;
  reason: string;
  platform: string;
  priority: string;
  status: string;
  assigned_to?: string | null;
  context: any;
  resolved_at?: string | null;
  created_at: string;
  updated_at: string;
}

const AdminNotifications = () => {
  const [notifications, setNotifications] = useState<AdminEscalation[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'in_progress' | 'resolved'>('all');
  const [priorityFilter, setPriorityFilter] = useState<'all' | 'low' | 'medium' | 'high' | 'urgent'>('all');

  // Carregar notificações
  const loadNotifications = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('admin_escalations')
        .select('*')
        .order('created_at', { ascending: false });

      if (filter !== 'all') {
        query = query.eq('status', filter);
      }

      if (priorityFilter !== 'all') {
        query = query.eq('priority', priorityFilter);
      }

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

  // Atualizar status da notificação
  const updateNotificationStatus = async (id: string, status: AdminEscalation['status']) => {
    try {
      const { error } = await supabase
        .from('admin_escalations')
        .update({ 
          status,
          resolved_at: status === 'resolved' ? new Date().toISOString() : null
        })
        .eq('id', id);

      if (error) throw error;

      toast.success(`Notificação marcada como ${status}`);
      loadNotifications();
    } catch (error) {
      console.error('Erro ao atualizar notificação:', error);
      toast.error('Erro ao atualizar status');
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
                            Usuário: {notification.user_id}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {notification.platform}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={getPriorityColor(notification.priority)}>
                            {notification.priority.toUpperCase()}
                          </Badge>
                          <Badge variant={getStatusColor(notification.status)}>
                            {notification.status === 'pending' && 'Pendente'}
                            {notification.status === 'in_progress' && 'Em Progresso'}
                            {notification.status === 'resolved' && 'Resolvido'}
                            {notification.status === 'dismissed' && 'Dispensado'}
                          </Badge>
                        </div>
                      </div>

                      {/* Razão da escalação */}
                      <div className="bg-yellow-50 p-3 rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                          <AlertTriangle className="h-4 w-4 text-yellow-600" />
                          <span className="font-medium text-sm text-yellow-800">
                            Motivo da Escalação: {notification.reason}
                          </span>
                        </div>
                      </div>

                      {/* Mensagem do usuário */}
                      <div className="bg-muted/50 p-3 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <MessageSquare className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium text-sm">Mensagem do Usuário:</span>
                        </div>
                        <p className="text-sm">{notification.message}</p>
                      </div>

                      {/* Contexto adicional */}
                      {notification.context && Object.keys(notification.context).length > 0 && (
                        <div className="text-xs text-muted-foreground">
                          <strong>Contexto:</strong> {JSON.stringify(notification.context, null, 2)}
                        </div>
                      )}

                      {/* Timestamps */}
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Criado: {formatDate(notification.created_at)}
                        </div>
                        {notification.resolved_at && (
                          <div className="flex items-center gap-1">
                            <CheckCircle className="h-3 w-3" />
                            Resolvido: {formatDate(notification.resolved_at)}
                          </div>
                        )}
                      </div>

                      {/* Ações */}
                      {notification.status === 'pending' && (
                        <div className="flex gap-2 pt-2 border-t">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateNotificationStatus(notification.id, 'in_progress')}
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            Assumir
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => updateNotificationStatus(notification.id, 'resolved')}
                          >
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Resolver
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => updateNotificationStatus(notification.id, 'dismissed')}
                          >
                            Dispensar
                          </Button>
                        </div>
                      )}

                      {notification.status === 'in_progress' && (
                        <div className="flex gap-2 pt-2 border-t">
                          <Button
                            size="sm"
                            onClick={() => updateNotificationStatus(notification.id, 'resolved')}
                          >
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Resolver
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateNotificationStatus(notification.id, 'pending')}
                          >
                            Voltar para Pendente
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