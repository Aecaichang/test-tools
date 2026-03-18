import React, { useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { BadgeCheck, Copy, Database, Download, Power, Plus, RefreshCw, RotateCcw, Server, Trash2, Upload, Wand2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Select, type SelectOption } from '@/components/common/Select';
import { Textarea } from '@/components/common/Textarea';
import { Checkbox } from '@/components/common/Checkbox';
import { Badge } from '@/components/common/Badge';
import { QuickStartCard } from '@/components/common/QuickStartCard';
import { cn } from '@/lib/utils';
import { useMockServer } from './MockServerProvider';
import { createMockRouteFromCurl } from './mock-server-curl';
import { buildMockRequestUrl } from './mock-server-utils';
import { type MockHttpMethod, type MockRouteDefinition, type MockRouteDraft, type MockServerBackupPayload } from './types';

const METHOD_OPTIONS: SelectOption[] = [
  { value: 'GET', label: 'GET' },
  { value: 'POST', label: 'POST' },
  { value: 'PUT', label: 'PUT' },
  { value: 'PATCH', label: 'PATCH' },
  { value: 'DELETE', label: 'DELETE' },
  { value: 'ANY', label: 'ANY' },
];

const isMockHttpMethod = (value: unknown): value is MockHttpMethod =>
  value === 'GET' || value === 'POST' || value === 'PUT' || value === 'PATCH' || value === 'DELETE' || value === 'ANY';

const parseBackupPayload = (raw: string): MockServerBackupPayload => {
  const parsed = JSON.parse(raw) as Partial<MockServerBackupPayload> & { routes?: unknown };

  if (parsed.version !== 1) {
    throw new Error('Unsupported backup version');
  }

  if (!Array.isArray(parsed.routes)) {
    throw new Error('Backup file is missing routes');
  }

  const routes = parsed.routes.map((route) => {
    if (!route || typeof route !== 'object') {
      throw new Error('Backup route entry is invalid');
    }

    const value = route as unknown as Record<string, unknown>;
    if (!isMockHttpMethod(value.method)) {
      throw new Error(`Invalid method for route ${String(value.name ?? 'Unnamed')}`);
    }

    return {
      id: String(value.id ?? ''),
      name: String(value.name ?? 'Mock Route'),
      enabled: Boolean(value.enabled),
      method: value.method,
      pathPattern: String(value.pathPattern ?? '/api/mock'),
      status: Number(value.status) || 200,
      delayMs: Number(value.delayMs) || 0,
      responseHeaders: value.responseHeaders && typeof value.responseHeaders === 'object'
        ? (value.responseHeaders as Record<string, string>)
        : { 'content-type': 'application/json' },
      responseBody: String(value.responseBody ?? '{}'),
      notes: String(value.notes ?? ''),
    } satisfies MockRouteDefinition;
  });

  return {
    version: 1,
    exportedAt: String(parsed.exportedAt ?? new Date().toISOString()),
    enabled: Boolean(parsed.enabled),
    routes,
  };
};

const createInitialDraft = (createDraftFromRoute: (route?: MockRouteDefinition) => MockRouteDraft) =>
  createDraftFromRoute();

interface RouteEditorFieldsProps {
  draft: MockRouteDraft;
  requestUrlPreview: string;
  isLoading: boolean;
  onDraftChange: React.Dispatch<React.SetStateAction<MockRouteDraft>>;
  onSave: () => void;
  onCancel: () => void;
  primaryActionLabel: string;
}

const RouteEditorFields: React.FC<RouteEditorFieldsProps> = ({
  draft,
  requestUrlPreview,
  isLoading,
  onDraftChange,
  onSave,
  onCancel,
  primaryActionLabel,
}) => (
  <div className="space-y-5">
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <div className="space-y-2">
        <label className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">Route Name</label>
        <Input
          value={draft.name}
          onChange={(event) => onDraftChange((prev) => ({ ...prev, name: event.target.value }))}
          className="h-11 rounded-xl"
          placeholder="Get users"
        />
      </div>

      <div className="space-y-2">
        <label className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">Method</label>
        <Select
          value={draft.method}
          onChange={(value) => onDraftChange((prev) => ({ ...prev, method: value as MockHttpMethod }))}
          options={METHOD_OPTIONS}
          className="h-11 rounded-xl"
        />
      </div>
    </div>

    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <label className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">Request URL Preview</label>
        <span className="text-[11px] text-muted-foreground">ใช้ URL นี้เป็นปลายทางตอนยิง request</span>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row">
        <Input
          value={requestUrlPreview}
          readOnly
          className="h-11 rounded-xl font-mono text-sm"
        />
        <Button
          variant="outline"
          className="h-11 rounded-xl px-4 text-sm font-semibold"
          onClick={() => {
            void navigator.clipboard.writeText(requestUrlPreview)
              .then(() => toast.success('Copied request URL'))
              .catch(() => toast.error('Failed to copy request URL'));
          }}
        >
          <Copy className="h-4 w-4" />
          Copy URL
        </Button>
      </div>
    </div>

    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <div className="space-y-2">
        <label className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">Path Pattern</label>
        <Input
          value={draft.pathPattern}
          onChange={(event) => onDraftChange((prev) => ({ ...prev, pathPattern: event.target.value }))}
          className="h-11 rounded-xl font-mono"
          placeholder="/api/users/*"
        />
        <p className="text-[11px] text-muted-foreground">รองรับ `*` เช่น `/api/users/*` และจับคู่เฉพาะ path</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">Status</label>
          <Input
            type="number"
            min={100}
            max={599}
            value={draft.status}
            onChange={(event) => onDraftChange((prev) => ({ ...prev, status: Number(event.target.value) || 200 }))}
            className="h-11 rounded-xl"
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">Delay (ms)</label>
          <Input
            type="number"
            min={0}
            max={5000}
            value={draft.delayMs}
            onChange={(event) => onDraftChange((prev) => ({ ...prev, delayMs: Number(event.target.value) || 0 }))}
            className="h-11 rounded-xl"
          />
        </div>
      </div>
    </div>

    <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-secondary/20 px-4 py-3">
      <Checkbox
        checked={draft.enabled}
        onChange={(event) => onDraftChange((prev) => ({ ...prev, enabled: event.target.checked }))}
      />
      <div className="space-y-0.5">
        <p className="text-sm font-semibold text-foreground">Enable this route</p>
        <p className="text-xs text-muted-foreground">ถ้าปิด route นี้ ระบบจะข้ามไป route ถัดไป</p>
      </div>
    </div>

    <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">Response Headers JSON</label>
          <span className="text-[11px] text-muted-foreground">readable by `JSON.parse`</span>
        </div>
        <Textarea
          value={draft.responseHeadersText}
          onChange={(event) => onDraftChange((prev) => ({ ...prev, responseHeadersText: event.target.value }))}
          className="min-h-44 rounded-2xl border-border/60 font-mono text-sm"
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">Response Body</label>
        </div>
        <Textarea
          value={draft.responseBody}
          onChange={(event) => onDraftChange((prev) => ({ ...prev, responseBody: event.target.value }))}
          className="min-h-44 rounded-2xl border-border/60 font-mono text-sm"
        />
      </div>
    </div>

    <div className="space-y-2">
      <label className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">Notes</label>
      <Textarea
        value={draft.notes}
        onChange={(event) => onDraftChange((prev) => ({ ...prev, notes: event.target.value }))}
        placeholder="What is this route used for?"
        className="min-h-24 rounded-2xl border-border/60 text-sm"
      />
    </div>

    <div className="flex flex-col gap-3 sm:flex-row">
      <Button onClick={onSave} disabled={isLoading} className="h-11 rounded-xl px-5 text-sm font-semibold">
        <RefreshCw className="h-4 w-4" />
        {primaryActionLabel}
      </Button>
      <Button variant="outline" onClick={onCancel} className="h-11 rounded-xl px-5 text-sm font-semibold">
        <Plus className="h-4 w-4" />
        Cancel
      </Button>
    </div>
  </div>
);

export const MockServerView: React.FC = () => {
  const {
    enabled,
    routes,
    routeCount,
    activeRouteCount,
    isLoading,
    syncError,
    toggleEnabled,
    refreshRoutes,
    restoreFromBackup,
    upsertRoute,
    deleteRoute,
    duplicateRoute,
    resetRoutes,
    updateRouteStatus,
    createDraftFromRoute,
    draftToRoute,
  } = useMockServer();

  const [draft, setDraft] = useState<MockRouteDraft>(() => createInitialDraft(createDraftFromRoute));
  const [editingRouteId, setEditingRouteId] = useState<string | null>(null);
  const [isCreatingRoute, setIsCreatingRoute] = useState(false);
  const [curlInput, setCurlInput] = useState('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const requestUrlPreview = buildMockRequestUrl(draft.pathPattern);

  const summaryCards = useMemo(() => [
    {
      label: 'Server State',
      value: enabled ? 'Enabled' : 'Disabled',
      helper: enabled ? 'Requests can be intercepted' : 'Toggle to activate mocks',
      icon: Power,
    },
    {
      label: 'Routes',
      value: `${routeCount}`,
      helper: `${activeRouteCount} active route${activeRouteCount === 1 ? '' : 's'}`,
      icon: Database,
    },
  ], [activeRouteCount, enabled, routeCount]);

  const handleSave = async () => {
    try {
      const nextRoute = draftToRoute(draft);
      await upsertRoute(nextRoute);
      setEditingRouteId(null);
      setIsCreatingRoute(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Invalid route configuration';
      toast.error(message);
    }
  };

  const handleCancelAddDraft = () => {
    setEditingRouteId(null);
    setIsCreatingRoute(false);
    setDraft(createInitialDraft(createDraftFromRoute));
  };

  const handleCancelInlineEdit = () => {
    setEditingRouteId(null);
  };

  const handleEditRoute = (route: MockRouteDefinition) => {
    setEditingRouteId(route.id);
    setIsCreatingRoute(false);
    setDraft(createDraftFromRoute(route));
  };

  const handleAddRoute = () => {
    setEditingRouteId(null);
    setIsCreatingRoute(true);
    setDraft(createInitialDraft(createDraftFromRoute));
  };

  const handleDeleteRoute = (routeId: string) => {
    void deleteRoute(routeId)
      .then(() => {
        if (editingRouteId === routeId) {
          handleCancelInlineEdit();
        }
      })
      .catch((error) => {
        const message = error instanceof Error ? error.message : 'Failed to delete route';
        toast.error(message);
      });
  };

  const handleDuplicateRoute = (routeId: string) => {
    void duplicateRoute(routeId).catch((error) => {
      const message = error instanceof Error ? error.message : 'Failed to duplicate route';
      toast.error(message);
    });
  };

  const handleExportBackup = () => {
    const backup: MockServerBackupPayload = {
      version: 1,
      exportedAt: new Date().toISOString(),
      enabled,
      routes,
    };

    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `mock-server-backup-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success('Exported backup JSON');
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleImportFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';

    if (!file) return;

    try {
      const raw = await file.text();
      const backup = parseBackupPayload(raw);
      await restoreFromBackup(backup);
      setEditingRouteId(null);
      setIsCreatingRoute(false);
      setDraft(createInitialDraft(createDraftFromRoute));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to import backup';
      toast.error(message);
    }
  };

  const handleGenerateFromCurl = () => {
    try {
      const nextDraft = createMockRouteFromCurl(curlInput);
      setEditingRouteId(null);
      setIsCreatingRoute(true);
      setDraft(nextDraft);
      toast.success('Generated route from cURL');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to generate route from CURL';
      toast.error(message);
    }
  };

  return (
    <div className="container relative mx-auto max-w-7xl px-4 py-6 pb-24 sm:py-8 md:py-10">
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute left-[-6rem] top-10 h-56 w-56 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="absolute right-[-4rem] top-44 h-72 w-72 rounded-full bg-cyan-500/10 blur-3xl" />
      </div>

      <div className="space-y-6">
        <header className="space-y-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/5 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600">
                <Server className="h-3.5 w-3.5" />
                Local API Intercept
              </div>
              <h1 className="text-3xl font-black tracking-tight text-foreground sm:text-4xl md:text-5xl">
                Mock <span className="text-primary italic">Server</span>
              </h1>
              <p className="max-w-3xl text-sm font-medium leading-relaxed text-muted-foreground sm:text-base">
                ตั้ง route จำลองเพื่อช่วย test API ได้ทันที โดยจับคู่จาก method + path pattern แล้วส่ง response กลับจากฝั่งหน้าเว็บโดยไม่ต้องรัน backend
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Badge
                variant={syncError ? 'destructive' : 'outline'}
                className="h-11 rounded-xl px-3 text-[10px] font-bold uppercase tracking-[0.18em]"
              >
                <Server className="mr-1 h-3.5 w-3.5" />
                {isLoading ? 'Syncing Supabase' : syncError ? 'Sync Error' : 'Supabase Connected'}
              </Badge>
              <Button
                variant={enabled ? 'secondary' : 'default'}
                onClick={() => void toggleEnabled(!enabled).catch((error) => {
                  const message = error instanceof Error ? error.message : 'Failed to update enabled state';
                  toast.error(message);
                })}
                className="h-11 rounded-xl px-4 text-sm font-semibold"
              >
                {enabled ? <Power className="h-4 w-4" /> : <BadgeCheck className="h-4 w-4" />}
                {enabled ? 'Disable Server' : 'Enable Server'}
              </Button>
              <Button
                variant="outline"
                onClick={() => void resetRoutes().catch((error) => {
                  const message = error instanceof Error ? error.message : 'Failed to reset routes';
                  toast.error(message);
                })}
                className="h-11 rounded-xl px-4 text-sm font-semibold"
              >
                <RotateCcw className="h-4 w-4" />
                Reset Defaults
              </Button>
              <Button
                variant="outline"
                onClick={() => void refreshRoutes().catch((error) => {
                  const message = error instanceof Error ? error.message : 'Failed to reload routes';
                  toast.error(message);
                })}
                className="h-11 rounded-xl px-4 text-sm font-semibold"
              >
                <RefreshCw className="h-4 w-4" />
                Reload
              </Button>
              <Button
                variant="outline"
                onClick={handleExportBackup}
                className="h-11 rounded-xl px-4 text-sm font-semibold"
              >
                <Download className="h-4 w-4" />
                Export JSON
              </Button>
              <Button
                variant="outline"
                onClick={handleImportClick}
                className="h-11 rounded-xl px-4 text-sm font-semibold"
              >
                <Upload className="h-4 w-4" />
                Import JSON
              </Button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={handleImportFile}
            />
          </div>

          <QuickStartCard
            steps={[
              'สร้าง route จาก method + path pattern',
              'ใส่ response body แบบ JSON หรือ text',
              'หรือวาง cURL เพื่อสร้าง route อัตโนมัติ',
              'เปิด server แล้วลองยิงจาก Loop API Tester',
            ]}
          />

          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/60 bg-card/80 px-4 py-3 shadow-sm">
            <div className="space-y-1">
              <p className="text-sm font-semibold text-foreground">Route Composer</p>
              <p className="text-xs text-muted-foreground">กดปุ่มเพื่อเพิ่มหรือแก้ไข route ทีละรายการ</p>
            </div>
            <Button onClick={handleAddRoute} className="h-11 rounded-xl px-5 text-sm font-semibold">
              <Plus className="h-4 w-4" />
              Add API
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {summaryCards.map((card) => {
              const Icon = card.icon;

              return (
                <Card key={card.label} className="border-border/60 bg-card/80">
                  <CardHeader className="space-y-3 pb-3">
                    <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                      <Icon className="h-4 w-4 text-primary" />
                      {card.label}
                    </div>
                    <CardTitle className="text-2xl font-black tracking-tight">{card.value}</CardTitle>
                    <CardDescription>{card.helper}</CardDescription>
                  </CardHeader>
                </Card>
              );
            })}
          </div>

          {syncError && (
            <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">
              Supabase sync failed: {syncError}
            </div>
          )}
        </header>

        <div className="space-y-6">
            <Card className="overflow-hidden border-border/60 bg-card/90 shadow-sm">
              <CardHeader className="border-b border-border/60 bg-secondary/20">
                <CardTitle className="flex items-center gap-2 text-xl font-black">
                  <Database className="h-5 w-5 text-primary" />
                  API Routes
                </CardTitle>
                <CardDescription>รายการ route เรียงต่อกันตามลำดับใน composer</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 p-5">
                {isCreatingRoute && (
                  <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 shadow-sm">
                    <div className="mb-5 flex flex-col gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="rounded-lg px-2 py-1 text-[10px] font-bold">
                            New API
                          </Badge>
                          <span className="text-xs text-muted-foreground">สร้าง API ใหม่แบบ inline</span>
                        </div>
                        <p className="text-sm font-semibold text-foreground">{draft.name}</p>
                      </div>
                      <div className="space-y-3 rounded-2xl border border-border/60 bg-background/80 p-4">
                        <div className="flex items-center gap-2">
                          <Wand2 className="h-4 w-4 text-primary" />
                          <p className="text-sm font-semibold text-foreground">Generate From cURL</p>
                        </div>
                        <p className="text-xs text-muted-foreground">วาง cURL แล้วให้ระบบแปลงเป็น draft เพื่อกรอกฟอร์มต่อได้ทันที</p>
                        <Textarea
                          value={curlInput}
                          onChange={(event) => setCurlInput(event.target.value)}
                          placeholder={`curl 'https://api.example.com/users/123' \\
  -X GET \\
  -H 'accept: application/json'`}
                          className="min-h-36 rounded-2xl border-border/60 font-mono text-sm"
                        />
                        <div className="flex flex-col gap-3 sm:flex-row">
                          <Button
                            onClick={handleGenerateFromCurl}
                            disabled={!curlInput.trim()}
                            className="h-11 rounded-xl px-5 text-sm font-semibold"
                          >
                            <Wand2 className="h-4 w-4" />
                            Generate Draft
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => setCurlInput('')}
                            className="h-11 rounded-xl px-5 text-sm font-semibold"
                          >
                            Clear cURL
                          </Button>
                        </div>
                      </div>
                    </div>
                    <RouteEditorFields
                      draft={draft}
                      requestUrlPreview={requestUrlPreview}
                      isLoading={isLoading}
                      onDraftChange={setDraft}
                      onSave={() => void handleSave()}
                      onCancel={handleCancelAddDraft}
                      primaryActionLabel="Save API"
                    />
                  </div>
                )}
                {routes.map((route, index) => (
                  <div
                    key={route.id}
                    className={cn(
                      'rounded-2xl border border-border/60 bg-background p-4 shadow-sm',
                      route.enabled ? '' : 'opacity-60'
                    )}
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                      <div className="min-w-0 space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant="secondary" className="rounded-lg px-2 py-1 text-[10px] font-bold">
                            #{index + 1}
                          </Badge>
                          <Badge variant="secondary" className="rounded-lg px-2 py-1 text-[10px] font-bold">
                            {route.method}
                          </Badge>
                          <Badge variant={route.enabled ? 'success' : 'outline'} className="rounded-lg px-2 py-1 text-[10px] font-bold">
                            {route.enabled ? 'Enabled' : 'Disabled'}
                          </Badge>
                        </div>
                        <div className="space-y-1">
                          <p className="text-base font-bold text-foreground">{route.name}</p>
                          <p className="truncate font-mono text-sm text-muted-foreground">{route.pathPattern}</p>
                          <p className="text-xs text-muted-foreground">{route.notes || 'No notes'}</p>
                          <p className="font-mono text-[11px] text-primary/80">{buildMockRequestUrl(route.pathPattern)}</p>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-9 rounded-lg px-3 text-xs font-semibold"
                          onClick={() => {
                            void navigator.clipboard.writeText(buildMockRequestUrl(route.pathPattern))
                              .then(() => toast.success('Copied request URL'))
                              .catch(() => toast.error('Failed to copy request URL'));
                          }}
                          aria-label={`Copy request URL for ${route.name}`}
                        >
                          <Copy className="h-4 w-4" />
                          Copy
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-9 rounded-lg px-3 text-xs font-semibold"
                          onClick={() => handleEditRoute(route)}
                          aria-label={`Edit ${route.name}`}
                        >
                          <BadgeCheck className="h-4 w-4" />
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 rounded-lg"
                          onClick={() => handleDuplicateRoute(route.id)}
                          aria-label={`Duplicate ${route.name}`}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 rounded-lg text-destructive hover:text-destructive"
                          onClick={() => handleDeleteRoute(route.id)}
                          aria-label={`Delete ${route.name}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-9 rounded-lg px-3 text-xs font-semibold"
                          onClick={() => void updateRouteStatus(route.id, !route.enabled).catch((error) => {
                            const message = error instanceof Error ? error.message : 'Failed to update route status';
                            toast.error(message);
                          })}
                        >
                          {route.enabled ? 'Enabled' : 'Disabled'}
                        </Button>
                      </div>
                    </div>

                    {editingRouteId === route.id ? (
                      <div className="mt-4 rounded-2xl border border-primary/20 bg-primary/5 p-4">
                        <div className="mb-4 flex flex-col gap-2">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="rounded-lg px-2 py-1 text-[10px] font-bold">
                                Editing inline
                              </Badge>
                              <span className="text-xs text-muted-foreground">แก้ไข route นี้ได้เลยใน card</span>
                            </div>
                            <p className="text-sm font-semibold text-foreground">{route.name}</p>
                          </div>
                        </div>
                        <RouteEditorFields
                          draft={draft}
                          requestUrlPreview={requestUrlPreview}
                          isLoading={isLoading}
                          onDraftChange={setDraft}
                          onSave={() => void handleSave()}
                          onCancel={handleCancelInlineEdit}
                          primaryActionLabel="Save Route"
                        />
                      </div>
                    ) : (
                      <div className="mt-4 grid grid-cols-1 gap-4 rounded-2xl border border-border/60 bg-secondary/10 p-4 xl:grid-cols-2">
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-black uppercase tracking-[0.16em] text-muted-foreground">Request URL</span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 rounded-lg"
                              onClick={() => {
                                void navigator.clipboard.writeText(buildMockRequestUrl(route.pathPattern))
                                  .then(() => toast.success('Copied request URL'))
                                  .catch(() => toast.error('Failed to copy request URL'));
                              }}
                              aria-label={`Copy request URL for ${route.name}`}
                            >
                              <Copy className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                          <div className="rounded-xl border border-border/60 bg-background px-3 py-2">
                            <p className="break-all font-mono text-xs text-foreground">{buildMockRequestUrl(route.pathPattern)}</p>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-black uppercase tracking-[0.16em] text-muted-foreground">Response</span>
                            <Badge variant="outline" className="rounded-lg px-2 py-1 text-[10px] font-bold">
                              {route.status}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            <div className="rounded-xl border border-border/60 bg-background p-3">
                              <p className="mb-2 text-[10px] font-black uppercase tracking-[0.16em] text-muted-foreground">Headers</p>
                              <div className="space-y-1">
                                {Object.entries(route.responseHeaders).map(([key, value]) => (
                                  <div key={key} className="flex items-start gap-2">
                                    <span className="min-w-0 shrink-0 font-mono text-[11px] font-semibold text-primary">{key}</span>
                                    <span className="min-w-0 break-all font-mono text-[11px] text-muted-foreground">{value}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                            <div className="rounded-xl border border-border/60 bg-background p-3">
                              <p className="mb-2 text-[10px] font-black uppercase tracking-[0.16em] text-muted-foreground">Body</p>
                              <pre className="max-h-40 overflow-auto whitespace-pre-wrap break-words font-mono text-[11px] leading-relaxed text-muted-foreground">
                                {route.responseBody}
                              </pre>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                {routes.length === 0 && (
                  <div className="rounded-2xl border border-dashed border-border/60 bg-secondary/10 py-12 text-center text-sm text-muted-foreground">
                    No APIs yet. Use Add API to create one.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
      </div>
    </div>
  );
};
