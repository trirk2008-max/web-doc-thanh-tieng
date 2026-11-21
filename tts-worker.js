const ALLOWED_ORIGIN = 'https://trirk2008-max.github.io';
const MAX_BLOCK_LENGTH = 1800;
const GOOGLE_TTS_LIMIT = 180;
const MAX_BOOK_BYTES = 1_800_000;
const RATE_LIMIT = 60;
const RATE_WINDOW_MS = 60_000;
const recentRequestsByIp = new Map();

function corsHeaders(origin = ALLOWED_ORIGIN) {
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, PUT, PATCH, OPTIONS',
    'Access-Control-Allow-Headers': 'Authorization, Content-Type',
    'Access-Control-Max-Age': '86400',
    'Cache-Control': 'no-store',
    'Vary': 'Origin',
    'X-Content-Type-Options': 'nosniff'
  };
}

function jsonResponse(body, status, origin) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(origin), 'Content-Type': 'application/json; charset=utf-8' }
  });
}

function textResponse(body, status, origin) {
  return new Response(body, {
    status,
    headers: { ...corsHeaders(origin), 'Content-Type': 'text/plain; charset=utf-8' }
  });
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

function splitTtsText(text) {
  const words = text.trim().split(/\s+/);
  const chunks = [];
  let current = '';

  for (const word of words) {
    let remaining = word;
    while (remaining.length > GOOGLE_TTS_LIMIT) {
      if (current) {
        chunks.push(current);
        current = '';
      }
      chunks.push(remaining.slice(0, GOOGLE_TTS_LIMIT));
      remaining = remaining.slice(GOOGLE_TTS_LIMIT);
    }
    const next = current ? `${current} ${remaining}` : remaining;
    if (next.length > GOOGLE_TTS_LIMIT && current) {
      chunks.push(current);
      current = remaining;
    } else {
      current = next;
    }
  }

  if (current) chunks.push(current);
  return chunks;
}

function stripMp3Tags(bytes, keepLeadingTag) {
  let start = 0;
  let end = bytes.length;
  if (!keepLeadingTag && end >= 10 && bytes[0] === 0x49 && bytes[1] === 0x44 && bytes[2] === 0x33) {
    const size = ((bytes[6] & 0x7f) << 21) | ((bytes[7] & 0x7f) << 14) | ((bytes[8] & 0x7f) << 7) | (bytes[9] & 0x7f);
    start = Math.min(end, 10 + size + ((bytes[5] & 0x10) ? 10 : 0));
  }
  if (end - start >= 128 && bytes[end - 128] === 0x54 && bytes[end - 127] === 0x41 && bytes[end - 126] === 0x47) end -= 128;
  return bytes.subarray(start, end);
}

async function createAudioParts(text) {
  const chunks = splitTtsText(text);
  const parts = [];
  for (let index = 0; index < chunks.length; index += 4) {
    const batch = await Promise.all(chunks.slice(index, index + 4).map(async chunk => {
      const upstreamUrl = new URL('https://translate.google.com/translate_tts');
      upstreamUrl.search = new URLSearchParams({ ie: 'UTF-8', client: 'tw-ob', tl: 'vi', q: chunk }).toString();
      const upstream = await fetch(upstreamUrl, {
        headers: {
          'Accept': 'audio/mpeg,audio/*;q=0.9,*/*;q=0.8',
          'User-Agent': 'Mozilla/5.0 (compatible; VietnameseReader/1.0)'
        }
      });
      const contentType = upstream.headers.get('Content-Type') || '';
      if (!upstream.ok || !contentType.toLowerCase().includes('audio')) throw new Error('Dịch vụ giọng Việt chưa trả về âm thanh.');
      return stripMp3Tags(new Uint8Array(await upstream.arrayBuffer()), false);
    }));
    parts.push(...batch);
  }
  return parts;
}

function encodeBase64(bytes) {
  let binary = '';
  const chunkSize = 0x8000;
  for (let offset = 0; offset < bytes.length; offset += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + chunkSize));
  }
  return btoa(binary);
}

async function createCombinedAudio(text) {
  const parts = await createAudioParts(text);
  const totalLength = parts.reduce((total, part) => total + part.length, 0);
  const combined = new Uint8Array(totalLength);
  let offset = 0;
  for (const part of parts) {
    combined.set(part, offset);
    offset += part.length;
  }
  return combined;
}

function getOwnerId(request) {
  const token = (request.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '');
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(token) ? token : null;
}

