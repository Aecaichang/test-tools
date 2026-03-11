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

  // 1. Pre-process: handle multi-line but preserve content within quotes
  // We can't just replace all \s+ globally because it ruins multipart bodies
  const joinedLines = curlCommand.replace(/\\\n/g, ' ');

  // 2. Extract URL
  const urlRegex = /(?:--location|curl)\s+['"]([^'"]+)['"]|['"](https?:\/\/[^'"]+)['"]/;
  const urlMatch = joinedLines.match(urlRegex);
  
  if (urlMatch) {
    result.url = (urlMatch[1] || urlMatch[2]).trim();
  } else {
    const fallbackMatch = joinedLines.match(/https?:\/\/[^\s'"]+/);
    if (fallbackMatch) {
      result.url = fallbackMatch[0].trim();
    }
  }

  // 3. Extract Method
  const methodMatch = joinedLines.match(/(?:-X|--request)\s+([A-Z]+)/);
  if (methodMatch) {
    result.method = methodMatch[1];
  }

  // 4. Extract Headers
  const headerRegex = /(?:-H|--header)\s+['"]([^'"]+?)['"]/g;
  let headerMatch;
  while ((headerMatch = headerRegex.exec(joinedLines)) !== null) {
    const parts = headerMatch[1].split(':');
    if (parts.length >= 2) {
      const key = parts[0].trim();
      const value = parts.slice(1).join(':').trim();
      if (['origin', 'referrer', 'host', 'content-length'].includes(key.toLowerCase())) continue;
      result.headers[key] = value;
    }
  }

  // 5. Extract Data (Payload)
  // Handle regular quotes and Shell-style $'...' quotes
  const dataRegex = /(?:--data(?:-raw|-binary)?|-d)\s+([$]?)(['"])([\s\S]*?)\2/;
  const dataMatch = joinedLines.match(dataRegex);
  
  if (dataMatch) {
    const isShellStyle = dataMatch[1] === '$';
    let rawData = dataMatch[3];
    
    if (isShellStyle) {
      rawData = unescapeShellString(rawData);
    }

    if (result.method === 'GET') result.method = 'POST';
    
    const contentType = result.headers['content-type'] || '';
    if (contentType.includes('multipart/form-data')) {
      const boundaryMatch = contentType.match(/boundary=(.+)/);
      if (boundaryMatch) {
        result.data = parseMultipart(rawData, boundaryMatch[1]);
      } else {
        result.data = rawData;
      }
    } else {
      try {
        result.data = JSON.parse(rawData);
      } catch {
        result.data = rawData;
      }
    }
  }

  return result;
}

function unescapeShellString(str: string): string {
  return str
    .replace(/\\r/g, '\r')
    .replace(/\\n/g, '\n')
    .replace(/\\t/g, '\t')
    .replace(/\\'/g, "'")
    .replace(/\\\\/g, '\\');
}

function parseMultipart(body: string, boundary: string): Record<string, string> {
  const result: Record<string, string> = {};
  const parts = body.split('--' + boundary);
  
  parts.forEach(part => {
    // Look for name="fieldName"
    const nameMatch = part.match(/name="([^"]+)"/);
    if (nameMatch) {
      const name = nameMatch[1];
      // Value is usually after \r\n\r\n or \n\n
      const valueMatch = part.match(/(?:\r?\n){2,}([\s\S]*?)\r?\n?$/);
      if (valueMatch) {
        result[name] = valueMatch[1].trim();
      }
    }
  });

  return result;
}
