import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Activity, Eye, User, MessageSquare } from 'lucide-react';

interface RealtimeMessage {
  id: string;
  platform: string;
  user_id: string;
  message: string;
  type: 'received' | 'sent';
  timestamp: string;
}

interface Conversation {
  user_id: string;
  platform: string;
  lastMessage: string;
  timestamp: string;
  messageCount: number;
}

interface Metrics {
  totalMessages: number;
  uniqueUsers: number;
  averageRating: number;
  successfulInteractions: number;
  leadsGenerated: number;
}

interface RealTimeTabProps {
  metrics: Metrics;
  realtimeMessages: RealtimeMessage[];
  conversations: Conversation[];
  messageCount: number;
  lastUpdate: Date | null;
  realtimeLoading: boolean;
}

export const RealTimeTab: React.FC<RealTimeTabProps> = ({
  metrics,
  realtimeMessages,
  conversations,
  messageCount,
  lastUpdate,
  realtimeLoading
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          ⚡ Tempo Real
        </CardTitle>
        <CardDescription>
          Monitoramento em tempo real das conversas e métricas do agente IA
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Métricas */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <Card className="p-4">
              <div className="text-center">
                <MessageSquare className="h-8 w-8 mx-auto mb-2 text-blue-500" />
                <div className="text-2xl font-bold">{metrics.totalMessages}</div>
                <div className="text-xs text-muted-foreground">Total Mensagens</div>
              </div>
            </Card>
            
            <Card className="p-4">
              <div className="text-center">
                <User className="h-8 w-8 mx-auto mb-2 text-green-500" />
                <div className="text-2xl font-bold">{metrics.uniqueUsers}</div>
                <div className="text-xs text-muted-foreground">Usuários Únicos</div>
              </div>
            </Card>
            
            <Card className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">{metrics.averageRating}%</div>
                <div className="text-xs text-muted-foreground">Avaliação Média</div>
              </div>
            </Card>
            
            <Card className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{metrics.successfulInteractions}</div>
                <div className="text-xs text-muted-foreground">Interações OK</div>
              </div>
            </Card>
            
            <Card className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{metrics.leadsGenerated}</div>
                <div className="text-xs text-muted-foreground">Leads Gerados</div>
              </div>
            </Card>
          </div>

          {/* Status */}
          <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <span className="font-medium">Sistema Online</span>
            </div>
            <div className="text-sm text-muted-foreground">
              {messageCount} mensagens • Última atualização: {lastUpdate?.toLocaleTimeString()}
            </div>
          </div>

          {/* Mensagens em Tempo Real */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                <h3 className="text-lg font-semibold">Mensagens Recentes</h3>
                {realtimeLoading && (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                )}
              </div>
              
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {realtimeMessages.map((message) => (
                  <div key={message.id} className="flex gap-3 p-3 bg-white rounded border">
                    <div className="flex-shrink-0">
                      <Badge variant={message.type === 'received' ? 'default' : 'secondary'}>
                        {message.platform}
                      </Badge>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium truncate">
                          {message.user_id}
                        </span>
                        <Badge variant={message.type === 'received' ? 'outline' : 'default'} className="text-xs">
                          {message.type === 'received' ? '👤' : '🤖'}
                        </Badge>
                      </div>
                      
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {message.message}
                      </p>
                      
                      <div className="text-xs text-muted-foreground mt-1">
                        {new Date(message.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Conversas por Usuário */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                <h3 className="text-lg font-semibold">Conversas por Usuário</h3>
              </div>
              
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {conversations.map((conv, index) => (
                  <div key={index} className="flex gap-3 p-3 bg-white rounded border">
                    <div className="flex-shrink-0">
                      <Badge variant="outline">
                        {conv.platform}
                      </Badge>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium truncate">
                          {conv.user_id}
                        </span>
                        <Badge variant="secondary" className="text-xs">
                          {conv.messageCount} msgs
                        </Badge>
                      </div>
                      
                      <p className="text-sm text-muted-foreground line-clamp-1">
                        {conv.lastMessage}
                      </p>
                      
                      <div className="text-xs text-muted-foreground mt-1">
                        {new Date(conv.timestamp).toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};