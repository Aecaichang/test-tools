import * as React from 'react';
import { useState, useEffect } from 'react';
import { Terminal, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

// Sub-components
import { TesterPanel } from './components/TesterPanel';
import { ResultsPanel } from './components/ResultsPanel';
import { HistoryPanel } from './components/HistoryPanel';
import { ExecutionControls } from './components/ExecutionControls';

// Custom Hook
import { useLoopApi } from './hooks/useLoopApi';
import { ApiLog } from './types';

export const LoopApiView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'tester' | 'history'>('tester');
  const [copied, setCopied] = useState(false);

  const {
    // Tester
    curlInput, setCurlInput,
    loopCount, setLoopCount,
    parsedData, fieldConfigs,
    results, isRunning,
    progress, error,
    editableHeaders, setEditableHeaders,
    handleParse, executeLoop,
    updateFieldConfig, removeFieldConfig, clearResults,
    
    // History
    historyItems, isLoadingHistory,
    fetchHistory, deleteHistoryItem,
    deleteAllHistory, loadHistoryItem
  } = useLoopApi();

  useEffect(() => {
    if (activeTab === 'history') {
      fetchHistory();
    }
  }, [activeTab, fetchHistory]);

  const onCopy = () => {
    const text = JSON.stringify(results, null, 2);
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLoadHistory = (item: ApiLog) => {
    loadHistoryItem(item);
    setActiveTab('tester');
  };

  return (
    <div className="container mx-auto p-4 md:p-8 space-y-8 max-w-6xl animate-in fade-in duration-700">
      {/* Header & Tabs */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight text-foreground">
            Loop API Tester
          </h1>
          <p className="text-muted-foreground font-medium">ยิง Loop API เพื่อสร้างข้อมูลทดสอบด้วยการ Config payload และ Query String ได้ตามต้องการ</p>
        </div>
        
        <div className="flex items-center bg-secondary/30 p-1 rounded-xl border border-border/50">
          <button
            onClick={() => setActiveTab('tester')}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
              activeTab === 'tester' ? "bg-background text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Terminal className="w-4 h-4" />
            Tester
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
              activeTab === 'history' ? "bg-background text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Clock className="w-4 h-4" />
            History
          </button>
        </div>
      </div>

      <div className="animate-in fade-in slide-in-from-top-4 duration-500">
        {activeTab === 'tester' ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
            {/* Left Side: Configuration */}
            <div className="space-y-6 flex flex-col">
              <TesterPanel 
                curlInput={curlInput}
                setCurlInput={setCurlInput}
                onParse={handleParse}
                error={error}
                isRunning={isRunning}
                progress={progress}
                parsedData={parsedData}
                editableHeaders={editableHeaders}
                setEditableHeaders={setEditableHeaders}
                fieldConfigs={fieldConfigs}
                updateFieldConfig={updateFieldConfig}
                removeFieldConfig={removeFieldConfig}
              />
              
              <ExecutionControls 
                loopCount={loopCount}
                setLoopCount={setLoopCount}
                isRunning={isRunning}
                progress={progress}
                executeLoop={executeLoop}
                parsedData={parsedData}
              />
            </div>

            {/* Right Side: Results */}
            <div className="space-y-6 flex flex-col">
              <ResultsPanel 
                results={results}
                onClear={clearResults}
                onCopy={onCopy}
                copied={copied}
              />
            </div>
          </div>
        ) : (
          <HistoryPanel 
            historyItems={historyItems}
            isLoading={isLoadingHistory}
            onLoad={handleLoadHistory}
            onDelete={deleteHistoryItem}
            onDeleteAll={deleteAllHistory}
          />
        )}
      </div>
    </div>
  );
};
