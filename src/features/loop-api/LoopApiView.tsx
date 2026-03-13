import * as React from 'react';
import { useState, useEffect } from 'react';
import { Zap } from 'lucide-react';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

// Sub-components
import { TesterPanel } from './components/TesterPanel';
import { ResultsPanel } from './components/ResultsPanel';
import { HistoryPanel } from './components/HistoryPanel';
import { ExecutionControls } from './components/ExecutionControls';

// Custom Hook
import { useLoopApi } from './hooks/useLoopApi';
import { ApiLog } from './types';

export const LoopApiView: React.FC = () => {
  const [activeTab, setActiveTab] = useState('tester');
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
    useProxy, setUseProxy,
    
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
    <div className="relative min-h-screen bg-background overflow-x-hidden w-full">
      {/* Background Decorations */}
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-primary/[0.03] rounded-full blur-[150px] -z-10 translate-x-1/2 -translate-y-1/2 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[800px] h-[800px] bg-secondary/[0.05] rounded-full blur-[150px] -z-10 -translate-x-1/3 translate-y-1/3 pointer-events-none" />
      
      <div className="w-full max-w-[1400px] mx-auto p-4 md:p-12 space-y-12 animate-in fade-in duration-1000 relative z-10">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-border/20 pb-16">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-primary/10 text-primary text-[11px] font-black uppercase tracking-[0.2em] border border-primary/20 shadow-sm">
              <Zap className="w-3.5 h-3.5 fill-current" />
              Developer Tool Suite
            </div>
            <h1 className="text-6xl md:text-8xl font-black tracking-tighter text-foreground leading-none">
              Loop <span className="text-primary">API</span> Tester
            </h1>
            <p className="text-muted-foreground font-medium text-xl max-w-2xl leading-relaxed opacity-70">
              ยิง Loop API เพื่อสร้างข้อมูลทดสอบด้วยการ Config payload และ Query String ได้ตามต้องการ
            </p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-12">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-8 w-full">
            <TabsList className="bg-secondary/20 p-2 rounded-[1.5rem] h-auto self-start border border-border shadow-inner backdrop-blur-md">
              <TabsTrigger 
                value="tester" 
                className="rounded-2xl px-10 py-4 text-sm font-black transition-all data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-xl tracking-tight uppercase italic hover:bg-background/50"
              >
                Engine Tester
              </TabsTrigger>
              <TabsTrigger 
                value="history" 
                className="rounded-2xl px-10 py-4 text-sm font-black transition-all data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-xl tracking-tight uppercase italic hover:bg-background/50"
              >
                Launch History
              </TabsTrigger>
            </TabsList>
            
            {/* Real-time status badge */}
            <div className="flex items-center gap-4 bg-background border border-border px-6 py-3 rounded-2xl shadow-xl shadow-black/5 animate-pulse-subtle">
               <div className="w-2.5 h-2.5 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
               <span className="text-[11px] font-black uppercase tracking-[0.1em] text-muted-foreground">Network Engine Active</span>
            </div>
          </div>

          <TabsContent value="tester" className="w-full mt-0">
            <div className="flex flex-col lg:flex-row gap-8 items-stretch w-full">
              <div className="space-y-8 flex flex-col w-full lg:w-1/2">
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
                  useProxy={useProxy}
                  setUseProxy={setUseProxy}
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

              <div className="w-full lg:w-1/2">
                <div className="lg:sticky lg:top-24">
                  <ResultsPanel
                    results={results}
                    onClear={clearResults}
                    onCopy={onCopy}
                    copied={copied}
                  />
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="history" className="w-full mt-0">
            <HistoryPanel
              historyItems={historyItems}
              isLoading={isLoadingHistory}
              onLoad={handleLoadHistory}
              onDelete={deleteHistoryItem}
              onDeleteAll={deleteAllHistory}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};
