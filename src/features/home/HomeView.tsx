import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import {
  Play,
  Zap,
  FileJson,
  ArrowRight,
  Database,
  Link,
  FileSpreadsheet,
  ArrowRightLeft,
  Sparkles,
  Server
} from 'lucide-react';
import { cn } from '@/lib/utils';

type ToolStatus = 'ready' | 'beta' | 'coming_soon';

interface Tool {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  accentClass: string;
  iconClass: string;
  category: string;
  status: ToolStatus;
}

interface ToolUsageMeta {
  openCount: number;
  lastOpenedAt: string | null;
  pinned: boolean;
  favorite: boolean;
}

interface HomeViewProps {
  onSelectTool: (toolId: string) => void;
}

const TOOL_USAGE_STORAGE_KEY = 'test_tools_home_usage_v1';

const defaultUsageMeta: ToolUsageMeta = {
  openCount: 0,
  lastOpenedAt: null,
  pinned: false,
  favorite: false
};

const readUsageStorage = (): Record<string, ToolUsageMeta> => {
  try {
    const raw = localStorage.getItem(TOOL_USAGE_STORAGE_KEY);
    if (!raw) return {};

    const parsed = JSON.parse(raw) as Record<string, Partial<ToolUsageMeta>>;
    return Object.entries(parsed).reduce<Record<string, ToolUsageMeta>>((acc, [toolId, value]) => {
      acc[toolId] = {
        openCount: Number(value.openCount) || 0,
        lastOpenedAt: value.lastOpenedAt ?? null,
        pinned: Boolean(value.pinned),
        favorite: Boolean(value.favorite)
      };
      return acc;
    }, {});
  } catch {
    return {};
  }
};

const formatRelativeTime = (dateInput: string | null): string => {
  if (!dateInput) return 'ยังไม่เคยใช้งาน';

  const date = new Date(dateInput);
  const deltaMs = date.getTime() - Date.now();
  const deltaMinutes = Math.round(deltaMs / (1000 * 60));
  const formatter = new Intl.RelativeTimeFormat('th', { numeric: 'auto' });

  if (Math.abs(deltaMinutes) < 60) {
    return formatter.format(deltaMinutes, 'minute');
  }

  const deltaHours = Math.round(deltaMinutes / 60);
  if (Math.abs(deltaHours) < 24) {
    return formatter.format(deltaHours, 'hour');
  }

  const deltaDays = Math.round(deltaHours / 24);
  return formatter.format(deltaDays, 'day');
};

const canOpenTool = (status: ToolStatus): boolean => status === 'ready' || status === 'beta';

const statusBadgeClassMap: Record<ToolStatus, string> = {
  ready: 'border-emerald-300/70 bg-emerald-500/10 text-emerald-700',
  beta: 'border-amber-300/70 bg-amber-500/10 text-amber-700',
  coming_soon: 'border-border/80 bg-background/70 text-muted-foreground'
};

const statusLabelMap: Record<ToolStatus, string> = {
  ready: 'Ready',
  beta: 'Beta',
  coming_soon: 'Coming Soon'
};

