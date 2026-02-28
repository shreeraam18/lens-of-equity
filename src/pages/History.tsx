import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { useDataset } from '@/contexts/DatasetContext';
import { AppLayout } from '@/components/AppLayout';

export default function History() {
  const { history, analysisResults } = useDataset();
  const navigate = useNavigate();

  useEffect(() => {
    if (!analysisResults) navigate('/upload');
  }, [analysisResults, navigate]);

  if (!analysisResults) return null;

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Analysis History</h1>
          <p className="text-muted-foreground mt-1">Track fairness score changes across analyses and mitigations.</p>
        </div>

        {history.length === 0 ? (
          <div className="bg-card rounded-2xl border border-border p-12 text-center">
            <Clock className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
            <p className="text-muted-foreground">No history entries yet. Run an analysis to get started.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Timeline */}
            <div className="relative">
              <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-border" />
              {history.map((entry, i) => {
                const prev = i > 0 ? history[i - 1] : null;
                const diff = prev ? entry.overallScore - prev.overallScore : 0;
                const riskColor = entry.riskLevel === 'low' ? 'text-success' : entry.riskLevel === 'moderate' ? 'text-warning' : 'text-destructive';

                return (
                  <div key={entry.id} className="relative pl-16 pb-6 animate-fade-in" style={{ animationDelay: `${i * 0.05}s` }}>
                    <div className={`absolute left-4 top-1 w-5 h-5 rounded-full border-2 border-card ${entry.riskLevel === 'low' ? 'bg-success' : entry.riskLevel === 'moderate' ? 'bg-warning' : 'bg-destructive'}`} />
                    <div className="bg-card rounded-xl border border-border p-5">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <span className="text-xs text-muted-foreground">{entry.timestamp.toLocaleString()}</span>
                          {entry.label && <span className="ml-2 text-xs bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full">{entry.label}</span>}
                        </div>
                        {prev && (
                          <div className={`flex items-center gap-1 text-sm font-semibold ${diff > 0 ? 'text-success' : diff < 0 ? 'text-destructive' : 'text-muted-foreground'}`}>
                            {diff > 0 ? <TrendingUp className="h-4 w-4" /> : diff < 0 ? <TrendingDown className="h-4 w-4" /> : <Minus className="h-4 w-4" />}
                            {diff > 0 ? '+' : ''}{diff}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-2xl font-bold text-foreground">{entry.overallScore}</span>
                        <span className={`text-sm font-medium ${riskColor}`}>{entry.riskLevel} risk</span>
                        <span className="text-sm text-muted-foreground">{entry.fileName}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
