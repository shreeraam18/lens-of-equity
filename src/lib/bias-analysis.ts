import Papa from 'papaparse';

// ===== TYPES =====
export interface ColumnInfo {
  name: string;
  type: 'categorical' | 'numerical';
  uniqueValues: number;
  missingCount: number;
  isSensitive: boolean;
  sensitiveReason?: string;
}

export interface DatasetSummary {
  totalRows: number;
  totalColumns: number;
  missingValues: number;
  columns: ColumnInfo[];
}

export interface DistributionEntry {
  label: string;
  count: number;
  percentage: number;
}

export interface DistributionResult {
  column: string;
  type: 'categorical' | 'numerical';
  distribution: DistributionEntry[];
  underrepresented: DistributionEntry[];
}

export interface CorrelationEntry {
  col1: string;
  col2: string;
  value: number;
}

export interface ProxyBias {
  column: string;
  sensitiveColumn: string;
  correlation: number;
  explanation: string;
}

export interface FairnessMetric {
  name: string;
  column: string;
  value: number;
  status: 'good' | 'moderate' | 'poor';
  explanation: string;
}

export interface Recommendation {
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  type: 'oversample' | 'undersample' | 'reweight' | 'remove' | 'transform';
  targetColumn?: string;
}

export interface AnalysisResults {
  summary: DatasetSummary;
  overallScore: number;
  riskLevel: 'low' | 'moderate' | 'high';
  distributions: DistributionResult[];
  correlations: CorrelationEntry[];
  proxyBiases: ProxyBias[];
  fairnessMetrics: FairnessMetric[];
  recommendations: Recommendation[];
  mostBiasedColumn: string;
  mostUnderrepresentedGroup: { column: string; group: string; percentage: number };
  proxyBiasDetected: boolean;
}

// ===== CONSTANTS =====
const SENSITIVE_PATTERNS: { pattern: RegExp; reason: string }[] = [
  { pattern: /\b(gender|sex)\b/i, reason: 'Gender-related attribute' },
  { pattern: /\b(race|ethnic)/i, reason: 'Race/ethnicity-related attribute' },
  { pattern: /\b(age|birth)/i, reason: 'Age-related attribute' },
  { pattern: /\b(religion|religious)/i, reason: 'Religion-related attribute' },
  { pattern: /\bcaste\b/i, reason: 'Caste-related attribute' },
  { pattern: /\b(income|salary|wage|pay)\b/i, reason: 'Income-related attribute' },
  { pattern: /\b(disab)/i, reason: 'Disability-related attribute' },
  { pattern: /\b(national|country|citizen)/i, reason: 'Nationality-related attribute' },
  { pattern: /\b(marital|married|divorce)/i, reason: 'Marital status attribute' },
  { pattern: /\b(orient|lgbtq)/i, reason: 'Sexual orientation attribute' },
  { pattern: /\b(pregnan)/i, reason: 'Pregnancy-related attribute' },
  { pattern: /\b(zip|postal|region)\b/i, reason: 'Geographic attribute (potential proxy)' },
];

const UNDERREPRESENTATION_THRESHOLD = 0.10;

// ===== PARSING =====
export function parseCSV(file: File): Promise<{ data: Record<string, string>[]; columns: string[] }> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const data = results.data as Record<string, string>[];
        const columns = results.meta.fields || [];
        resolve({ data, columns });
      },
      error: (error: Error) => reject(error),
    });
  });
}

// ===== COLUMN ANALYSIS =====
export function analyzeColumns(data: Record<string, string>[], columns: string[]): ColumnInfo[] {
  return columns.map((col) => {
    const values = data.map((row) => row[col]);
    const nonEmpty = values.filter((v) => v !== '' && v != null);
    const numericCount = nonEmpty.filter((v) => !isNaN(Number(v)) && v.trim() !== '').length;
    const isNumerical = nonEmpty.length > 0 && numericCount / nonEmpty.length > 0.8;
    const uniqueSet = new Set(nonEmpty);
    const sensitive = SENSITIVE_PATTERNS.find((p) => p.pattern.test(col));

    return {
      name: col,
      type: isNumerical ? 'numerical' : 'categorical',
      uniqueValues: uniqueSet.size,
      missingCount: values.length - nonEmpty.length,
      isSensitive: !!sensitive,
      sensitiveReason: sensitive?.reason,
    };
  });
}

