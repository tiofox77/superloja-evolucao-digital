import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Activity, Mail, MessageSquare, Search, RefreshCw, Eye, AlertCircle, CheckCircle, Clock, XCircle, Send } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useNotifications } from '@/hooks/useNotifications';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface NotificationLog {
  id: string;
  user_id: string;
  notification_type: 'email' | 'sms';
  recipient: string;
  subject?: string;
  message: string;
  status: 'pending' | 'sent' | 'failed' | 'queued';
  provider?: string;
  provider_response?: any;
  error_message?: string;
  metadata?: any;
  sent_at?: string;
  created_at: string;
  updated_at: string;
}

const AdminLogs = () => {
  const [logs, setLogs] = useState<NotificationLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedLog, setSelectedLog] = useState<NotificationLog | null>(null);
  const [testEmail, setTestEmail] = useState('');
  const [testPhone, setTestPhone] = useState('');
  const [testingEmail, setTestingEmail] = useState(false);
  const [testingSms, setTestingSms] = useState(false);
  const { toast } = useToast();
  const { sendTestEmail, sendTestSms } = useNotifications();

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('notification_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setLogs(data as NotificationLog[] || []);
    } catch (error) {
      console.error('Erro ao carregar logs:', error);
      toast({
        title: "❌ Erro",
        description: "Não foi possível carregar os logs.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTestEmail = async () => {
    if (!testEmail) {
      toast({
        title: "❌ Erro",
        description: "Digite um email válido",
        variant: "destructive"
      });
      return;
    }

    setTestingEmail(true);
    try {
      const result = await sendTestEmail(testEmail);
      if (result.success) {
        toast({
          title: "✅ Sucesso",
          description: "Email de teste enviado! Verifique os logs."
        });
        loadLogs(); // Refresh logs
      } else {
        toast({
          title: "❌ Erro",
          description: result.error || "Falha ao enviar email",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "❌ Erro",
        description: "Erro ao enviar email de teste",
        variant: "destructive"
      });
    } finally {
      setTestingEmail(false);
    }
  };

  const handleTestSms = async () => {
    if (!testPhone) {
      toast({
        title: "❌ Erro",
        description: "Digite um número válido",
        variant: "destructive"
      });
      return;
    }

    setTestingSms(true);
    try {
      const result = await sendTestSms(testPhone);
      if (result.success) {
        toast({
          title: "✅ Sucesso",
          description: "SMS de teste enviado! Verifique os logs."
        });
        loadLogs(); // Refresh logs
      } else {
        toast({
          title: "❌ Erro",
          description: result.error || "Falha ao enviar SMS",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "❌ Erro",
        description: "Erro ao enviar SMS de teste",
        variant: "destructive"
      });
    } finally {
      setTestingSms(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-600" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'queued':
        return <Clock className="w-4 h-4 text-blue-600" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'sent':
        return 'default';
      case 'failed':
        return 'destructive';
      case 'pending':
        return 'secondary';
      case 'queued':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      log.recipient.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.subject && log.subject.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = statusFilter === 'all' || log.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const emailLogs = filteredLogs.filter(log => log.notification_type === 'email');
  const smsLogs = filteredLogs.filter(log => log.notification_type === 'sms');

  const LogsTable = ({ logs, type }: { logs: NotificationLog[], type: 'email' | 'sms' }) => (
    <div className="space-y-4">
      {/* Test Section */}
      <Card className="bg-muted/30">
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            {type === 'email' ? <Mail className="w-4 h-4" /> : <MessageSquare className="w-4 h-4" />}
            Teste de {type === 'email' ? 'Email' : 'SMS'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              placeholder={type === 'email' ? 'Digite um email...' : 'Digite um número de telefone...'}
              value={type === 'email' ? testEmail : testPhone}
              onChange={(e) => type === 'email' ? setTestEmail(e.target.value) : setTestPhone(e.target.value)}
              className="flex-1"
            />
            <Button 
              onClick={type === 'email' ? handleTestEmail : handleTestSms}
              disabled={type === 'email' ? testingEmail : testingSms}
              size="sm"
            >
              <Send className="w-4 h-4 mr-2" />
              {type === 'email' 
                ? (testingEmail ? 'Enviando...' : 'Enviar Email')
                : (testingSms ? 'Enviando...' : 'Enviar SMS')
              }
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-4 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Buscar por destinatário, assunto ou mensagem..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="sent">Enviados</SelectItem>
            <SelectItem value="failed">Falhas</SelectItem>
            <SelectItem value="pending">Pendentes</SelectItem>
            <SelectItem value="queued">Na Fila</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={loadLogs} variant="outline" size="icon">
          <RefreshCw className="w-4 h-4" />
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Status</TableHead>
                <TableHead>Destinatário</TableHead>
                {type === 'email' && <TableHead>Assunto</TableHead>}
                <TableHead>Mensagem</TableHead>
                <TableHead>Provedor</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={type === 'email' ? 7 : 6} className="text-center py-8">
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      {type === 'email' ? <Mail className="w-8 h-8" /> : <MessageSquare className="w-8 h-8" />}
                      <p>Nenhum log de {type === 'email' ? 'email' : 'SMS'} encontrado</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(log.status)}
                        <Badge variant={getStatusBadgeVariant(log.status)}>
                          {log.status}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{log.recipient}</TableCell>
                    {type === 'email' && (
                      <TableCell>{log.subject || '-'}</TableCell>
                    )}
                    <TableCell>
                      <div className="max-w-xs truncate">
                        {log.message}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{log.provider || 'N/A'}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{format(new Date(log.created_at), 'dd/MM/yyyy', { locale: ptBR })}</div>
                        <div className="text-muted-foreground">
                          {format(new Date(log.created_at), 'HH:mm:ss', { locale: ptBR })}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => setSelectedLog(log)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>Detalhes do Log</DialogTitle>
                            <DialogDescription>
                              Informações detalhadas sobre a notificação
                            </DialogDescription>
                          </DialogHeader>
                          <ScrollArea className="max-h-96">
                            <div className="space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <h4 className="font-semibold">Status</h4>
                                  <div className="flex items-center gap-2 mt-1">
                                    {getStatusIcon(log.status)}
                                    <Badge variant={getStatusBadgeVariant(log.status)}>
                                      {log.status}
                                    </Badge>
                                  </div>
                                </div>
                                <div>
                                  <h4 className="font-semibold">Tipo</h4>
                                  <p className="text-sm text-muted-foreground mt-1">
                                    {log.notification_type === 'email' ? 'Email' : 'SMS'}
                                  </p>
                                </div>
                                <div>
                                  <h4 className="font-semibold">Destinatário</h4>
                                  <p className="text-sm text-muted-foreground mt-1">{log.recipient}</p>
                                </div>
                                <div>
                                  <h4 className="font-semibold">Provedor</h4>
                                  <p className="text-sm text-muted-foreground mt-1">
                                    {log.provider || 'N/A'}
                                  </p>
                                </div>
                              </div>

                              {log.subject && (
                                <div>
                                  <h4 className="font-semibold">Assunto</h4>
                                  <p className="text-sm text-muted-foreground mt-1">{log.subject}</p>
                                </div>
                              )}

                              <div>
                                <h4 className="font-semibold">Mensagem</h4>
                                <div className="bg-muted p-3 rounded-lg mt-1">
                                  <p className="text-sm whitespace-pre-wrap">{log.message}</p>
                                </div>
                              </div>

                              {log.error_message && (
                                <div>
                                  <h4 className="font-semibold text-red-600">Erro</h4>
                                  <div className="bg-red-50 border border-red-200 p-3 rounded-lg mt-1">
                                    <p className="text-sm text-red-700">{log.error_message}</p>
                                  </div>
                                </div>
                              )}

                              {log.provider_response && (
                                <div>
                                  <h4 className="font-semibold">Resposta do Provedor</h4>
                                  <div className="bg-muted p-3 rounded-lg mt-1">
                                    <pre className="text-xs overflow-auto">
                                      {JSON.stringify(log.provider_response, null, 2)}
                                    </pre>
                                  </div>
                                </div>
                              )}

                              <div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground">
                                <div>
                                  <strong>Criado em:</strong> {format(new Date(log.created_at), 'dd/MM/yyyy HH:mm:ss', { locale: ptBR })}
                                </div>
                                {log.sent_at && (
                                  <div>
                                    <strong>Enviado em:</strong> {format(new Date(log.sent_at), 'dd/MM/yyyy HH:mm:ss', { locale: ptBR })}
                                  </div>
                                )}
                              </div>
                            </div>
                          </ScrollArea>
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );

  const stats = {
    total: logs.length,
    sent: logs.filter(l => l.status === 'sent').length,
    failed: logs.filter(l => l.status === 'failed').length,
    pending: logs.filter(l => l.status === 'pending').length
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          📊 Logs de Notificações
        </h1>
        <p className="text-muted-foreground">Monitore o envio de emails e SMS com detalhes completos</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 p-2 rounded-lg">
                <Activity className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-sm text-muted-foreground">Total</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="bg-green-100 p-2 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600">{stats.sent}</p>
                <p className="text-sm text-muted-foreground">Enviados</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="bg-red-100 p-2 rounded-lg">
                <XCircle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-red-600">{stats.failed}</p>
                <p className="text-sm text-muted-foreground">Falhas</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="bg-yellow-100 p-2 rounded-lg">
                <Clock className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
                <p className="text-sm text-muted-foreground">Pendentes</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Logs Table with Tabs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Logs Detalhados
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <Tabs defaultValue="all" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="all">
                  Todos ({filteredLogs.length})
                </TabsTrigger>
                <TabsTrigger value="email">
                  <Mail className="w-4 h-4 mr-2" />
                  Emails ({emailLogs.length})
                </TabsTrigger>
                <TabsTrigger value="sms">
                  <MessageSquare className="w-4 h-4 mr-2" />
                  SMS ({smsLogs.length})
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="all">
                <LogsTable logs={filteredLogs} type="email" />
              </TabsContent>
              
              <TabsContent value="email">
                <LogsTable logs={emailLogs} type="email" />
              </TabsContent>
              
              <TabsContent value="sms">
                <LogsTable logs={smsLogs} type="sms" />
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminLogs;