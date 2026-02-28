import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Download, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useDataset } from '@/contexts/DatasetContext';
import { AppLayout } from '@/components/AppLayout';

export default function AuditReport() {
  const { analysisResults, fileName, sensitiveColumns } = useDataset();
  const navigate = useNavigate();
  const reportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!analysisResults) navigate('/upload');
  }, [analysisResults, navigate]);

  if (!analysisResults) return null;

  const { overallScore, riskLevel, summary, fairnessMetrics, proxyBiases, recommendations, mostBiasedColumn, mostUnderrepresentedGroup } = analysisResults;

  const handleDownload = () => {
    const content = reportRef.current?.innerHTML || '';
    const html = `<!DOCTYPE html><html><head><title>BiasLens Audit Report</title><style>body{font-family:Manrope,system-ui,sans-serif;max-width:800px;margin:0 auto;padding:40px;color:#1a1a2e}h1{color:#6366f1}h2{color:#333;border-bottom:1px solid #eee;padding-bottom:8px;margin-top:32px}table{width:100%;border-collapse:collapse;margin:16px 0}th,td{text-align:left;padding:8px 12px;border:1px solid #eee}th{background:#f8f8fc}.good{color:#22c55e}.moderate{color:#f59e0b}.poor{color:#ef4444}.badge{display:inline-block;padding:2px 8px;border-radius:12px;font-size:12px;font-weight:600}</style></head><body>${content}</body></html>`;
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `biaslens-audit-${fileName || 'report'}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const StatusIcon = ({ status }: { status: string }) => {
    if (status === 'good') return <CheckCircle className="h-4 w-4 text-success inline" />;
    if (status === 'moderate') return <AlertTriangle className="h-4 w-4 text-warning inline" />;
    return <XCircle className="h-4 w-4 text-destructive inline" />;
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Audit Report</h1>
            <p className="text-muted-foreground mt-1">Generate a compliance-ready bias audit report.</p>
          </div>
          <Button variant="gradient" onClick={handleDownload}>
            <Download className="h-4 w-4" /> Download Report
          </Button>
        </div>

        {/* Report preview */}
        <div ref={reportRef} className="bg-card rounded-2xl border border-border p-10 space-y-8">
          <div className="text-center border-b border-border pb-8">
            <div className="flex items-center justify-center gap-2 mb-2">
              <FileText className="h-8 w-8 text-primary" />
              <h1 className="text-2xl font-bold text-foreground">BiasLens Audit Report</h1>
            </div>
            <p className="text-sm text-muted-foreground">Generated on {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
            <p className="text-sm text-muted-foreground">Dataset: {fileName}</p>
          </div>

          {/* Summary */}
          <div>
            <h2 className="text-xl font-bold text-foreground mb-4">1. Dataset Summary</h2>
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-secondary rounded-lg p-4"><p className="text-xs text-muted-foreground">Rows</p><p className="text-xl font-bold text-foreground">{summary.totalRows.toLocaleString()}</p></div>
              <div className="bg-secondary rounded-lg p-4"><p className="text-xs text-muted-foreground">Columns</p><p className="text-xl font-bold text-foreground">{summary.totalColumns}</p></div>
              <div className="bg-secondary rounded-lg p-4"><p className="text-xs text-muted-foreground">Missing Values</p><p className="text-xl font-bold text-foreground">{summary.missingValues.toLocaleString()}</p></div>
            </div>
            <p className="text-sm text-muted-foreground mt-3">Sensitive attributes analyzed: {sensitiveColumns.join(', ')}</p>
          </div>

          {/* Findings */}
          <div>
            <h2 className="text-xl font-bold text-foreground mb-4">2. Bias Findings</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-secondary rounded-lg p-4">
                <p className="text-xs text-muted-foreground">Overall Fairness Score</p>
                <p className="text-3xl font-bold text-foreground">{overallScore}<span className="text-lg text-muted-foreground">/100</span></p>
                <p className={`text-sm font-medium mt-1 ${riskLevel === 'low' ? 'text-success' : riskLevel === 'moderate' ? 'text-warning' : 'text-destructive'}`}>
                  {riskLevel.toUpperCase()} RISK
                </p>
              </div>
              <div className="space-y-2">
                <div className="bg-secondary rounded-lg p-3"><p className="text-xs text-muted-foreground">Most Biased Column</p><p className="font-semibold text-foreground">{mostBiasedColumn}</p></div>
                <div className="bg-secondary rounded-lg p-3"><p className="text-xs text-muted-foreground">Proxy Bias</p><p className="font-semibold text-foreground">{proxyBiases.length > 0 ? `${proxyBiases.length} detected` : 'None'}</p></div>
              </div>
            </div>
          </div>

          {/* Metrics */}
          <div>
            <h2 className="text-xl font-bold text-foreground mb-4">3. Fairness Metrics</h2>
            <table className="w-full text-sm">
              <thead><tr className="bg-secondary"><th className="px-4 py-2 text-left text-foreground">Column</th><th className="px-4 py-2 text-left text-foreground">Metric</th><th className="px-4 py-2 text-left text-foreground">Value</th><th className="px-4 py-2 text-left text-foreground">Status</th></tr></thead>
              <tbody>
                {fairnessMetrics.map((m, i) => (
                  <tr key={i} className="border-t border-border">
                    <td className="px-4 py-2 text-foreground">{m.column}</td>
                    <td className="px-4 py-2 text-foreground">{m.name}</td>
                    <td className="px-4 py-2 font-mono text-foreground">{m.value.toFixed(3)}</td>
                    <td className="px-4 py-2"><StatusIcon status={m.status} /> <span className="ml-1 text-foreground">{m.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Recommendations */}
          <div>
            <h2 className="text-xl font-bold text-foreground mb-4">4. Mitigation Steps</h2>
            <ol className="space-y-3">
              {recommendations.map((rec, i) => (
                <li key={i} className="bg-secondary rounded-lg p-4">
                  <p className="font-semibold text-foreground">{i + 1}. {rec.title}</p>
                  <p className="text-sm text-muted-foreground mt-1">{rec.description}</p>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
