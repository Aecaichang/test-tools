import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { Modal } from '@/components/common/Modal';
import { Send, Terminal, Copy, Check, Eye, FileCode, ArrowRight, Globe, Layers, Activity, Trash2 } from 'lucide-react';
import { RequestResult } from '../types';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface ResultsPanelProps {
  results: RequestResult[];
  onClear: () => void;
  onCopy: () => void;
  copied: boolean;
}

export const ResultsPanel: React.FC<ResultsPanelProps> = ({
  results,
  onClear,
  onCopy,
  copied,
}) => {
  const [viewingResult, setViewingResult] = useState<RequestResult | null>(null);
  const [copyingIndex, setCopyingIndex] = useState<number | null>(null);

  const copyIndividual = (data: unknown, label: string) => {
    const text = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
    navigator.clipboard.writeText(text);
    toast.success(`Copied ${label}`);
  };

  const renderFormattedData = (data: unknown) => {
    if (typeof data === 'string' && (data.includes('<!doctype html>') || data.includes('<html'))) {
      return (
        <div className="space-y-4">
          <Badge variant="outline" className="mb-2">HTML Content Detected</Badge>
          <div className="border border-border rounded-xl overflow-hidden bg-white h-[500px] shadow-inner">
            <iframe 
              srcDoc={data} 
              title="Response Preview" 
              className="w-full h-full border-none"
            />
          </div>
          <div className="space-y-2">
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-2">Source Code</p>
            <pre className="text-[11px] font-mono p-5 bg-secondary/30 rounded-2xl overflow-x-auto whitespace-pre-wrap max-h-[300px] border border-border/50 custom-scrollbar shadow-sm">
              {data}
            </pre>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-2">
        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-2">Data Response</p>
        <pre className="text-[11px] font-mono p-6 bg-[#0f1117] text-zinc-100 rounded-[2rem] overflow-x-auto whitespace-pre-wrap border border-white/5 shadow-2xl custom-scrollbar max-h-[600px]">
          {JSON.stringify(data, null, 2)}
        </pre>
      </div>
    );
  };

  return (
    <div className="space-y-6 flex flex-col h-full h-min-[700px]">
      <Card className="h-full flex flex-col shadow-xl border-border/50 overflow-hidden rounded-[2rem] bg-gradient-to-b from-background to-secondary/10">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between shrink-0 bg-background/50 backdrop-blur-md border-b border-border/30 p-8 gap-4">
          <div className="space-y-1.5">
            <CardTitle className="flex items-center gap-3 text-2xl font-black italic">
              <div className="p-2.5 rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
                <Activity className="w-5 h-5" />
              </div>
              Execution Logs
            </CardTitle>
            <CardDescription className="font-medium text-sm">เรียลไทม์ล็อคของการเรียกใช้ API</CardDescription>
          </div>
          <div className="flex items-center gap-3 self-end sm:self-center">
            {results.length > 0 && (
              <>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={onCopy} 
                  className="h-10 px-5 shadow-sm rounded-xl font-bold gap-2 active:scale-95"
                >
                  {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                  {copied ? 'Copied' : 'Copy All JSON'}
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={onClear} 
                  className="h-10 w-10 text-destructive hover:bg-destructive/10 rounded-xl"
                  title="Clear results"
                >
                  <Trash2 className="w-5 h-5" />
                </Button>
              </>
            )}
          </div>
        </CardHeader>
        <CardContent className="flex-1 overflow-hidden flex flex-col p-0">
          {results.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-10 min-h-[400px]">
              <div className="relative mb-8">
                 <div className="absolute inset-0 bg-primary/10 rounded-full blur-3xl animate-pulse scale-150" />
                 <div className="relative w-32 h-32 rounded-full border-2 border-dashed border-primary/20 flex items-center justify-center bg-background/50 backdrop-blur-sm">
                   <Terminal className="w-12 h-12 text-primary/30" />
                 </div>
              </div>
              <div className="text-center space-y-2 max-w-xs">
                <p className="text-xl font-black text-foreground/80 tracking-tight">Ready for Execution</p>
                <p className="text-sm font-medium leading-relaxed opacity-60">กดปุ่ม Parse CURL และ Run Loop เพื่อเริ่มดูผลลัพธ์แบบเรียลไทม์ที่นี่</p>
              </div>
            </div>
          ) : (
            <div className="p-6 space-y-6 h-full overflow-y-auto custom-scrollbar pb-10">
              {results.slice().reverse().map((res) => (
                <div
                  key={`${res.index}-${res.timestamp}`}
                  className={cn(
                    "group relative overflow-hidden rounded-[1.5rem] border-2 transition-all duration-500 animate-in slide-in-from-right-8",
                    res.success 
                      ? "bg-white/50 border-green-500/20 hover:border-green-500/40 hover:shadow-lg hover:shadow-green-500/5" 
                      : "bg-white/50 border-destructive/20 hover:border-destructive/40 hover:shadow-lg hover:shadow-destructive/5"
                  )}
                >
                  {/* Decorative indicator */}
                  <div className={cn(
                    "absolute left-0 top-0 bottom-0 w-1.5",
                    res.success ? "bg-green-500" : "bg-destructive"
                  )} />

                  <div className="p-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5">
                      <div className="flex items-center gap-4">
                        <div className={cn(
                           "w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg shadow-sm border",
                           res.success ? "bg-green-50 border-green-200 text-green-700" : "bg-destructive/5 border-destructive/20 text-destructive"
                        )}>
                           {res.index}
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                             <p className={cn(
                                "text-lg font-black leading-none",
                                res.success ? "text-green-700" : "text-destructive"
                             )}>
                               Status: {res.status}
                             </p>
                             {res.success ? <Badge variant="success" className="h-5 px-1.5 font-bold">SUCCESS</Badge> : <Badge variant="destructive" className="h-5 px-1.5 font-bold">FAILED</Badge>}
                          </div>
                          <div className="flex items-center gap-2 opacity-60">
                             <Globe className="w-3 h-3" />
                             <span className="text-[10px] font-bold tracking-widest uppercase">{res.timestamp}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-2 group-hover:translate-x-0">
                        <Button 
                          variant="secondary" 
                          size="sm" 
                          className="h-9 px-4 rounded-xl font-bold gap-2"
                          onClick={() => {
                            copyIndividual(res.data, `#${res.index} Response`);
                            setCopyingIndex(res.index);
                            setTimeout(() => setCopyingIndex(null), 2000);
                          }}
                        >
                          {copyingIndex === res.index ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                          Copy JSON
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="w-10 h-10 rounded-xl hover:bg-primary/10 hover:text-primary transition-colors bg-secondary/30 border border-border/20"
                          onClick={() => setViewingResult(res)}
                        >
                          <Eye className="w-5 h-5" />
                        </Button>
                      </div>
                    </div>
                    
                    {/* URL Card */}
                    <div className="mb-5 bg-secondary/30 p-4 rounded-2xl border border-border/50 group/url overflow-hidden">
                       <div className="flex items-center gap-2 mb-2">
                          <Badge className="bg-primary/20 text-primary border-0 rounded-lg tracking-widest font-black h-5 px-2 text-[10px]">{res.request.method}</Badge>
                          <p className="text-[10px] font-black text-muted-foreground/50 uppercase tracking-widest">Target URL</p>
                       </div>
                       <p className="text-xs font-mono break-all leading-relaxed font-semibold text-foreground/70">{res.request.url}</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                       <div className="space-y-2">
                          <div className="flex items-center gap-2 px-1">
                             <div className="w-1.5 h-1.5 rounded-full bg-primary/40" />
                             <span className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest">Payload Sent</span>
                          </div>
                          <pre className="text-[10px] font-mono p-4 bg-background/80 rounded-2xl border border-border/30 h-28 overflow-hidden line-clamp-6 shadow-inner italic">
                            {JSON.stringify(res.request.payload, null, 2)}
                          </pre>
                       </div>
                       <div className="space-y-2">
                          <div className="flex items-center gap-2 px-1">
                             <div className="w-1.5 h-1.5 rounded-full bg-green-500/40" />
                             <span className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest">API Response</span>
                          </div>
                          <pre className="text-[10px] font-mono p-4 bg-background/80 rounded-2xl border border-border/30 h-28 overflow-hidden line-clamp-6 shadow-inner">
                            {typeof res.data === 'string' ? res.data : JSON.stringify(res.data, null, 2)}
                          </pre>
                       </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* View Detailed Modal */}
      <Modal
        isOpen={viewingResult !== null}
        onClose={() => setViewingResult(null)}
        title={`Round #${viewingResult?.index} - Deep Analysis`}
        className="max-w-6xl overflow-hidden p-0 rounded-[2.5rem]"
      >
        {viewingResult && (
          <div className="flex flex-col h-[85vh]">
            <div className="flex-1 overflow-y-auto p-10 space-y-10 custom-scrollbar">
              {/* Status Header */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className={cn(
                  "p-8 rounded-[2rem] border-2 shadow-sm flex flex-col justify-center gap-1",
                  viewingResult.success ? "bg-green-50 border-green-200" : "bg-destructive/5 border-destructive/10"
                )}>
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Response Status</p>
                  <div className="flex items-center gap-3">
                    <div className={cn("w-3 h-3 rounded-full animate-pulse", viewingResult.success ? "bg-green-500" : "bg-destructive")} />
                    <h3 className={cn("text-4xl font-black italic", viewingResult.success ? "text-green-700" : "text-destructive")}>
                      {viewingResult.status}
                    </h3>
                  </div>
                </div>

                <div className="p-8 rounded-[2rem] border border-border bg-secondary/10 flex flex-col justify-center gap-1">
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Timestamp</p>
                  <h3 className="text-2xl font-black text-foreground/80">{viewingResult.timestamp}</h3>
                </div>

                <div className="p-8 rounded-[2rem] border border-border bg-secondary/10 flex flex-col justify-center gap-4">
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-[-10px]">Quick Actions</p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => copyIndividual(viewingResult.request, 'Full Request')} className="flex-1 rounded-xl h-10 font-bold gap-2">
                        <Copy className="w-3.5 h-3.5 text-primary" /> Request
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => copyIndividual(viewingResult.data, 'Full Response')} className="flex-1 rounded-xl h-10 font-bold gap-2">
                        <Copy className="w-3.5 h-3.5 text-green-600" /> Response
                    </Button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                {/* Request Side */}
                <div className="space-y-6">
                  <div className="flex items-center gap-3 px-2">
                    <div className="p-2 rounded-xl bg-primary/10 text-primary">
                      <Globe className="w-5 h-5" />
                    </div>
                    <h4 className="font-black text-xl tracking-tight italic">Request Payload</h4>
                  </div>
                  
                  <div className="space-y-6">
                    <div className="p-6 bg-secondary/20 rounded-[2rem] border border-border shadow-inner space-y-4">
                       <div>
                          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2 opacity-50">API Endpoint</p>
                          <div className="flex items-center gap-3 flex-wrap">
                            <Badge className="bg-primary text-primary-foreground border-0 font-black px-3 py-1 text-xs">{viewingResult.request.method}</Badge>
                            <code className="text-xs font-mono font-bold text-foreground/70 break-all bg-background px-3 py-1.5 rounded-xl border border-border/50">{viewingResult.request.url}</code>
                          </div>
                       </div>

                       <div className="space-y-3">
                          <div className="flex items-center gap-2 opacity-60">
                            <Layers className="w-4 h-4" />
                            <span className="text-[11px] font-black uppercase tracking-widest">Headers</span>
                          </div>
                          <pre className="text-[11px] font-mono p-6 bg-background rounded-3xl border border-border/50 overflow-x-auto shadow-sm max-h-[200px]">
                            {JSON.stringify(viewingResult.request.headers, null, 2)}
                          </pre>
                       </div>

                       <div className="space-y-3">
                          <div className="flex items-center gap-2 opacity-60">
                            <FileCode className="w-4 h-4" />
                            <span className="text-[11px] font-black uppercase tracking-widest">Data Body</span>
                          </div>
                          <pre className="text-[11px] font-mono p-6 bg-background rounded-3xl border border-border/50 overflow-x-auto min-h-[150px] shadow-sm italic">
                            {JSON.stringify(viewingResult.request.payload, null, 2)}
                          </pre>
                       </div>
                    </div>
                  </div>
                </div>

                {/* Response Side */}
                <div className="space-y-6">
                  <div className="flex items-center gap-3 px-2">
                    <div className="p-2 rounded-xl bg-green-500/10 text-green-500">
                      <ArrowRight className="w-5 h-5" />
                    </div>
                    <h4 className="font-black text-xl tracking-tight italic">API Full Response</h4>
                  </div>
                  
                  <div className="space-y-4">
                    {renderFormattedData(viewingResult.data)}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Modal Footer */}
            <div className="p-8 border-t border-border bg-secondary/5 flex justify-end">
               <Button onClick={() => setViewingResult(null)} className="px-10 h-12 rounded-2xl font-black text-sm shadow-xl shadow-primary/10">
                  CLOSE ANALYSIS
               </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