export const HomeView: React.FC<HomeViewProps> = ({ onSelectTool }) => {
  const [usageMap, setUsageMap] = useState<Record<string, ToolUsageMeta>>(readUsageStorage);

  const tools: Tool[] = useMemo(() => [
    {
      id: 'loop-api',
      name: 'Loop API Tester',
      description: 'ยิง Loop API เพื่อสร้างข้อมูลทดสอบด้วยการ Config payload ได้ตามต้องการ พร้อมระบบประวัติ',
      icon: <Play className="w-8 h-8" />,
      accentClass: 'from-sky-500/20 to-cyan-500/20',
      iconClass: 'bg-sky-500',
      category: 'API',
      status: 'ready'
    },
    {
      id: 'mock-generator',
      name: 'Mock Data Generator',
      description: 'เครื่องมือสร้างข้อมูลจำลอง (เช่น ชื่อ, ที่อยู่, เบอร์โทร, เลขบัตรประชาชน) ในรูปแบบ JSON หรือ CSV เพื่อเอาไปใช้ยิง API ต่อ',
      icon: <Database className="w-8 h-8" />,
      accentClass: 'from-indigo-500/20 to-blue-500/20',
      iconClass: 'bg-indigo-500',
      category: 'Data',
      status: 'beta'
    },
    {
      id: 'mock-server',
      name: 'Mock Server',
      description: 'ตั้ง route จำลองและตอบกลับ payload แบบ local ได้ทันที เพื่อทดสอบ API โดยไม่ต้องรอ backend',
      icon: <Server className="w-8 h-8" />,
      accentClass: 'from-emerald-500/20 to-cyan-500/20',
      iconClass: 'bg-emerald-600',
      category: 'API',
      status: 'beta'
    },
    {
      id: 'base64-tool',
      name: 'Base64 Encoder/Decoder',
      description: 'เข้ารหัสและถอดรหัสข้อความเป็นรูปแบบ Base64 อย่างรวดเร็ว รองรับข้อความภาษาไทย',
      icon: <Link className="w-8 h-8" />,
      accentClass: 'from-rose-500/20 to-orange-500/20',
      iconClass: 'bg-rose-500',
      category: 'Utility',
      status: 'ready'
    },
    {
      id: 'performance',
      name: 'Performance Test',
      description: 'ทดสอบประสิทธิภาพของ API ด้วยการจำลองการโหลดรันจากผู้ใช้จำนวนมาก',
      icon: <Zap className="w-8 h-8" />,
      accentClass: 'from-amber-500/20 to-orange-500/20',
      iconClass: 'bg-amber-500',
      category: 'Performance',
      status: 'coming_soon'
    },
    {
      id: 'json-parser',
      name: 'JSON Utilities',
      description: 'เครื่องมือจัดรูปแบบ (Formatter), ย่อขนาด (Minify) และเปรียบเทียบความแตกต่าง (Diff) ของ JSON',
      icon: <FileJson className="w-8 h-8" />,
      accentClass: 'from-emerald-500/20 to-teal-500/20',
      iconClass: 'bg-emerald-500',
      category: 'JSON',
      status: 'ready'
    },
    {
      id: 'excel-tool',
      name: 'Excel Viewer',
      description: 'ตัวช่วยอ่านไฟล์ Excel และ CSV พร้อมระบบค้นหาข้อมูล และแปลงเป็น JSON ได้ทันที',
      icon: <FileSpreadsheet className="w-8 h-8" />,
      accentClass: 'from-emerald-600/20 to-lime-500/20',
      iconClass: 'bg-emerald-600',
      category: 'Spreadsheet',
      status: 'ready'
    },
    {
      id: 'csv-converter',
      name: 'CSV to Excel Converter',
      description: 'แปลงไฟล์ CSV เป็นไฟล์เครื่องหมาย Excel (.xlsx) อย่างรวดเร็ว พร้อมรองรับภาษาไทยและ UTF-8',
      icon: <ArrowRightLeft className="w-8 h-8" />,
      accentClass: 'from-emerald-400/20 to-green-500/20',
      iconClass: 'bg-emerald-500',
      category: 'Spreadsheet',
      status: 'ready'
    },
    {
      id: 'product-query',
      name: 'Product SQL Generator',
      description: 'เครื่องมือช่วยสร้าง SQL (Select / Update / Rollback) สำหรับจัดการข้อมูลสินค้าจำนวนมากจากรหัส SKU',
      icon: <Database className="w-8 h-8" />,
      accentClass: 'from-orange-500/20 to-amber-500/20',
      iconClass: 'bg-orange-500',
      category: 'SQL',
      status: 'ready'
    }
  ], []);

  useEffect(() => {
    localStorage.setItem(TOOL_USAGE_STORAGE_KEY, JSON.stringify(usageMap));
  }, [usageMap]);

  const withUsageMeta = useCallback((toolId: string): ToolUsageMeta => usageMap[toolId] ?? defaultUsageMeta, [usageMap]);

  const updateUsageMeta = (toolId: string, updater: (prev: ToolUsageMeta) => ToolUsageMeta) => {
    setUsageMap((prev) => ({
      ...prev,
      [toolId]: updater(prev[toolId] ?? defaultUsageMeta)
    }));
  };

  const openTool = (tool: Tool) => {
    if (!canOpenTool(tool.status)) return;

    updateUsageMeta(tool.id, (prev) => ({
      ...prev,
      openCount: prev.openCount + 1,
      lastOpenedAt: new Date().toISOString()
    }));
    onSelectTool(tool.id);
  };

  const sortedTools = useMemo(() => {
    const statusPriority: Record<ToolStatus, number> = { ready: 0, beta: 1, coming_soon: 2 };

    return [...tools].sort((a, b) => {
      const aMeta = withUsageMeta(a.id);
      const bMeta = withUsageMeta(b.id);

      if (aMeta.pinned !== bMeta.pinned) return aMeta.pinned ? -1 : 1;
      if (aMeta.favorite !== bMeta.favorite) return aMeta.favorite ? -1 : 1;
      if (statusPriority[a.status] !== statusPriority[b.status]) return statusPriority[a.status] - statusPriority[b.status];
      return a.name.localeCompare(b.name);
    });
  }, [tools, withUsageMeta]);

  const filteredTools = sortedTools;

  const quickTools = useMemo(() => {
    const ranked = tools
      .filter((tool) => canOpenTool(tool.status))
      .map((tool) => ({ tool, usage: withUsageMeta(tool.id) }))
      .sort((a, b) => {
        if (a.usage.pinned !== b.usage.pinned) return a.usage.pinned ? -1 : 1;
        if (a.usage.openCount !== b.usage.openCount) return b.usage.openCount - a.usage.openCount;
        return a.tool.name.localeCompare(b.tool.name);
      })
      .slice(0, 3);

    return ranked.map((item) => item.tool);
  }, [tools, withUsageMeta]);

  return (
    <section className="container mx-auto max-w-7xl px-4 py-6 sm:py-8 md:py-10 pb-24 md:pb-10">
      <div className="grid grid-cols-1 gap-4 sm:gap-5 lg:grid-cols-4">
        {filteredTools.map((tool) => {
          const usage = withUsageMeta(tool.id);
          const isOpenable = canOpenTool(tool.status);

          return (
            <Card
              key={tool.id}
              className="group relative h-full overflow-hidden border border-border/70 bg-card/85 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
            >
              <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${tool.accentClass} opacity-80`} />
              <CardHeader className="relative z-10 flex-1 pb-1">
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${tool.iconClass} text-white shadow-md shadow-black/10 transition-transform duration-300 group-hover:scale-105`}>
                    {tool.icon}
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <Badge variant="outline" className="h-7 rounded-full border-border/80 bg-background/70 px-3 text-[11px] uppercase tracking-[0.12em]">
                      {tool.category}
                    </Badge>
                    <Badge
                      variant="outline"
                      className={cn(
                        'h-7 rounded-full px-3 text-[11px] uppercase tracking-[0.12em]',
                        statusBadgeClassMap[tool.status]
                      )}
                    >
                      {statusLabelMap[tool.status]}
                    </Badge>
                  </div>
                </div>
                <CardTitle className="text-xl font-semibold sm:text-2xl">{tool.name}</CardTitle>
                <CardDescription className="mt-1 text-sm leading-relaxed sm:text-base">
                  {tool.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="relative z-10 pt-2">
                {isOpenable ? (
                  <Button
                    onClick={() => openTool(tool)}
                    className="h-11 w-full group/btn text-sm font-semibold sm:text-base"
                  >
                    <Sparkles className="mr-2 h-4 w-4" />
                    เปิดใช้งาน
                    <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover/btn:translate-x-1" />
                  </Button>
                ) : (
                  <Button
                    disabled
                    variant="secondary"
                    className="h-11 w-full text-sm font-semibold sm:text-base"
                  >
                    เร็วๆ นี้
                  </Button>
                )}

                <p className="mt-2 text-xs text-muted-foreground">
                  ใช้งานล่าสุด: {formatRelativeTime(usage.lastOpenedAt)} | เปิดแล้ว {usage.openCount} ครั้ง
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border/80 bg-background/95 p-2 backdrop-blur md:hidden">
        <div className="container mx-auto grid max-w-6xl grid-cols-3 gap-2">
        {quickTools.map((tool) => (
            <Button
              key={tool.id}
              variant="outline"
              className="h-11 px-2 text-xs gap-1.5"
              onClick={() => openTool(tool)}
            >
              <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md ${tool.iconClass} text-white`}>
                {tool.icon}
              </span>
              <span className="truncate">{tool.name}</span>
            </Button>
          ))}
        </div>
      </div>
    </section>
  );
};
