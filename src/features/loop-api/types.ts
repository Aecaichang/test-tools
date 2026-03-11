export interface FieldConfig {
  key: string;
  value: unknown;
  enabled: boolean;
  generator: 'none' | 'random_string' | 'random_number' | 'random_uuid' | 'timestamp' | 'random_phone' | 'random_email';
  location: 'payload' | 'query';
}

export interface RequestResult {
  index: number;
  status: number | string;
  success: boolean;
  data: unknown;
  timestamp: string;
  request: {
    url: string;
    method: string;
    headers: Record<string, string>;
    payload: unknown;
  };
}

export interface ApiLog {
  id: string;
  created_at: string;
  url: string;
  method: string;
  headers: unknown;
  payload: unknown;
  response_status: string;
  response_data: unknown;
  success: boolean;
}
