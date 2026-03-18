import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import {
  createDefaultMockServerState,
  generateMockRouteId,
} from './mock-server-storage';
import {
  deleteMockRouteFromSupabase,
  fetchMockRoutesFromSupabase,
  fetchMockServerEnabledFromSupabase,
  replaceMockRoutesInSupabase,
  replaceMockServerStateInSupabase,
  upsertMockRouteToSupabase,
  upsertMockServerEnabledToSupabase,
} from './mock-server-repository';
import { buildRequestContext, resolveMockRoute } from './mock-server-utils';
import {
  type MockServerBackupPayload,
  type MockRequestContext,
  type MockResolution,
  type MockRouteDefinition,
  type MockRouteDraft,
  type MockServerState,
} from './types';

interface MockServerContextValue {
  enabled: boolean;
  routes: MockRouteDefinition[];
  routeCount: number;
  activeRouteCount: number;
  isLoading: boolean;
  syncError: string | null;
  toggleEnabled: (nextEnabled: boolean) => Promise<void>;
  refreshRoutes: () => Promise<void>;
  upsertRoute: (route: MockRouteDefinition) => Promise<void>;
  deleteRoute: (routeId: string) => Promise<void>;
  duplicateRoute: (routeId: string) => Promise<void>;
  resetRoutes: () => Promise<void>;
  updateRouteStatus: (routeId: string, enabled: boolean) => Promise<void>;
  restoreFromBackup: (backup: MockServerBackupPayload) => Promise<void>;
  getRouteById: (routeId: string) => MockRouteDefinition | undefined;
  resolveRequest: (request: MockRequestContext) => MockResolution | null;
  createDraftFromRoute: (route?: MockRouteDefinition) => MockRouteDraft;
}

const MockServerContext = createContext<MockServerContextValue | null>(null);

const createEmptyDraft = (): MockRouteDraft => ({
  id: generateMockRouteId(),
  name: 'New Mock Route',
  enabled: true,
  method: 'GET',
  pathPattern: '/api/mock',
  status: 200,
  delayMs: 200,
  responseHeadersText: JSON.stringify({ 'content-type': 'application/json' }, null, 2),
  responseBody: JSON.stringify(
    {
      success: true,
      source: 'mock-server',
      message: 'Mock route response',
      data: {
        method: '{{method}}',
        path: '{{path}}',
        body: '{{body}}',
      },
    },
    null,
    2,
  ),
  notes: '',
});

const routeToDraft = (route: MockRouteDefinition): MockRouteDraft => ({
  id: route.id,
  name: route.name,
  enabled: route.enabled,
  method: route.method,
  pathPattern: route.pathPattern,
  status: route.status,
  delayMs: route.delayMs,
  responseHeadersText: JSON.stringify(route.responseHeaders, null, 2),
  responseBody: route.responseBody,
  notes: route.notes,
});

const draftToRoute = (draft: MockRouteDraft): MockRouteDefinition => {
  const parsedHeaders = JSON.parse(draft.responseHeadersText || '{}') as Record<string, string>;

  return {
    id: draft.id || generateMockRouteId(),
    name: draft.name.trim() || 'Mock Route',
    enabled: draft.enabled,
    method: draft.method,
    pathPattern: draft.pathPattern.trim() || '/api/mock',
    status: Math.max(100, Number(draft.status) || 200),
    delayMs: Math.max(0, Number(draft.delayMs) || 0),
    responseHeaders: Object.entries(parsedHeaders).reduce<Record<string, string>>((acc, [key, value]) => {
      acc[key] = String(value);
      return acc;
    }, {}),
    responseBody: draft.responseBody,
    notes: draft.notes.trim(),
  };
};

