export interface ParsedCurl {
  url: string;
  method: string;
  headers: Record<string, string>;
  data: any;
}

export function parseCurl(curlCommand: string): ParsedCurl {
  const result: ParsedCurl = {
    url: '',
    method: 'GET',
    headers: {},
    data: null,
  };

  // Simple parser logic
  // Extracting URL
  const urlMatch = curlCommand.match(/--location\s+'([^']+)'/) || curlCommand.match(/curl\s+'([^']+)'/) || curlCommand.match(/"([^"]+)"/);
  if (urlMatch) {
    result.url = urlMatch[1];
  }

  // Extracting headers
  const headerMatches = curlCommand.matchAll(/--header\s+'([^:]+):\s*([^']+)'/g);
  for (const match of headerMatches) {
    result.headers[match[1]] = match[2];
  }

  // Extracting data
  const dataMatch = curlCommand.match(/--data\s+'([\s\S]+?)'/m) || curlCommand.match(/--data\s+"([\s\S]+?)"/m);
  if (dataMatch) {
    try {
      result.data = JSON.parse(dataMatch[1]);
      result.method = 'POST'; // Default to POST if data exists, though it should check --request
    } catch (e) {
      result.data = dataMatch[1];
    }
  }
  
  const methodMatch = curlCommand.match(/--request\s+([A-Z]+)/);
  if (methodMatch) {
    result.method = methodMatch[1];
  }

  return result;
}
