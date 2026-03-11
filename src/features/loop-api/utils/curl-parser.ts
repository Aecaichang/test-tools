export interface ParsedCurl {
  url: string;
  method: string;
  headers: Record<string, string>;
  data: unknown;
}

export function parseCurl(curlCommand: string): ParsedCurl {
  const result: ParsedCurl = {
    url: '',
    method: 'GET',
    headers: {},
    data: null,
  };

  if (!curlCommand) return result;

  // 1. Pre-process: handle multi-line and extra whitespace
  const cleanCommand = curlCommand.replace(/\\\n/g, ' ').replace(/\s+/g, ' ').trim();

  // 2. Extract URL
  // More precise URL extraction: handle --location 'URL' or just 'URL'
  // Common pattern: curl --location 'HTTPS_URL' or curl "HTTPS_URL"
  const urlRegex = /(?:--location|curl)\s+['"]([^'"]+)['"]|['"](https?:\/\/[^'"]+)['"]/;
  const urlMatch = cleanCommand.match(urlRegex);
  
  if (urlMatch) {
    result.url = (urlMatch[1] || urlMatch[2]).trim();
  } else {
    // Fallback: search for something that looks like an absolute URL
    const fallbackMatch = cleanCommand.match(/https?:\/\/[^\s'"]+/);
    if (fallbackMatch) {
      result.url = fallbackMatch[0].trim();
    }
  }

  // 3. Extract Method
  const methodMatch = cleanCommand.match(/(?:-X|--request)\s+([A-Z]+)/);
  if (methodMatch) {
    result.method = methodMatch[1];
  }

  // 4. Extract Headers
  const headerRegex = /(?:-H|--header)\s+['"]([^'"]+?)['"]/g;
  let headerMatch;
  while ((headerMatch = headerRegex.exec(cleanCommand)) !== null) {
    const parts = headerMatch[1].split(':');
    if (parts.length >= 2) {
      const key = parts[0].trim();
      const value = parts.slice(1).join(':').trim();
      // Skip some headers that browser handles or might cause issues
      if (['origin', 'referrer', 'host', 'content-length'].includes(key.toLowerCase())) continue;
      result.headers[key] = value;
    }
  }

  // 5. Extract Data (Payload)
  const dataRegex = /(?:--data(?:-raw|-binary)?|-d)\s+(['"])([\s\S]*?)\1/;
  const dataMatch = cleanCommand.match(dataRegex);
  
  if (dataMatch) {
    const rawData = dataMatch[2];
    if (result.method === 'GET') result.method = 'POST';
    
    try {
      result.data = JSON.parse(rawData);
    } catch {
      result.data = rawData;
    }
  }

  return result;
}
