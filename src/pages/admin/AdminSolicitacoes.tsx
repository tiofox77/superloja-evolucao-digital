import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Eye, Edit, MessageCircle, Package, Search, Filter } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ProductRequest {
  id: string;
  product_name: string;
  description: string;
  category: string | null;
  estimated_price: number | null;
  contact_email: string;
  contact_phone: string | null;
  additional_notes: string | null;
  images: string[] | null;
  status: string;
  created_at: string;
  updated_at: string;
}

const AdminSolicitacoes = () => {
  const [requests, setRequests] = useState<ProductRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<ProductRequest | null>(null);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('product_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRequests(data || []);
    } catch (error) {
      console.error('Error fetching requests:', error);
      toast({
        title: "Erro ao carregar solicitações",
        description: "Não foi possível carregar as solicitações.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const updateRequestStatus = async (id: string, status: string) => {
    try {
      const { error } = await supabase
        .from('product_requests')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;

      setRequests(prev => prev.map(req => 
        req.id === id ? { ...req, status, updated_at: new Date().toISOString() } : req
      ));

      toast({
        title: "Status atualizado!",
        description: "O status da solicitação foi atualizado com sucesso."
      });
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: "Erro ao atualizar",
        description: "Não foi possível atualizar o status.",
        variant: "destructive"
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      pending: { label: 'Pendente', variant: 'secondary' as const },
      analyzing: { label: 'Analisando', variant: 'default' as const },
      approved: { label: 'Aprovado', variant: 'default' as const },
      rejected: { label: 'Rejeitado', variant: 'destructive' as const },
      completed: { label: 'Concluído', variant: 'default' as const }
    };
    
    const statusInfo = statusMap[status as keyof typeof statusMap] || statusMap.pending;
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>;
  };

  const filteredRequests = requests.filter(request => {
    const matchesFilter = filter === 'all' || request.status === filter;
    const matchesSearch = request.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         request.contact_email.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const getRequestCounts = () => {
    return {
      all: requests.length,
      pending: requests.filter(r => r.status === 'pending').length,
      analyzing: requests.filter(r => r.status === 'analyzing').length,
      approved: requests.filter(r => r.status === 'approved').length,
      rejected: requests.filter(r => r.status === 'rejected').length,
      completed: requests.filter(r => r.status === 'completed').length,
    };
  };

  const counts = getRequestCounts();

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-muted rounded w-64 animate-pulse"></div>
        <div className="grid gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-32 bg-muted rounded animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Solicitações de Produtos</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie todas as solicitações de produtos dos clientes
          </p>
        </div>
        <Badge variant="outline" className="text-lg px-4 py-2">
          {filteredRequests.length} solicitações
        </Badge>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Buscar por produto ou email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Filtrar por status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos ({counts.all})</SelectItem>
            <SelectItem value="pending">Pendente ({counts.pending})</SelectItem>
            <SelectItem value="analyzing">Analisando ({counts.analyzing})</SelectItem>
            <SelectItem value="approved">Aprovado ({counts.approved})</SelectItem>
            <SelectItem value="rejected">Rejeitado ({counts.rejected})</SelectItem>
            <SelectItem value="completed">Concluído ({counts.completed})</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Lista de Solicitações */}
      <div className="grid gap-4">
        {filteredRequests.map((request) => (
          <Card key={request.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Package className="w-4 h-4 text-primary" />
                    <h3 className="font-semibold text-lg">{request.product_name}</h3>
                    {getStatusBadge(request.status)}
                  </div>
                  
                  <p className="text-muted-foreground mb-2 line-clamp-2">
                    {request.description}
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Categoria:</span> {request.category || 'Não especificada'}
                    </div>
                    <div>
                      <span className="font-medium">Preço estimado:</span> {
                        request.estimated_price ? `${request.estimated_price.toLocaleString()} Kz` : 'Não informado'
                      }
                    </div>
                    <div>
                      <span className="font-medium">Data:</span> {
                        format(new Date(request.created_at), 'dd/MM/yyyy', { locale: ptBR })
                      }
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                    <span>📧 {request.contact_email}</span>
                    {request.contact_phone && <span>📱 {request.contact_phone}</span>}
                    {request.images && request.images.length > 0 && (
                      <span>🖼️ {request.images.length} imagens</span>
                    )}
                  </div>
                </div>
                
                <div className="flex gap-2 ml-4">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedRequest(request)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Detalhes da Solicitação</DialogTitle>
                      </DialogHeader>
                      {selectedRequest && (
                        <div className="space-y-6">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                              <Label className="text-base font-semibold">Produto</Label>
                              <p className="mt-1">{selectedRequest.product_name}</p>
                            </div>
                            <div>
                              <Label className="text-base font-semibold">Status</Label>
                              <div className="mt-1">{getStatusBadge(selectedRequest.status)}</div>
                            </div>
                            <div>
                              <Label className="text-base font-semibold">Categoria</Label>
                              <p className="mt-1">{selectedRequest.category || 'Não especificada'}</p>
                            </div>
                            <div>
                              <Label className="text-base font-semibold">Preço Estimado</Label>
                              <p className="mt-1">
                                {selectedRequest.estimated_price 
                                  ? `${selectedRequest.estimated_price.toLocaleString()} Kz` 
                                  : 'Não informado'
                                }
                              </p>
                            </div>
                          </div>
                          
                          <div>
                            <Label className="text-base font-semibold">Descrição</Label>
                            <p className="mt-1 whitespace-pre-wrap">{selectedRequest.description}</p>
                          </div>
                          
                          {selectedRequest.additional_notes && (
                            <div>
                              <Label className="text-base font-semibold">Observações</Label>
                              <p className="mt-1 whitespace-pre-wrap">{selectedRequest.additional_notes}</p>
                            </div>
                          )}
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                              <Label className="text-base font-semibold">Email</Label>
                              <p className="mt-1">{selectedRequest.contact_email}</p>
                            </div>
                            <div>
                              <Label className="text-base font-semibold">Telefone</Label>
                              <p className="mt-1">{selectedRequest.contact_phone || 'Não informado'}</p>
                            </div>
                          </div>
                          
                          {selectedRequest.images && selectedRequest.images.length > 0 && (
                            <div>
                              <Label className="text-base font-semibold">Imagens</Label>
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2">
                                {selectedRequest.images.map((image, index) => (
                                  <img
                                    key={index}
                                    src={image}
                                    alt={`Referência ${index + 1}`}
                                    className="w-full h-24 object-cover rounded-lg border"
                                  />
                                ))}
                              </div>
                            </div>
                          )}
                          
                          <div>
                            <Label className="text-base font-semibold">Alterar Status</Label>
                            <div className="flex gap-2 mt-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => updateRequestStatus(selectedRequest.id, 'analyzing')}
                              >
                                Analisando
                              </Button>
                              <Button
                                variant="default"
                                size="sm"
                                onClick={() => updateRequestStatus(selectedRequest.id, 'approved')}
                              >
                                Aprovar
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => updateRequestStatus(selectedRequest.id, 'rejected')}
                              >
                                Rejeitar
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => updateRequestStatus(selectedRequest.id, 'completed')}
                              >
                                Concluir
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredRequests.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhuma solicitação encontrada</h3>
            <p className="text-muted-foreground">
              {searchTerm || filter !== 'all' 
                ? 'Tente ajustar os filtros para encontrar solicitações.'
                : 'Ainda não há solicitações de produtos.'
              }
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AdminSolicitacoes;