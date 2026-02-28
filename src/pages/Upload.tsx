import { useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload as UploadIcon, FileUp, X, AlertCircle, Sparkles, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useDataset } from '@/contexts/DatasetContext';
import { parseCSV, analyzeColumns, runFullAnalysis } from '@/lib/bias-analysis';

export default function UploadPage() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { rawData, columns, sensitiveColumns, targetColumn, fileName, setRawData, setSensitiveColumns, setTargetColumn, setAnalysisResults, setIsAnalyzing, addHistoryEntry } = useDataset();

  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [columnInfos, setColumnInfos] = useState<ReturnType<typeof analyzeColumns>>([]);

  const handleFile = useCallback(async (file: File) => {
    if (!file.name.endsWith('.csv')) {
      setError('Please upload a CSV file.');
      return;
    }
    setError(null);
    try {
      const { data, columns: cols } = await parseCSV(file);
      if (data.length === 0) {
        setError('The file appears to be empty.');
        return;
      }
      setRawData(data, cols, file.name);
      const infos = analyzeColumns(data, cols);
      setColumnInfos(infos);
      // Auto-select sensitive columns
      const autoSensitive = infos.filter((c) => c.isSensitive).map((c) => c.name);
      setSensitiveColumns(autoSensitive);
    } catch {
      setError('Failed to parse CSV. Please check the file format.');
    }
  }, [setRawData, setSensitiveColumns]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleRunAnalysis = async () => {
    if (!rawData || !columns) return;
    setIsAnalyzing(true);
    // Use setTimeout to allow UI to update
    setTimeout(() => {
      const results = runFullAnalysis(rawData, columns, sensitiveColumns, targetColumn);
      setAnalysisResults(results);
      addHistoryEntry({
        id: Date.now().toString(),
        fileName: fileName || 'Unknown',
        timestamp: new Date(),
        overallScore: results.overallScore,
        riskLevel: results.riskLevel,
        label: 'Initial Analysis',
      });
      navigate('/dashboard');
    }, 100);
  };

  const toggleSensitive = (col: string) => {
    setSensitiveColumns(
      sensitiveColumns.includes(col)
        ? sensitiveColumns.filter((c) => c !== col)
        : [...sensitiveColumns, col]
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <nav className="h-16 border-b border-border flex items-center px-6">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
          <Eye className="h-6 w-6 text-primary" />
          <span className="text-xl font-bold text-foreground">BiasLens</span>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold text-foreground mb-2">Upload & Configure Dataset</h1>
        <p className="text-muted-foreground mb-8">Upload your CSV file to begin bias analysis.</p>

        {/* Upload zone */}
        {!rawData && (
          <div
            className={`border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-200 cursor-pointer ${
              dragActive ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40 hover:bg-primary/5'
            }`}
            onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
            onDragLeave={() => setDragActive(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input ref={fileInputRef} type="file" accept=".csv" className="hidden" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
            <UploadIcon className="h-12 w-12 text-primary/60 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">Drag & drop your CSV file here</h3>
            <p className="text-sm text-muted-foreground mb-4">or click to browse</p>
            <Button variant="heroOutline" size="sm">
              <FileUp className="h-4 w-4" /> Choose File
            </Button>
          </div>
        )}

        {error && (
          <div className="mt-4 flex items-center gap-2 bg-destructive/10 text-destructive rounded-lg px-4 py-3 text-sm">
            <AlertCircle className="h-4 w-4 shrink-0" /> {error}
          </div>
        )}

        {/* Dataset loaded */}
        {rawData && columns && (
          <div className="space-y-8 animate-fade-in">
            {/* File info + new upload */}
            <div className="flex items-center justify-between bg-card rounded-xl border border-border p-4">
              <div>
                <span className="font-semibold text-foreground">{fileName}</span>
                <span className="text-sm text-muted-foreground ml-3">{rawData.length} rows × {columns.length} columns</span>
              </div>
              <Button variant="ghost" size="sm" onClick={() => { setRawData([], [], ''); setColumnInfos([]); }}>
                <X className="h-4 w-4" /> Remove
              </Button>
            </div>

            {/* Summary cards */}
            <div className="grid grid-cols-4 gap-4">
              {[
                { label: 'Total Rows', value: rawData.length.toLocaleString() },
                { label: 'Total Columns', value: columns.length },
                { label: 'Missing Values', value: columnInfos.reduce((s, c) => s + c.missingCount, 0).toLocaleString() },
                { label: 'Data Types', value: `${columnInfos.filter((c) => c.type === 'numerical').length} num / ${columnInfos.filter((c) => c.type === 'categorical').length} cat` },
              ].map((card) => (
                <div key={card.label} className="bg-card rounded-xl border border-border p-4">
                  <p className="text-xs text-muted-foreground font-medium mb-1">{card.label}</p>
                  <p className="text-2xl font-bold text-foreground">{card.value}</p>
                </div>
              ))}
            </div>

            {/* Preview table */}
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-3">Data Preview</h3>
              <div className="bg-card rounded-xl border border-border overflow-hidden">
                <div className="overflow-x-auto max-h-72">
                  <table className="w-full text-sm">
                    <thead className="bg-secondary sticky top-0">
                      <tr>
                        {columns.slice(0, 10).map((col) => (
                          <th key={col} className="px-4 py-2.5 text-left font-semibold text-foreground whitespace-nowrap">{col}</th>
                        ))}
                        {columns.length > 10 && <th className="px-4 py-2.5 text-muted-foreground">+{columns.length - 10} more</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {rawData.slice(0, 50).map((row, i) => (
                        <tr key={i} className="border-t border-border hover:bg-secondary/50">
                          {columns.slice(0, 10).map((col) => (
                            <td key={col} className="px-4 py-2 whitespace-nowrap text-foreground">{row[col] || '—'}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Column Configuration */}
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-1">Column Configuration</h3>
              <p className="text-sm text-muted-foreground mb-4">Select sensitive attributes for bias analysis.</p>

              <div className="bg-card rounded-xl border border-border p-5 space-y-4">
                <div>
                  <label className="text-sm font-medium text-foreground block mb-2">Sensitive Attributes</label>
                  <div className="flex flex-wrap gap-2">
                    {columns.map((col) => {
                      const info = columnInfos.find((c) => c.name === col);
                      const isSelected = sensitiveColumns.includes(col);
                      return (
                        <button
                          key={col}
                          onClick={() => toggleSensitive(col)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-150 border ${
                            isSelected
                              ? 'gradient-bg text-primary-foreground border-transparent'
                              : 'bg-secondary text-secondary-foreground border-border hover:border-primary/30'
                          }`}
                        >
                          {col}
                          {info?.isSensitive && !isSelected && (
                            <Sparkles className="h-3 w-3 text-primary" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                  {columnInfos.some((c) => c.isSensitive) && (
                    <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                      <Sparkles className="h-3 w-3 text-primary" /> AI auto-suggested based on column names
                    </p>
                  )}
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground block mb-2">Target Column (optional)</label>
                  <select
                    value={targetColumn || ''}
                    onChange={(e) => setTargetColumn(e.target.value || null)}
                    className="w-full max-w-xs bg-secondary text-secondary-foreground rounded-lg px-3 py-2 text-sm border border-border focus:ring-2 focus:ring-primary/30 outline-none"
                  >
                    <option value="">None</option>
                    {columns.map((col) => (
                      <option key={col} value={col}>{col}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-4">
              <Button variant="hero" size="lg" onClick={handleRunAnalysis} disabled={sensitiveColumns.length === 0}>
                Run Bias Analysis <span className="ml-1">→</span>
              </Button>
              <Button variant="outline" size="lg" onClick={() => navigate('/')}>Cancel</Button>
            </div>
            {sensitiveColumns.length === 0 && (
              <p className="text-sm text-destructive">Please select at least one sensitive attribute to analyze.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
