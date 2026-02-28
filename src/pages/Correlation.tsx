import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';
import { useDataset } from '@/contexts/DatasetContext';
import { AppLayout } from '@/components/AppLayout';

function getHeatmapColor(value: number): string {
  const abs = Math.abs(value);
  if (value > 0) return `rgba(99, 102, 241, ${abs})`;  // indigo
  if (value < 0) return `rgba(239, 68, 68, ${abs})`;   // red
  return 'transparent';
}

export default function Correlation() {
  const { analysisResults } = useDataset();
  const navigate = useNavigate();

  useEffect(() => {
    if (!analysisResults) navigate('/upload');
  }, [analysisResults, navigate]);

  if (!analysisResults) return null;

  const { correlations, proxyBiases, summary } = analysisResults;
  const cols = [...new Set(correlations.map((c) => c.col1))];

  return (
    <AppLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Correlation & Proxy Bias</h1>
          <p className="text-muted-foreground mt-1">Detect hidden correlations and proxy discrimination risks.</p>
        </div>

        {/* Heatmap */}
        <div className="bg-card rounded-2xl border border-border p-6 overflow-x-auto">
          <h3 className="font-semibold text-foreground mb-4">Correlation Matrix</h3>
          <div className="inline-block min-w-max">
            <div className="grid" style={{ gridTemplateColumns: `120px repeat(${cols.length}, 60px)` }}>
              {/* Header */}
              <div />
              {cols.map((col) => (
                <div key={col} className="text-xs font-medium text-muted-foreground truncate px-1 -rotate-45 origin-left h-16 flex items-end">
                  {col.length > 8 ? col.slice(0, 8) + '…' : col}
                </div>
              ))}

              {/* Rows */}
              {cols.map((rowCol) => (
                <>
                  <div key={`label-${rowCol}`} className="text-xs font-medium text-foreground truncate pr-2 flex items-center h-[40px]">
                    {rowCol.length > 14 ? rowCol.slice(0, 14) + '…' : rowCol}
                  </div>
                  {cols.map((cellCol) => {
                    const entry = correlations.find((c) => c.col1 === rowCol && c.col2 === cellCol);
                    const val = entry?.value ?? 0;
                    return (
                      <div
                        key={`${rowCol}-${cellCol}`}
                        className="h-[40px] flex items-center justify-center text-[10px] font-medium rounded-sm mx-0.5 my-0.5 cursor-default"
                        style={{ background: getHeatmapColor(val), color: Math.abs(val) > 0.5 ? 'white' : 'hsl(240,24%,10%)' }}
                        title={`${rowCol} × ${cellCol}: ${val.toFixed(2)}`}
                      >
                        {val.toFixed(1)}
                      </div>
                    );
                  })}
                </>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-4 mt-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><span className="w-4 h-3 rounded" style={{ background: 'rgba(239,68,68,0.7)' }} /> Negative</span>
            <span className="flex items-center gap-1"><span className="w-4 h-3 rounded bg-secondary" /> Zero</span>
            <span className="flex items-center gap-1"><span className="w-4 h-3 rounded" style={{ background: 'rgba(99,102,241,0.7)' }} /> Positive</span>
          </div>
        </div>

        {/* Proxy Bias Warnings */}
        <div>
          <h3 className="text-lg font-semibold text-foreground mb-4">Proxy Bias Alerts</h3>
          {proxyBiases.length === 0 ? (
            <div className="bg-success/5 border border-success/20 rounded-xl p-6 text-center">
              <p className="text-success font-medium">No proxy bias detected.</p>
              <p className="text-sm text-muted-foreground mt-1">No non-sensitive columns show high correlation with sensitive attributes.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {proxyBiases.map((pb, i) => (
                <div key={i} className="bg-destructive/5 border border-destructive/20 rounded-xl p-5">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-foreground">
                        "{pb.column}" may act as proxy for "{pb.sensitiveColumn}"
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">{pb.explanation}</p>
                      <div className="mt-2 inline-flex items-center gap-1 bg-destructive/10 text-destructive text-xs font-medium px-2 py-1 rounded-full">
                        Correlation: {pb.correlation.toFixed(2)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
