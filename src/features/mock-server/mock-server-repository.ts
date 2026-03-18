import { supabase } from '@/lib/supabase';
import { type MockRouteDefinition, type MockServerState } from './types';

const MOCK_ROUTES_TABLE = 'mock_routes';
const MOCK_SERVER_SETTINGS_TABLE = 'mock_server_settings';

const toRouteRecord = (route: MockRouteDefinition) => ({
  id: route.id,
  name: route.name,
  enabled: route.enabled,
  method: route.method,
  path_pattern: route.pathPattern,
  status: route.status,
  delay_ms: route.delayMs,
  response_headers: route.responseHeaders,
  response_body: route.responseBody,
  notes: route.notes,
});

const fromRouteRecord = (record: Record<string, unknown>): MockRouteDefinition => ({
  id: String(record.id ?? ''),
  name: String(record.name ?? 'Mock Route'),
  enabled: Boolean(record.enabled),
  method: String(record.method ?? 'GET') as MockRouteDefinition['method'],
  pathPattern: String(record.path_pattern ?? '/api/mock'),
  status: Number(record.status) || 200,
  delayMs: Number(record.delay_ms) || 0,
  responseHeaders: record.response_headers && typeof record.response_headers === 'object'
    ? (record.response_headers as Record<string, string>)
    : { 'content-type': 'application/json' },
  responseBody: String(record.response_body ?? '{}'),
  notes: String(record.notes ?? ''),
});

export const fetchMockRoutesFromSupabase = async (): Promise<MockRouteDefinition[]> => {
  const { data, error } = await supabase
    .from(MOCK_ROUTES_TABLE)
    .select('*')
    .order('created_at', { ascending: true });

  if (error) throw error;
  return (data ?? []).map((item) => fromRouteRecord(item as Record<string, unknown>));
};

export const fetchMockServerEnabledFromSupabase = async (): Promise<boolean> => {
  const { data, error } = await supabase
    .from(MOCK_SERVER_SETTINGS_TABLE)
    .select('enabled')
    .eq('id', 1)
    .maybeSingle();

  if (error) throw error;
  return Boolean(data?.enabled);
};

export const upsertMockServerEnabledToSupabase = async (enabled: boolean) => {
  const { error } = await supabase
    .from(MOCK_SERVER_SETTINGS_TABLE)
    .upsert({ id: 1, enabled }, { onConflict: 'id' });

  if (error) throw error;
};

export const upsertMockRouteToSupabase = async (route: MockRouteDefinition) => {
  const { error } = await supabase
    .from(MOCK_ROUTES_TABLE)
    .upsert(toRouteRecord(route), { onConflict: 'id' });

  if (error) throw error;
};

export const deleteMockRouteFromSupabase = async (routeId: string) => {
  const { error } = await supabase
    .from(MOCK_ROUTES_TABLE)
    .delete()
    .eq('id', routeId);

  if (error) throw error;
};

export const replaceMockRoutesInSupabase = async (routes: MockRouteDefinition[]) => {
  const { error: deleteError } = await supabase
    .from(MOCK_ROUTES_TABLE)
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000');

  if (deleteError) throw deleteError;

  if (routes.length === 0) return;

  const { error: insertError } = await supabase
    .from(MOCK_ROUTES_TABLE)
    .insert(routes.map(toRouteRecord));

  if (insertError) throw insertError;
};

export const replaceMockServerStateInSupabase = async (state: MockServerState) => {
  await upsertMockServerEnabledToSupabase(state.enabled);
  await replaceMockRoutesInSupabase(state.routes);
};

export const ensureMockRoutesSeeded = async (state: MockServerState) => {
  const existingRoutes = await fetchMockRoutesFromSupabase();
  if (existingRoutes.length > 0) return existingRoutes;

  if (state.routes.length > 0) {
    await replaceMockRoutesInSupabase(state.routes);
  }

  return state.routes;
};
