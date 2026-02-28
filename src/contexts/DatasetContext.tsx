import React, { createContext, useContext, useState, ReactNode } from 'react';
import { AnalysisResults } from '@/lib/bias-analysis';

export interface HistoryEntry {
  id: string;
  fileName: string;
  timestamp: Date;
  overallScore: number;
  riskLevel: 'low' | 'moderate' | 'high';
  label?: string;
}

interface DatasetState {
  rawData: Record<string, string>[] | null;
  columns: string[] | null;
  sensitiveColumns: string[];
  targetColumn: string | null;
  analysisResults: AnalysisResults | null;
  fileName: string | null;
  isAnalyzing: boolean;
  history: HistoryEntry[];
}

interface DatasetContextType extends DatasetState {
  setRawData: (data: Record<string, string>[], columns: string[], fileName: string) => void;
  setSensitiveColumns: (cols: string[]) => void;
  setTargetColumn: (col: string | null) => void;
  setAnalysisResults: (results: AnalysisResults) => void;
  setIsAnalyzing: (v: boolean) => void;
  addHistoryEntry: (entry: HistoryEntry) => void;
  reset: () => void;
}

const DatasetContext = createContext<DatasetContextType | null>(null);

export function DatasetProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<DatasetState>({
    rawData: null,
    columns: null,
    sensitiveColumns: [],
    targetColumn: null,
    analysisResults: null,
    fileName: null,
    isAnalyzing: false,
    history: [],
  });

  const setRawData = (data: Record<string, string>[], columns: string[], fileName: string) =>
    setState((s) => ({ ...s, rawData: data, columns, fileName, analysisResults: null }));

  const setSensitiveColumns = (cols: string[]) =>
    setState((s) => ({ ...s, sensitiveColumns: cols }));

  const setTargetColumn = (col: string | null) =>
    setState((s) => ({ ...s, targetColumn: col }));

  const setAnalysisResults = (results: AnalysisResults) =>
    setState((s) => ({ ...s, analysisResults: results, isAnalyzing: false }));

  const setIsAnalyzing = (v: boolean) =>
    setState((s) => ({ ...s, isAnalyzing: v }));

  const addHistoryEntry = (entry: HistoryEntry) =>
    setState((s) => ({ ...s, history: [...s.history, entry] }));

  const reset = () =>
    setState((s) => ({ ...s, rawData: null, columns: null, sensitiveColumns: [], targetColumn: null, analysisResults: null, fileName: null }));

  return (
    <DatasetContext.Provider
      value={{ ...state, setRawData, setSensitiveColumns, setTargetColumn, setAnalysisResults, setIsAnalyzing, addHistoryEntry, reset }}
    >
      {children}
    </DatasetContext.Provider>
  );
}

export function useDataset() {
  const ctx = useContext(DatasetContext);
  if (!ctx) throw new Error('useDataset must be used within DatasetProvider');
  return ctx;
}
