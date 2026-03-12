import * as React from 'react';
import { useState, useEffect } from 'react';
import { Terminal, Clock, Zap } from 'lucide-react';
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
    <div className="relative min-h-screen bg-background overflow-x-hidden">
      {/* Background Decorations */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] -z-10 translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-secondary/10 rounded-full blur-[150px] -z-10 -translate-x-1/3 translate-y-1/3" />
      
      <div className="container mx-auto p-4 md:p-12 space-y-12 max-w-7xl animate-in fade-in duration-700 relative z-10">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-border/10 pb-12">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-[11px] font-black uppercase tracking-[0.2em] border border-primary/20 shadow-sm">
              <Zap className="w-3 h-3 fill-current" />
              Developer Suite v2.0
            </div>
            <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-foreground bg-gradient-to-br from-foreground via-foreground to-foreground/40 bg-clip-text text-transparent">
              Loop <span className="text-primary">API</span> Tester
            </h1>
            <p className="text-muted-foreground font-medium text-xl max-w-2xl leading-relaxed opacity-80">
              ยิง Loop API เพื่อสร้างข้อมูลทดสอบด้วยการ Config payload และ Query String ได้ตามต้องการ
            </p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 px-2">
            <TabsList className="bg-secondary/40 p-1.5 rounded-2xl h-auto self-start border border-border/50 backdrop-blur-sm shadow-inner group">
              <TabsTrigger 
                value="tester" 
                className="rounded-xl px-8 py-3 text-sm font-black transition-all data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-lg tracking-tight uppercase italic"
              >
                Engine Tester
              </TabsTrigger>
              <TabsTrigger 
                value="history" 
                className="rounded-xl px-8 py-3 text-sm font-black transition-all data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-lg tracking-tight uppercase italic"
              >
                Launch History
              </TabsTrigger>
            </TabsList>
            
            {/* Real-time status badge */}
            <div className="flex items-center gap-3 bg-background border border-border px-4 py-2 rounded-2xl shadow-sm">
               <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
               <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">System Online</span>
            </div>
          </div>

          <TabsContent value="tester" className="mt-0 animate-in fade-in slide-in-from-top-6 duration-700">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-stretch">
              <div className="space-y-8 flex flex-col">
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

              <div className="flex flex-col h-full lg:sticky lg:top-8 max-h-[calc(100vh-8rem)]">
                <ResultsPanel
                  results={results}
                  onClear={clearResults}
                  onCopy={onCopy}
                  copied={copied}
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="history" className="mt-0 animate-in fade-in slide-in-from-top-6 duration-700">
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
