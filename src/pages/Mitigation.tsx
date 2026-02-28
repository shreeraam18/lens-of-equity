import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lightbulb, Play, ArrowUp, ArrowDown, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useDataset } from '@/contexts/DatasetContext';
import { AppLayout } from '@/components/AppLayout';
import { FairnessGauge } from '@/components/FairnessGauge';
import { simulateMitigation, Recommendation } from '@/lib/bias-analysis';

export default function Mitigation() {
  const { analysisResults, rawData, sensitiveColumns, targetColumn, addHistoryEntry, fileName } = useDataset();
  const navigate = useNavigate();
  const [simulationResult, setSimulationResult] = useState<{ rec: Recommendation; newScore: number } | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);

  useEffect(() => {
    if (!analysisResults) navigate('/upload');
  }, [analysisResults, navigate]);

  if (!analysisResults || !rawData) return null;

  const { recommendations, overallScore, summary } = analysisResults;

  const handleSimulate = (rec: Recommendation) => {
    setIsSimulating(true);
    setTimeout(() => {
      const result = simulateMitigation(
        rawData,
        summary.columns,
        sensitiveColumns,
        targetColumn,
        rec
      );
      setSimulationResult({ rec, newScore: result.newScore });
      addHistoryEntry({
        id: Date.now().toString(),
        fileName: fileName || 'Unknown',
        timestamp: new Date(),
        overallScore: result.newScore,
        riskLevel: result.newScore >= 75 ? 'low' : result.newScore >= 50 ? 'moderate' : 'high',
        label: `After: ${rec.title.slice(0, 30)}`,
      });
      setIsSimulating(false);
    }, 500);
  };

  const impactBadge = (impact: 'high' | 'medium' | 'low') => {
    const cls = impact === 'high' ? 'bg-destructive/10 text-destructive' : impact === 'medium' ? 'bg-warning/10 text-warning' : 'bg-success/10 text-success';
    return <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${cls}`}>{impact} impact</span>;
  };

  const scoreDiff = simulationResult ? simulationResult.newScore - overallScore : 0;

  return (
    <AppLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Bias Mitigation</h1>
          <p className="text-muted-foreground mt-1">AI-generated recommendations to improve dataset fairness.</p>
        </div>

        {/* Simulation comparison */}
        {simulationResult && (
          <div className="bg-card rounded-2xl border border-border p-8 animate-scale-in">
            <h3 className="font-semibold text-foreground mb-6">Simulation Result: {simulationResult.rec.title}</h3>
            <div className="grid md:grid-cols-3 gap-8 items-center">
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-2">Before</p>
                <FairnessGauge score={overallScore} size={140} />
              </div>
              <div className="text-center">
                <div className={`flex items-center justify-center gap-2 text-2xl font-bold ${scoreDiff > 0 ? 'text-success' : scoreDiff < 0 ? 'text-destructive' : 'text-muted-foreground'}`}>
                  {scoreDiff > 0 ? <ArrowUp className="h-6 w-6" /> : scoreDiff < 0 ? <ArrowDown className="h-6 w-6" /> : <Minus className="h-6 w-6" />}
                  {scoreDiff > 0 ? '+' : ''}{scoreDiff} points
                </div>
                <p className="text-sm text-muted-foreground mt-1">Fairness improvement</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-2">After</p>
                <FairnessGauge score={simulationResult.newScore} size={140} />
              </div>
            </div>
          </div>
        )}

        {/* Recommendations */}
        <div className="space-y-4">
          {recommendations.map((rec, i) => (
            <div key={i} className="bg-card rounded-2xl border border-border p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="h-10 w-10 rounded-xl gradient-bg-subtle flex items-center justify-center shrink-0">
                    <Lightbulb className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h4 className="font-semibold text-foreground">{rec.title}</h4>
                      {impactBadge(rec.impact)}
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">{rec.description}</p>
                    <div className="mt-2">
                      <span className="text-xs bg-secondary text-secondary-foreground px-2 py-0.5 rounded">{rec.type}</span>
                    </div>
                  </div>
                </div>
                <Button
                  variant="heroOutline"
                  size="sm"
                  onClick={() => handleSimulate(rec)}
                  disabled={isSimulating}
                >
                  <Play className="h-3 w-3" /> Simulate
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
