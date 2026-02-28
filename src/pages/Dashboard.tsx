import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, TrendingDown, GitBranch, ArrowRight } from 'lucide-react';
import { useDataset } from '@/contexts/DatasetContext';
import { AppLayout } from '@/components/AppLayout';
import { FairnessGauge } from '@/components/FairnessGauge';
import { Button } from '@/components/ui/button';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';

const CHART_COLORS = [
  'hsl(252, 87%, 58%)', 'hsl(270, 76%, 55%)', 'hsl(160, 84%, 39%)',
  'hsl(38, 92%, 50%)', 'hsl(0, 84%, 60%)', 'hsl(200, 80%, 50%)',
];

export default function Dashboard() {
  const { analysisResults } = useDataset();
  const navigate = useNavigate();

  useEffect(() => {
    if (!analysisResults) navigate('/upload');
  }, [analysisResults, navigate]);

  if (!analysisResults) return null;

  const { overallScore, riskLevel, mostBiasedColumn, mostUnderrepresentedGroup, proxyBiasDetected, distributions, summary } = analysisResults;

  const riskColor = riskLevel === 'low' ? 'text-success' : riskLevel === 'moderate' ? 'text-warning' : 'text-destructive';
  const riskBg = riskLevel === 'low' ? 'bg-success/10' : riskLevel === 'moderate' ? 'bg-warning/10' : 'bg-destructive/10';

  // First distribution for chart preview
  const firstDist = distributions[0];

  return (
    <AppLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Bias Overview Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Analysis of <span className="font-medium text-foreground">{summary.totalRows.toLocaleString()}</span> rows across <span className="font-medium text-foreground">{summary.totalColumns}</span> columns
          </p>
        </div>

        {/* Top row: Gauge + Summary */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Gauge */}
          <div className="bg-card rounded-2xl border border-border p-8 flex flex-col items-center justify-center">
            <p className="text-sm font-medium text-muted-foreground mb-4">Overall Fairness Score</p>
            <FairnessGauge score={overallScore} size={180} />
            <div className={`mt-4 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold ${riskBg} ${riskColor}`}>
              {riskLevel === 'low' ? '✓ Low Risk' : riskLevel === 'moderate' ? '⚠ Moderate Risk' : '✕ High Risk'}
            </div>
          </div>

          {/* Summary cards */}
          <div className="lg:col-span-2 grid sm:grid-cols-3 gap-4">
            <div className="bg-card rounded-2xl border border-border p-6">
              <div className="flex items-center gap-2 text-muted-foreground mb-3">
                <AlertTriangle className="h-4 w-4" />
                <span className="text-xs font-medium uppercase tracking-wide">Most Biased Column</span>
              </div>
              <p className="text-xl font-bold text-foreground">{mostBiasedColumn}</p>
              <Button variant="ghost" size="sm" className="mt-3 text-primary px-0" onClick={() => navigate('/distribution')}>
                View details <ArrowRight className="h-3 w-3" />
              </Button>
            </div>

            <div className="bg-card rounded-2xl border border-border p-6">
              <div className="flex items-center gap-2 text-muted-foreground mb-3">
                <TrendingDown className="h-4 w-4" />
                <span className="text-xs font-medium uppercase tracking-wide">Underrepresented</span>
              </div>
              <p className="text-xl font-bold text-foreground">{mostUnderrepresentedGroup.group || 'None'}</p>
              <p className="text-sm text-muted-foreground mt-1">
                {mostUnderrepresentedGroup.column ? `${(mostUnderrepresentedGroup.percentage * 100).toFixed(1)}% in "${mostUnderrepresentedGroup.column}"` : 'No underrepresentation detected'}
              </p>
            </div>

            <div className="bg-card rounded-2xl border border-border p-6">
              <div className="flex items-center gap-2 text-muted-foreground mb-3">
                <GitBranch className="h-4 w-4" />
                <span className="text-xs font-medium uppercase tracking-wide">Proxy Bias</span>
              </div>
              <p className={`text-xl font-bold ${proxyBiasDetected ? 'text-destructive' : 'text-success'}`}>
                {proxyBiasDetected ? 'Detected' : 'Not Detected'}
              </p>
              {proxyBiasDetected && (
                <Button variant="ghost" size="sm" className="mt-3 text-primary px-0" onClick={() => navigate('/correlation')}>
                  Investigate <ArrowRight className="h-3 w-3" />
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Charts row */}
        {firstDist && (
          <div className="grid lg:grid-cols-2 gap-6">
            <div className="bg-card rounded-2xl border border-border p-6">
              <h3 className="font-semibold text-foreground mb-4">Distribution: {firstDist.column}</h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={firstDist.distribution.slice(0, 10)}>
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: 'hsl(240,10%,46%)' }} interval={0} angle={-30} textAnchor="end" height={60} />
                  <YAxis tick={{ fontSize: 11, fill: 'hsl(240,10%,46%)' }} />
                  <Tooltip
                    contentStyle={{ background: 'hsl(0,0%,100%)', border: '1px solid hsl(240,15%,90%)', borderRadius: '12px', fontSize: '13px' }}
                    formatter={(value: number, _: string, entry: { payload: { percentage: number } }) => [`${value} (${(entry.payload.percentage * 100).toFixed(1)}%)`, 'Count']}
                  />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                    {firstDist.distribution.slice(0, 10).map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-card rounded-2xl border border-border p-6">
              <h3 className="font-semibold text-foreground mb-4">Composition: {firstDist.column}</h3>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={firstDist.distribution.slice(0, 8)}
                    cx="50%" cy="50%"
                    outerRadius={90}
                    dataKey="count"
                    nameKey="label"
                    label={({ label, percentage }) => `${label} (${(percentage * 100).toFixed(0)}%)`}
                    labelLine={false}
                    fontSize={11}
                  >
                    {firstDist.distribution.slice(0, 8).map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => [value, 'Count']} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Quick actions */}
        <div className="flex gap-3">
          <Button variant="gradient" onClick={() => navigate('/distribution')}>View Distribution Analysis</Button>
          <Button variant="outline" onClick={() => navigate('/mitigation')}>View Mitigations</Button>
          <Button variant="outline" onClick={() => navigate('/report')}>Generate Report</Button>
        </div>
      </div>
    </AppLayout>
  );
}
