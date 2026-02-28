import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';
import { useDataset } from '@/contexts/DatasetContext';
import { AppLayout } from '@/components/AppLayout';
import { analyzeDistribution } from '@/lib/bias-analysis';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';

const COLORS = [
  'hsl(252, 87%, 58%)', 'hsl(270, 76%, 55%)', 'hsl(160, 84%, 39%)',
  'hsl(38, 92%, 50%)', 'hsl(0, 84%, 60%)', 'hsl(200, 80%, 50%)',
  'hsl(320, 70%, 50%)', 'hsl(45, 90%, 45%)',
];

export default function Distribution() {
  const { analysisResults, rawData, columns } = useDataset();
  const navigate = useNavigate();
  const [selectedCol, setSelectedCol] = useState<string>('');
  const [chartType, setChartType] = useState<'bar' | 'pie'>('bar');

  useEffect(() => {
    if (!analysisResults || !columns) navigate('/upload');
    else if (!selectedCol && columns.length > 0) setSelectedCol(columns[0]);
  }, [analysisResults, columns, navigate, selectedCol]);

  if (!analysisResults || !rawData || !columns) return null;

  const colInfo = analysisResults.summary.columns.find((c) => c.name === selectedCol);
  const dist = selectedCol ? analyzeDistribution(rawData, selectedCol, colInfo?.type || 'categorical') : null;

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Distribution & Representation</h1>
          <p className="text-muted-foreground mt-1">Explore how data is distributed across columns.</p>
        </div>

        <div className="grid lg:grid-cols-[280px_1fr] gap-6">
          {/* Column selector */}
          <div className="bg-card rounded-2xl border border-border p-4 space-y-1 max-h-[600px] overflow-y-auto">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3 px-2">Columns</p>
            {columns.map((col) => {
              const ci = analysisResults.summary.columns.find((c) => c.name === col);
              return (
                <button
                  key={col}
                  onClick={() => setSelectedCol(col)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                    selectedCol === col ? 'gradient-bg text-primary-foreground' : 'text-foreground hover:bg-secondary'
                  }`}
                >
                  <span className="block font-medium truncate">{col}</span>
                  <span className={`text-xs ${selectedCol === col ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                    {ci?.type} · {ci?.uniqueValues} unique
                  </span>
                </button>
              );
            })}
          </div>

          {/* Chart panel */}
          <div className="bg-card rounded-2xl border border-border p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-foreground">{selectedCol}</h3>
              {colInfo?.type === 'categorical' && (
                <div className="flex bg-secondary rounded-lg p-1">
                  <button onClick={() => setChartType('bar')} className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${chartType === 'bar' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'}`}>
                    Bar
                  </button>
                  <button onClick={() => setChartType('pie')} className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${chartType === 'pie' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'}`}>
                    Pie
                  </button>
                </div>
              )}
            </div>

            {dist && (
              <>
                <ResponsiveContainer width="100%" height={350}>
                  {chartType === 'bar' || colInfo?.type === 'numerical' ? (
                    <BarChart data={dist.distribution.slice(0, 20)}>
                      <XAxis dataKey="label" tick={{ fontSize: 11, fill: 'hsl(240,10%,46%)' }} interval={0} angle={-30} textAnchor="end" height={80} />
                      <YAxis tick={{ fontSize: 11, fill: 'hsl(240,10%,46%)' }} />
                      <Tooltip
                        contentStyle={{ background: 'hsl(0,0%,100%)', border: '1px solid hsl(240,15%,90%)', borderRadius: '12px', fontSize: '13px' }}
                        formatter={(value: number, _: string, entry: { payload: { percentage: number } }) => [`${value} (${(entry.payload.percentage * 100).toFixed(1)}%)`, 'Count']}
                      />
                      <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                        {dist.distribution.slice(0, 20).map((d, i) => (
                          <Cell key={i} fill={d.percentage < 0.1 ? 'hsl(0, 84%, 60%)' : COLORS[i % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  ) : (
                    <PieChart>
                      <Pie data={dist.distribution.slice(0, 10)} cx="50%" cy="50%" outerRadius={120} dataKey="count" nameKey="label" label={({ label, percentage }) => `${label} ${(percentage * 100).toFixed(0)}%`} fontSize={11}>
                        {dist.distribution.slice(0, 10).map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => [value, 'Count']} />
                    </PieChart>
                  )}
                </ResponsiveContainer>

                {/* Underrepresentation warnings */}
                {dist.underrepresented.length > 0 && (
                  <div className="mt-6 space-y-2">
                    <p className="text-sm font-semibold text-destructive flex items-center gap-1.5">
                      <AlertTriangle className="h-4 w-4" />
                      Underrepresented Groups ({`<10%`})
                    </p>
                    {dist.underrepresented.map((u) => (
                      <div key={u.label} className="bg-destructive/5 border border-destructive/20 rounded-lg px-4 py-2.5 text-sm">
                        <span className="font-medium text-foreground">{u.label}</span>
                        <span className="text-muted-foreground"> — {u.count} records ({(u.percentage * 100).toFixed(1)}%)</span>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