// ===== DISTRIBUTION =====
export function analyzeDistribution(
  data: Record<string, string>[],
  column: string,
  columnType: 'categorical' | 'numerical'
): DistributionResult {
  const values = data.map((r) => r[column]).filter((v) => v !== '' && v != null);
  const total = values.length;

  if (columnType === 'categorical') {
    const counts: Record<string, number> = {};
    values.forEach((v) => {
      counts[v] = (counts[v] || 0) + 1;
    });
    const distribution = Object.entries(counts)
      .map(([label, count]) => ({ label, count, percentage: count / total }))
      .sort((a, b) => b.count - a.count);
    const underrepresented = distribution.filter((d) => d.percentage < UNDERREPRESENTATION_THRESHOLD);
    return { column, type: 'categorical', distribution, underrepresented };
  }

  // Numerical: create histogram bins
  const nums = values.map(Number).filter((n) => !isNaN(n));
  const min = Math.min(...nums);
  const max = Math.max(...nums);
  const binCount = Math.min(10, Math.ceil(Math.sqrt(nums.length)));
  const binWidth = (max - min) / binCount || 1;
  const bins: Record<string, number> = {};
  for (let i = 0; i < binCount; i++) {
    const lo = min + i * binWidth;
    const hi = i === binCount - 1 ? max + 1 : min + (i + 1) * binWidth;
    const label = `${lo.toFixed(1)}–${(hi - (i === binCount - 1 ? 1 : 0)).toFixed(1)}`;
    bins[label] = nums.filter((n) => n >= lo && n < hi).length;
  }
  const distribution = Object.entries(bins).map(([label, count]) => ({
    label,
    count,
    percentage: count / total,
  }));
  return { column, type: 'numerical', distribution, underrepresented: [] };
}

// ===== CORRELATION =====
function encodeColumn(data: Record<string, string>[], column: string): number[] {
  const values = data.map((r) => r[column]);
  const unique = [...new Set(values.filter((v) => v !== '' && v != null))];
  const map = Object.fromEntries(unique.map((v, i) => [v, i]));
  return values.map((v) => (v != null && v !== '' ? map[v] ?? 0 : 0));
}

function pearsonCorrelation(x: number[], y: number[]): number {
  const n = x.length;
  if (n === 0) return 0;
  const meanX = x.reduce((a, b) => a + b, 0) / n;
  const meanY = y.reduce((a, b) => a + b, 0) / n;
  let num = 0, denX = 0, denY = 0;
  for (let i = 0; i < n; i++) {
    const dx = x[i] - meanX;
    const dy = y[i] - meanY;
    num += dx * dy;
    denX += dx * dx;
    denY += dy * dy;
  }
  const den = Math.sqrt(denX * denY);
  return den === 0 ? 0 : num / den;
}

export function calculateCorrelationMatrix(
  data: Record<string, string>[],
  columns: ColumnInfo[]
): CorrelationEntry[] {
  const selectedCols = columns.slice(0, 15); // Limit for performance
  const encoded: Record<string, number[]> = {};
  selectedCols.forEach((col) => {
    if (col.type === 'numerical') {
      encoded[col.name] = data.map((r) => {
        const v = Number(r[col.name]);
        return isNaN(v) ? 0 : v;
      });
    } else {
      encoded[col.name] = encodeColumn(data, col.name);
    }
  });

  const results: CorrelationEntry[] = [];
  for (let i = 0; i < selectedCols.length; i++) {
    for (let j = i; j < selectedCols.length; j++) {
      const val = i === j ? 1 : pearsonCorrelation(encoded[selectedCols[i].name], encoded[selectedCols[j].name]);
      results.push({ col1: selectedCols[i].name, col2: selectedCols[j].name, value: Math.round(val * 100) / 100 });
      if (i !== j) {
        results.push({ col1: selectedCols[j].name, col2: selectedCols[i].name, value: Math.round(val * 100) / 100 });
      }
    }
  }
  return results;
}

