import type { VercelRequest, VercelResponse } from '@vercel/node';
import axios, { AxiosError } from 'axios';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const targetOrigin = req.headers['x-target-origin'] as string;
  
  if (!targetOrigin) {
    return res.status(400).json({ error: 'Missing x-target-origin header' });
  }

  // Get target path from query (passed by vercel.json rewrite)
  const proxyPathRaw = req.query._proxy_path as string;
  let pathWithQuery = proxyPathRaw ? (proxyPathRaw.startsWith('/') ? proxyPathRaw : '/' + proxyPathRaw) : '';

  // Append original query parameters (excluding our internal _proxy_path)
  const queryParams = { ...req.query };
  delete queryParams._proxy_path;
  
  const queryString = Object.entries(queryParams)
    .map(([key, val]) => `${key}=${encodeURIComponent(String(val))}`)
    .join('&');

  if (queryString) {
    pathWithQuery += (pathWithQuery.includes('?') ? '&' : '?') + queryString;
  }
  
  const targetUrl = `${targetOrigin}${pathWithQuery}`;

  const cleanHeaders = { ...req.headers };
  delete cleanHeaders['x-target-origin'];
  delete cleanHeaders['host'];
  delete cleanHeaders['connection'];

  try {
    const response = await axios({
      method: req.method,
      url: targetUrl,
      headers: cleanHeaders as Record<string, string>,
      data: req.body,
      validateStatus: () => true, // Allow all status codes to be passed through
    });

    // Forward headers from target to client
    Object.entries(response.headers).forEach(([key, value]) => {
      if (value) res.setHeader(key, value);
    });

    return res.status(response.status).send(response.data);
  } catch (error) {
    const axiosError = error as AxiosError;
    return res.status(axiosError.response?.status || 500).json({
      error: 'Proxy Error',
      message: axiosError.message,
      details: axiosError.response?.data
    });
  }
}
