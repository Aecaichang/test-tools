import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { Modal } from '@/components/common/Modal';
import { Send, Terminal, Copy, Check, Eye, FileCode, ArrowRight, Globe, Layers } from 'lucide-react';
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
          <div className="border border-border rounded-xl overflow-hidden bg-white h-[500px]">
            <iframe 
              srcDoc={data} 
              title="Response Preview" 
              className="w-full h-full border-none"
            />
          </div>
          <div className="space-y-2">
            <p className="text-xs font-bold text-muted-foreground uppercase">Source Code</p>
            <pre className="text-[11px] font-mono p-4 bg-secondary/30 rounded-xl overflow-x-auto whitespace-pre-wrap max-h-60 border border-border">
              {data}
            </pre>
          </div>
        </div>
      );
    }

    return (
      <pre className="text-xs font-mono p-6 bg-secondary/30 rounded-2xl overflow-x-auto whitespace-pre-wrap border border-border">
        {JSON.stringify(data, null, 2)}
      </pre>
    );
  };

  return (
    <div className="space-y-6 flex flex-col h-full">
      <Card className="h-full flex flex-col shadow-sm border-border/50 overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between shrink-0 bg-secondary/5 border-b border-border/30">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Send className="w-5 h-5 text-primary" />
              Execution Logs
            </CardTitle>
            <CardDescription>ผลลัพธ์จากการยิง API แต่ละรอบ</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {results.length > 0 && (
              <>
                <Button variant="outline" size="sm" onClick={onCopy} className="h-8 shadow-sm">
                  {copied ? <Check className="w-4 h-4 mr-2 text-green-500" /> : <Copy className="w-4 h-4 mr-2" />}
                  {copied ? 'Copied' : 'Copy All'}
                </Button>
                <Button variant="ghost" size="sm" onClick={onClear} className="h-8 hover:bg-destructive/10 hover:text-destructive">
                  Clear
                </Button>
              </>
            )}
          </div>
        </CardHeader>
        <CardContent className="flex-1 overflow-hidden flex flex-col p-4">
          {results.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground space-y-4 py-20">
              <div className="w-20 h-20 rounded-full bg-secondary/50 flex items-center justify-center animate-pulse">
                <Terminal className="w-10 h-10 text-primary/40" />
              </div>
              <div className="text-center space-y-1">
                <p className="text-lg font-semibold text-foreground/70">Waiting for execution...</p>
                <p className="text-sm">ผลลัพธ์จากการยิง API จะปรากฏที่นี่</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4 h-full overflow-y-auto pr-2 custom-scrollbar pb-6">
              {results.map((res) => (
                <div
                  key={`${res.index}-${res.timestamp}`}
                  className={cn(
                    "group relative overflow-hidden rounded-2xl border transition-all duration-300 animate-in slide-in-from-right-5",
                    res.success 
                      ? "bg-green-500/[0.02] border-green-500/10 hover:border-green-500/30" 
                      : "bg-destructive/[0.02] border-destructive/10 hover:border-destructive/30"
                  )}
                >
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <Badge 
                          variant={res.success ? 'success' : 'destructive'}
                          className="px-2 py-0 h-5 text-[10px] font-bold"
                        >
                          Round #{res.index}
                        </Badge>
                        <div className="flex items-center gap-1.5">
                          <span className={cn(
                            "text-xs font-bold",
                            res.success ? "text-green-600" : "text-destructive"
                          )}>
                            Status: {res.status}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <span className="text-[10px] font-medium text-muted-foreground/60">{res.timestamp}</span>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="w-7 h-7 rounded-lg hover:bg-secondary"
                            onClick={() => {
                              copyIndividual(res.data, `Response for Round #${res.index}`);
                              setCopyingIndex(res.index);
                              setTimeout(() => setCopyingIndex(null), 2000);
                            }}
                            title="Copy Response"
                          >
                            {copyingIndex === res.index ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="w-7 h-7 rounded-lg hover:bg-primary/10 hover:text-primary"
                            onClick={() => setViewingResult(res)}
                            title="View Details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                    
                    {/* Summary Row */}
                    <div className="flex items-start gap-2 mb-3 text-[10px] bg-secondary/20 p-2 rounded-lg border border-border/20">
                      <Badge variant="outline" className="text-[8px] h-3.5 px-1 bg-background shrink-0 mt-0.5">{res.request.method}</Badge>
                      <span className="text-muted-foreground break-all whitespace-pre-wrap flex-1 leading-relaxed">{res.request.url}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                       <div className="space-y-1">
                          <div className="flex items-center justify-between px-1">
                             <span className="text-[9px] font-bold text-muted-foreground/50 uppercase">Request</span>
                          </div>
                          <pre className="text-[9px] font-mono p-2 bg-background/50 rounded-lg border border-border/30 h-20 overflow-hidden line-clamp-5">
                            {JSON.stringify(res.request.payload, null, 2)}
                          </pre>
                       </div>
                       <div className="space-y-1">
                          <div className="flex items-center justify-between px-1">
                             <span className="text-[9px] font-bold text-muted-foreground/50 uppercase">Response</span>
                          </div>
                          <pre className="text-[9px] font-mono p-2 bg-background/50 rounded-lg border border-border/30 h-20 overflow-hidden line-clamp-5">
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
        title={`Round #${viewingResult?.index} - Full Details`}
        className="max-w-5xl"
      >
        {viewingResult && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-5 duration-300">
            {/* Top Bar Info */}
            <div className="flex items-stretch gap-4">
              <div className="flex-1 flex items-center justify-between bg-secondary/20 p-6 rounded-3xl border border-border shadow-sm">
                <div className="flex items-center gap-10">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest leading-none">Status</p>
                    <div className="flex items-center gap-2">
                      <div className={cn("w-2 h-2 rounded-full", viewingResult.success ? "bg-green-500" : "bg-destructive")} />
                      <p className={cn(
                        "text-2xl font-black",
                        viewingResult.success ? "text-green-600" : "text-destructive"
                      )}>{viewingResult.status}</p>
                    </div>
                  </div>
                  <div className="w-px h-10 bg-border/50" />
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest leading-none">Timestamp</p>
                    <p className="text-xl font-bold text-foreground/80">{viewingResult.timestamp}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                   <Button variant="outline" size="sm" onClick={() => copyIndividual(viewingResult.request, 'Full Request')} className="rounded-xl h-9">
                      <Copy className="w-3.5 h-3.5 mr-2" /> Request
                   </Button>
                   <Button variant="outline" size="sm" onClick={() => copyIndividual(viewingResult.data, 'Full Response')} className="rounded-xl h-9">
                      <Copy className="w-3.5 h-3.5 mr-2" /> Response
                   </Button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Request Side */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 px-1">
                  <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                    <Globe className="w-4 h-4" />
                  </div>
                  <h4 className="font-bold text-sm tracking-tight">Request Details</h4>
                </div>
                
                <div className="space-y-3">
                  <div className="p-4 bg-secondary/30 rounded-2xl border border-border/50 space-y-2">
                    <div className="flex items-center gap-2">
                       <Badge className="bg-primary/20 text-primary border-0 hover:bg-primary/30 tracking-tighter">{viewingResult.request.method}</Badge>
                       <code className="text-[11px] font-mono text-muted-foreground break-all">{viewingResult.request.url}</code>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 px-1 opacity-60">
                      <Layers className="w-3.5 h-3.5" />
                      <span className="text-[10px] font-black uppercase tracking-widest">Headers</span>
                    </div>
                    <pre className="text-[10px] font-mono p-4 bg-secondary/10 rounded-2xl border border-border/30 overflow-x-auto">
                      {JSON.stringify(viewingResult.request.headers, null, 2)}
                    </pre>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 px-1 opacity-60">
                      <FileCode className="w-3.5 h-3.5" />
                      <span className="text-[10px] font-black uppercase tracking-widest">Payload / Data</span>
                    </div>
                    <pre className="text-[10px] font-mono p-4 bg-secondary/10 rounded-2xl border border-border/30 overflow-x-auto min-h-[100px]">
                      {JSON.stringify(viewingResult.request.payload, null, 2)}
                    </pre>
                  </div>
                </div>
              </div>

              {/* Response Side */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 px-1">
                  <div className="p-1.5 rounded-lg bg-green-500/10 text-green-500">
                    <ArrowRight className="w-4 h-4" />
                  </div>
                  <h4 className="font-bold text-sm tracking-tight">Response Details</h4>
                </div>
                
                <div className="space-y-2">
                  {renderFormattedData(viewingResult.data)}
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
