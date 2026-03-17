import React from 'react';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { History, RotateCw, Trash2, Database, Search, Clock } from 'lucide-react';
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
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-5 duration-500">
      <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-4">
        <div className="space-y-1">
          <h2 className="flex items-center gap-2 text-xl font-black tracking-tight text-foreground">
            <History className="h-5 w-5 text-primary" />
            Archives & Logs
          </h2>
          <p className="text-sm text-muted-foreground">ประวัติการเรียกใช้งาน 20 รายการล่าสุด</p>
        </div>

        {historyItems.length > 0 && !isLoading && (
          <Button 
            variant="outline"
            size="sm"
            onClick={() => setIsConfirmDeleteAllOpen(true)}
            className="h-11 min-w-44 gap-2 rounded-xl border-destructive/20 text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="w-4 h-4" />
            Clear History
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="h-44 rounded-2xl border-dashed animate-pulse bg-secondary/10" />
          ))
        ) : (
          historyItems.map((item) => (
            <Card key={item.id} className="group relative overflow-hidden rounded-2xl border-border/60 bg-background p-4 transition-all duration-300 hover:border-primary/30 hover:shadow-lg">
               <div className={cn(
                  "absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 rounded-full blur-2xl opacity-10",
                  item.success ? "bg-green-500" : "bg-destructive"
               )} />
               
               <div className="relative z-10 space-y-4">
                  <div className="flex items-start justify-between">
                     <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-10 h-10 rounded-xl flex items-center justify-center font-black border shadow-sm",
                          item.success ? "bg-green-500/5 border-green-500/10 text-green-600" : "bg-destructive/5 border-destructive/10 text-destructive"
                        )}>
                          {item.method.charAt(0)}
                        </div>
                        <div className="min-w-0">
                           <div className="flex items-center gap-2">
                              <Badge variant={item.success ? 'success' : 'destructive'} className="h-5 px-2 text-[10px] font-bold uppercase tracking-wide">
                                {item.method}
                              </Badge>
                              <span className="text-[11px] font-semibold text-muted-foreground">{item.response_status}</span>
                           </div>
                           <p className="mt-1 max-w-[180px] truncate font-mono text-[11px] text-muted-foreground">
                             {item.url}
                           </p>
                        </div>
                     </div>
                     
                     <div className="flex items-center gap-1">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => onLoad(item)}
                          aria-label="Reload this request"
                          className="h-9 w-9 rounded-lg border border-transparent hover:border-primary/20 hover:bg-primary/10 hover:text-primary"
                        >
                          <RotateCw className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => onDelete(item.id)}
                          aria-label="Delete this history item"
                          className="h-9 w-9 rounded-lg border border-transparent text-muted-foreground/40 hover:border-destructive/20 hover:bg-destructive/10 hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                     </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                     <div className="space-y-1.5">
                        <div className="flex items-center gap-1.5 px-1">
                           <Database className="w-3 h-3 text-primary/30" />
                           <span className="text-[9px] font-black text-muted-foreground/40 uppercase tracking-widest">Payload</span>
                        </div>
                        <div className="max-h-20 overflow-hidden rounded-xl border border-border/40 bg-secondary/20 p-3 font-mono text-[10px] text-muted-foreground italic">
                           {JSON.stringify(item.payload)}
                        </div>
                     </div>
                     <div className="space-y-1.5">
                        <div className="flex items-center gap-1.5 px-1">
                           <Search className="w-3 h-3 text-primary/30" />
                           <span className="text-[9px] font-black text-muted-foreground/40 uppercase tracking-widest">Response</span>
                        </div>
                        <div className="max-h-20 overflow-hidden rounded-xl border border-border/40 bg-secondary/20 p-3 font-mono text-[10px] text-muted-foreground">
                           {JSON.stringify(item.response_data)}
                        </div>
                     </div>
                  </div>

                  <div className="flex items-center gap-2 border-t border-border/30 pt-2 text-[10px] font-semibold text-muted-foreground">
                     <Clock className="w-3 h-3" />
                     {new Date(item.created_at).toLocaleString()}
                  </div>
               </div>
            </Card>
          ))
        )}
        
        {historyItems.length === 0 && !isLoading && (
          <div className="md:col-span-2 xl:col-span-3 flex flex-col items-center justify-center space-y-4 rounded-2xl border-2 border-dashed border-border/50 bg-secondary/5 py-24 text-center">
             <div className="rounded-2xl border border-border/50 bg-background p-5 text-muted-foreground/20">
                <History className="w-16 h-16" />
             </div>
             <div className="space-y-1.5">
                <p className="text-lg font-bold text-foreground">ยังไม่มีประวัติการยิง API</p>
                <p className="text-sm text-muted-foreground">ลองรัน Workbench สัก 1 รอบ แล้วรายการจะขึ้นที่แท็บนี้อัตโนมัติ</p>
             </div>
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={isConfirmDeleteAllOpen}
        onClose={() => setIsConfirmDeleteAllOpen(false)}
        onConfirm={onDeleteAll}
        title="Clear all history?"
        description="คุณแน่ใจหรือไม่ว่าต้องการลบประวัติการยิง API ทั้งหมด? ข้อมูลนี้จะถูกลบออกจากระบบถาวร"
        confirmText="Clear history"
        cancelText="Cancel"
      />
    </div>
  );
};
