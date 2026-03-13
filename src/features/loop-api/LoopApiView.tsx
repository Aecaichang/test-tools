import * as React from 'react';
import { useEffect } from 'react';
import { Zap, History, LayoutDashboard, Settings2, Activity, Gauge, Archive } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/common/Card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { useLoopApi } from './hooks/useLoopApi';
import { TesterPanel } from './components/TesterPanel';
import { ResultsPanel } from './components/ResultsPanel';
import { ExecutionControls } from './components/ExecutionControls';
import { HistoryPanel } from './components/HistoryPanel';

export const LoopApiView: React.FC = () => {
  const [activeTab, setActiveTab] = React.useState('tester');

  const {
    curlInput, setCurlInput,
    loopCount, setLoopCount,
    parsedData, fieldConfigs,
    results, isRunning,
    progress, error,
    editableHeaders, setEditableHeaders,
    handleParse, executeLoop,
    updateFieldConfig, removeFieldConfig, clearResults,
    useProxy, setUseProxy,
    historyItems, isLoadingHistory,
    fetchHistory, deleteHistoryItem,
    deleteAllHistory, loadHistoryItem
  } = useLoopApi();

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  return (
    <div className="min-h-screen bg-[#f8fafc] transition-colors duration-500">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="mx-auto max-w-[1600px] space-y-6 p-4 sm:p-6 md:space-y-8 md:p-8">
          <header className="space-y-5">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
              <div className="space-y-3">
                <div className="inline-flex items-center gap-2.5 rounded-xl border border-primary/15 bg-primary/5 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-primary">
                  <Zap className="h-3.5 w-3.5 fill-current" />
                  Network Automation Engine
                </div>
                <h1 className="text-3xl font-black tracking-tight text-foreground sm:text-4xl md:text-5xl">
                  Loop API <span className="text-primary italic">Tester</span>
                </h1>
                <p className="max-w-3xl text-sm font-medium leading-relaxed text-muted-foreground sm:text-base">
                  ยิง API ซ้ำพร้อม Smart Injection และดูผลลัพธ์แบบเรียลไทม์ในหน้าเดียว เหมาะกับงาน data seeding, load check และ regression test
                </p>
              </div>

              <TabsList className="grid h-12 w-full grid-cols-2 rounded-xl border border-border/60 bg-secondary/30 p-1 xl:w-[360px]">
                <TabsTrigger
                  value="tester"
                  className="gap-2 rounded-lg text-xs font-bold uppercase tracking-wider data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm"
                >
                  <LayoutDashboard className="h-4 w-4" />
                  Workbench
                </TabsTrigger>
                <TabsTrigger
                  value="history"
                  className="gap-2 rounded-lg text-xs font-bold uppercase tracking-wider data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm"
                >
                  <History className="h-4 w-4" />
                  Archives
                </TabsTrigger>
              </TabsList>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <Card className="border-primary/20 bg-primary/[0.03]">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-sm font-bold">
                    <Gauge className="h-4 w-4 text-primary" />
                    Execution Status
                  </CardTitle>
                  <CardDescription>สถานะการยิง API ปัจจุบัน</CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-sm font-semibold text-foreground">{isRunning ? 'Running...' : 'Idle'}</p>
                </CardContent>
              </Card>

              <Card className="border-border/60 bg-card/80">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-sm font-bold">
                    <Activity className="h-4 w-4 text-primary" />
                    Results
                  </CardTitle>
                  <CardDescription>จำนวนผลลัพธ์ในรอบล่าสุด</CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-sm font-semibold text-foreground">{results.length} items</p>
                </CardContent>
              </Card>

              <Card className="border-border/60 bg-card/80">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-sm font-bold">
                    <Archive className="h-4 w-4 text-primary" />
                    History
                  </CardTitle>
                  <CardDescription>ข้อมูลย้อนหลังที่บันทึกไว้</CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-sm font-semibold text-foreground">{historyItems.length} logs</p>
                </CardContent>
              </Card>
            </div>

            <Card className="border-dashed border-primary/25 bg-primary/[0.02]">
              <CardContent className="space-y-1 py-4 text-sm text-muted-foreground">
                <p className="font-semibold text-foreground">Quick Start</p>
                <p>1. วาง cURL และกด Parse</p>
                <p>2. ปรับ payload/header ตามต้องการ</p>
                <p>3. ตั้งจำนวน loop แล้วกด Execute</p>
              </CardContent>
            </Card>
          </header>

          <main>
            <TabsContent value="tester" className="mt-0 border-none p-0 outline-none focus:outline-none focus-visible:outline-none">
              <div className="px-1">
                <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12">
                  <div className="space-y-8 lg:col-span-12 xl:col-span-7">
                    <div className="flex items-center gap-3">
                      <div className="h-6 w-1.5 rounded-full bg-primary" />
                      <h2 className="flex items-center gap-2 text-xl font-black tracking-tight text-foreground">
                        <Settings2 className="h-5 w-5 text-muted-foreground/40" />
                        Configuration
                      </h2>
                    </div>

                    <TesterPanel
                      curlInput={curlInput}
                      setCurlInput={setCurlInput}
                      onParse={handleParse}
                      error={error}
                      isRunning={isRunning}
                      parsedData={parsedData}
                      editableHeaders={editableHeaders}
                      setEditableHeaders={setEditableHeaders}
                      fieldConfigs={fieldConfigs}
                      updateFieldConfig={updateFieldConfig}
                      removeFieldConfig={removeFieldConfig}
                      useProxy={useProxy}
                      setUseProxy={setUseProxy}
                    />
                  </div>

                  <div className="space-y-8 lg:col-span-12 xl:col-span-5">
                    <div className="xl:sticky xl:top-24 space-y-8">
                      <div className="flex items-center gap-3">
                        <div className="h-6 w-1.5 rounded-full bg-primary" />
                        <h2 className="flex items-center gap-2 text-xl font-black tracking-tight text-foreground">
                          <Activity className="h-5 w-5 text-muted-foreground/40" />
                          Execution
                        </h2>
                      </div>

                      <ExecutionControls
                        loopCount={loopCount}
                        setLoopCount={setLoopCount}
                        onExecute={executeLoop}
                        onClear={clearResults}
                        isRunning={isRunning}
                        progress={progress}
                        canExecute={!!parsedData}
                      />

                      <ResultsPanel results={results} />
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="history" className="mt-0 border-none p-0 focus:outline-none focus-visible:outline-none">
              <div className="px-1">
                <HistoryPanel
                  historyItems={historyItems}
                  isLoading={isLoadingHistory}
                  onLoad={loadHistoryItem}
                  onDelete={deleteHistoryItem}
                  onDeleteAll={deleteAllHistory}
                />
              </div>
            </TabsContent>
          </main>
        </div>
      </Tabs>
    </div>
  );
};
