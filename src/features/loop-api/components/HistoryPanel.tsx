import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { Clock, History, RotateCw, Trash2, Database, ExternalLink, ChevronRight, Search } from 'lucide-react';
import { ApiLog } from '../types';
import { ConfirmModal } from '@/components/common/ConfirmModal';
import { cn } from '@/lib/utils';

interface HistoryPanelProps {
  historyItems: ApiLog[];
  isLoading: boolean;
  onLoad: (item: ApiLog) => void;
  onDelete: (id: string) => void;
  onDeleteAll: () => void;
}

export const HistoryPanel: React.FC<HistoryPanelProps> = ({
  historyItems,
  isLoading,
  onLoad,
  onDelete,
  onDeleteAll,
}) => {
  const [isConfirmDeleteAllOpen, setIsConfirmDeleteAllOpen] = React.useState(false);

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-5 duration-700">
      <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-6 px-2">
        <div className="space-y-1.5">
           <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary text-[10px] font-black uppercase tracking-widest border border-border">
              Persistence Engine
           </div>
           <h2 className="text-3xl font-black tracking-tight text-foreground flex items-center gap-4 italic">
             <div className="p-2 rounded-2xl bg-primary/10 text-primary">
                <History className="w-8 h-8" />
             </div>
             Request History
           </h2>
           <p className="text-muted-foreground font-medium text-lg max-w-lg">
             ดึงข้อมูลประวัติการยิง API 20 รายการล่าสุดจากระบบจัดเก็บ
           </p>
        </div>
        
        {historyItems.length > 0 && !isLoading && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setIsConfirmDeleteAllOpen(true)}
            className="h-10 gap-2 px-5 shadow-sm rounded-xl text-destructive hover:bg-destructive/10 font-bold"
          >
            <Trash2 className="w-4 h-4" />
            Delete Entire History
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="h-64 rounded-[2rem] border-dashed animate-pulse bg-secondary/20" />
          ))
        ) : (
          historyItems.map((item) => (
            <Card key={item.id} className="p-0 rounded-[2.5rem] border-border shadow-md hover:shadow-2xl transition-all duration-500 group overflow-hidden bg-background">
              <div className={cn(
                "h-2 w-full",
                item.success ? "bg-green-500" : "bg-destructive"
              )} />
              
              <div className="p-8 space-y-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className={cn(
                      "w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl shadow-inner border shrink-0",
                      item.success ? "bg-green-50 border-green-200 text-green-700" : "bg-destructive/5 border-destructive/20 text-destructive"
                    )}>
                      {item.method.charAt(0)}
                    </div>
                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge variant={item.success ? 'success' : 'destructive'} className="font-black px-2 py-0 h-5 text-[9px] tracking-widest uppercase">
                          {item.method}
                        </Badge>
                        <p className="text-[10px] font-bold text-muted-foreground/50">{new Date(item.created_at).toLocaleString()}</p>
                      </div>
                      <h4 className="text-sm font-mono truncate font-bold text-foreground/70 bg-secondary/30 px-3 py-1.5 rounded-xl border border-border/50">
                        {item.url}
                      </h4>
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-2 shrink-0">
                     <Button 
                        variant="default" 
                        size="icon" 
                        onClick={() => onLoad(item)}
                        className="h-12 w-12 rounded-2xl shadow-lg shadow-primary/20 hover:scale-110 active:scale-90 transition-all"
                        title="Load this request into Tester"
                      >
                       <RotateCw className="w-6 h-6" />
                     </Button>
                     <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => onDelete(item.id)}
                        className="h-10 w-10 p-0 rounded-xl text-muted-foreground/40 hover:text-destructive hover:bg-destructive/10 transition-colors"
                        title="Remove from history"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 px-1">
                       <Database className="w-3 h-3 text-primary/40" />
                       <p className="text-[9px] font-black text-muted-foreground/50 uppercase tracking-widest">Payload</p>
                    </div>
                    <pre className="text-[10px] p-4 bg-secondary/20 rounded-2xl overflow-hidden max-h-32 border border-border/20 font-mono shadow-inner italic">
                      {JSON.stringify(item.payload, null, 2)}
                    </pre>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 px-1">
                       <Search className="w-3 h-3 text-green-500/40" />
                       <p className="text-[9px] font-black text-muted-foreground/50 uppercase tracking-widest">Response ({item.response_status})</p>
                    </div>
                    <pre className="text-[10px] p-4 bg-secondary/20 rounded-2xl overflow-hidden max-h-32 border border-border/20 font-mono shadow-inner">
                      {JSON.stringify(item.response_data, null, 2)}
                    </pre>
                  </div>
                </div>
              </div>
            </Card>
          ))
        )}
        
        {historyItems.length === 0 && !isLoading && (
          <div className="md:col-span-2 flex flex-col items-center justify-center py-40 bg-secondary/10 rounded-[3rem] border-2 border-dashed border-border/50 text-muted-foreground/30 gap-6">
            <div className="relative">
               <History className="w-24 h-24 opacity-10" />
               <div className="absolute inset-0 bg-primary/5 animate-pulse rounded-full" />
            </div>
            <div className="text-center space-y-2">
              <p className="text-2xl font-black tracking-tight italic">No records found in time-stream</p>
              <p className="text-sm font-medium">ยิง API ครั้งแรกเพื่อเริ่มจัดเก็บประวัติการเรียกใช้งานที่นี่</p>
            </div>
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={isConfirmDeleteAllOpen}
        onClose={() => setIsConfirmDeleteAllOpen(false)}
        onConfirm={onDeleteAll}
        title="Wipe Entire History?"
        description="คุณแน่ใจหรือไม่ว่าต้องการลบประวัติการยิง API ทั้งหมด? ข้อมูลนี้จะถูกลบออกจากฐานข้อมูลถาวร"
        confirmText="Yes, Wipe Records"
        cancelText="Cancel Action"
      />
    </div>
  );
};
