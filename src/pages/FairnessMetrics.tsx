import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Info } from 'lucide-react';
import { useDataset } from '@/contexts/DatasetContext';
import { AppLayout } from '@/components/AppLayout';

export default function FairnessMetrics() {
  const { analysisResults } = useDataset();
  const navigate = useNavigate();
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);

  useEffect(() => {
    if (!analysisResults) navigate('/upload');
  }, [analysisResults, navigate]);

  if (!analysisResults) return null;

  const { fairnessMetrics } = analysisResults;

  const statusBadge = (status: 'good' | 'moderate' | 'poor') => {
    const cls =
      status === 'good'
        ? 'bg-success/10 text-success'
        : status === 'moderate'
        ? 'bg-warning/10 text-warning'
        : 'bg-destructive/10 text-destructive';
    return (
      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${cls}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Fairness Metrics</h1>
          <p className="text-muted-foreground mt-1">Quantitative fairness measurements for each sensitive attribute.</p>
        </div>

        <div className="bg-card rounded-2xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-secondary">
              <tr>
                <th className="text-left px-6 py-3.5 font-semibold text-foreground">Column</th>
                <th className="text-left px-6 py-3.5 font-semibold text-foreground">Metric</th>
                <th className="text-left px-6 py-3.5 font-semibold text-foreground">Value</th>
                <th className="text-left px-6 py-3.5 font-semibold text-foreground">Status</th>
                <th className="px-6 py-3.5" />
              </tr>
            </thead>
            <tbody>
              {fairnessMetrics.map((metric, i) => (
                <>
                  <tr key={i} className="border-t border-border hover:bg-secondary/30 transition-colors cursor-pointer" onClick={() => setExpandedIdx(expandedIdx === i ? null : i)}>
                    <td className="px-6 py-4 font-medium text-foreground">{metric.column}</td>
                    <td className="px-6 py-4 text-foreground">{metric.name}</td>
                    <td className="px-6 py-4 font-mono font-semibold text-foreground">{metric.value.toFixed(3)}</td>
                    <td className="px-6 py-4">{statusBadge(metric.status)}</td>
                    <td className="px-6 py-4">
                      <Info className="h-4 w-4 text-muted-foreground" />
                    </td>
                  </tr>
                  {expandedIdx === i && (
                    <tr key={`exp-${i}`} className="bg-secondary/20">
                      <td colSpan={5} className="px-6 py-4">
                        <p className="text-sm text-muted-foreground leading-relaxed">{metric.explanation}</p>
                      </td>
                    </tr>
                  )}
                </>
              ))}
              {fairnessMetrics.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                    No fairness metrics computed. Ensure sensitive columns are selected.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AppLayout>
  );
}