export function detectProxyBias(
  correlations: CorrelationEntry[],
  sensitiveColumns: string[],
  allColumns: ColumnInfo[]
): ProxyBias[] {
  const nonSensitive = allColumns.filter((c) => !sensitiveColumns.includes(c.name)).map((c) => c.name);
  const proxies: ProxyBias[] = [];

  for (const ns of nonSensitive) {
    for (const sc of sensitiveColumns) {
      const entry = correlations.find((c) => c.col1 === ns && c.col2 === sc);
      if (entry && Math.abs(entry.value) > 0.4) {
        proxies.push({
          column: ns,
          sensitiveColumn: sc,
          correlation: entry.value,
          explanation: `"${ns}" has a correlation of ${entry.value.toFixed(2)} with sensitive attribute "${sc}". This column may act as a proxy, introducing indirect bias even if "${sc}" is excluded from the model.`,
        });
      }
    }
  }
  return proxies;
}

// ===== FAIRNESS METRICS =====
export function calculateFairnessMetrics(
  data: Record<string, string>[],
  sensitiveColumns: string[],
  targetColumn: string | null,
  columns: ColumnInfo[]
): FairnessMetric[] {
  const metrics: FairnessMetric[] = [];

  for (const sc of sensitiveColumns) {
    const colInfo = columns.find((c) => c.name === sc);
    if (!colInfo || colInfo.type !== 'categorical') continue;

    const groups: Record<string, number> = {};
    data.forEach((row) => {
      const v = row[sc];
      if (v && v !== '') groups[v] = (groups[v] || 0) + 1;
    });
    const counts = Object.values(groups);
    if (counts.length < 2) continue;

    const total = counts.reduce((a, b) => a + b, 0);
    const percentages = counts.map((c) => c / total);
    const maxP = Math.max(...percentages);
    const minP = Math.min(...percentages);
    const expectedEqual = 1 / counts.length;

    // Demographic Parity Difference
    const dpd = maxP - minP;
    metrics.push({
      name: 'Demographic Parity Difference',
      column: sc,
      value: Math.round(dpd * 1000) / 1000,
      status: dpd < 0.1 ? 'good' : dpd < 0.3 ? 'moderate' : 'poor',
      explanation: `Measures the difference between the highest and lowest group representation in "${sc}". Value of ${dpd.toFixed(3)} means a ${(dpd * 100).toFixed(1)}% gap exists. Below 0.1 is considered fair.`,
    });

    // Representation Ratio
    const repRatio = minP / expectedEqual;
    metrics.push({
      name: 'Representation Ratio',
      column: sc,
      value: Math.round(repRatio * 1000) / 1000,
      status: repRatio > 0.8 ? 'good' : repRatio > 0.5 ? 'moderate' : 'poor',
      explanation: `Compares the smallest group in "${sc}" against expected equal distribution. Ratio of ${repRatio.toFixed(3)} means the smallest group is ${(repRatio * 100).toFixed(1)}% of expected size. Above 0.8 is fair.`,
    });
  }

  // Class Imbalance Score for target
  if (targetColumn) {
    const groups: Record<string, number> = {};
    data.forEach((row) => {
      const v = row[targetColumn];
      if (v && v !== '') groups[v] = (groups[v] || 0) + 1;
    });
    const counts = Object.values(groups);
    if (counts.length >= 2) {
      const imbalance = 1 - Math.min(...counts) / Math.max(...counts);
      metrics.push({
        name: 'Class Imbalance Score',
        column: targetColumn,
        value: Math.round(imbalance * 1000) / 1000,
        status: imbalance < 0.3 ? 'good' : imbalance < 0.6 ? 'moderate' : 'poor',
        explanation: `Measures how imbalanced the target variable "${targetColumn}" is. Score of ${imbalance.toFixed(3)} means ${(imbalance * 100).toFixed(1)}% imbalance. Below 0.3 is balanced.`,
      });
    }
  }

  return metrics;
}

