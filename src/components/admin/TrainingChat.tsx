import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Bot, User, Plus, Save, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface TrainingMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isTraining?: boolean;
}

interface TrainingExample {
  id: string;
  question: string;
  answer: string;
  keywords: string[];
  category: string;
}

export const TrainingChat = () => {
  const [messages, setMessages] = useState<TrainingMessage[]>([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [trainingExamples, setTrainingExamples] = useState<TrainingExample[]>([]);
  const [newExample, setNewExample] = useState({
    question: '',
    answer: '',
    keywords: '',
    category: 'geral'
  });
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadTrainingExamples();
    // Adicionar mensagem de boas-vindas
    setMessages([{
      id: '1',
      role: 'assistant',
      content: 'Olá! Eu sou o Agente IA da SuperLoja. Você pode conversar comigo para testar minhas respostas e me treinar. Como posso ajudá-lo hoje?',
      timestamp: new Date()
    }]);
  }, []);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  const loadTrainingExamples = async () => {
    try {
      const { data, error } = await supabase
        .from('ai_knowledge_base')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data) {
        setTrainingExamples(data.map(item => ({
          id: item.id,
          question: item.question,
          answer: item.answer,
          keywords: item.keywords || [],
          category: item.category
        })));
      }
    } catch (error) {
      console.error('Erro ao carregar exemplos de treinamento:', error);
    }
  };

  const sendMessage = async () => {
    if (!currentMessage.trim()) return;

    const userMessage: TrainingMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: currentMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setCurrentMessage('');
    setIsLoading(true);

    try {
      // Simular resposta da IA (aqui você pode integrar com sua edge function real)
      const response = await simulateAIResponse(currentMessage);
      
      const assistantMessage: TrainingMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      toast.error('Erro ao processar mensagem');
    } finally {
      setIsLoading(false);
    }
  };

  const simulateAIResponse = async (message: string): Promise<string> => {
    // Verificar se há uma resposta treinada para esta pergunta
    const lowerMessage = message.toLowerCase();
    const matchingExample = trainingExamples.find(example => 
      example.keywords.some(keyword => 
        lowerMessage.includes(keyword.toLowerCase())
      ) || lowerMessage.includes(example.question.toLowerCase())
    );

    if (matchingExample) {
      return matchingExample.answer;
    }

    // Respostas padrão baseadas em palavras-chave
    if (lowerMessage.includes('produto') || lowerMessage.includes('preço')) {
      return 'Temos uma grande variedade de produtos! Posso te ajudar a encontrar algo específico? Você está procurando algum tipo particular de produto?';
    }

    if (lowerMessage.includes('entrega') || lowerMessage.includes('frete')) {
      return 'Fazemos entregas em toda Angola! A entrega é gratuita para Luanda e região metropolitana. Para outras províncias, o frete varia conforme a localização. Precisa de mais detalhes sobre entrega?';
    }

    if (lowerMessage.includes('pagamento') || lowerMessage.includes('pagar')) {
      return 'Aceitamos várias formas de pagamento: transferência bancária, Multicaixa Express, pagamento na entrega. Qual método prefere?';
    }

    // Resposta padrão
    return 'Entendi sua pergunta. Para que eu possa te ajudar melhor, pode fornecer mais detalhes? Ou você gostaria de conhecer nossos produtos?';
  };

  const saveTrainingExample = async () => {
    if (!newExample.question.trim() || !newExample.answer.trim()) {
      toast.error('Pergunta e resposta são obrigatórias');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('ai_knowledge_base')
        .insert({
          question: newExample.question,
          answer: newExample.answer,
          keywords: newExample.keywords.split(',').map(k => k.trim()).filter(k => k),
          category: newExample.category,
          priority: 1,
          active: true
        })
        .select()
        .single();

      if (error) throw error;

      // Atualizar lista local
      if (data) {
        setTrainingExamples(prev => [
          {
            id: data.id,
            question: data.question,
            answer: data.answer,
            keywords: data.keywords || [],
            category: data.category
          },
          ...prev
        ]);
      }

      // Limpar formulário
      setNewExample({
        question: '',
        answer: '',
        keywords: '',
        category: 'geral'
      });

      toast.success('Exemplo de treinamento salvo!');
    } catch (error) {
      console.error('Erro ao salvar exemplo:', error);
      toast.error('Erro ao salvar exemplo de treinamento');
    }
  };

  const deleteTrainingExample = async (id: string) => {
    try {
      const { error } = await supabase
        .from('ai_knowledge_base')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setTrainingExamples(prev => prev.filter(example => example.id !== id));
      toast.success('Exemplo removido!');
    } catch (error) {
      console.error('Erro ao remover exemplo:', error);
      toast.error('Erro ao remover exemplo');
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Chat de Treinamento */}
      <Card className="h-[600px] flex flex-col">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            Chat de Treinamento
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col p-0">
          <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] p-3 rounded-lg ${
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      {message.role === 'user' ? (
                        <User className="h-4 w-4" />
                      ) : (
                        <Bot className="h-4 w-4" />
                      )}
                      <span className="text-xs opacity-70">
                        {message.timestamp.toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-sm">{message.content}</p>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-muted p-3 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Bot className="h-4 w-4" />
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:0.1s]"></div>
                        <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:0.2s]"></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
          
          <div className="p-4 border-t">
            <div className="flex gap-2">
              <Input
                value={currentMessage}
                onChange={(e) => setCurrentMessage(e.target.value)}
                placeholder="Digite uma mensagem para treinar a IA..."
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                disabled={isLoading}
              />
              <Button 
                onClick={sendMessage} 
                disabled={isLoading || !currentMessage.trim()}
                size="icon"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Painel de Treinamento */}
      <div className="space-y-6">
        {/* Adicionar Novo Exemplo */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Adicionar Treinamento
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Pergunta/Cenário</label>
              <Input
                value={newExample.question}
                onChange={(e) => setNewExample(prev => ({ ...prev, question: e.target.value }))}
                placeholder="Ex: Qual o preço do produto X?"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Resposta Ideal</label>
              <textarea
                className="w-full p-2 border rounded-lg h-20 text-sm"
                value={newExample.answer}
                onChange={(e) => setNewExample(prev => ({ ...prev, answer: e.target.value }))}
                placeholder="Ex: O produto X custa 15.000 AOA..."
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Palavras-chave</label>
                <Input
                  value={newExample.keywords}
                  onChange={(e) => setNewExample(prev => ({ ...prev, keywords: e.target.value }))}
                  placeholder="produto, preço, custo"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Categoria</label>
                <select
                  className="w-full p-2 border rounded-lg text-sm"
                  value={newExample.category}
                  onChange={(e) => setNewExample(prev => ({ ...prev, category: e.target.value }))}
                >
                  <option value="geral">Geral</option>
                  <option value="produtos">Produtos</option>
                  <option value="precos">Preços</option>
                  <option value="entrega">Entrega</option>
                  <option value="pagamento">Pagamento</option>
                  <option value="suporte">Suporte</option>
                </select>
              </div>
            </div>
            
            <Button onClick={saveTrainingExample} className="w-full">
              <Save className="h-4 w-4 mr-2" />
              Salvar Exemplo
            </Button>
          </CardContent>
        </Card>

        {/* Lista de Exemplos */}
        <Card>
          <CardHeader>
            <CardTitle>Exemplos de Treinamento ({trainingExamples.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px]">
              <div className="space-y-3">
                {trainingExamples.map((example) => (
                  <div key={example.id} className="border rounded-lg p-3">
                    <div className="flex items-start justify-between mb-2">
                      <Badge variant="outline">{example.category}</Badge>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => deleteTrainingExample(example.id)}
                        className="h-6 w-6 text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                    <h4 className="font-medium text-sm mb-1">{example.question}</h4>
                    <p className="text-xs text-muted-foreground mb-2">{example.answer}</p>
                    {example.keywords.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {example.keywords.map((keyword, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {keyword}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
                {trainingExamples.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Plus className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>Nenhum exemplo de treinamento ainda.</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};