async function handleBooks(request, env, url, origin) {
  if (!env.BOOKS_DB) return jsonResponse({ error: 'Kho sách chưa được cấu hình.' }, 503, origin);
  const ownerId = getOwnerId(request);
  if (!ownerId) return jsonResponse({ error: 'Thiếu mã thiết bị lưu sách.' }, 401, origin);
  if (request.method === 'GET' && url.pathname === '/books') {
    const result = await env.BOOKS_DB.prepare(
      'SELECT id, title, updated_at, position_index, position_seconds, elapsed_seconds, rate, mode FROM books WHERE owner_id = ? ORDER BY updated_at DESC LIMIT 100'
    ).bind(ownerId).all();
    return jsonResponse(result.results || [], 200, origin);
  }

  const match = url.pathname.match(/^\/books\/([0-9a-f-]{36})(?:\/(progress))?$/i);
  if (!match) return jsonResponse({ error: 'Không tìm thấy sách.' }, 404, origin);
  const [, id, progressRoute] = match;

  if (request.method === 'GET' && !progressRoute) {
    const book = await env.BOOKS_DB.prepare('SELECT * FROM books WHERE id = ? AND owner_id = ?').bind(id, ownerId).first();
    return book ? jsonResponse(book, 200, origin) : jsonResponse({ error: 'Không tìm thấy sách.' }, 404, origin);
  }

  let body;
  try {
    if (Number(request.headers.get('Content-Length') || 0) > MAX_BOOK_BYTES + 10_000) {
      return jsonResponse({ error: 'Sách quá lớn để lưu.' }, 413, origin);
    }
    body = await request.json();
  } catch {
    return jsonResponse({ error: 'Dữ liệu gửi lên không hợp lệ.' }, 400, origin);
  }

  if (request.method === 'PATCH' && progressRoute === 'progress') {
    const result = await env.BOOKS_DB.prepare(
      'UPDATE books SET position_index = ?, position_seconds = ?, elapsed_seconds = ?, rate = ?, updated_at = ? WHERE id = ? AND owner_id = ?'
    ).bind(
      Math.max(0, Math.floor(Number(body.position_index) || 0)),
      Math.max(0, Number(body.position_seconds) || 0),
      Math.max(0, Number(body.elapsed_seconds) || 0),
      Math.min(2.5, Math.max(0.5, Number(body.rate) || 1)),
      Date.now(), id, ownerId
    ).run();
    return result.meta.changes ? jsonResponse({ saved: true }, 200, origin) : jsonResponse({ error: 'Không tìm thấy sách.' }, 404, origin);
  }

  if (request.method === 'PUT' && !progressRoute) {
    const title = String(body.title || '').trim().slice(0, 160);
    const content = typeof body.content === 'string' ? body.content : '';
    const contentBytes = new TextEncoder().encode(content).byteLength;
    if (!title || !content.trim() || contentBytes > MAX_BOOK_BYTES) {
      return jsonResponse({ error: contentBytes > MAX_BOOK_BYTES ? 'Sách vượt quá giới hạn lưu 1,8 MB.' : 'Tên sách và văn bản không được để trống.' }, 413, origin);
    }
    const existing = await env.BOOKS_DB.prepare('SELECT id FROM books WHERE id = ? AND owner_id = ?').bind(id, ownerId).first();
    if (!existing) {
      const count = await env.BOOKS_DB.prepare('SELECT COUNT(*) AS count FROM books WHERE owner_id = ?').bind(ownerId).first();
      if ((count?.count || 0) >= 100) return jsonResponse({ error: 'Đã đạt giới hạn 100 sách cho trình duyệt này.' }, 413, origin);
    }
    const result = await env.BOOKS_DB.prepare(
      'INSERT INTO books (id, owner_id, title, content, mode, position_index, position_seconds, elapsed_seconds, rate, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET title = excluded.title, content = excluded.content, mode = excluded.mode, position_index = excluded.position_index, position_seconds = excluded.position_seconds, elapsed_seconds = excluded.elapsed_seconds, rate = excluded.rate, updated_at = excluded.updated_at WHERE books.owner_id = excluded.owner_id'
    ).bind(
      id, ownerId, title, content, body.mode === 'raw' ? 'raw' : 'cleaned',
      Math.max(0, Math.floor(Number(body.position_index) || 0)),
      Math.max(0, Number(body.position_seconds) || 0),
      Math.max(0, Number(body.elapsed_seconds) || 0),
      Math.min(2.5, Math.max(0.5, Number(body.rate) || 1)),
      Date.now(), Date.now()
    ).run();
    return result.meta.changes ? jsonResponse({ saved: true }, 200, origin) : jsonResponse({ error: 'Mã sách đã được dùng.' }, 409, origin);
  }

  return jsonResponse({ error: 'Phương thức không được hỗ trợ.' }, 405, origin);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const origin = request.headers.get('Origin');
    if (origin && origin !== ALLOWED_ORIGIN) return textResponse('Origin không được phép.', 403, ALLOWED_ORIGIN);
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders(ALLOWED_ORIGIN) });
    if (url.pathname === '/health' && request.method === 'GET') return jsonResponse({ status: 'ok' }, 200, origin);

    const clientIp = request.headers.get('CF-Connecting-IP') || 'unknown';
    if (!checkRateLimit(clientIp)) return textResponse('Thử lại sau một phút.', 429, origin);

    if (url.pathname === '/books' || url.pathname.startsWith('/books/')) {
      try {
        return await handleBooks(request, env, url, origin);
      } catch {
        return jsonResponse({ error: 'Không truy cập được cơ sở dữ liệu sách.' }, 500, origin);
      }
    }

    if (url.pathname !== '/tts') return textResponse('Không tìm thấy.', 404, origin);
    if (request.method !== 'GET') return textResponse('Phương thức không được hỗ trợ.', 405, origin);

    const text = (url.searchParams.get('q') || '').trim();
    if (!text || text.length > MAX_BLOCK_LENGTH) return textResponse('Đoạn đọc phải dài từ 1 đến 1.800 ký tự.', 400, origin);

    try {
      if (url.searchParams.get('format') === 'parts-v1') {
        const parts = await createAudioParts(text);
        return jsonResponse({ format: 'mp3-parts-v1', parts: parts.map(encodeBase64) }, 200, origin);
      }
      const audio = await createCombinedAudio(text);
      return new Response(audio, {
        status: 200,
        headers: {
          ...corsHeaders(origin),
          'Content-Type': 'audio/mpeg',
          'Content-Length': String(audio.length),
          'Accept-Ranges': 'none'
        }
      });
    } catch {
      return textResponse('Không tải được giọng Việt. Hãy thử lại khi có kết nối Internet.', 502, origin);
    }
  }
};

