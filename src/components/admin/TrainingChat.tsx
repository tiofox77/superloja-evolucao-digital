import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Send, 
  Bot, 
  User, 
  Plus, 
  Save, 
  MessageSquare,
  Brain,
  Target,
  Lightbulb
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface TrainingExample {
  id: string;
  question: string;
  answer: string;
  keywords: string[];
  category: string;
  created_at: string;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

const TrainingChat = () => {
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [trainingExamples, setTrainingExamples] = useState<TrainingExample[]>([]);
  const [newExample, setNewExample] = useState({
    question: '',
    answer: '',
    keywords: '',
    category: 'geral'
  });
  const [isTraining, setIsTraining] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'examples'>('chat');

  // Carregar exemplos de treinamento
  const loadTrainingExamples = async () => {
    try {
      const { data } = await supabase
        .from('ai_knowledge_base')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (data) {
        setTrainingExamples(data.map(item => ({
          id: item.id,
          question: item.question,
          answer: item.answer,
          keywords: item.keywords || [],
          category: item.category,
          created_at: item.created_at
        })));
      }
    } catch (error) {
      console.error('Erro ao carregar exemplos:', error);
    }
  };

  // Enviar mensagem para a IA
  const sendTrainingMessage = async (message: string) => {
    if (!message.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: message,
      timestamp: new Date().toISOString()
    };

    setChatMessages(prev => [...prev, userMessage]);
    setCurrentMessage('');
    setIsTraining(true);

    try {
      // Simular resposta da IA (aqui você pode integrar com sua API da IA)
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const botResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Entendi sua pergunta sobre "${message}". Baseado no meu treinamento atual, posso fornecer informações sobre nossos produtos e ajudar com vendas. Você gostaria de adicionar este exemplo ao meu banco de conhecimento?`,
        timestamp: new Date().toISOString()
      };

      setChatMessages(prev => [...prev, botResponse]);
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      toast.error('Erro ao comunicar com a IA');
    } finally {
      setIsTraining(false);
    }
  };

  // Adicionar exemplo de treinamento
  const addTrainingExample = async () => {
    if (!newExample.question.trim() || !newExample.answer.trim()) {
      toast.error('Pergunta e resposta são obrigatórias');
      return;
    }

    try {
      const keywords = newExample.keywords.split(',').map(k => k.trim()).filter(k => k);
      
      // Verificar se já existe uma pergunta similar
      const { data: existingExample } = await supabase
        .from('ai_knowledge_base')
        .select('id')
        .eq('question', newExample.question.trim())
        .maybeSingle();

      if (existingExample) {
        toast.error('Já existe um exemplo com esta pergunta na base de conhecimento');
        return;
      }
      
      const { error } = await supabase
        .from('ai_knowledge_base')
        .insert({
          question: newExample.question,
          answer: newExample.answer,
          keywords,
          category: newExample.category,
          priority: 1,
          active: true
        });

      if (error) throw error;

      toast.success('Exemplo de treinamento adicionado!');
      setNewExample({
        question: '',
        answer: '',
        keywords: '',
        category: 'geral'
      });
      
      loadTrainingExamples();
    } catch (error) {
      console.error('Erro ao adicionar exemplo:', error);
      toast.error('Erro ao salvar exemplo');
    }
  };

  return (
    <div className="space-y-6">
      {/* Tabs de navegação */}
      <div className="flex gap-2">
        <Button
          variant={activeTab === 'chat' ? 'default' : 'outline'}
          onClick={() => setActiveTab('chat')}
          className="flex items-center gap-2"
        >
          <MessageSquare className="h-4 w-4" />
          Chat de Treinamento
        </Button>
        <Button
          variant={activeTab === 'examples' ? 'default' : 'outline'}
          onClick={() => setActiveTab('examples')}
          className="flex items-center gap-2"
        >
          <Brain className="h-4 w-4" />
          Exemplos de Treinamento
        </Button>
      </div>

      {/* Chat de Treinamento */}
      {activeTab === 'chat' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5" />
              Chat Interativo de Treinamento
            </CardTitle>
            <CardDescription>
              Converse com a IA para testar e treinar suas respostas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Área do chat */}
              <ScrollArea className="h-96 border rounded-lg p-4">
                <div className="space-y-4">
                  {chatMessages.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Bot className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>Inicie uma conversa para treinar a IA</p>
                    </div>
                  ) : (
                    chatMessages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[80%] p-3 rounded-lg ${
                            msg.role === 'user'
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted'
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            {msg.role === 'user' ? (
                              <User className="h-4 w-4" />
                            ) : (
                              <Bot className="h-4 w-4" />
                            )}
                            <span className="text-xs opacity-70">
                              {msg.role === 'user' ? 'Você' : 'IA'}
                            </span>
                          </div>
                          <p className="text-sm">{msg.content}</p>
                        </div>
                      </div>
                    ))
                  )}
                  
                  {isTraining && (
                    <div className="flex justify-start">
                      <div className="bg-muted p-3 rounded-lg">
                        <div className="flex items-center gap-2">
                          <Bot className="h-4 w-4" />
                          <div className="animate-pulse text-sm">
                            IA está pensando...
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>

              {/* Input de mensagem */}
              <div className="flex gap-2">
                <Input
                  placeholder="Digite sua pergunta para treinar a IA..."
                  value={currentMessage}
                  onChange={(e) => setCurrentMessage(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !isTraining) {
                      sendTrainingMessage(currentMessage);
                    }
                  }}
                  disabled={isTraining}
                />
                <Button
                  onClick={() => sendTrainingMessage(currentMessage)}
                  disabled={!currentMessage.trim() || isTraining}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Exemplos de Treinamento */}
      {activeTab === 'examples' && (
        <div className="space-y-6">
          {/* Adicionar novo exemplo */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Adicionar Novo Exemplo
              </CardTitle>
              <CardDescription>
                Crie exemplos de perguntas e respostas para treinar a IA
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Pergunta</Label>
                    <Textarea
                      placeholder="Ex: Qual o preço do iPhone 15?"
                      value={newExample.question}
                      onChange={(e) => setNewExample(prev => ({ ...prev, question: e.target.value }))}
                      rows={3}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Palavras-chave</Label>
                    <Input
                      placeholder="Ex: iphone, preço, valor"
                      value={newExample.keywords}
                      onChange={(e) => setNewExample(prev => ({ ...prev, keywords: e.target.value }))}
                    />
                    <p className="text-xs text-muted-foreground">
                      Separe por vírgulas
                    </p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Resposta</Label>
                    <Textarea
                      placeholder="Ex: O iPhone 15 custa AOA 350.000. Temos várias cores disponíveis..."
                      value={newExample.answer}
                      onChange={(e) => setNewExample(prev => ({ ...prev, answer: e.target.value }))}
                      rows={3}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Categoria</Label>
                    <select
                      value={newExample.category}
                      onChange={(e) => setNewExample(prev => ({ ...prev, category: e.target.value }))}
                      className="w-full p-2 border rounded-lg"
                    >
                      <option value="geral">Geral</option>
                      <option value="produtos">Produtos</option>
                      <option value="precos">Preços</option>
                      <option value="entrega">Entrega</option>
                      <option value="pagamento">Pagamento</option>
                    </select>
                  </div>
                </div>
              </div>
              
              <Button onClick={addTrainingExample} className="mt-4">
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Exemplo
              </Button>
            </CardContent>
          </Card>

          {/* Lista de exemplos existentes */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Exemplos de Treinamento ({trainingExamples.length})
              </CardTitle>
              <CardDescription>
                Exemplos atualmente na base de conhecimento da IA
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <div className="space-y-4">
                  {trainingExamples.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Lightbulb className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>Nenhum exemplo de treinamento encontrado.</p>
                      <Button variant="outline" className="mt-2" onClick={loadTrainingExamples}>
                        Carregar Exemplos
                      </Button>
                    </div>
                  ) : (
                    trainingExamples.map((example) => (
                      <div key={example.id} className="border rounded-lg p-4">
                        <div className="flex items-start justify-between mb-2">
                          <Badge variant="secondary">{example.category}</Badge>
                          <span className="text-xs text-muted-foreground">
                            {new Date(example.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        
                        <div className="space-y-2">
                          <div>
                            <Label className="text-sm font-medium">Pergunta:</Label>
                            <p className="text-sm text-muted-foreground">{example.question}</p>
                          </div>
                          
                          <div>
                            <Label className="text-sm font-medium">Resposta:</Label>
                            <p className="text-sm text-muted-foreground">{example.answer}</p>
                          </div>
                          
                          {example.keywords.length > 0 && (
                            <div>
                              <Label className="text-sm font-medium">Palavras-chave:</Label>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {example.keywords.map((keyword, idx) => (
                                  <Badge key={idx} variant="outline" className="text-xs">
                                    {keyword}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default TrainingChat;