// ===== SCORING =====
export function calculateOverallScore(
  metrics: FairnessMetric[],
  proxyBiases: ProxyBias[],
  distributions: DistributionResult[]
): number {
  let score = 100;

  // Deduct for poor metrics
  metrics.forEach((m) => {
    if (m.status === 'poor') score -= 12;
    else if (m.status === 'moderate') score -= 6;
  });

  // Deduct for proxy biases
  score -= proxyBiases.length * 8;

  // Deduct for underrepresented groups
  distributions.forEach((d) => {
    score -= d.underrepresented.length * 3;
  });

  return Math.max(0, Math.min(100, Math.round(score)));
}

// ===== RECOMMENDATIONS =====
export function generateRecommendations(
  distributions: DistributionResult[],
  metrics: FairnessMetric[],
  proxyBiases: ProxyBias[]
): Recommendation[] {
  const recs: Recommendation[] = [];

  // Underrepresentation
  distributions.forEach((d) => {
    if (d.underrepresented.length > 0) {
      const groups = d.underrepresented.map((u) => u.label).join(', ');
      recs.push({
        title: `Oversample underrepresented groups in "${d.column}"`,
        description: `Groups [${groups}] are below the 10% threshold. Consider oversampling these groups using SMOTE or random oversampling to improve representation balance.`,
        impact: 'high',
        type: 'oversample',
        targetColumn: d.column,
      });
    }
  });

  // Poor DPD
  metrics.filter((m) => m.name === 'Demographic Parity Difference' && m.status === 'poor').forEach((m) => {
    recs.push({
      title: `Re-weight samples for "${m.column}"`,
      description: `High demographic parity difference (${m.value.toFixed(3)}) detected. Apply sample re-weighting to give underrepresented groups higher importance during model training.`,
      impact: 'high',
      type: 'reweight',
      targetColumn: m.column,
    });
  });

  // Proxy bias
  proxyBiases.forEach((pb) => {
    recs.push({
      title: `Review or remove proxy column "${pb.column}"`,
      description: `"${pb.column}" has ${(pb.correlation * 100).toFixed(0)}% correlation with sensitive attribute "${pb.sensitiveColumn}". Consider removing it or applying decorrelation to prevent indirect discrimination.`,
      impact: 'high',
      type: 'remove',
      targetColumn: pb.column,
    });
  });

  // Class imbalance
  metrics.filter((m) => m.name === 'Class Imbalance Score' && m.status !== 'good').forEach((m) => {
    recs.push({
      title: `Balance target variable "${m.column}"`,
      description: `Class imbalance score of ${m.value.toFixed(3)} detected. Use techniques like SMOTE, random undersampling, or stratified sampling to balance the target distribution.`,
      impact: m.status === 'poor' ? 'high' : 'medium',
      type: 'undersample',
      targetColumn: m.column,
    });
  });

  if (recs.length === 0) {
    recs.push({
      title: 'Dataset appears fair',
      description: 'No significant bias issues detected. Continue monitoring as data evolves and consider regular audits.',
      impact: 'low',
      type: 'transform',
    });
  }

  return recs;
}

