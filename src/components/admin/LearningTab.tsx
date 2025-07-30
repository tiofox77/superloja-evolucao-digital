import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Lightbulb, TrendingUp, Target, Zap } from 'lucide-react';

interface LearningInsight {
  id: string;
  insight_type: string;
  content: string;
  confidence_score: number;
  usage_count: number;
  effectiveness_score: number;
  created_at: string;
}

interface LearningTabProps {
  learningInsights: LearningInsight[];
}

export const LearningTab: React.FC<LearningTabProps> = ({ learningInsights }) => {
  const getInsightTypeIcon = (type: string) => {
    switch (type) {
      case 'pattern':
        return <Target className="h-4 w-4" />;
      case 'improvement':
        return <TrendingUp className="h-4 w-4" />;
      case 'optimization':
        return <Zap className="h-4 w-4" />;
      default:
        return <Lightbulb className="h-4 w-4" />;
    }
  };

  const getInsightTypeColor = (type: string) => {
    switch (type) {
      case 'pattern':
        return 'bg-blue-500';
      case 'improvement':
        return 'bg-green-500';
      case 'optimization':
        return 'bg-purple-500';
      default:
        return 'bg-orange-500';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5" />
          🧩 Aprendizado IA
        </CardTitle>
        <CardDescription>
          Insights e aprendizados automáticos do agente IA baseados nas interações
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Resumo de Aprendizado */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{learningInsights.length}</div>
                <div className="text-xs text-muted-foreground">Total Insights</div>
              </div>
            </Card>
            
            <Card className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {Math.round(learningInsights.reduce((acc, insight) => acc + insight.confidence_score, 0) / learningInsights.length * 100) || 0}%
                </div>
                <div className="text-xs text-muted-foreground">Confiança Média</div>
              </div>
            </Card>
            
            <Card className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {learningInsights.reduce((acc, insight) => acc + insight.usage_count, 0)}
                </div>
                <div className="text-xs text-muted-foreground">Aplicações</div>
              </div>
            </Card>
          </div>

          {/* Lista de Insights */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Insights Recentes</h3>
            
            {learningInsights.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Lightbulb className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhum insight de aprendizado ainda.</p>
                <p className="text-sm">Os insights aparecerão conforme o agente IA interage com os usuários.</p>
              </div>
            ) : (
              learningInsights.map((insight) => (
                <Card key={insight.id} className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`p-2 rounded-full ${getInsightTypeColor(insight.insight_type)}`}>
                          {getInsightTypeIcon(insight.insight_type)}
                        </div>
                        <div>
                          <Badge variant="outline" className="mb-1">
                            {insight.insight_type}
                          </Badge>
                          <div className="text-sm text-muted-foreground">
                            {new Date(insight.created_at).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="text-sm font-medium">
                          {insight.usage_count} aplicações
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Usado {insight.usage_count} vezes
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <p className="text-sm">{insight.content}</p>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span>Confiança</span>
                            <span>{Math.round(insight.confidence_score * 100)}%</span>
                          </div>
                          <Progress value={insight.confidence_score * 100} className="h-2" />
                        </div>
                        
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span>Efetividade</span>
                            <span>{Math.round(insight.effectiveness_score * 100)}%</span>
                          </div>
                          <Progress value={insight.effectiveness_score * 100} className="h-2" />
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>

          {/* Como Funciona */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium text-blue-800 mb-2">Como Funciona o Aprendizado</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• IA analisa padrões nas conversas automaticamente</li>
              <li>• Identifica respostas mais efetivas para diferentes situações</li>
              <li>• Aprende com feedback dos usuários e resultados</li>
              <li>• Otimiza respostas baseado no histórico de sucesso</li>
              <li>• Sugere melhorias na base de conhecimento</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};