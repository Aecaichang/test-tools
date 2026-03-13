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
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-5 duration-700">
      <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-6 px-2">
        <div className="space-y-1.5 text-center md:text-left w-full md:w-auto">
           <h2 className="text-3xl font-black tracking-tight text-foreground flex items-center justify-center md:justify-start gap-4">
              Archives <span className="text-primary italic">& Logs</span>
           </h2>
           <p className="text-muted-foreground font-medium text-lg">
              ประวัติการเรียกใช้งาน 20 รายการล่าสุด
           </p>
        </div>
        
        {historyItems.length > 0 && !isLoading && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setIsConfirmDeleteAllOpen(true)}
            className="h-10 gap-2 px-5 rounded-xl text-destructive hover:bg-destructive/10 font-bold self-center md:self-end"
          >
            <Trash2 className="w-4 h-4" />
            WIPE ARCHIVES
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="h-48 rounded-3xl border-dashed animate-pulse bg-secondary/10" />
          ))
        ) : (
          historyItems.map((item) => (
            <Card key={item.id} className="group p-6 rounded-[2rem] border-border/50 hover:border-primary/30 transition-all duration-300 hover:shadow-xl hover:shadow-primary/5 bg-background relative overflow-hidden">
               <div className={cn(
                  "absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 rounded-full blur-2xl opacity-10",
                  item.success ? "bg-green-500" : "bg-destructive"
               )} />
               
               <div className="space-y-6 relative z-10">
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
                              <Badge variant={item.success ? 'success' : 'destructive'} className="text-[9px] px-1.5 h-4 font-black uppercase tracking-tighter">
                                {item.method}
                              </Badge>
                              <span className="text-[10px] font-bold text-muted-foreground/30">{item.response_status}</span>
                           </div>
                           <p className="text-[11px] font-mono text-muted-foreground/60 truncate max-w-[150px] mt-1">
                             {item.url}
                           </p>
                        </div>
                     </div>
                     
                     <div className="flex items-center gap-1">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => onLoad(item)}
                          className="h-9 w-9 rounded-lg hover:bg-primary/10 hover:text-primary"
                        >
                          <RotateCw className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => onDelete(item.id)}
                          className="h-9 w-9 rounded-lg hover:bg-destructive/10 hover:text-destructive text-muted-foreground/20"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                     </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                     <div className="space-y-1.5">
                        <div className="flex items-center gap-1.5 px-1">
                           <Database className="w-3 h-3 text-primary/30" />
                           <span className="text-[9px] font-black text-muted-foreground/40 uppercase tracking-widest">Payload</span>
                        </div>
                        <div className="p-3 bg-secondary/20 rounded-xl border border-border/30 text-[10px] font-mono max-h-20 overflow-hidden text-muted-foreground italic">
                           {JSON.stringify(item.payload)}
                        </div>
                     </div>
                     <div className="space-y-1.5">
                        <div className="flex items-center gap-1.5 px-1">
                           <Search className="w-3 h-3 text-primary/30" />
                           <span className="text-[9px] font-black text-muted-foreground/40 uppercase tracking-widest">Response</span>
                        </div>
                        <div className="p-3 bg-secondary/20 rounded-xl border border-border/30 text-[10px] font-mono max-h-20 overflow-hidden text-muted-foreground">
                           {JSON.stringify(item.response_data)}
                        </div>
                     </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-border/20 text-[9px] font-bold text-muted-foreground/30 uppercase tracking-widest">
                     <Clock className="w-3 h-3" />
                     {new Date(item.created_at).toLocaleString()}
                  </div>
               </div>
            </Card>
          ))
        )}
        
        {historyItems.length === 0 && !isLoading && (
          <div className="md:col-span-2 xl:col-span-3 py-40 flex flex-col items-center justify-center text-center space-y-6 bg-secondary/5 rounded-[4rem] border-2 border-dashed border-border/50">
             <div className="p-6 rounded-3xl bg-background shadow-sm border border-border/50 text-muted-foreground/10">
                <History className="w-16 h-16" />
             </div>
             <div className="space-y-1">
                <p className="text-xl font-black text-muted-foreground/40 uppercase tracking-widest italic">Temporal Void</p>
                <p className="text-sm text-muted-foreground/30 font-medium">No records found in the current time-stream</p>
             </div>
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={isConfirmDeleteAllOpen}
        onClose={() => setIsConfirmDeleteAllOpen(false)}
        onConfirm={onDeleteAll}
        title="Wipe Entire Archive?"
        description="คุณแน่ใจหรือไม่ว่าต้องการลบประวัติการยิง API ทั้งหมด? ข้อมูลนี้จะถูกลบออกจากระบบถาวร"
        confirmText="Confirm Wipeout"
        cancelText="Keep Records"
      />
    </div>
  );
};