export const MockServerProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [state, setState] = useState<MockServerState>(() => createDefaultMockServerState());
  const [isLoading, setIsLoading] = useState(true);
  const [syncError, setSyncError] = useState<string | null>(null);

  const refreshRoutes = useCallback(async () => {
    setIsLoading(true);
    try {
      const [remoteEnabled, remoteRoutes] = await Promise.all([
        fetchMockServerEnabledFromSupabase().catch(() => false),
        fetchMockRoutesFromSupabase(),
      ]);

      if (remoteRoutes.length > 0) {
        setState({
          enabled: remoteEnabled,
          routes: remoteRoutes,
        });
        setSyncError(null);
        return;
      }

      const seededState = createDefaultMockServerState();
      await replaceMockServerStateInSupabase(seededState);
      setState(seededState);
      setSyncError(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load mock routes from Supabase';
      setSyncError(message);
      toast.error(message);
      setState((prev) => ({
        ...prev,
        ...createDefaultMockServerState(),
      }));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshRoutes();
  }, [refreshRoutes]);

  const toggleEnabled = useCallback(async (nextEnabled: boolean) => {
    try {
      await upsertMockServerEnabledToSupabase(nextEnabled);
      setState((prev) => ({ ...prev, enabled: nextEnabled }));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update mock server state';
      setSyncError(message);
      toast.error(message);
      throw error;
    }
  }, []);

  const upsertRoute = useCallback(async (route: MockRouteDefinition) => {
    try {
      await upsertMockRouteToSupabase(route);
      setSyncError(null);
      setState((prev) => {
        const nextRoutes = prev.routes.some((item) => item.id === route.id)
          ? prev.routes.map((item) => (item.id === route.id ? route : item))
          : [route, ...prev.routes];

        return { ...prev, routes: nextRoutes };
      });
      toast.success('Saved mock route to Supabase');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to save mock route';
      setSyncError(message);
      toast.error(message);
      throw error;
    }
  }, []);

  const deleteRoute = useCallback(async (routeId: string) => {
    try {
      await deleteMockRouteFromSupabase(routeId);
      setSyncError(null);
      setState((prev) => ({
        ...prev,
        routes: prev.routes.filter((route) => route.id !== routeId),
      }));
      toast.success('Deleted mock route from Supabase');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete mock route';
      setSyncError(message);
      toast.error(message);
      throw error;
    }
  }, []);

  const duplicateRoute = useCallback(async (routeId: string) => {
    const source = state.routes.find((route) => route.id === routeId);
    if (!source) return;

    const duplicated: MockRouteDefinition = {
      ...source,
      id: generateMockRouteId(),
      name: `${source.name} Copy`,
    };

    try {
      await upsertMockRouteToSupabase(duplicated);
      setSyncError(null);
      setState((prev) => ({ ...prev, routes: [duplicated, ...prev.routes] }));
      toast.success('Duplicated mock route');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to duplicate mock route';
      setSyncError(message);
      toast.error(message);
      throw error;
    }
  }, [state.routes]);

  const resetRoutes = useCallback(async () => {
    try {
      const defaults = createDefaultMockServerState().routes;
      await replaceMockRoutesInSupabase(defaults);
      setSyncError(null);
      setState((prev) => ({ ...prev, routes: defaults }));
      toast.success('Reset mock routes to defaults');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to reset mock routes';
      setSyncError(message);
      toast.error(message);
      throw error;
    }
  }, []);

  const updateRouteStatus = useCallback(async (routeId: string, enabled: boolean) => {
    const current = state.routes.find((route) => route.id === routeId);
    if (!current) return;

    const nextRoute = { ...current, enabled };
    try {
      await upsertMockRouteToSupabase(nextRoute);
      setSyncError(null);
      setState((prev) => ({
        ...prev,
        routes: prev.routes.map((route) => (route.id === routeId ? nextRoute : route)),
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update mock route';
      setSyncError(message);
      toast.error(message);
      throw error;
    }
  }, [state.routes]);

  const restoreFromBackup = useCallback(async (backup: MockServerBackupPayload) => {
    try {
      await replaceMockServerStateInSupabase({
        enabled: backup.enabled,
        routes: backup.routes,
      });
      setSyncError(null);
      setState({
        enabled: backup.enabled,
        routes: backup.routes,
      });
      toast.success('Imported mock server backup');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to import backup';
      setSyncError(message);
      toast.error(message);
      throw error;
    }
  }, []);

  const getRouteById = useCallback(
    (routeId: string) => state.routes.find((route) => route.id === routeId),
    [state.routes],
  );

  const resolveRequest = useCallback(
    (request: MockRequestContext) => {
      if (!state.enabled) return null;
      return resolveMockRoute(state.routes, request);
    },
    [state.enabled, state.routes],
  );

  const createDraftFromRoute = useCallback((route?: MockRouteDefinition) => {
    if (!route) {
      return createEmptyDraft();
    }

    return routeToDraft(route);
  }, []);

  const contextValue = useMemo<MockServerContextValue>(() => ({
    enabled: state.enabled,
    routes: state.routes,
    routeCount: state.routes.length,
    activeRouteCount: state.routes.filter((route) => route.enabled).length,
    isLoading,
    syncError,
    toggleEnabled,
    refreshRoutes,
    upsertRoute,
    deleteRoute,
    duplicateRoute,
    resetRoutes,
    updateRouteStatus,
    restoreFromBackup,
    getRouteById,
    resolveRequest,
    createDraftFromRoute,
  }), [
    createDraftFromRoute,
    deleteRoute,
    duplicateRoute,
    getRouteById,
    isLoading,
    refreshRoutes,
    resolveRequest,
    resetRoutes,
    state.enabled,
    state.routes,
    syncError,
    toggleEnabled,
    upsertRoute,
    updateRouteStatus,
    restoreFromBackup,
  ]);

  return (
    <MockServerContext.Provider value={contextValue}>
      {children}
    </MockServerContext.Provider>
  );
};

export const useMockServer = () => {
  const context = useContext(MockServerContext);
  if (!context) {
    throw new Error('useMockServer must be used within MockServerProvider');
  }

  return {
    ...context,
    buildRequestContext,
    draftToRoute,
  };
};