// ===== MITIGATION SIMULATION =====
export function simulateMitigation(
  data: Record<string, string>[],
  columns: ColumnInfo[],
  sensitiveColumns: string[],
  targetColumn: string | null,
  recommendation: Recommendation
): { mitigatedData: Record<string, string>[]; newScore: number } {
  let mitigated = [...data];

  if (recommendation.type === 'oversample' && recommendation.targetColumn) {
    const col = recommendation.targetColumn;
    const groups: Record<string, Record<string, string>[]> = {};
    mitigated.forEach((row) => {
      const v = row[col] || 'unknown';
      if (!groups[v]) groups[v] = [];
      groups[v].push(row);
    });
    const maxCount = Math.max(...Object.values(groups).map((g) => g.length));
    Object.values(groups).forEach((group) => {
      while (group.length < maxCount) {
        group.push({ ...group[group.length % group.length] });
      }
    });
    mitigated = Object.values(groups).flat();
  } else if (recommendation.type === 'undersample' && recommendation.targetColumn) {
    const col = recommendation.targetColumn;
    const groups: Record<string, Record<string, string>[]> = {};
    mitigated.forEach((row) => {
      const v = row[col] || 'unknown';
      if (!groups[v]) groups[v] = [];
      groups[v].push(row);
    });
    const minCount = Math.min(...Object.values(groups).map((g) => g.length));
    mitigated = Object.values(groups).flatMap((group) => group.slice(0, minCount));
  } else if (recommendation.type === 'remove' && recommendation.targetColumn) {
    const colToRemove = recommendation.targetColumn;
    mitigated = mitigated.map((row) => {
      const newRow = { ...row };
      delete newRow[colToRemove];
      return newRow;
    });
  }

  // Recalculate score
  const newColumns = analyzeColumns(mitigated, Object.keys(mitigated[0] || {}));
  const activeSensitive = sensitiveColumns.filter((sc) => newColumns.some((c) => c.name === sc));
  const dists = activeSensitive.map((sc) => {
    const ci = newColumns.find((c) => c.name === sc);
    return analyzeDistribution(mitigated, sc, ci?.type || 'categorical');
  });
  const corrs = calculateCorrelationMatrix(mitigated, newColumns);
  const proxies = detectProxyBias(corrs, activeSensitive, newColumns);
  const metrics = calculateFairnessMetrics(mitigated, activeSensitive, targetColumn, newColumns);
  const newScore = calculateOverallScore(metrics, proxies, dists);

  return { mitigatedData: mitigated, newScore };
}

// ===== MAIN ANALYSIS =====
export function runFullAnalysis(
  data: Record<string, string>[],
  columns: string[],
  sensitiveColumns: string[],
  targetColumn: string | null
): AnalysisResults {
  const columnInfos = analyzeColumns(data, columns);
  const totalMissing = columnInfos.reduce((sum, c) => sum + c.missingCount, 0);

  const summary: DatasetSummary = {
    totalRows: data.length,
    totalColumns: columns.length,
    missingValues: totalMissing,
    columns: columnInfos,
  };

  // Distribution for sensitive columns
  const distributions = sensitiveColumns.map((sc) => {
    const ci = columnInfos.find((c) => c.name === sc);
    return analyzeDistribution(data, sc, ci?.type || 'categorical');
  });

  // Correlation
  const correlations = calculateCorrelationMatrix(data, columnInfos);
  const proxyBiases = detectProxyBias(correlations, sensitiveColumns, columnInfos);

  // Fairness
  const fairnessMetrics = calculateFairnessMetrics(data, sensitiveColumns, targetColumn, columnInfos);

  // Score
  const overallScore = calculateOverallScore(fairnessMetrics, proxyBiases, distributions);
  const riskLevel: 'low' | 'moderate' | 'high' = overallScore >= 75 ? 'low' : overallScore >= 50 ? 'moderate' : 'high';

  // Most biased
  const poorMetrics = fairnessMetrics.filter((m) => m.status === 'poor');
  const mostBiasedColumn = poorMetrics.length > 0 ? poorMetrics[0].column : sensitiveColumns[0] || columns[0];

  // Most underrepresented
  let mostUnderrepresentedGroup = { column: '', group: '', percentage: 1 };
  distributions.forEach((d) => {
    d.underrepresented.forEach((u) => {
      if (u.percentage < mostUnderrepresentedGroup.percentage) {
        mostUnderrepresentedGroup = { column: d.column, group: u.label, percentage: u.percentage };
      }
    });
  });
  if (!mostUnderrepresentedGroup.column && distributions.length > 0 && distributions[0].distribution.length > 0) {
    const last = distributions[0].distribution[distributions[0].distribution.length - 1];
    mostUnderrepresentedGroup = { column: distributions[0].column, group: last.label, percentage: last.percentage };
  }

  // Recommendations
  const recommendations = generateRecommendations(distributions, fairnessMetrics, proxyBiases);

  return {
    summary,
    overallScore,
    riskLevel,
    distributions,
    correlations,
    proxyBiases,
    fairnessMetrics,
    recommendations,
    mostBiasedColumn,
    mostUnderrepresentedGroup,
    proxyBiasDetected: proxyBiases.length > 0,
  };
}
