const ALLOWED_ORIGIN = 'https://trirk2008-max.github.io';
const MAX_TEXT_LENGTH = 180;
const RATE_LIMIT = 60;
const RATE_WINDOW_MS = 60_000;
const recentRequestsByIp = new Map();

function response(body, status, origin) {
  const headers = new Headers({
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Origin': origin || ALLOWED_ORIGIN,
    'Vary': 'Origin'
  });
  if (body instanceof ReadableStream) headers.set('Content-Type', 'audio/mpeg');
  else headers.set('Content-Type', 'text/plain; charset=utf-8');
  return new Response(body, { status, headers });
}

function checkRateLimit(ip) {
  const now = Date.now();
  const recent = (recentRequestsByIp.get(ip) || []).filter(timestamp => now - timestamp < RATE_WINDOW_MS);
  if (recent.length >= RATE_LIMIT) return false;
  recent.push(now);
  recentRequestsByIp.set(ip, recent);

  if (recentRequestsByIp.size > 500) {
    for (const [key, timestamps] of recentRequestsByIp) {
      if (timestamps.every(timestamp => now - timestamp >= RATE_WINDOW_MS)) recentRequestsByIp.delete(key);
    }
  }
  return true;
}

export default {
  async fetch(request) {
    const url = new URL(request.url);
    const origin = request.headers.get('Origin');

    if (url.pathname === '/health' && request.method === 'GET') {
      return Response.json({ status: 'ok' }, { headers: { 'Cache-Control': 'no-store' } });
    }
    if (origin && origin !== ALLOWED_ORIGIN) return response('Origin không được phép.', 403, ALLOWED_ORIGIN);
    if (request.method === 'OPTIONS') return response(null, 204, ALLOWED_ORIGIN);
    if (url.pathname !== '/tts') return response('Không tìm thấy.', 404, ALLOWED_ORIGIN);
    if (request.method !== 'GET') return response('Phương thức không được hỗ trợ.', 405, ALLOWED_ORIGIN);

    const text = (url.searchParams.get('q') || '').trim();
    if (!text || text.length > MAX_TEXT_LENGTH) return response('Đoạn đọc phải dài từ 1 đến 180 ký tự.', 400, ALLOWED_ORIGIN);

    const clientIp = request.headers.get('CF-Connecting-IP') || 'unknown';
    if (!checkRateLimit(clientIp)) return response('Thử lại sau một phút.', 429, ALLOWED_ORIGIN);

    const upstreamUrl = new URL('https://translate.google.com/translate_tts');
    upstreamUrl.search = new URLSearchParams({ ie: 'UTF-8', client: 'tw-ob', tl: 'vi', q: text }).toString();

    try {
      const upstream = await fetch(upstreamUrl, {
        headers: {
          'Accept': 'audio/mpeg,audio/*;q=0.9,*/*;q=0.8',
          'User-Agent': 'Mozilla/5.0 (compatible; VietnameseReader/1.0)'
        }
      });
      const contentType = upstream.headers.get('Content-Type') || '';
      if (!upstream.ok || !contentType.toLowerCase().includes('audio')) {
        return response('Dịch vụ giọng Việt chưa trả về âm thanh.', 502, ALLOWED_ORIGIN);
      }

      return new Response(upstream.body, {
        status: 200,
        headers: {
          'Content-Type': 'audio/mpeg',
          'Cache-Control': 'no-store',
          'X-Content-Type-Options': 'nosniff',
          'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
          'Vary': 'Origin'
        }
      });
    } catch {
      return response('Không kết nối được dịch vụ giọng Việt.', 502, ALLOWED_ORIGIN);
    }
  }
};

